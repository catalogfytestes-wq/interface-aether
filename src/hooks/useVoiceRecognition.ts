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
  const lastTranscriptRef = useRef('');
  const commandExecutedRef = useRef(false);
  
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

    const clearTimers = () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
    };

    const safeStart = () => {
      if (isRunningRef.current) return;
      
      try {
        recognition.start();
        isRunningRef.current = true;
      } catch (e) {
        console.log('Recognition already running or failed to start');
        isRunningRef.current = false;
      }
    };

    const scheduleRestart = (delay: number = 500) => {
      clearTimers();
      restartTimeoutRef.current = setTimeout(() => {
        if (alwaysListenRef.current) {
          console.log('Restarting wake word detection...');
          safeStart();
        }
      }, delay);
    };

    const executeCommandAndStop = () => {
      if (isListeningRef.current && lastTranscriptRef.current && !commandExecutedRef.current) {
        console.log('⚡ Executing command:', lastTranscriptRef.current);
        commandExecutedRef.current = true;
        callbacksRef.current.onFinalTranscript?.(lastTranscriptRef.current);
      }
      
      // Stop listening mode
      console.log('⏹️ Auto-stopping after silence...');
      setIsListening(false);
      isListeningRef.current = false;
      setTranscript('');
      lastTranscriptRef.current = '';
      commandExecutedRef.current = false;
      callbacksRef.current.onListeningChange?.(false);
    };

    const startSilenceTimer = (delay: number = 2500) => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      silenceTimeoutRef.current = setTimeout(executeCommandAndStop, delay);
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
        scheduleRestart(300);
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
      
      if (lowerTranscript) {
        console.log('🎧 Heard:', lowerTranscript);
      }
      
      // Check for wake word - extensive variations including greetings
      const wakeWordVariations = [
        // Basic variations
        'jarvis', 'jarves', 'jarvi', 'jervis', 'jarvs', 'jarvo', 'jarbis', 'jarvez',
        // Portuguese pronunciation
        'djarvis', 'djarves', 'diarvis', 'diárvis', 'djárvis', 'djarvi',
        'charvis', 'charves', 'xarvis', 'xarves',
        'giarvis', 'giarves', 'giárvis',
        // With greetings
        'oi jarvis', 'olá jarvis', 'ola jarvis', 'hey jarvis', 'ei jarvis', 'e aí jarvis',
        'oi djarvis', 'olá djarvis', 'hey djarvis',
        'bom dia jarvis', 'boa tarde jarvis', 'boa noite jarvis',
        // Commands starting with jarvis
        'jarvis abrir', 'jarvis abre', 'jarvis mostra', 'jarvis fecha',
        // Phonetic mishears
        'jarvice', 'jarviz', 'djarviz', 'charviz', 'gervais', 'jerves'
      ];
      
      const hasWakeWord = wakeWordVariations.some(v => lowerTranscript.includes(v));
      
      if (hasWakeWord && !isListeningRef.current) {
        console.log('🎤 Wake word detected! Activating JARVIS...');
        callbacksRef.current.onWakeWord?.();
        setIsListening(true);
        isListeningRef.current = true;
        commandExecutedRef.current = false;
        lastTranscriptRef.current = '';
        callbacksRef.current.onListeningChange?.(true);
        
        // Check if there's already a command in the same phrase
        const commandPart = lowerTranscript.replace(/.*jarv\w*/i, '').trim();
        if (commandPart.length > 3) {
          lastTranscriptRef.current = commandPart;
          setTranscript(commandPart);
          callbacksRef.current.onTranscript?.(commandPart);
        }
        
        // Start silence timer for auto-stop
        startSilenceTimer(3000);
        return;
      }
      
      // If in active listening mode, process commands
      if (isListeningRef.current && currentTranscript) {
        lastTranscriptRef.current = currentTranscript;
        setTranscript(currentTranscript);
        callbacksRef.current.onTranscript?.(currentTranscript);

        // Reset silence timer on any speech
        startSilenceTimer(2500);

        if (finalTranscript) {
          console.log('📝 Final transcript:', finalTranscript);
          // Execute command immediately on final transcript
          commandExecutedRef.current = true;
          callbacksRef.current.onFinalTranscript?.(finalTranscript);
          
          // After command executed, short timer to close
          startSilenceTimer(1500);
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
        const delay = error === 'no-speech' ? 200 : 1000;
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
      clearTimers();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
      isRunningRef.current = false;
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
      commandExecutedRef.current = false;
      lastTranscriptRef.current = '';
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
    lastTranscriptRef.current = '';
    commandExecutedRef.current = false;
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
