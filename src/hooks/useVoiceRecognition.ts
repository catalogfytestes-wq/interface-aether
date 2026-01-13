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

    recognition.onstart = () => {
      console.log('Speech recognition started');
      setIsWakeWordListening(true);
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
      setIsWakeWordListening(false);
      
      // Auto-restart if always listening and not in active mode
      if (alwaysListenRef.current && !isListeningRef.current) {
        setTimeout(() => {
          try {
            recognition.start();
            console.log('Auto-restarting wake word detection...');
          } catch (e) {
            console.log('Could not restart recognition');
          }
        }, 100);
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
      
      // Always check for wake word
      if (lowerTranscript.includes(wakeWordRef.current.toLowerCase()) && !isListeningRef.current) {
        console.log('Wake word detected:', wakeWordRef.current);
        callbacksRef.current.onWakeWord?.();
        setIsListening(true);
        isListeningRef.current = true;
        callbacksRef.current.onListeningChange?.(true);
        return;
      }
      
      // If in active listening mode, process commands
      if (isListeningRef.current) {
        setTranscript(currentTranscript);
        callbacksRef.current.onTranscript?.(currentTranscript);

        if (finalTranscript) {
          callbacksRef.current.onFinalTranscript?.(finalTranscript);
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        // Try to restart on error
        if (alwaysListenRef.current) {
          setTimeout(() => {
            try {
              recognition.start();
            } catch (e) {}
          }, 500);
        }
      }
    };

    recognitionRef.current = recognition;

    // Auto-start if always listening
    if (alwaysListenForWakeWord) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then(() => {
        try {
          recognition.start();
          console.log('Started always-on wake word detection for:', wakeWord);
        } catch (e) {
          console.error('Failed to start wake word detection:', e);
        }
      }).catch(e => {
        console.error('Microphone permission denied:', e);
      });
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, [language, alwaysListenForWakeWord, wakeWord]);

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
      try {
        recognitionRef.current.start();
      } catch (e) {
        // Already running, that's fine
      }
      
      console.log('Started active listening...');
    } catch (error) {
      console.error('Failed to start recognition:', error);
    }
  }, []);

  const stopListening = useCallback(() => {
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
