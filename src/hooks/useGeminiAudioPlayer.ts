// Gemini Live Native Audio Player Hook with VU Meter
// Plays audio chunks returned by the Gemini Live API (PCM16 @ 24kHz)

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseGeminiAudioPlayerOptions {
  enabled?: boolean;
  onPlayStart?: () => void;
  onPlayEnd?: () => void;
  onError?: (error: Error) => void;
  onAudioLevel?: (level: number) => void; // 0-1 audio level for VU meter
}

interface UseGeminiAudioPlayerReturn {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  queueLength: number;
  audioLevel: number; // Current audio level 0-1
  queueAudio: (audioBase64: string) => void;
  stop: () => void;
  clearQueue: () => void;
  setMuted: (muted: boolean) => void;
  setVolume: (volume: number) => void;
}

export function useGeminiAudioPlayer(
  options: UseGeminiAudioPlayerOptions = {}
): UseGeminiAudioPlayerReturn {
  const { enabled = true, onPlayStart, onPlayEnd, onError, onAudioLevel } = options;

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const [queueLength, setQueueLength] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioQueueRef = useRef<string[]>([]);
  const isProcessingRef = useRef(false);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize audio context lazily
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      
      // Create gain node
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.gain.value = isMuted ? 0 : volume;
      
      // Create analyser for VU meter
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.3;
      
      // Connect: source -> analyser -> gain -> destination
      gainNodeRef.current.connect(audioContextRef.current.destination);
    }
    return audioContextRef.current;
  }, [isMuted, volume]);

  // Update gain when volume/mute changes
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : volume;
    }
  }, [isMuted, volume]);

  // VU Meter animation loop
  const updateAudioLevel = useCallback(() => {
    if (!analyserRef.current || !isPlaying) {
      setAudioLevel(0);
      onAudioLevel?.(0);
      return;
    }

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Calculate RMS level
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sum / dataArray.length) / 255;
    const smoothedLevel = Math.min(1, rms * 2); // Amplify for visibility
    
    setAudioLevel(smoothedLevel);
    onAudioLevel?.(smoothedLevel);
    
    animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
  }, [isPlaying, onAudioLevel]);

  // Start/stop VU meter animation
  useEffect(() => {
    if (isPlaying) {
      updateAudioLevel();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      setAudioLevel(0);
      onAudioLevel?.(0);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, updateAudioLevel, onAudioLevel]);

  // Process next audio chunk in queue
  const processQueue = useCallback(async () => {
    if (!enabled || isProcessingRef.current || audioQueueRef.current.length === 0) {
      if (audioQueueRef.current.length === 0 && isProcessingRef.current === false) {
        setIsPlaying(false);
        onPlayEnd?.();
      }
      return;
    }

    isProcessingRef.current = true;
    
    if (!isPlaying) {
      setIsPlaying(true);
      onPlayStart?.();
    }

    const audioBase64 = audioQueueRef.current.shift()!;
    setQueueLength(audioQueueRef.current.length);

    try {
      const ctx = getAudioContext();
      
      // Resume context if suspended (browser autoplay policy)
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // Decode base64 to Uint8Array
      const binaryString = atob(audioBase64);
      const audioData = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        audioData[i] = binaryString.charCodeAt(i);
      }

      // Convert PCM16 (little-endian) to Float32
      const samples = new Float32Array(audioData.length / 2);
      const view = new DataView(audioData.buffer);
      for (let i = 0; i < samples.length; i++) {
        samples[i] = view.getInt16(i * 2, true) / 32768;
      }

      // Create audio buffer
      const audioBuffer = ctx.createBuffer(1, samples.length, 24000);
      audioBuffer.getChannelData(0).set(samples);

      // Create and play source
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      
      // Connect through analyser for VU meter
      source.connect(analyserRef.current!);
      analyserRef.current!.connect(gainNodeRef.current!);
      
      currentSourceRef.current = source;

      source.onended = () => {
        currentSourceRef.current = null;
        isProcessingRef.current = false;
        // Process next chunk
        processQueue();
      };

      source.start();
    } catch (error) {
      console.error('[GeminiAudioPlayer] Playback error:', error);
      onError?.(error instanceof Error ? error : new Error('Audio playback failed'));
      isProcessingRef.current = false;
      // Continue with next chunk despite error
      processQueue();
    }
  }, [enabled, isPlaying, getAudioContext, onPlayStart, onPlayEnd, onError]);

  // Queue audio chunk for playback
  const queueAudio = useCallback(
    (audioBase64: string) => {
      if (!enabled) return;

      audioQueueRef.current.push(audioBase64);
      setQueueLength(audioQueueRef.current.length);

      // Start processing if not already
      if (!isProcessingRef.current) {
        processQueue();
      }
    },
    [enabled, processQueue]
  );

  // Stop current playback
  const stop = useCallback(() => {
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
      } catch {
        // Already stopped
      }
      currentSourceRef.current = null;
    }
    isProcessingRef.current = false;
    setIsPlaying(false);
    setAudioLevel(0);
    onPlayEnd?.();
  }, [onPlayEnd]);

  // Clear the audio queue
  const clearQueue = useCallback(() => {
    audioQueueRef.current = [];
    setQueueLength(0);
    stop();
  }, [stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearQueue();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    isPlaying,
    isMuted,
    volume,
    queueLength,
    audioLevel,
    queueAudio,
    stop,
    clearQueue,
    setMuted: setIsMuted,
    setVolume,
  };
}
