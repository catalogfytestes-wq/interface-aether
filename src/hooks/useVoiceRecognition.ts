import { useState, useCallback, useRef, useEffect } from 'react';

interface UseVoiceRecognitionOptions {
  onTranscript?: (transcript: string) => void;
  onFinalTranscript?: (transcript: string) => void;
  onListeningChange?: (isListening: boolean) => void;
  onWakeWord?: () => void;
  wakeWord?: string;
  language?: string;
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
}: UseVoiceRecognitionOptions = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [isWakeWordMode, setIsWakeWordMode] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);
  const wakeWordRecognitionRef = useRef<SpeechRecognitionType | null>(null);
  const callbacksRef = useRef({ onTranscript, onFinalTranscript, onListeningChange, onWakeWord });
  const wakeWordRef = useRef(wakeWord);
  
  // Keep callbacks up to date
  useEffect(() => {
    callbacksRef.current = { onTranscript, onFinalTranscript, onListeningChange, onWakeWord };
    wakeWordRef.current = wakeWord;
  }, [onTranscript, onFinalTranscript, onListeningChange, onWakeWord, wakeWord]);

  // Initialize main recognition
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
      setIsListening(true);
      callbacksRef.current.onListeningChange?.(true);
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
      setIsListening(false);
      callbacksRef.current.onListeningChange?.(false);
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
      setTranscript(currentTranscript);
      callbacksRef.current.onTranscript?.(currentTranscript);

      if (finalTranscript) {
        callbacksRef.current.onFinalTranscript?.(finalTranscript);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setIsListening(false);
        callbacksRef.current.onListeningChange?.(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
    };
  }, [language]);

  // Initialize wake word recognition (separate instance for background listening)
  useEffect(() => {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) return;

    const wakeRecognition = new SpeechRecognitionClass() as SpeechRecognitionType;
    wakeRecognition.continuous = true;
    wakeRecognition.interimResults = true;
    wakeRecognition.lang = language;

    wakeRecognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript.toLowerCase().trim();
        
        // Check for wake word
        if (transcript.includes(wakeWordRef.current.toLowerCase())) {
          console.log('Wake word detected:', wakeWordRef.current);
          callbacksRef.current.onWakeWord?.();
          
          // Stop wake word mode and start main listening
          try {
            wakeRecognition.stop();
          } catch (e) {}
          setIsWakeWordMode(false);
        }
      }
    };

    wakeRecognition.onend = () => {
      // Restart if still in wake word mode
      if (isWakeWordMode) {
        setTimeout(() => {
          try {
            wakeRecognition.start();
          } catch (e) {
            console.log('Failed to restart wake word detection');
          }
        }, 100);
      }
    };

    wakeRecognition.onerror = (event: any) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        console.error('Wake word recognition error:', event.error);
      }
    };

    wakeWordRecognitionRef.current = wakeRecognition;

    return () => {
      if (wakeWordRecognitionRef.current) {
        try {
          wakeWordRecognitionRef.current.abort();
        } catch (e) {}
      }
    };
  }, [language, isWakeWordMode]);

  const startListening = useCallback(async () => {
    if (!recognitionRef.current) {
      console.error('Speech recognition not initialized');
      return;
    }
    
    try {
      // Stop wake word mode if active
      if (wakeWordRecognitionRef.current) {
        try {
          wakeWordRecognitionRef.current.stop();
        } catch (e) {}
      }
      setIsWakeWordMode(false);
      
      // Request microphone permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });
      recognitionRef.current.start();
      console.log('Started listening...');
    } catch (error) {
      console.error('Failed to start recognition:', error);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        console.log('Stopped listening');
      } catch (error) {
        console.error('Failed to stop recognition:', error);
      }
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const startWakeWordMode = useCallback(async () => {
    if (!wakeWordRecognitionRef.current) {
      console.error('Wake word recognition not initialized');
      return;
    }
    
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsWakeWordMode(true);
      wakeWordRecognitionRef.current.start();
      console.log('Started wake word detection for:', wakeWord);
    } catch (error) {
      console.error('Failed to start wake word detection:', error);
    }
  }, [wakeWord]);

  const stopWakeWordMode = useCallback(() => {
    if (wakeWordRecognitionRef.current) {
      try {
        wakeWordRecognitionRef.current.stop();
        setIsWakeWordMode(false);
        console.log('Stopped wake word detection');
      } catch (error) {
        console.error('Failed to stop wake word detection:', error);
      }
    }
  }, []);

  return {
    isListening,
    isWakeWordMode,
    transcript,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
    startWakeWordMode,
    stopWakeWordMode,
  };
};

export default useVoiceRecognition;
