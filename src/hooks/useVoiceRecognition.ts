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
  const [micPermission, setMicPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [lastError, setLastError] = useState<string | null>(null);

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
    
    // Keep recognition running longer
    (recognition as any).maxAlternatives = 5;

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
      if (isRunningRef.current) {
        console.log('Recognition already running, skipping start');
        return;
      }
      
      try {
        recognition.start();
        isRunningRef.current = true;
        console.log('✅ Recognition started successfully');
      } catch (e: any) {
        console.log('Start failed:', e.message);
        isRunningRef.current = false;
        // Try again after a longer delay
        setTimeout(() => {
          if (alwaysListenRef.current && !isRunningRef.current) {
            try {
              recognition.start();
              isRunningRef.current = true;
            } catch (e2) {}
          }
        }, 1000);
      }
    };

    const scheduleRestart = (delay: number = 100) => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      restartTimeoutRef.current = setTimeout(() => {
        if (alwaysListenRef.current && !isRunningRef.current) {
          console.log('🔄 Restarting wake word detection...');
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
      console.log('🎙️ Speech recognition ACTIVE - say "JARVIS"');
      isRunningRef.current = true;
      setIsWakeWordListening(true);
    };

    recognition.onend = () => {
      console.log('Speech recognition ended, isRunning was:', isRunningRef.current);
      isRunningRef.current = false;
      
      // Only restart if we should be listening
      if (alwaysListenRef.current) {
        // Use longer delay to prevent rapid restart loops
        scheduleRestart(500);
      } else {
        setIsWakeWordListening(false);
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
      const normalizedTranscript = (currentTranscript || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
      
      if (normalizedTranscript) {
        console.log('🎧 Heard:', normalizedTranscript);
      }
      
      // Check for wake word - extensive variations including greetings
      const wakeWordVariations = [
        // Basic variations
        'jarvis', 'jarves', 'jarvi', 'jervis', 'jarvs', 'jarvo', 'jarbis', 'jarvez',
        // Portuguese pronunciation
        'djarvis', 'djarves', 'diarvis', 'dj arvis', 'dj-arvis', 'djarvi',
        'charvis', 'charves', 'xarvis', 'xarves',
        'giarvis', 'giarves',
        // With greetings
        'oi jarvis', 'ola jarvis', 'olá jarvis', 'hey jarvis', 'ei jarvis', 'e ai jarvis',
        'oi djarvis', 'ola djarvis', 'hey djarvis',
        'bom dia jarvis', 'boa tarde jarvis', 'boa noite jarvis',
        // Commands starting with jarvis
        'jarvis abrir', 'jarvis abre', 'jarvis mostra', 'jarvis fecha',
        // Phonetic mishears
        'jarvice', 'jarviz', 'djarviz', 'charviz', 'gervais', 'jerves'
      ];
      
      const hasWakeWord = wakeWordVariations.some(v => normalizedTranscript.includes(v));
      
      if (hasWakeWord && !isListeningRef.current) {
        console.log('🎤 Wake word detected! Activating JARVIS...');
        callbacksRef.current.onWakeWord?.();
        setIsListening(true);
        isListeningRef.current = true;
        commandExecutedRef.current = false;
        lastTranscriptRef.current = '';
        callbacksRef.current.onListeningChange?.(true);
        
        // Check if there's already a command in the same phrase
        const commandPart = normalizedTranscript.replace(/.*(?:jarv\w*|djarv\w*|diarv\w*|charv\w*|xarv\w*|giarv\w*)/i, '').trim();
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
      const error = event.error as string;

      // no-speech is normal - recognition just didn't hear anything
      if (error === 'no-speech') {
        console.log('👂 No speech detected, continuing to listen...');
        isRunningRef.current = false;
        if (alwaysListenRef.current) scheduleRestart(250);
        return;
      }

      if (error === 'aborted') {
        isRunningRef.current = false;
        return;
      }

      // Common when start() happens without a user gesture / mic blocked
      if (error === 'not-allowed' || error === 'service-not-allowed') {
        console.error('❌ Speech recognition not allowed (needs user interaction or mic permission)');
        setMicPermission('denied');
        setLastError('O navegador bloqueou o microfone/voz. Clique para ativar.');
        isRunningRef.current = false;
        setIsWakeWordListening(false);
        return;
      }

      console.error('❌ Speech recognition error:', error);
      setLastError(error);
      isRunningRef.current = false;

      // Restart with longer delay for real errors
      if (alwaysListenRef.current) {
        scheduleRestart(2000);
      }
    };

    recognitionRef.current = recognition;

    // Auto-start if always listening (may fail without user gesture in some browsers)
    if (alwaysListenForWakeWord) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        setMicPermission('granted');
        setLastError(null);
        stream.getTracks().forEach((t) => t.stop());
        console.log('🎙️ Microfone permitido - armando escuta do "JARVIS"');
        safeStart();
      }).catch((e) => {
        console.error('Microphone permission denied:', e);
        setMicPermission('denied');
        setLastError('Permissão de microfone negada');
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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermission('granted');
      setLastError(null);
      stream.getTracks().forEach((t) => t.stop());

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
      setMicPermission('denied');
      setLastError('Sem permissão de microfone');
    }
  }, []);

  const armWakeWord = useCallback(async () => {
    if (!recognitionRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermission('granted');
      setLastError(null);
      stream.getTracks().forEach((t) => t.stop());

      if (!isRunningRef.current) {
        try {
          recognitionRef.current.start();
          isRunningRef.current = true;
        } catch (e: any) {
          setLastError(e?.message || 'Falha ao iniciar reconhecimento');
        }
      }
    } catch (e) {
      setMicPermission('denied');
      setLastError('Permissão de microfone negada');
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
    micPermission,
    lastError,
    armWakeWord,
    startListening,
    stopListening,
    toggleListening,
  };
};

export default useVoiceRecognition;
