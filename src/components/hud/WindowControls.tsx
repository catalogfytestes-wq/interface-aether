import { motion } from 'framer-motion';
import { X, Minus, Terminal, Wifi, WifiOff, Monitor, MonitorOff, Loader2, RefreshCw } from 'lucide-react';

interface WindowControlsProps {
  onClose?: () => void;
  onMinimize?: () => void;
  onLogsToggle?: () => void;
  logsOpen?: boolean;
  transparentMode?: boolean;
  // JARVIS status
  isGeminiConnected?: boolean;
  isGeminiConnecting?: boolean;
  isScreenSharing?: boolean;
  isSpeaking?: boolean;
  audioLevel?: number;
  onScreenShareToggle?: () => void;
  onReconnect?: () => void;
}

// VU Meter Component for audio level
const MiniVUMeter = ({ level, isActive }: { level: number; isActive: boolean }) => {
  const bars = 5;
  const activeThreshold = level * bars;
  
  return (
    <div className="flex items-end gap-0.5 h-4">
      {Array.from({ length: bars }).map((_, i) => {
        const isBarActive = i < activeThreshold;
        return (
          <motion.div
            key={i}
            className={`w-1 rounded-sm transition-all duration-75 ${
              isBarActive && isActive ? 'bg-cyan-400' : 'bg-white/20'
            }`}
            animate={{
              height: isBarActive && isActive ? `${(i + 1) * 3}px` : '3px',
            }}
            transition={{ duration: 0.05 }}
          />
        );
      })}
    </div>
  );
};

const WindowControls = ({ 
  onClose, 
  onMinimize, 
  onLogsToggle,
  logsOpen = false,
  transparentMode = false,
  isGeminiConnected = false,
  isGeminiConnecting = false,
  isScreenSharing = false,
  isSpeaking = false,
  audioLevel = 0,
  onScreenShareToggle,
  onReconnect,
}: WindowControlsProps) => {
  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
      {/* JARVIS Status Indicator */}
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md ${
        isGeminiConnected 
          ? 'border-green-500/30 bg-green-500/10' 
          : isGeminiConnecting
            ? 'border-yellow-500/30 bg-yellow-500/10'
            : 'border-red-500/30 bg-red-500/10'
      }`}>
        {/* Connection Status */}
        <div className="flex items-center gap-1.5">
          {isGeminiConnecting ? (
            <Loader2 size={12} className="text-yellow-400 animate-spin" />
          ) : isGeminiConnected ? (
            <Wifi size={12} className="text-green-400" />
          ) : (
            <WifiOff size={12} className="text-red-400/60" />
          )}
          <span className={`text-[10px] font-mono tracking-wider ${
            isGeminiConnected ? 'text-green-400' : isGeminiConnecting ? 'text-yellow-400' : 'text-red-400/60'
          }`}>
            {isGeminiConnecting ? 'CONECTANDO...' : isGeminiConnected ? 'JARVIS' : 'OFFLINE'}
          </span>
        </div>

        {/* VU Meter when speaking */}
        {isGeminiConnected && (
          <MiniVUMeter level={audioLevel} isActive={isSpeaking} />
        )}

        {/* Force reconnect */}
        {onReconnect && (
          <motion.button
            onClick={onReconnect}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-1 rounded text-white/50 hover:text-white/80 transition-colors"
            title="Forçar reconexão do Gemini"
          >
            <RefreshCw size={12} />
          </motion.button>
        )}

        {/* Screen Share Toggle */}
        {isGeminiConnected && onScreenShareToggle && (
          <motion.button
            onClick={onScreenShareToggle}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`p-1 rounded transition-colors ${
              isScreenSharing 
                ? 'text-cyan-400 bg-cyan-400/20' 
                : 'text-white/50 hover:text-white/80'
            }`}
            title={isScreenSharing ? 'Parar compartilhamento' : 'Compartilhar tela'}
          >
            {isScreenSharing ? <Monitor size={12} /> : <MonitorOff size={12} />}
          </motion.button>
        )}
      </div>

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