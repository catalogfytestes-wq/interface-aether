import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, ChevronUp } from 'lucide-react';
import ParticleSphere from './ParticleSphere';
import MinimizedMenu from './MinimizedMenu';
import useSoundEffects from '@/hooks/useSoundEffects';

interface HUDOverlayProps {
  isListening?: boolean;
  isProcessing?: boolean;
  audioLevel?: number;
}

const HUDOverlay = ({
  isListening = false,
  isProcessing = false,
  audioLevel = 0,
}: HUDOverlayProps) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { playSound, toggleSound } = useSoundEffects();

  const handleToggleSound = () => {
    setSoundEnabled(!soundEnabled);
    toggleSound(!soundEnabled);
    playSound('click');
  };

  const getStatusText = () => {
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
      />

      {/* Status Text */}
      <AnimatePresence>
        {(isListening || isProcessing) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2"
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
