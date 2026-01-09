import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import CentralOrb, { OrbState } from './CentralOrb';
import HolographicSidebar from './HolographicSidebar';
import NeuralFeed, { LogEntry } from './NeuralFeed';
import SystemWidgets from './SystemWidgets';

interface HUDOverlayProps {
  isListening?: boolean;
  isProcessing?: boolean;
  logs?: LogEntry[];
  onActivateVoice?: () => void;
  onIntelScan?: () => void;
  onSettings?: () => void;
  onMinimize?: () => void;
  onClose?: () => void;
}

const HUDOverlay = ({
  isListening = false,
  isProcessing = false,
  logs: externalLogs,
  onActivateVoice,
  onIntelScan,
  onSettings,
  onMinimize,
  onClose,
}: HUDOverlayProps) => {
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const [internalLogs, setInternalLogs] = useState<LogEntry[]>([]);

  // Determine orb state from props
  useEffect(() => {
    if (isListening) {
      setOrbState('listening');
    } else if (isProcessing) {
      setOrbState('processing');
    } else {
      setOrbState('idle');
    }
  }, [isListening, isProcessing]);

  // Demo logs for preview
  useEffect(() => {
    if (externalLogs) return;

    const demoLogs: Omit<LogEntry, 'id'>[] = [
      { timestamp: '00:00:01', type: 'system', message: 'Inicializando núcleo AETHER...' },
      { timestamp: '00:00:02', type: 'success', message: 'Conexão neural estabelecida' },
      { timestamp: '00:00:03', type: 'info', message: 'Calibrando sensores de voz' },
      { timestamp: '00:00:04', type: 'system', message: 'Módulos de IA carregados' },
      { timestamp: '00:00:05', type: 'success', message: 'Sistema pronto para operação' },
      { timestamp: '00:00:06', type: 'warning', message: 'Latência de rede detectada: 42ms' },
      { timestamp: '00:00:07', type: 'info', message: 'Aguardando comando do operador...' },
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < demoLogs.length) {
        setInternalLogs((prev) => [
          ...prev,
          { ...demoLogs[index], id: `log-${Date.now()}-${index}` },
        ]);
        index++;
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [externalLogs]);

  // Demo state cycling
  useEffect(() => {
    if (isListening || isProcessing) return;

    const states: OrbState[] = ['idle', 'listening', 'processing'];
    let currentIndex = 0;

    const cycleInterval = setInterval(() => {
      currentIndex = (currentIndex + 1) % states.length;
      setOrbState(states[currentIndex]);
    }, 5000);

    return () => clearInterval(cycleInterval);
  }, [isListening, isProcessing]);

  const logs = externalLogs || internalLogs;

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(185 100% 50%) 1px, transparent 1px),
            linear-gradient(90deg, hsl(185 100% 50%) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Corner decorations */}
      <CornerDecoration position="top-left" />
      <CornerDecoration position="top-right" />
      <CornerDecoration position="bottom-left" />
      <CornerDecoration position="bottom-right" />

      {/* Central Orb */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
        <CentralOrb state={orbState} />
      </div>

      {/* Holographic Sidebar */}
      <div className="pointer-events-auto">
        <HolographicSidebar
          onActivateVoice={onActivateVoice}
          onIntelScan={onIntelScan}
          onSettings={onSettings}
        />
      </div>

      {/* Neural Feed */}
      <div className="pointer-events-auto">
        <NeuralFeed logs={logs} />
      </div>

      {/* System Widgets */}
      <div className="pointer-events-auto">
        <SystemWidgets
          onMinimize={onMinimize}
          onClose={onClose}
          status="online"
        />
      </div>

      {/* Ambient glow effects */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, hsl(185 100% 50% / 0.03) 0%, transparent 60%)',
        }}
      />
    </div>
  );
};

const CornerDecoration = ({
  position,
}: {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}) => {
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4 rotate-90',
    'bottom-left': 'bottom-4 left-4 -rotate-90',
    'bottom-right': 'bottom-4 right-4 rotate-180',
  };

  return (
    <motion.div
      className={`absolute ${positionClasses[position]} w-16 h-16`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      <svg viewBox="0 0 64 64" className="w-full h-full">
        <path
          d="M0 32 L0 0 L32 0"
          fill="none"
          stroke="hsl(185 100% 50% / 0.3)"
          strokeWidth="1"
        />
        <path
          d="M0 24 L0 0 L24 0"
          fill="none"
          stroke="hsl(185 100% 50% / 0.5)"
          strokeWidth="1"
        />
        <circle cx="0" cy="0" r="2" fill="hsl(185 100% 50% / 0.5)" />
      </svg>
    </motion.div>
  );
};

export default HUDOverlay;
