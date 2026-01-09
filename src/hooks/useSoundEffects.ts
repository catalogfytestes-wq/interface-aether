import { useCallback, useRef } from 'react';

type SoundType = 'hover' | 'click' | 'activate' | 'deactivate' | 'alert' | 'scan' | 'transition';

const useSoundEffects = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const isEnabled = useRef(true);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback((
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume: number = 0.1,
    fadeOut: boolean = true
  ) => {
    if (!isEnabled.current) return;

    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);

    if (fadeOut) {
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    }

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }, [getAudioContext]);

  const playSound = useCallback((type: SoundType) => {
    if (!isEnabled.current) return;

    switch (type) {
      case 'hover':
        playTone(800, 0.05, 'sine', 0.03);
        break;

      case 'click':
        playTone(1200, 0.08, 'square', 0.05);
        setTimeout(() => playTone(1600, 0.06, 'sine', 0.03), 30);
        break;

      case 'activate':
        playTone(400, 0.15, 'sine', 0.06);
        setTimeout(() => playTone(600, 0.15, 'sine', 0.05), 80);
        setTimeout(() => playTone(800, 0.2, 'sine', 0.04), 160);
        break;

      case 'deactivate':
        playTone(800, 0.1, 'sine', 0.05);
        setTimeout(() => playTone(500, 0.15, 'sine', 0.04), 60);
        setTimeout(() => playTone(300, 0.2, 'sine', 0.03), 120);
        break;

      case 'alert':
        playTone(880, 0.1, 'sawtooth', 0.04);
        setTimeout(() => playTone(660, 0.1, 'sawtooth', 0.04), 100);
        setTimeout(() => playTone(880, 0.1, 'sawtooth', 0.04), 200);
        break;

      case 'scan':
        for (let i = 0; i < 5; i++) {
          setTimeout(() => playTone(300 + i * 100, 0.1, 'sine', 0.02), i * 50);
        }
        break;

      case 'transition':
        playTone(200, 0.3, 'sine', 0.04);
        playTone(400, 0.3, 'triangle', 0.02);
        break;
    }
  }, [playTone]);

  const toggleSound = useCallback((enabled: boolean) => {
    isEnabled.current = enabled;
  }, []);

  return { playSound, toggleSound };
};

export default useSoundEffects;
