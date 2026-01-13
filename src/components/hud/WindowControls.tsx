import { motion } from 'framer-motion';
import { X, Minus, Terminal } from 'lucide-react';

interface WindowControlsProps {
  onClose?: () => void;
  onMinimize?: () => void;
  onLogsToggle?: () => void;
  logsOpen?: boolean;
  transparentMode?: boolean;
}

const WindowControls = ({ 
  onClose, 
  onMinimize, 
  onLogsToggle,
  logsOpen = false,
  transparentMode = false 
}: WindowControlsProps) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
      {/* Logs Button */}
      <motion.button
        onClick={onLogsToggle}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
          logsOpen
            ? 'border-cyan-500/50 bg-cyan-500/20 text-cyan-400'
            : transparentMode
              ? 'border-white/30 bg-white/10 backdrop-blur-md text-white/70 hover:text-white hover:border-white/50'
              : 'border-white/20 bg-black/50 backdrop-blur-sm text-white/50 hover:text-white hover:border-white/40'
        }`}
        title="Logs do Sistema"
      >
        <Terminal size={14} />
      </motion.button>

      {/* Minimize Button */}
      <motion.button
        onClick={onMinimize}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
          transparentMode
            ? 'border-white/30 bg-white/10 backdrop-blur-md text-white/70 hover:text-yellow-400 hover:border-yellow-400/50 hover:bg-yellow-400/20'
            : 'border-white/20 bg-black/50 backdrop-blur-sm text-white/50 hover:text-yellow-400 hover:border-yellow-400/50 hover:bg-yellow-400/10'
        }`}
        title="Minimizar"
      >
        <Minus size={14} />
      </motion.button>

      {/* Close Button */}
      <motion.button
        onClick={onClose}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
          transparentMode
            ? 'border-white/30 bg-white/10 backdrop-blur-md text-white/70 hover:text-red-400 hover:border-red-400/50 hover:bg-red-400/20'
            : 'border-white/20 bg-black/50 backdrop-blur-sm text-white/50 hover:text-red-400 hover:border-red-400/50 hover:bg-red-400/10'
        }`}
        title="Fechar"
      >
        <X size={14} />
      </motion.button>
    </div>
  );
};

export default WindowControls;
