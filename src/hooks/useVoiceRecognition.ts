import { useState, useCallback, useRef, useEffect } from 'react';

interface UseVoiceRecognitionOptions {
  onTranscript?: (transcript: string) => void;
  onFinalTranscript?: (transcript: string) => void;
  onListeningChange?: (isListening: boolean) => void;
  onWakeWord?: () => void;
  wakeWord?: string;
  language?: string;
  alwaysListenForWakeWord?: boolean;
}

interface SpeechRecognitionType {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

const useVoiceRecognition = ({
  onTranscript,
  onFinalTranscript,
  onListeningChange,
  onWakeWord,
  wakeWord = 'jarvis',
  language = 'pt-BR',
  alwaysListenForWakeWord = true,
}: UseVoiceRecognitionOptions = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [isWakeWordListening, setIsWakeWordListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);
  const callbacksRef = useRef({ onTranscript, onFinalTranscript, onListeningChange, onWakeWord });
  const wakeWordRef = useRef(wakeWord);
  const alwaysListenRef = useRef(alwaysListenForWakeWord);
  const isListeningRef = useRef(false);
  const isRunningRef = useRef(false);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Auto-stop after silence
  const startSilenceTimer = useCallback((delay: number = 3000) => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    silenceTimeoutRef.current = setTimeout(() => {
      if (isListeningRef.current) {
        console.log('⏹️ Auto-stopping after silence...');
        setIsListening(false);
        isListeningRef.current = false;
        setTranscript('');
        callbacksRef.current.onListeningChange?.(false);
      }
    }, delay);
  }, []);
  
  // Keep callbacks up to date
  useEffect(() => {
    callbacksRef.current = { onTranscript, onFinalTranscript, onListeningChange, onWakeWord };
    wakeWordRef.current = wakeWord;
    alwaysListenRef.current = alwaysListenForWakeWord;
  }, [onTranscript, onFinalTranscript, onListeningChange, onWakeWord, wakeWord, alwaysListenForWakeWord]);

  // Initialize recognition
  useEffect(() => {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognitionClass);

    if (!SpeechRecognitionClass) return;

    const recognition = new SpeechRecognitionClass() as SpeechRecognitionType;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    const safeStart = () => {
      if (isRunningRef.current) return;
      
      try {
        recognition.start();
        isRunningRef.current = true;
      } catch (e) {
        console.log('Recognition already running or failed to start');
      }
    };

    const scheduleRestart = (delay: number = 1000) => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      restartTimeoutRef.current = setTimeout(() => {
        if (alwaysListenRef.current) {
          console.log('Restarting wake word detection...');
          safeStart();
        }
      }, delay);
    };

    recognition.onstart = () => {
      console.log('Speech recognition started - listening for "JARVIS"');
      isRunningRef.current = true;
      setIsWakeWordListening(true);
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
      isRunningRef.current = false;
      setIsWakeWordListening(false);
      
      // Auto-restart with delay
      if (alwaysListenRef.current) {
        scheduleRestart(1000);
      }
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const currentTranscript = finalTranscript || interimTranscript;
      const lowerTranscript = currentTranscript.toLowerCase().trim();
      
      console.log('Heard:', lowerTranscript);
      
      // Check for wake word - multiple variations including Portuguese pronunciation
      const wakeWordVariations = [
        'jarvis', 'jarves', 'jarvi', 'jervis', 'jarvs',
        'djarvis', 'djarves', 'diarvis', 'diárvis', 'djárvis',
        'charvis', 'charves', 'jarvo', 'jarbis', 'jarvez'
      ];
      const hasWakeWord = wakeWordVariations.some(v => lowerTranscript.includes(v));
      
      if (hasWakeWord && !isListeningRef.current) {
        console.log('🎤 Wake word detected! Activating JARVIS...');
        callbacksRef.current.onWakeWord?.();
        setIsListening(true);
        isListeningRef.current = true;
        callbacksRef.current.onListeningChange?.(true);
        
        // Start silence timer for auto-stop
        startSilenceTimer();
        return;
      }
      
      // If in active listening mode, process commands
      if (isListeningRef.current) {
        setTranscript(currentTranscript);
        callbacksRef.current.onTranscript?.(currentTranscript);

        // Reset silence timer on any speech
        startSilenceTimer();

        if (finalTranscript) {
          callbacksRef.current.onFinalTranscript?.(finalTranscript);
          
          // After final transcript, start shorter timer to auto-stop
          startSilenceTimer(2000);
        }
      }
    };

    recognition.onerror = (event: any) => {
      const error = event.error;
      isRunningRef.current = false;
      
      // Only log non-trivial errors
      if (error !== 'no-speech' && error !== 'aborted') {
        console.error('Speech recognition error:', error);
      }
      
      // Restart with appropriate delay based on error type
      if (alwaysListenRef.current) {
        const delay = error === 'no-speech' ? 500 : 2000;
        scheduleRestart(delay);
      }
    };

    recognitionRef.current = recognition;

    // Auto-start if always listening
    if (alwaysListenForWakeWord) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then(() => {
        console.log('🎙️ Microfone ativado - Diga "JARVIS" para começar');
        safeStart();
      }).catch(e => {
        console.error('Microphone permission denied:', e);
      });
    }

    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
      isRunningRef.current = false;
    };
  }, [language, alwaysListenForWakeWord, wakeWord, startSilenceTimer]);

  const startListening = useCallback(async () => {
    if (!recognitionRef.current) {
      console.error('Speech recognition not initialized');
      return;
    }
    
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsListening(true);
      isListeningRef.current = true;
      callbacksRef.current.onListeningChange?.(true);
      
      // Make sure recognition is running
      if (!isRunningRef.current) {
        try {
          recognitionRef.current.start();
          isRunningRef.current = true;
        } catch (e) {
          // Already running, that's fine
        }
      }
      
      console.log('Started active listening...');
    } catch (error) {
      console.error('Failed to start recognition:', error);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
    setIsListening(false);
    isListeningRef.current = false;
    setTranscript('');
    callbacksRef.current.onListeningChange?.(false);
    console.log('Stopped active listening, still detecting wake word');
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    isWakeWordListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
  };
};

export default useVoiceRecognition;
