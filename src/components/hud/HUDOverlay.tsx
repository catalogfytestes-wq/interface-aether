import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, ChevronUp } from 'lucide-react';
import ParticleSphere from './ParticleSphere';
import MinimizedMenu from './MinimizedMenu';
import useSoundEffects from '@/hooks/useSoundEffects';
import useVoiceRecognition from '@/hooks/useVoiceRecognition';
import useAudioLevel from '@/hooks/useAudioLevel';
import { toast } from 'sonner';

interface HUDOverlayProps {
  isProcessing?: boolean;
}

const HUDOverlay = ({
  isProcessing = false,
}: HUDOverlayProps) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { playSound, toggleSound } = useSoundEffects();
  const { audioLevel, isCapturing, startCapturing, stopCapturing } = useAudioLevel();

  // Voice commands
  const voiceCommands = useMemo(() => [
    {
      command: 'abrir música',
      action: () => {
        playSound('activate');
        toast('🎵 Abrindo player de música...');
      },
    },
    {
      command: 'abrir clima',
      action: () => {
        playSound('activate');
        toast('🌤️ Abrindo widget de clima...');
      },
    },
    {
      command: 'abrir calendário',
      action: () => {
        playSound('activate');
        toast('📅 Abrindo calendário...');
      },
    },
    {
      command: 'abrir relógio',
      action: () => {
        playSound('activate');
        toast('🕐 Abrindo relógio...');
      },
    },
    {
      command: 'abrir sistema',
      action: () => {
        playSound('activate');
        toast('⚙️ Abrindo diagnósticos do sistema...');
      },
    },
    {
      command: 'desativar som',
      action: () => {
        setSoundEnabled(false);
        toggleSound(false);
        toast('🔇 Som desativado');
      },
    },
    {
      command: 'ativar som',
      action: () => {
        setSoundEnabled(true);
        toggleSound(true);
        toast('🔊 Som ativado');
      },
    },
  ], [playSound, toggleSound]);

  const { isListening, transcript, isSupported, toggleListening } = useVoiceRecognition({
    commands: voiceCommands,
    onTranscript: (text) => {
      console.log('Transcript:', text);
    },
  });

  // Sync audio capture with voice listening
  useEffect(() => {
    if (isListening && !isCapturing) {
      startCapturing();
    } else if (!isListening && isCapturing) {
      stopCapturing();
    }
  }, [isListening, isCapturing, startCapturing, stopCapturing]);

  const handleToggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    toggleSound(newState);
    if (soundEnabled) playSound('click');
  };

  const handleVoiceToggle = useCallback(() => {
    if (!isSupported) {
      toast.error('Reconhecimento de voz não suportado neste navegador');
      return;
    }
    toggleListening();
    if (!isListening) {
      toast('🎤 Ouvindo comandos de voz...', {
        description: 'Diga "abrir música", "abrir clima", etc.',
      });
    }
  }, [isSupported, toggleListening, isListening]);

  const getStatusText = () => {
    if (isListening && transcript) return transcript;
    if (isListening) return 'Ouvindo...';
    if (isProcessing) return 'Processando...';
    return '';
  };

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      {/* Particle Sphere Background */}
      <ParticleSphere isListening={isListening} audioLevel={audioLevel} />

      {/* Minimized Menu */}
      <MinimizedMenu 
        onPlaySound={soundEnabled ? playSound : undefined}
        isVoiceActive={isListening}
        onVoiceToggle={handleVoiceToggle}
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
              <div className="text-white/80 font-medium">Comandos disponíveis:</div>
              <div className="flex flex-wrap justify-center gap-2">
                {['música', 'clima', 'calendário', 'relógio', 'sistema'].map((cmd) => (
                  <span key={cmd} className="px-2 py-0.5 bg-white/10 rounded text-white/50">
                    "abrir {cmd}"
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
            className="absolute bottom-32 left-1/2 -translate-x-1/2 flex gap-1"
          >
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                className="w-1 bg-white/60 rounded-full"
                animate={{
                  height: Math.max(4, audioLevel * 40 * (1 + Math.sin(Date.now() * 0.01 + i) * 0.5)),
                }}
                transition={{ duration: 0.05 }}
              />
            ))}
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
            className="absolute bottom-24 left-1/2 -translate-x-1/2 max-w-md text-center"
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

      {/* Sound Toggle */}
      <motion.button
        onClick={handleToggleSound}
        className="absolute bottom-6 right-6 flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        <span className="text-[10px] font-mono tracking-wider">
          SOM: {soundEnabled ? 'ON' : 'OFF'}
        </span>
      </motion.button>
    </div>
  );
};

export default HUDOverlay;
