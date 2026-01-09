import { useState, useCallback, useRef, useEffect } from 'react';

interface UseAudioLevelOptions {
  smoothing?: number;
  minDecibels?: number;
  maxDecibels?: number;
}

const useAudioLevel = ({
  smoothing = 0.5,
  minDecibels = -70,
  maxDecibels = -10,
}: UseAudioLevelOptions = {}) => {
  const [audioLevel, setAudioLevel] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const startCapturing = useCallback(async () => {
    if (isCapturing) return;
    
    try {
      console.log('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      
      console.log('Microphone access granted');
      streamRef.current = stream;
      setHasPermission(true);

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      
      // Resume if suspended (required in some browsers)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
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
      const dataArray = new Uint8Array(bufferLength);

      setIsCapturing(true);
      console.log('Audio capture started');

      const updateLevel = () => {
        if (!analyserRef.current) return;

        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Calculate RMS (root mean square) for better voice detection
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i] * dataArray[i];
        }
        const rms = Math.sqrt(sum / bufferLength);
        const normalizedLevel = Math.min(1, rms / 128); // Normalize to 0-1
        
        setAudioLevel(normalizedLevel);
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch (error) {
      console.error('Failed to capture audio:', error);
      setHasPermission(false);
      setIsCapturing(false);
    }
  }, [isCapturing, smoothing, minDecibels, maxDecibels]);

  const stopCapturing = useCallback(() => {
    console.log('Stopping audio capture...');
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('Audio track stopped');
      });
      streamRef.current = null;
    }

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    
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
