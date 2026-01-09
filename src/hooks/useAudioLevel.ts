import { useState, useCallback, useRef, useEffect } from 'react';

interface UseAudioLevelOptions {
  smoothing?: number;
  minDecibels?: number;
  maxDecibels?: number;
}

const useAudioLevel = ({
  smoothing = 0.8,
  minDecibels = -90,
  maxDecibels = -10,
}: UseAudioLevelOptions = {}) => {
  const [audioLevel, setAudioLevel] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  const startCapturing = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setHasPermission(true);

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = smoothing;
      analyser.minDecibels = minDecibels;
      analyser.maxDecibels = maxDecibels;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);

      setIsCapturing(true);

      const updateLevel = () => {
        const analyser = analyserRef.current;
        const arr = dataArrayRef.current;
        if (!analyser || !arr) return;

        (analyser as any).getByteFrequencyData(arr);
        
        // Calculate average level
        let sum = 0;
        const len = arr.length;
        for (let i = 0; i < len; i++) {
          sum += arr[i];
        }
        const average = sum / len;
        const normalizedLevel = average / 255; // Normalize to 0-1
        
        setAudioLevel(normalizedLevel);
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (error) {
      console.error('Failed to capture audio:', error);
      setHasPermission(false);
    }
  }, [smoothing, minDecibels, maxDecibels]);

  const stopCapturing = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    dataArrayRef.current = null;
    
    setIsCapturing(false);
    setAudioLevel(0);
  }, []);

  useEffect(() => {
    return () => {
      stopCapturing();
    };
  }, [stopCapturing]);

  return {
    audioLevel,
    isCapturing,
    hasPermission,
    startCapturing,
    stopCapturing,
  };
};

export default useAudioLevel;
