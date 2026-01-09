import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef } from 'react';

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'system';
  message: string;
}

interface NeuralFeedProps {
  logs?: LogEntry[];
  maxVisible?: number;
}

const NeuralFeed = ({ logs = [], maxVisible = 8 }: NeuralFeedProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  const getTypeStyles = (type: LogEntry['type']) => {
    switch (type) {
      case 'error':
        return 'text-destructive';
      case 'warning':
        return 'text-hud-orange';
      case 'success':
        return 'text-primary';
      case 'system':
        return 'text-secondary';
      default:
        return 'text-primary/70';
    }
  };

  const getTypePrefix = (type: LogEntry['type']) => {
    switch (type) {
      case 'error':
        return '[ERRO]';
      case 'warning':
        return '[ALERTA]';
      case 'success':
        return '[OK]';
      case 'system':
        return '[SYS]';
      default:
        return '[INFO]';
    }
  };

  const visibleLogs = logs.slice(-maxVisible);

  return (
    <div className="fixed bottom-6 right-6 w-96 z-30">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary"
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
        <span className="text-[10px] uppercase tracking-[0.2em] text-primary/60 font-orbitron">
          FEED NEURAL
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-primary/30 to-transparent" />
      </div>

      {/* Log container */}
      <div
        ref={containerRef}
        className="space-y-1 max-h-64 overflow-y-auto scrollbar-hide"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)',
        }}
      >
        <AnimatePresence mode="popLayout">
          {visibleLogs.map((log, index) => (
            <motion.div
              key={log.id}
              className="relative group"
              initial={{ opacity: 0, x: 50, filter: 'blur(10px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: -20, filter: 'blur(5px)' }}
              transition={{
                type: 'spring',
                damping: 20,
                stiffness: 300,
                delay: index * 0.05,
              }}
            >
              <div className="flex items-start gap-2 font-mono text-xs leading-relaxed">
                {/* Timestamp */}
                <span className="text-muted-foreground/50 flex-shrink-0">
                  {log.timestamp}
                </span>

                {/* Type prefix */}
                <span className={`flex-shrink-0 ${getTypeStyles(log.type)}`}>
                  {getTypePrefix(log.type)}
                </span>

                {/* Message with matrix effect */}
                <motion.span
                  className={`${getTypeStyles(log.type)} break-all`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  {log.message.split('').map((char, charIndex) => (
                    <motion.span
                      key={charIndex}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: charIndex * 0.01,
                        duration: 0.1,
                      }}
                    >
                      {char}
                    </motion.span>
                  ))}
                </motion.span>
              </div>

              {/* Hover line indicator */}
              <motion.div
                className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary/0 group-hover:bg-primary/50 transition-colors"
                style={{ marginLeft: '-8px' }}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {logs.length === 0 && (
          <motion.div
            className="text-muted-foreground/40 font-mono text-xs italic"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Aguardando dados do sistema...
          </motion.div>
        )}
      </div>

      {/* Cursor blink effect */}
      <motion.div
        className="flex items-center gap-2 mt-3"
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        <span className="text-primary font-mono text-xs">{'>'}</span>
        <div className="w-2 h-4 bg-primary/80" />
      </motion.div>

      {/* Background glow */}
      <div
        className="absolute inset-0 -z-10 rounded-lg opacity-30 blur-xl pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, hsl(185 100% 50% / 0.1) 0%, transparent 70%)',
        }}
      />
    </div>
  );
};

export default NeuralFeed;
