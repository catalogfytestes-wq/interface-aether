import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, ChevronUp, Maximize2, Minimize2 } from 'lucide-react';
import ParticleSphere from './ParticleSphere';
import MinimizedMenu from './MinimizedMenu';
import WindowControls from './WindowControls';
import SystemLogs from './SystemLogs';
import MiniParticleSphere from './MiniParticleSphere';
import useSoundEffects from '@/hooks/useSoundEffects';
import useVoiceRecognition from '@/hooks/useVoiceRecognition';
import useAudioLevel from '@/hooks/useAudioLevel';
import { toast } from 'sonner';

type SystemMode = 'idle' | 'listening' | 'processing' | 'success' | 'error';

interface HUDOverlayProps {
  isProcessing?: boolean;
}

const HUDOverlay = ({
  isProcessing = false,
}: HUDOverlayProps) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [transparentMode, setTransparentMode] = useState(false);
  const [systemMode, setSystemMode] = useState<SystemMode>('idle');
  const [logsOpen, setLogsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMiniMode, setIsMiniMode] = useState(false);
  const { playSound, toggleSound } = useSoundEffects();
  const { audioLevel, isCapturing, startCapturing, stopCapturing } = useAudioLevel();
  const playSoundRef = useRef(playSound);
  
  useEffect(() => {
    playSoundRef.current = playSound;
  }, [playSound]);

  // Voice command callbacks
  const onWidgetCommand = useRef<(widget: string | null) => void>(() => {});

  // Handle wake word detection
  const handleWakeWord = useCallback(() => {
    console.log('JARVIS wake word detected!');
    playSoundRef.current('activate');
    toast('🎤 JARVIS ativado! Ouvindo comandos...', {
      description: 'Diga seu comando agora.',
    });
    // Expand from mini mode if in it
    if (isMiniMode) {
      setIsMiniMode(false);
    }
  }, [isMiniMode]);

  // Handle voice commands
  const handleFinalTranscript = useCallback((transcript: string) => {
    const lower = transcript.toLowerCase().trim();
    console.log('Final transcript:', lower);
    
    // Modo mini
    if (lower.includes('modo mini') || lower.includes('minimizar jarvis') || lower.includes('dormir')) {
      playSoundRef.current('click');
      setIsMiniMode(true);
      toast('💤 Modo mini ativado. Diga "JARVIS" para despertar.');
      return;
    }
    
    // Abrir widgets
    if (lower.includes('abrir música') || lower.includes('abrir musica') || lower.includes('tocar música') || lower.includes('tocar musica')) {
      playSoundRef.current('activate');
      onWidgetCommand.current('music');
      toast('🎵 Abrindo player de música...');
    } else if (lower.includes('abrir clima') || lower.includes('ver clima') || lower.includes('tempo')) {
      playSoundRef.current('activate');
      onWidgetCommand.current('weather');
      toast('🌤️ Abrindo widget de clima...');
    } else if (lower.includes('abrir calendário') || lower.includes('abrir calendario') || lower.includes('agenda')) {
      playSoundRef.current('activate');
      onWidgetCommand.current('calendar');
      toast('📅 Abrindo calendário...');
    } else if (lower.includes('abrir relógio') || lower.includes('abrir relogio') || lower.includes('que horas') || lower.includes('ver horas')) {
      playSoundRef.current('activate');
      onWidgetCommand.current('clock');
      toast('🕐 Abrindo relógio...');
    } else if (lower.includes('abrir sistema') || lower.includes('diagnóstico') || lower.includes('diagnostico') || lower.includes('status')) {
      playSoundRef.current('activate');
      onWidgetCommand.current('diagnostics');
      toast('⚙️ Abrindo diagnósticos do sistema...');
    } else if (lower.includes('abrir radar') || lower.includes('ver radar')) {
      playSoundRef.current('activate');
      onWidgetCommand.current('radar');
      toast('📡 Abrindo radar...');
    } else if (lower.includes('abrir notificações') || lower.includes('abrir notificacoes') || lower.includes('alertas')) {
      playSoundRef.current('activate');
      onWidgetCommand.current('notifications');
      toast('🔔 Abrindo notificações...');
    } else if (lower.includes('abrir rede') || lower.includes('ver rede') || lower.includes('conexão') || lower.includes('conexao')) {
      playSoundRef.current('activate');
      onWidgetCommand.current('network');
      toast('📶 Abrindo status da rede...');
    } else if (lower.includes('abrir energia') || lower.includes('bateria')) {
      playSoundRef.current('activate');
      onWidgetCommand.current('battery');
      toast('🔋 Abrindo status de energia...');
    }
    // Fechar widgets
    else if (lower.includes('fechar') || lower.includes('sair') || lower.includes('encerrar')) {
      playSoundRef.current('click');
      onWidgetCommand.current(null);
      toast('❌ Widget fechado');
    }
    // Controle de som
    else if (lower.includes('desativar som') || lower.includes('silenciar') || lower.includes('mudo')) {
      setSoundEnabled(false);
      toggleSound(false);
      toast('🔇 Som desativado');
    } else if (lower.includes('ativar som') || lower.includes('ligar som')) {
      setSoundEnabled(true);
      toggleSound(true);
      toast('🔊 Som ativado');
    }
    // Controle de música
    else if (lower.includes('pausar') || lower.includes('parar música') || lower.includes('parar musica')) {
      playSoundRef.current('click');
      toast('⏸️ Música pausada');
    } else if (lower.includes('continuar') || lower.includes('play') || lower.includes('reproduzir')) {
      playSoundRef.current('click');
      toast('▶️ Reproduzindo música');
    } else if (lower.includes('próxima') || lower.includes('proxima') || lower.includes('próximo') || lower.includes('proximo') || lower.includes('next')) {
      playSoundRef.current('click');
      toast('⏭️ Próxima faixa');
    } else if (lower.includes('anterior') || lower.includes('voltar faixa')) {
      playSoundRef.current('click');
      toast('⏮️ Faixa anterior');
    }
    // Modo transparente
    else if (lower.includes('modo transparente') || lower.includes('modo widget') || lower.includes('overlay')) {
      setTransparentMode(true);
      playSoundRef.current('activate');
      toast('🖥️ Modo widget ativado');
    } else if (lower.includes('modo normal') || lower.includes('sair transparente') || lower.includes('voltar normal')) {
      setTransparentMode(false);
      playSoundRef.current('click');
      toast('🖥️ Modo normal');
    }
    // Navegação
    else if (lower.includes('abrir menu') || lower.includes('mostrar menu')) {
      playSoundRef.current('activate');
      toast('📋 Menu aberto');
    }
  }, [toggleSound]);

  const { 
    isListening, 
    isWakeWordListening,
    transcript, 
    isSupported,
    micPermission,
    lastError,
    armWakeWord,
    toggleListening,
    startListening,
    stopListening,
  } = useVoiceRecognition({
    onTranscript: (text) => {
      console.log('Transcript:', text);
    },
    onFinalTranscript: handleFinalTranscript,
    onWakeWord: handleWakeWord,
    wakeWord: 'jarvis',
    alwaysListenForWakeWord: true,
  });

  // Update system mode based on state
  useEffect(() => {
    if (isListening) {
      setSystemMode('listening');
    } else if (isProcessing) {
      setSystemMode('processing');
    } else {
      setSystemMode('idle');
    }
  }, [isListening, isProcessing]);

  // Sync audio capture
  // IMPORTANT: manter um getUserMedia aberto pode atrapalhar o SpeechRecognition em alguns navegadores.
  // Então só capturamos áudio para efeitos visuais no Mini Mode.
  useEffect(() => {
    const shouldCapture = isMiniMode;

    if (shouldCapture && !isCapturing) {
      console.log('Starting audio capture (mini mode)...');
      startCapturing();
    } else if (!shouldCapture && isCapturing) {
      console.log('Stopping audio capture...');
      stopCapturing();
    }
  }, [isMiniMode, isCapturing, startCapturing, stopCapturing]);

  const handleToggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    toggleSound(newState);
    if (soundEnabled) playSound('click');
  };

  const handleVoiceToggle = useCallback(async () => {
    if (!isSupported) {
      toast.error('Reconhecimento de voz não suportado neste navegador');
      return;
    }
    
    if (!isListening) {
      toast('🎤 Ouvindo comandos de voz...', {
        description: 'Diga "abrir música", "abrir clima", etc.',
      });
    }
    
    toggleListening();
  }, [isSupported, toggleListening, isListening]);

  const getStatusText = () => {
    if (isListening && transcript) return transcript;
    if (isListening) return 'Ouvindo...';
    if (isProcessing) return 'Processando...';
    return '';
  };

  const handleToggleTransparent = () => {
    const newMode = !transparentMode;
    setTransparentMode(newMode);
    playSound(newMode ? 'activate' : 'click');
    toast(newMode ? '🖥️ Modo widget ativado' : '🖥️ Modo normal');
  };

  const handleClose = () => {
    playSound('click');
    toast('👋 Fechando interface...');
    // In a real desktop app, this would close the window
    setIsMinimized(true);
  };

  const handleMinimize = () => {
    playSound('click');
    setIsMinimized(!isMinimized);
    toast(isMinimized ? '🔼 Interface restaurada' : '🔽 Interface minimizada');
  };

  const handleLogsToggle = () => {
    playSound('click');
    setLogsOpen(!logsOpen);
  };

  // Demo: Cycle through modes for testing colored particles
  const handleModeDemo = () => {
    const modes: SystemMode[] = ['idle', 'listening', 'processing', 'success', 'error'];
    const currentIndex = modes.indexOf(systemMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setSystemMode(nextMode);
    playSound('activate');
    toast(`🎨 Modo: ${nextMode}`);
  };

  // Handle entering mini mode
  const handleEnterMiniMode = useCallback(() => {
    playSound('click');
    setIsMiniMode(true);
    toast('💤 Modo mini ativado. Diga "JARVIS" para despertar.');
  }, [playSound]);

  // Handle exiting mini mode
  const handleExitMiniMode = useCallback(() => {
    playSound('activate');
    setIsMiniMode(false);
    startListening();
    toast('🎤 JARVIS ativado!');
  }, [playSound, startListening]);

  // Mini mode - small blue particle sphere in corner with audio reactivity
  if (isMiniMode) {
    return (
      <AnimatePresence>
        <MiniParticleSphere onClick={handleExitMiniMode} audioLevel={audioLevel} />
      </AnimatePresence>
    );
  }

  if (isMinimized) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-8 right-8 z-50"
      >
        <motion.button
          onClick={() => setIsMinimized(false)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/20 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
        </motion.button>
      </motion.div>
    );
  }

  return (
    <div className={`fixed inset-0 overflow-hidden transition-colors duration-500 ${transparentMode ? 'bg-transparent' : 'bg-black'}`}>
      {/* Wake Word Status Indicator - Always visible */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
      >
        <button
          type="button"
          onClick={() => {
            // user gesture to unlock mic/recognition if needed
            armWakeWord();
            // also start active listening if user wants
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border transition-colors ${
            isListening 
              ? 'bg-cyan-500/20 border-cyan-400/50' 
              : isWakeWordListening 
                ? 'bg-green-500/10 border-green-400/30' 
                : 'bg-red-500/10 border-red-400/30'
          }`}
          aria-label="Ativar microfone e escuta do Jarvis"
          title={lastError || (micPermission === 'denied' ? 'Clique para permitir o microfone' : 'Clique para rearmar')}
        >
          <motion.div
            className={`w-2 h-2 rounded-full ${
              isListening 
                ? 'bg-cyan-400' 
                : isWakeWordListening 
                  ? 'bg-green-400' 
                  : 'bg-red-400'
            }`}
            animate={{ 
              scale: isWakeWordListening || isListening ? [1, 1.3, 1] : 1,
              opacity: isWakeWordListening || isListening ? [1, 0.5, 1] : 0.5 
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span className={`text-xs font-mono tracking-wider ${
            isListening 
              ? 'text-cyan-400' 
              : isWakeWordListening 
                ? 'text-green-400/80' 
                : 'text-red-400/60'
          }`}>
            {isListening 
              ? '🎤 OUVINDO COMANDO...' 
              : isWakeWordListening 
                ? '👂 ESCUTANDO: "JARVIS"' 
                : '🔇 CLIQUE PARA ATIVAR MICROFONE'}
          </span>
        </button>

        {lastError && (
          <div className="mt-2 text-center">
            <span className="text-[10px] font-mono text-white/50">
              {lastError}
            </span>
          </div>
        )}
      </motion.div>

      {/* Window Controls */}
      <WindowControls
        onClose={handleClose}
        onMinimize={handleMinimize}
        onLogsToggle={handleLogsToggle}
        logsOpen={logsOpen}
        transparentMode={transparentMode}
      />

      {/* System Logs Panel */}
      <SystemLogs
        isOpen={logsOpen}
        onClose={() => setLogsOpen(false)}
        transparentMode={transparentMode}
      />

      {/* Particle Sphere Background */}
      <ParticleSphere 
        isListening={isListening} 
        audioLevel={audioLevel} 
        transparentMode={transparentMode}
        systemMode={systemMode}
      />

      {/* Minimized Menu */}
      <MinimizedMenu 
        onPlaySound={soundEnabled ? playSound : undefined}
        isVoiceActive={isListening}
        onVoiceToggle={handleVoiceToggle}
        onWidgetCommandRef={onWidgetCommand}
        transparentMode={transparentMode}
      />

      {/* Voice Commands Help */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-2"
          >
            <div className="text-[10px] text-white/60 text-center space-y-1">
              <div className="text-white/80 font-medium mb-2">Comandos disponíveis:</div>
              <div className="flex flex-wrap justify-center gap-2 max-w-sm">
                {['música', 'clima', 'calendário', 'relógio', 'sistema', 'radar', 'notificações'].map((cmd) => (
                  <span key={cmd} className="px-2 py-0.5 bg-white/10 rounded text-white/50">
                    "abrir {cmd}"
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-1">
                {['fechar', 'pausar', 'próxima', 'silenciar'].map((cmd) => (
                  <span key={cmd} className="px-2 py-0.5 bg-cyan-500/20 rounded text-cyan-400/70">
                    "{cmd}"
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Audio Level Indicator */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute bottom-32 left-1/2 -translate-x-1/2 flex gap-1 items-end h-12"
          >
            {Array.from({ length: 30 }).map((_, i) => {
              const centerOffset = Math.abs(i - 15) / 15;
              const heightMultiplier = 1 - centerOffset * 0.5;
              const height = Math.max(4, audioLevel * 48 * heightMultiplier);
              
              return (
                <motion.div
                  key={i}
                  className="w-1 bg-white/70 rounded-full"
                  style={{ height }}
                  animate={{ height }}
                  transition={{ duration: 0.05 }}
                />
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Text */}
      <AnimatePresence>
        {(isListening || isProcessing) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 max-w-md text-center"
          >
            <span className="text-white/60 text-sm font-light tracking-widest uppercase">
              {getStatusText()}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chevron indicator at bottom center */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ChevronUp className="w-6 h-6 text-white/30" />
      </motion.div>

      {/* Bottom Controls */}
      <div className="absolute bottom-6 right-6 flex items-center gap-4">
        {/* Mini Mode Button */}
        <motion.button
          onClick={handleEnterMiniMode}
          className="flex items-center gap-2 text-cyan-400/60 hover:text-cyan-400 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="w-3 h-3 rounded-full bg-cyan-400/50" />
          <span className="text-[10px] font-mono tracking-wider uppercase">
            MINI
          </span>
        </motion.button>

        {/* Mode Demo Button */}
        <motion.button
          onClick={handleModeDemo}
          className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div 
            className="w-3 h-3 rounded-full"
            style={{
              background: systemMode === 'idle' ? 'white' :
                systemMode === 'listening' ? 'cyan' :
                systemMode === 'processing' ? 'magenta' :
                systemMode === 'success' ? 'lime' : 'red'
            }}
          />
          <span className="text-[10px] font-mono tracking-wider uppercase">
            {systemMode}
          </span>
        </motion.button>

        {/* Transparent Mode Toggle */}
        <motion.button
          onClick={handleToggleTransparent}
          className={`flex items-center gap-2 transition-colors ${
            transparentMode 
              ? 'text-cyan-400 hover:text-cyan-300' 
              : 'text-white/40 hover:text-white/70'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {transparentMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          <span className="text-[10px] font-mono tracking-wider">
            {transparentMode ? 'WIDGET' : 'NORMAL'}
          </span>
        </motion.button>

        {/* Sound Toggle */}
        <motion.button
          onClick={handleToggleSound}
          className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          <span className="text-[10px] font-mono tracking-wider">
            SOM: {soundEnabled ? 'ON' : 'OFF'}
          </span>
        </motion.button>
      </div>
    </div>
  );
};

export default HUDOverlay;
