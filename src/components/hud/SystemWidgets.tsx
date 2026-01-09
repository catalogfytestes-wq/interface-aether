import { motion } from 'framer-motion';
import { Minus, X, Circle } from 'lucide-react';

interface SystemWidgetsProps {
  onMinimize?: () => void;
  onClose?: () => void;
  status?: 'online' | 'offline' | 'standby';
}

const SystemWidgets = ({
  onMinimize,
  onClose,
  status = 'online',
}: SystemWidgetsProps) => {
  const getStatusColor = () => {
    switch (status) {
      case 'online':
        return 'bg-primary';
      case 'offline':
        return 'bg-destructive';
      case 'standby':
        return 'bg-hud-orange';
      default:
        return 'bg-primary';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'online':
        return 'ONLINE';
      case 'offline':
        return 'DESCONECTADO';
      case 'standby':
        return 'EM ESPERA';
      default:
        return 'ONLINE';
    }
  };

  return (
    <div className="fixed top-6 right-6 z-40">
      <div className="flex flex-col items-end gap-4">
        {/* Window controls */}
        <motion.div
          className="flex items-center gap-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {/* Minimize button */}
          <motion.button
            className="group relative w-8 h-8 flex items-center justify-center rounded border border-primary/30 bg-primary/5 hover:bg-primary/20 transition-all duration-300"
            onClick={onMinimize}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Minus className="w-3 h-3 text-primary/60 group-hover:text-primary transition-colors" />
            <motion.div
              className="absolute inset-0 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              style={{
                boxShadow: '0 0 15px hsl(185 100% 50% / 0.3), inset 0 0 10px hsl(185 100% 50% / 0.1)',
              }}
            />
          </motion.button>

          {/* Close button */}
          <motion.button
            className="group relative w-8 h-8 flex items-center justify-center rounded border border-destructive/30 bg-destructive/5 hover:bg-destructive/20 transition-all duration-300"
            onClick={onClose}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <X className="w-3 h-3 text-destructive/60 group-hover:text-destructive transition-colors" />
            <motion.div
              className="absolute inset-0 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              style={{
                boxShadow: '0 0 15px hsl(0 100% 58% / 0.3), inset 0 0 10px hsl(0 100% 58% / 0.1)',
              }}
            />
          </motion.button>
        </motion.div>

        {/* Status indicator */}
        <motion.div
          className="flex items-center gap-3 px-4 py-2 rounded hud-glass"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          {/* Status dot */}
          <motion.div
            className={`w-2 h-2 rounded-full ${getStatusColor()}`}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* System info */}
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-[0.15em] text-primary font-orbitron text-glow">
              AETHER.OS v2.0
            </span>
            <span className="text-[9px] uppercase tracking-widest text-primary/50 font-mono">
              // {getStatusText()}
            </span>
          </div>
        </motion.div>

        {/* Additional system stats */}
        <motion.div
          className="flex flex-col items-end gap-1 text-right"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <SystemStat label="CPU" value="12%" />
          <SystemStat label="MEM" value="2.4GB" />
          <SystemStat label="NET" value="ATIVO" />
        </motion.div>
      </div>
    </div>
  );
};

const SystemStat = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center gap-2 font-mono text-[9px]">
    <span className="text-muted-foreground/40 uppercase tracking-wider">{label}:</span>
    <span className="text-primary/60">{value}</span>
  </div>
);

export default SystemWidgets;
