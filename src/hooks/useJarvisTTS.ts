import { useState, useCallback, useRef, useEffect } from 'react';

interface TTSOptions {
  rate?: number;
  volume?: number;
  voiceId?: string;
}

interface UseJarvisTTSReturn {
  speak: (text: string, options?: TTSOptions) => Promise<void>;
  speakAsync: (text: string, options?: TTSOptions) => Promise<void>;
  generateAudio: (text: string, options?: TTSOptions) => Promise<string | null>;
  playAudio: (base64Audio: string) => void;
  stopAudio: () => void;
  isSpeaking: boolean;
  isConnected: boolean;
  error: string | null;
}

const JARVIS_SERVER_URL = 'http://localhost:5000';

export const useJarvisTTS = (): UseJarvisTTSReturn => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const checkIntervalRef = useRef<number | null>(null);

  // Verifica conexão com servidor Python
  const checkConnection = useCallback(async () => {
    try {
      const response = await fetch(`${JARVIS_SERVER_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000), // 2 second timeout
      });
      const data = await response.json();
      const connected = data.status === 'healthy' && data.modules?.includes('tts');
      setIsConnected(connected);
      return connected;
    } catch {
      setIsConnected(false);
      return false;
    }
  }, []);

  // Check connection on mount and periodically
  useEffect(() => {
    checkConnection();
    
    // Check every 5 seconds
    checkIntervalRef.current = window.setInterval(() => {
      checkConnection();
    }, 5000);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [checkConnection]);

  // Fala texto de forma síncrona (espera terminar)
  const speak = useCallback(async (text: string, options?: TTSOptions) => {
    setError(null);
    setIsSpeaking(true);
    
    try {
      const response = await fetch(`${JARVIS_SERVER_URL}/tts/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          rate: options?.rate ?? 150,
          volume: options?.volume ?? 1.0,
          voice_id: options?.voiceId
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Erro no TTS');
      }
      
      setIsConnected(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      setIsConnected(false);
      console.error('TTS Error:', message);
    } finally {
      setIsSpeaking(false);
    }
  }, []);

  // Fala texto de forma assíncrona (não espera)
  const speakAsync = useCallback(async (text: string, options?: TTSOptions) => {
    setError(null);
    setIsSpeaking(true);
    
    try {
      const response = await fetch(`${JARVIS_SERVER_URL}/tts/speak-async`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          rate: options?.rate ?? 150,
          volume: options?.volume ?? 1.0,
          voice_id: options?.voiceId
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Erro no TTS');
      }
      
      setIsConnected(true);
      
      // Aguarda um tempo estimado baseado no texto
      const estimatedDuration = (text.length / 15) * 1000; // ~15 chars/seg
      setTimeout(() => setIsSpeaking(false), estimatedDuration);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      setIsConnected(false);
      setIsSpeaking(false);
      console.error('TTS Error:', message);
    }
  }, []);

  // Gera áudio e retorna como base64
  const generateAudio = useCallback(async (text: string, options?: TTSOptions): Promise<string | null> => {
    setError(null);
    
    try {
      const response = await fetch(`${JARVIS_SERVER_URL}/tts/generate-audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          rate: options?.rate ?? 150,
          volume: options?.volume ?? 1.0,
          voice_id: options?.voiceId
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Erro ao gerar áudio');
      }
      
      setIsConnected(true);
      return data.audio_base64;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      setIsConnected(false);
      console.error('TTS Generate Error:', message);
      return null;
    }
  }, []);

  // Reproduz áudio base64 no navegador
  const playAudio = useCallback((base64Audio: string) => {
    try {
      // Para áudio anterior se estiver tocando
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      const audioBlob = new Blob(
        [Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0))],
        { type: 'audio/wav' }
      );
      const audioUrl = URL.createObjectURL(audioBlob);
      
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onplay = () => setIsSpeaking(true);
      audioRef.current.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };
      audioRef.current.onerror = () => {
        setIsSpeaking(false);
        setError('Erro ao reproduzir áudio');
        URL.revokeObjectURL(audioUrl);
      };
      
      audioRef.current.play();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao reproduzir';
      setError(message);
      console.error('Audio playback error:', message);
    }
  }, []);

  // Para áudio em reprodução
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsSpeaking(false);
    }
  }, []);

  return {
    speak,
    speakAsync,
    generateAudio,
    playAudio,
    stopAudio,
    isSpeaking,
    isConnected,
    error
  };
};
