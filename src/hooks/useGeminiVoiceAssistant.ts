// Gemini Voice Assistant Hook
// Integra reconhecimento de voz com Gemini Live para respostas de áudio
// Pode ver a tela do usuário quando compartilhada

import { useState, useCallback, useRef, useEffect } from 'react';
import { useGeminiLive } from './useGeminiLive';
import { useGeminiAudioPlayer } from './useGeminiAudioPlayer';
import { useScreenShare } from './useScreenShare';
import type { GeminiLiveConfig } from '@/lib/gemini/types';

interface UseGeminiVoiceAssistantOptions {
  autoConnect?: boolean;
  voiceName?: string;
  onSpeakingChange?: (isSpeaking: boolean) => void;
  onConnectionChange?: (connected: boolean) => void;
  onResponse?: (text: string) => void;
  onError?: (error: Error) => void;
}

interface UseGeminiVoiceAssistantReturn {
  // State
  isConnected: boolean;
  isConnecting: boolean;
  isSpeaking: boolean;
  isScreenSharing: boolean;
  error: string | null;
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  sendVoiceCommand: (text: string) => void;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => void;
  
  // Audio controls
  setMuted: (muted: boolean) => void;
  setVolume: (volume: number) => void;
  audioLevel: number;
}

const LS_VOICE_KEY = 'jarvis.gemini.voice';

export function useGeminiVoiceAssistant(
  options: UseGeminiVoiceAssistantOptions = {}
): UseGeminiVoiceAssistantReturn {
  const {
    autoConnect = true,
    voiceName: voiceNameProp,
    onSpeakingChange,
    onConnectionChange,
    onResponse,
    onError,
  } = options;

  const [error, setError] = useState<string | null>(null);
  const hasAutoConnectedRef = useRef(false);
  
  // Get saved voice preference
  const savedVoice = (() => {
    try {
      return localStorage.getItem(LS_VOICE_KEY) || 'Kore';
    } catch {
      return 'Kore';
    }
  })();
  
  const voiceName = voiceNameProp || savedVoice;

  // Audio player for Gemini responses
  const audioPlayer = useGeminiAudioPlayer({
    enabled: true,
    onPlayStart: () => onSpeakingChange?.(true),
    onPlayEnd: () => onSpeakingChange?.(false),
    onError: (err) => console.error('[GeminiAudio]', err),
  });

  // Screen share for visual context
  const screenShare = useScreenShare({
    frameRate: 1,
    quality: 0.7,
    maxWidth: 1280,
    maxHeight: 720,
    onFrame: (frame) => {
      if (gemini.state.isReady) {
        gemini.sendScreenFrame(frame);
      }
    },
    onError: (err) => console.error('[ScreenShare]', err),
  });

  // Gemini Live config
  const config: GeminiLiveConfig = {
    model: 'models/gemini-2.0-flash-exp',
    responseModalities: ['AUDIO', 'TEXT'], // TEXT needed for image/screen analysis
    voiceName,
    systemInstruction: `Você é JARVIS, um assistente de IA avançado inspirado no assistente do Tony Stark.
Você pode ver a tela do usuário em tempo real quando ele compartilhar.
Quando receber uma imagem da tela, ANALISE E DESCREVA o que você vê de forma detalhada.
Se o usuário perguntar "o que você vê" ou algo similar, descreva EXATAMENTE o conteúdo visível na tela.
Seja proativo, observador, inteligente e útil. Use um tom sofisticado mas acessível.
Responda SEMPRE em português brasileiro. Seja conciso mas informativo nas respostas de voz.
IMPORTANTE: Quando houver conteúdo visual, SEMPRE mencione o que está vendo.`,
  };

  // Gemini Live hook
  const gemini = useGeminiLive({
    config,
    onResponse: (text, isFinal) => {
      if (isFinal && text) {
        onResponse?.(text);
      }
    },
    onAudio: (audioBase64) => {
      audioPlayer.queueAudio(audioBase64);
    },
    onError: (err) => {
      setError(err.message);
      onError?.(err);
    },
    onStateChange: (state) => {
      onConnectionChange?.(state.connectionState === 'connected' && state.isReady);
    },
  });

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && !hasAutoConnectedRef.current) {
      hasAutoConnectedRef.current = true;
      gemini.connect().catch((err) => {
        console.error('[GeminiVoiceAssistant] Auto-connect failed:', err);
        setError(err.message);
      });
    }
    
    return () => {
      gemini.disconnect();
      screenShare.stopSharing();
    };
  }, []);

  // Send voice command to Gemini
  const sendVoiceCommand = useCallback((text: string) => {
    if (!gemini.state.isReady) {
      console.warn('[GeminiVoiceAssistant] Not connected, cannot send command');
      return;
    }
    
    console.log('[GeminiVoiceAssistant] Sending command:', text);
    gemini.sendText(text);
  }, [gemini]);

  // Connect manually
  const connect = useCallback(async () => {
    setError(null);
    await gemini.connect();
  }, [gemini]);

  // Disconnect
  const disconnect = useCallback(() => {
    gemini.disconnect();
    screenShare.stopSharing();
    audioPlayer.clearQueue();
  }, [gemini, screenShare, audioPlayer]);

  // Start screen share
  const startScreenShare = useCallback(async () => {
    await screenShare.startSharing();
  }, [screenShare]);

  // Stop screen share
  const stopScreenShare = useCallback(() => {
    screenShare.stopSharing();
  }, [screenShare]);

  return {
    // State
    isConnected: gemini.state.connectionState === 'connected' && gemini.state.isReady,
    isConnecting: gemini.state.connectionState === 'connecting',
    isSpeaking: audioPlayer.isPlaying,
    isScreenSharing: screenShare.state.isSharing,
    error,
    
    // Actions
    connect,
    disconnect,
    sendVoiceCommand,
    startScreenShare,
    stopScreenShare,
    
    // Audio controls
    setMuted: audioPlayer.setMuted,
    setVolume: audioPlayer.setVolume,
    audioLevel: audioPlayer.audioLevel,
  };
}
