import { useState, useCallback, useRef, useEffect } from 'react';

interface UseVoiceRecognitionOptions {
  onTranscript?: (transcript: string) => void;
  onFinalTranscript?: (transcript: string) => void;
  onListeningChange?: (isListening: boolean) => void;
  onWakeWord?: () => void;
  onClapProgress?: (count: number) => void;
  wakeWord?: string;
  language?: string;
  alwaysListenForWakeWord?: boolean;
  enableClapDetection?: boolean;
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

// Extended wake word variations for maximum sensitivity
const WAKE_WORD_PATTERNS = [
  // === OK JARVIS (primary - like "Ok Google") ===
  /\bok\s*jarv/i,
  /\bokay\s*jarv/i,
  /\bo\s*k\s*jarv/i,
  /\bok\s*djarv/i,
  /\bokay\s*djarv/i,
  /\bok\s*charv/i,
  /\bok\s*xarv/i,
  
  // === JARVIS basic (very loose matching) ===
  /jarv/i,           // catches jarvis, jarves, jarvi, jarvs, etc
  /djarv/i,          // catches djarvis, djarves, etc
  /diarv/i,          // catches diarvis, etc
  /charv/i,          // catches charvis, charves
  /xarv/i,           // catches xarvis
  /giarv/i,          // catches giarvis
  /gerv/i,           // catches gervais, gervis
  /jerv/i,           // catches jervis
  
  // === Custom wake phrases ===
  /acorda\s*beb[eê]/i,                    // "acorda bebê papai chegou"
  /acordar?\s*jarv/i,                     // "acordar jarvis"
  /desperta/i,                            // "despertar"
  /ativar?\s*jarv/i,                      // "ativar jarvis"
  /chamar?\s*jarv/i,                      // "chamar jarvis"
  /iniciar?\s*jarv/i,                     // "iniciar jarvis"
  /ligar?\s*jarv/i,                       // "ligar jarvis"
  /acionar/i,                             // "acionar"
  
  // === Greetings with JARVIS ===
  /\b(oi|ola|ol[áa]|hey|ei|e\s*ai|fala)\s*(a[ií])?\s*(jarv|djarv|charv)/i,
  /\b(bom\s*dia|boa\s*tarde|boa\s*noite)\s*(jarv|djarv)/i,
  
  // === English variations ===
  /\bhey\s*jarv/i,
  /\bhi\s*jarv/i,
  /\bhello\s*jarv/i,
  /\bwake\s*up\s*jarv/i,
];

// Normalize text for better matching
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[.,!?;:'"]/g, '')      // Remove punctuation
    .replace(/\s+/g, ' ')            // Normalize spaces
    .trim();
};

// Check if text contains wake word
const containsWakeWord = (text: string): boolean => {
  const normalized = normalizeText(text);
  return WAKE_WORD_PATTERNS.some(pattern => pattern.test(normalized));
};

// Extract command after wake word
const extractCommand = (text: string): string => {
  const normalized = normalizeText(text);
  
  // Try to find and remove wake word patterns
  let command = normalized;
  
  // Remove common wake word prefixes
  const prefixPatterns = [
    /^.*?\b(ok\s*jarv\w*|okay\s*jarv\w*)/i,
    /^.*?\b(oi|ola|hey|ei)\s*(jarv\w*|djarv\w*)/i,
    /^.*?\b(jarv\w*|djarv\w*|charv\w*|xarv\w*|giarv\w*)/i,
    /^.*?\b(acorda\s*bebe|acordar|despertar|ativar|chamar|iniciar|ligar)/i,
  ];
  
  for (const pattern of prefixPatterns) {
    command = command.replace(pattern, '').trim();
    if (command !== normalized) break;
  }
  
  return command;
};

const useVoiceRecognition = ({
  onTranscript,
  onFinalTranscript,
  onListeningChange,
  onWakeWord,
  onClapProgress,
  wakeWord = 'jarvis',
  language = 'pt-BR',
  alwaysListenForWakeWord = true,
  enableClapDetection = true,
}: UseVoiceRecognitionOptions = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [isWakeWordListening, setIsWakeWordListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [micPermission, setMicPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [lastError, setLastError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionType | null>(null);
  const callbacksRef = useRef({ onTranscript, onFinalTranscript, onListeningChange, onWakeWord, onClapProgress });
  const wakeWordRef = useRef(wakeWord);
  const alwaysListenRef = useRef(alwaysListenForWakeWord);
  const isListeningRef = useRef(false);
  const isRunningRef = useRef(false);
  const hasUserArmedRef = useRef(false);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTranscriptRef = useRef('');
  const commandExecutedRef = useRef(false);
  const lastRestartAtRef = useRef(0);

  // Clap detection refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const clapStreamRef = useRef<MediaStream | null>(null);
  const lastClapTimeRef = useRef(0);
  const clapCountRef = useRef(0);
  const clapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Keep callbacks up to date
  useEffect(() => {
    callbacksRef.current = { onTranscript, onFinalTranscript, onListeningChange, onWakeWord, onClapProgress };
    wakeWordRef.current = wakeWord;
    alwaysListenRef.current = alwaysListenForWakeWord;
  }, [onTranscript, onFinalTranscript, onListeningChange, onWakeWord, onClapProgress, wakeWord, alwaysListenForWakeWord]);

  useEffect(() => {
    // IMPORTANT: manter um stream de microfone aberto pode derrubar o SpeechRecognition em alguns navegadores.
    // Por isso, só ativamos a detecção de palmas depois que o usuário "armar" (gesto do usuário) e
    // apenas quando o SpeechRecognition NÃO estiver rodando.
    if (!enableClapDetection || !alwaysListenForWakeWord) return;
    
    let mounted = true;
    
    const setupClapDetection = async () => {
      if (!hasUserArmedRef.current) return;
      if (isRunningRef.current) return;
      if (micPermission !== 'granted') return;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!mounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        
        clapStreamRef.current = stream;
        audioContextRef.current = new AudioContext();
        analyserRef.current = audioContextRef.current.createAnalyser();
        
        const source = audioContextRef.current.createMediaStreamSource(stream);
        source.connect(analyserRef.current);
        
        analyserRef.current.fftSize = 2048;
        analyserRef.current.smoothingTimeConstant = 0.3;
        
        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        
        // Clap detection thresholds
        const CLAP_THRESHOLD = 200;      // Volume threshold for clap
        const CLAP_MIN_INTERVAL = 150;   // Minimum ms between claps
        const CLAP_MAX_INTERVAL = 800;   // Maximum ms between claps for sequence
        const CLAPS_REQUIRED = 3;        // Number of claps to trigger
        
        let lastPeak = 0;
        let cooldown = false;
        
        const detectClaps = () => {
          if (!mounted || !analyserRef.current) return;
          
          analyserRef.current.getByteTimeDomainData(dataArray);
          
          // Calculate peak amplitude
          let peak = 0;
          for (let i = 0; i < bufferLength; i++) {
            const amplitude = Math.abs(dataArray[i] - 128);
            if (amplitude > peak) peak = amplitude;
          }
          
          const now = Date.now();
          
          // Detect sudden loud sound (clap)
          if (peak > CLAP_THRESHOLD && !cooldown && (now - lastClapTimeRef.current) > CLAP_MIN_INTERVAL) {
            // Check if this is part of a sequence or new sequence
            if ((now - lastClapTimeRef.current) > CLAP_MAX_INTERVAL) {
              // New sequence
              clapCountRef.current = 1;
            } else {
              // Continue sequence
              clapCountRef.current++;
            }
            
            lastClapTimeRef.current = now;
            callbacksRef.current.onClapProgress?.(clapCountRef.current);
            console.log(`👏 Clap detected! Count: ${clapCountRef.current}`);
            
            // Short cooldown to prevent double detection
            cooldown = true;
            setTimeout(() => { cooldown = false; }, CLAP_MIN_INTERVAL);
            
            // Clear previous timeout
            if (clapTimeoutRef.current) {
              clearTimeout(clapTimeoutRef.current);
            }
            
            // Check if we have enough claps
            if (clapCountRef.current >= CLAPS_REQUIRED) {
              console.log('👏👏👏 Triple clap detected! Activating JARVIS...');
              clapCountRef.current = 0;
              callbacksRef.current.onClapProgress?.(0);

              // Trigger wake word
              if (!isListeningRef.current) {
                callbacksRef.current.onWakeWord?.();
                setIsListening(true);
                isListeningRef.current = true;
                commandExecutedRef.current = false;
                lastTranscriptRef.current = '';
                callbacksRef.current.onListeningChange?.(true);
              }
            } else {
              // Reset after timeout
              clapTimeoutRef.current = setTimeout(() => {
                clapCountRef.current = 0;
                callbacksRef.current.onClapProgress?.(0);
              }, CLAP_MAX_INTERVAL);
            }
          }
          
          lastPeak = peak;
          animationFrameRef.current = requestAnimationFrame(detectClaps);
        };
        
        detectClaps();
        console.log('👏 Clap detection initialized');
        
      } catch (e) {
        console.log('Could not initialize clap detection:', e);
      }
    };
    
    setupClapDetection();
    
    return () => {
      mounted = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (clapTimeoutRef.current) {
        clearTimeout(clapTimeoutRef.current);
      }
      if (clapStreamRef.current) {
        clapStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [enableClapDetection, alwaysListenForWakeWord, micPermission]);

  // Initialize speech recognition
  useEffect(() => {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognitionClass);

    if (!SpeechRecognitionClass) return;

    const recognition = new SpeechRecognitionClass() as SpeechRecognitionType;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;
    
    // Maximum alternatives for better wake word detection
    (recognition as any).maxAlternatives = 10;

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
        console.log('✅ Recognition started - listening for wake words');
      } catch (e: any) {
        console.log('Start failed:', e.message);
        isRunningRef.current = false;
        setTimeout(() => {
          if (alwaysListenRef.current && !isRunningRef.current) {
            try {
              recognition.start();
              isRunningRef.current = true;
            } catch (e2) {}
          }
        }, 500);
      }
    };

    const scheduleRestart = (delay: number = 500) => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      restartTimeoutRef.current = setTimeout(() => {
        const now = Date.now();
        // Evita loop agressivo start/end
        if (now - lastRestartAtRef.current < 400) return;
        lastRestartAtRef.current = now;

        if (alwaysListenRef.current && !isRunningRef.current && hasUserArmedRef.current) {
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
      console.log('🎙️ Speech recognition ACTIVE - say "OK JARVIS", "acorda bebê", or clap 3x');
      isRunningRef.current = true;
      setIsWakeWordListening(true);
    };

    recognition.onend = () => {
      console.log('Speech recognition ended');
      isRunningRef.current = false;
      
      if (alwaysListenRef.current) {
        // Restart mais estável (evita flapping)
        scheduleRestart(800);
      } else {
        setIsWakeWordListening(false);
      }
    };

    recognition.onresult = (event: any) => {
      // Process all alternatives for better wake word detection
      const alternatives: string[] = [];
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        for (let j = 0; j < result.length; j++) {
          if (result[j]?.transcript) {
            alternatives.push(result[j].transcript);
          }
        }
      }
      
      // Log all heard alternatives
      if (alternatives.length > 0) {
        console.log('🧠 Heard alternatives:', alternatives.slice(0, 3).join(' | '));
      }

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
      
      // Check ALL alternatives for wake word (more sensitive)
      const hasWakeWord = alternatives.some(alt => containsWakeWord(alt)) || 
                          containsWakeWord(currentTranscript);

      if (hasWakeWord && !isListeningRef.current) {
        console.log('🎤 Wake word detected! Activating JARVIS...');
        callbacksRef.current.onWakeWord?.();
        setIsListening(true);
        isListeningRef.current = true;
        commandExecutedRef.current = false;
        lastTranscriptRef.current = '';
        callbacksRef.current.onListeningChange?.(true);

        // Extract any command in the same phrase
        const commandPart = extractCommand(currentTranscript);
        if (commandPart.length > 2) {
          lastTranscriptRef.current = commandPart;
          setTranscript(commandPart);
          callbacksRef.current.onTranscript?.(commandPart);
        }

        startSilenceTimer(3000);
        return;
      }

      // Active listening mode - process commands
      if (isListeningRef.current && currentTranscript) {
        lastTranscriptRef.current = currentTranscript;
        setTranscript(currentTranscript);
        callbacksRef.current.onTranscript?.(currentTranscript);
        
        startSilenceTimer(2500);

        if (finalTranscript) {
          console.log('📝 Final transcript:', finalTranscript);
          commandExecutedRef.current = true;
          callbacksRef.current.onFinalTranscript?.(finalTranscript);
          startSilenceTimer(1500);
        }
      }
    };

    recognition.onerror = (event: any) => {
      const error = event.error as string;

      if (error === 'no-speech') {
        console.log('👂 No speech, continuing...');
        isRunningRef.current = false;
        if (alwaysListenRef.current) scheduleRestart(100);
        return;
      }

      if (error === 'aborted') {
        isRunningRef.current = false;
        return;
      }

      if (error === 'not-allowed' || error === 'service-not-allowed') {
        console.error('❌ Microphone blocked');
        setMicPermission('denied');
        setLastError('Microfone bloqueado. Clique para ativar.');
        isRunningRef.current = false;
        setIsWakeWordListening(false);
        return;
      }

      console.error('❌ Speech error:', error);
      setLastError(error);
      isRunningRef.current = false;

      if (alwaysListenRef.current) {
        scheduleRestart(1000);
      }
    };

    recognitionRef.current = recognition;

    // NÃO auto-inicia no mount: precisa de gesto do usuário (armWakeWord/startListening)
    // para ser confiável em Chrome/Safari e evitar loops start/end.

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

      if (!isRunningRef.current) {
        try {
          recognitionRef.current.start();
          isRunningRef.current = true;
        } catch (e) {}
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

      hasUserArmedRef.current = true;

      if (!isRunningRef.current) {
        try {
          recognitionRef.current.start();
          isRunningRef.current = true;
        } catch (e: any) {
          setLastError(e?.message || 'Falha ao iniciar');
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
    console.log('Stopped active listening');
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
