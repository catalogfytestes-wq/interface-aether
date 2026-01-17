// Gemini Screen Agent Hook
// Combines screen sharing, audio, and Gemini Live for a complete AI assistant experience

import { useState, useCallback, useRef, useEffect } from 'react';
import { useScreenShare } from './useScreenShare';
import { useGeminiLive } from './useGeminiLive';
import type { GeminiScreenAgentState, GeminiLiveConfig } from '@/lib/gemini/types';

interface UseGeminiScreenAgentOptions {
  config?: GeminiLiveConfig;
  frameRate?: number; // Screen capture FPS
  audioEnabled?: boolean;
  onTranscript?: (text: string) => void;
  onResponse?: (text: string, isFinal: boolean) => void;
  onAudioResponse?: (audioBase64: string) => void;
  onError?: (error: Error) => void;
  onWsEvent?: (event: {
    ts: number;
    type: 'open' | 'setup_sent' | 'setup_complete' | 'close' | 'error' | 'retry';
    model?: string;
    code?: number;
    reason?: string;
    detail?: string;
  }) => void;
}

interface UseGeminiScreenAgentReturn {
  state: GeminiScreenAgentState;
  
  // Connection
  start: () => Promise<void>;
  stop: () => void;
  
  // Screen sharing
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => void;
  
  // Audio
  startMicrophone: () => Promise<void>;
  stopMicrophone: () => void;
  
  // Manual input
  sendTextMessage: (text: string) => void;
  
  // Refs
  screenVideoRef: React.RefObject<HTMLVideoElement>;
}

export function useGeminiScreenAgent(options: UseGeminiScreenAgentOptions = {}): UseGeminiScreenAgentReturn {
  const {
    config,
    frameRate = 1,
    audioEnabled = true,
    onTranscript,
    onResponse,
    onAudioResponse,
    onError,
    onWsEvent,
  } = options;

  const [state, setState] = useState<GeminiScreenAgentState>({
    connection: 'disconnected',
    screenShare: {
      isSharing: false,
      stream: null,
      error: null,
      frameRate,
    },
    audio: {
      isMicActive: false,
      isPlayingAudio: false,
      micStream: null,
      audioContext: null,
      error: null,
    },
    isProcessing: false,
    conversation: [],
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioWorkletRef = useRef<AudioWorkletNode | null>(null);
  const audioQueueRef = useRef<string[]>([]);

  // Gemini Live hook
  const gemini = useGeminiLive({
    config,
    onTranscript: (text) => {
      onTranscript?.(text);
      addToConversation('user', text);
    },
    onResponse: (text, isFinal) => {
      onResponse?.(text, isFinal);
      if (isFinal) {
        addToConversation('assistant', text);
      }
    },
    onAudio: (audioBase64) => {
      onAudioResponse?.(audioBase64);
      audioQueueRef.current.push(audioBase64);
      playNextAudio();
    },
    onError,
    onWsEvent,
    onStateChange: (geminiState) => {
      setState(prev => ({
        ...prev,
        connection: geminiState.connectionState,
        isProcessing: geminiState.isSpeaking,
      }));
    },
  });

  // Screen share hook with frame callback
  const screenShare = useScreenShare({
    frameRate,
    quality: 0.7,
    maxWidth: 1280,
    maxHeight: 720,
    onFrame: (frame) => {
      if (gemini.state.isReady) {
        gemini.sendScreenFrame(frame);
      }
    },
    onError,
  });

  // Add message to conversation
  const addToConversation = useCallback((role: 'user' | 'assistant', content: string) => {
    setState(prev => ({
      ...prev,
      conversation: [
        ...prev.conversation,
        { role, content, timestamp: Date.now() },
      ],
    }));
  }, []);

  // Audio playback
  const playNextAudio = useCallback(async () => {
    if (audioQueueRef.current.length === 0) {
      setState(prev => ({
        ...prev,
        audio: { ...prev.audio, isPlayingAudio: false },
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      audio: { ...prev.audio, isPlayingAudio: true },
    }));

    const audioBase64 = audioQueueRef.current.shift()!;
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      }

      const audioData = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));
      
      // Convert PCM16 to Float32
      const samples = new Float32Array(audioData.length / 2);
      const view = new DataView(audioData.buffer);
      for (let i = 0; i < samples.length; i++) {
        samples[i] = view.getInt16(i * 2, true) / 32768;
      }

      const audioBuffer = audioContextRef.current.createBuffer(1, samples.length, 24000);
      audioBuffer.getChannelData(0).set(samples);

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => playNextAudio();
      source.start();

    } catch (error) {
      console.error('Audio playback error:', error);
      playNextAudio(); // Continue with next chunk
    }
  }, []);

  // Start microphone capture
  const startMicrophone = useCallback(async () => {
    if (!audioEnabled) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      micStreamRef.current = stream;

      // Create audio context for processing
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      
      // Use ScriptProcessor for audio capture (worklet would be better but more complex)
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (e) => {
        if (!gemini.state.isReady) return;

        const inputData = e.inputBuffer.getChannelData(0);
        
        // Convert Float32 to PCM16
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcm16[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
        }

        // Convert to base64
        const base64 = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
        gemini.sendAudio(base64);
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      setState(prev => ({
        ...prev,
        audio: {
          ...prev.audio,
          isMicActive: true,
          micStream: stream,
          audioContext,
          error: null,
        },
      }));

    } catch (error) {
      console.error('Microphone error:', error);
      setState(prev => ({
        ...prev,
        audio: {
          ...prev.audio,
          error: error instanceof Error ? error.message : 'Microphone error',
        },
      }));
      onError?.(error instanceof Error ? error : new Error('Microphone error'));
    }
  }, [audioEnabled, gemini, onError]);

  // Stop microphone
  const stopMicrophone = useCallback(() => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }

    setState(prev => ({
      ...prev,
      audio: {
        ...prev.audio,
        isMicActive: false,
        micStream: null,
      },
    }));
  }, []);

  // Start everything
  const start = useCallback(async () => {
    await gemini.connect();
  }, [gemini]);

  // Stop everything
  const stop = useCallback(() => {
    screenShare.stopSharing();
    stopMicrophone();
    gemini.disconnect();
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    setState(prev => ({
      ...prev,
      connection: 'disconnected',
      conversation: [],
    }));
  }, [gemini, screenShare, stopMicrophone]);

  // Send text message
  const sendTextMessage = useCallback((text: string) => {
    gemini.sendText(text);
    addToConversation('user', text);
  }, [gemini, addToConversation]);

  // Update screen share state
  useEffect(() => {
    setState(prev => ({
      ...prev,
      screenShare: screenShare.state,
    }));
  }, [screenShare.state]);

  // Cleanup
  useEffect(() => {
    return () => {
      stop();
    };
  }, []);

  return {
    state,
    start,
    stop,
    startScreenShare: screenShare.startSharing,
    stopScreenShare: screenShare.stopSharing,
    startMicrophone,
    stopMicrophone,
    sendTextMessage,
    screenVideoRef: screenShare.videoRef,
  };
}
