import { useState, useEffect, useCallback, useRef } from 'react';
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
  const playSoundRef = useRef(playSound);
  
  useEffect(() => {
    playSoundRef.current = playSound;
  }, [playSound]);

  // Handle voice commands
  const handleFinalTranscript = useCallback((transcript: string) => {
    const lower = transcript.toLowerCase().trim();
    console.log('Final transcript:', lower);
    
    if (lower.includes('abrir música') || lower.includes('abrir musica')) {
      playSoundRef.current('activate');
      toast('🎵 Abrindo player de música...');
    } else if (lower.includes('abrir clima')) {
      playSoundRef.current('activate');
      toast('🌤️ Abrindo widget de clima...');
    } else if (lower.includes('abrir calendário') || lower.includes('abrir calendario')) {
      playSoundRef.current('activate');
      toast('📅 Abrindo calendário...');
    } else if (lower.includes('abrir relógio') || lower.includes('abrir relogio')) {
      playSoundRef.current('activate');
      toast('🕐 Abrindo relógio...');
    } else if (lower.includes('abrir sistema')) {
      playSoundRef.current('activate');
      toast('⚙️ Abrindo diagnósticos do sistema...');
    } else if (lower.includes('desativar som')) {
      setSoundEnabled(false);
      toggleSound(false);
      toast('🔇 Som desativado');
    } else if (lower.includes('ativar som')) {
      setSoundEnabled(true);
      toggleSound(true);
      toast('🔊 Som ativado');
    }
  }, [toggleSound]);

  const { isListening, transcript, isSupported, toggleListening } = useVoiceRecognition({
    onTranscript: (text) => {
      console.log('Transcript:', text);
    },
    onFinalTranscript: handleFinalTranscript,
  });

  // Sync audio capture with voice listening
  useEffect(() => {
    if (isListening && !isCapturing) {
      console.log('Starting audio capture...');
      startCapturing();
    } else if (!isListening && isCapturing) {
      console.log('Stopping audio capture...');
      stopCapturing();
    }
  }, [isListening, isCapturing, startCapturing, stopCapturing]);

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
