// Gemini Live Native Audio Player Hook
// Plays audio chunks returned by the Gemini Live API (PCM16 @ 24kHz)

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseGeminiAudioPlayerOptions {
  enabled?: boolean;
  onPlayStart?: () => void;
  onPlayEnd?: () => void;
  onError?: (error: Error) => void;
}

interface UseGeminiAudioPlayerReturn {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  queueLength: number;
  queueAudio: (audioBase64: string) => void;
  stop: () => void;
  clearQueue: () => void;
  setMuted: (muted: boolean) => void;
  setVolume: (volume: number) => void;
}

export function useGeminiAudioPlayer(
  options: UseGeminiAudioPlayerOptions = {}
): UseGeminiAudioPlayerReturn {
  const { enabled = true, onPlayStart, onPlayEnd, onError } = options;

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1.0);
  const [queueLength, setQueueLength] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const audioQueueRef = useRef<string[]>([]);
  const isProcessingRef = useRef(false);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Initialize audio context lazily
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.connect(audioContextRef.current.destination);
      gainNodeRef.current.gain.value = isMuted ? 0 : volume;
    }
    return audioContextRef.current;
  }, [isMuted, volume]);

  // Update gain when volume/mute changes
  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = isMuted ? 0 : volume;
    }
  }, [isMuted, volume]);

  // Process next audio chunk in queue
  const processQueue = useCallback(async () => {
    if (!enabled || isProcessingRef.current || audioQueueRef.current.length === 0) {
      if (audioQueueRef.current.length === 0) {
        setIsPlaying(false);
        onPlayEnd?.();
      }
      return;
    }

    isProcessingRef.current = true;
    setIsPlaying(true);
    setQueueLength(audioQueueRef.current.length);

    if (!isPlaying) {
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
      source.connect(gainNodeRef.current!);
      
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
    queueAudio,
    stop,
    clearQueue,
    setMuted: setIsMuted,
    setVolume,
  };
}
