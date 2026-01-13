import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, X, Trash2, ChevronDown } from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'info' | 'warn' | 'error' | 'success';
  message: string;
}

interface SystemLogsProps {
  isOpen: boolean;
  onClose: () => void;
  transparentMode?: boolean;
}

const SystemLogs = ({ isOpen, onClose, transparentMode = false }: SystemLogsProps) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Add initial logs
  useEffect(() => {
    const initialLogs: LogEntry[] = [
      { id: '1', timestamp: new Date(), type: 'info', message: '[CORE] Sistema inicializado' },
      { id: '2', timestamp: new Date(), type: 'success', message: '[NET] Conexão estabelecida' },
      { id: '3', timestamp: new Date(), type: 'info', message: '[UI] Interface HUD carregada' },
      { id: '4', timestamp: new Date(), type: 'info', message: '[AUDIO] Módulo de áudio pronto' },
      { id: '5', timestamp: new Date(), type: 'success', message: '[PARTICLES] Engine de partículas ativo' },
    ];
    setLogs(initialLogs);
  }, []);

  // Simulate periodic logs
  useEffect(() => {
    if (!isOpen) return;

    const messages = [
      { type: 'info' as const, message: '[MONITOR] Verificação de saúde: OK' },
      { type: 'info' as const, message: '[MEM] Uso de memória: normal' },
      { type: 'info' as const, message: '[CPU] Carga do sistema: baixa' },
      { type: 'success' as const, message: '[SYNC] Dados sincronizados' },
      { type: 'warn' as const, message: '[CACHE] Limpeza automática executada' },
      { type: 'info' as const, message: '[NET] Latência: 24ms' },
    ];

    const interval = setInterval(() => {
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      setLogs(prev => [...prev.slice(-50), {
        id: Date.now().toString(),
        timestamp: new Date(),
        type: randomMsg.type,
        message: randomMsg.message
      }]);
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const clearLogs = () => {
    setLogs([{
      id: Date.now().toString(),
      timestamp: new Date(),
      type: 'info',
      message: '[SYS] Logs limpos'
    }]);
  };

  const getTypeColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'error': return 'text-red-400';
      case 'warn': return 'text-yellow-400';
      case 'success': return 'text-green-400';
      default: return 'text-cyan-400';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -20, height: 0 }}
          className={`fixed top-14 left-1/2 -translate-x-1/2 w-[600px] max-w-[90vw] z-50 rounded-lg border overflow-hidden ${
            transparentMode 
              ? 'bg-white/10 backdrop-blur-xl border-white/20' 
              : 'bg-black/90 backdrop-blur-md border-white/10'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
            <div className="flex items-center gap-2 text-white/80">
              <Terminal size={14} />
              <span className="text-xs font-mono tracking-wider">LOGS DO SISTEMA</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoScroll(!autoScroll)}
                className={`p-1 rounded transition-colors ${
                  autoScroll ? 'text-cyan-400' : 'text-white/40 hover:text-white/70'
                }`}
                title={autoScroll ? 'Auto-scroll ativado' : 'Auto-scroll desativado'}
              >
                <ChevronDown size={14} />
              </button>
              <button
                onClick={clearLogs}
                className="p-1 text-white/40 hover:text-white/70 transition-colors"
                title="Limpar logs"
              >
                <Trash2 size={14} />
              </button>
              <button
                onClick={onClose}
                className="p-1 text-white/40 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Logs Content */}
          <div className="h-[200px] overflow-y-auto p-2 font-mono text-[11px] scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            {logs.map((log) => (
              <div key={log.id} className="flex gap-2 py-0.5 hover:bg-white/5 px-1 rounded">
                <span className="text-white/30 shrink-0">{formatTime(log.timestamp)}</span>
                <span className={`${getTypeColor(log.type)} shrink-0`}>
                  [{log.type.toUpperCase()}]
                </span>
                <span className="text-white/70">{log.message}</span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>

          {/* Status Bar */}
          <div className="flex items-center justify-between px-4 py-1 border-t border-white/10 text-[10px] text-white/40">
            <span>{logs.length} entradas</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Monitorando
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SystemLogs;
