import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import CentralOrb, { OrbState } from './CentralOrb';
import HolographicSidebar from './HolographicSidebar';
import NeuralFeed, { LogEntry } from './NeuralFeed';
import SystemWidgets from './SystemWidgets';
import RadarWidget from './RadarWidget';
import FuturisticClock from './FuturisticClock';
import WeatherWidget from './WeatherWidget';
import CalendarWidget from './CalendarWidget';
import SystemDiagnostics from './SystemDiagnostics';
import useSoundEffects from '@/hooks/useSoundEffects';

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
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { playSound, toggleSound } = useSoundEffects();

  // Determine orb state from props
  useEffect(() => {
    if (isListening) {
      setOrbState('listening');
      playSound('activate');
    } else if (isProcessing) {
      setOrbState('processing');
      playSound('transition');
    } else {
      setOrbState('idle');
    }
  }, [isListening, isProcessing, playSound]);

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
    }, 2000);

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
      
      if (states[currentIndex] === 'listening') {
        playSound('activate');
      } else if (states[currentIndex] === 'processing') {
        playSound('scan');
      }
    }, 6000);

    return () => clearInterval(cycleInterval);
  }, [isListening, isProcessing, playSound]);

  const logs = externalLogs || internalLogs;

  const handleToggleSound = useCallback(() => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    toggleSound(newState);
    if (newState) {
      playSound('click');
    }
  }, [soundEnabled, toggleSound, playSound]);

  const handleHover = useCallback(() => {
    playSound('hover');
  }, [playSound]);

  const handleClick = useCallback(() => {
    playSound('click');
  }, [playSound]);

  const handleActivateVoice = useCallback(() => {
    playSound('activate');
    onActivateVoice?.();
  }, [playSound, onActivateVoice]);

  const handleIntelScan = useCallback(() => {
    playSound('scan');
    onIntelScan?.();
  }, [playSound, onIntelScan]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(185 100% 50%) 1px, transparent 1px),
            linear-gradient(90deg, hsl(185 100% 50%) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Day indicators at top */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
        <div className="flex gap-4 items-center">
          {Array.from({ length: 15 }).map((_, i) => {
            const day = i + 1;
            const isCurrentDay = day === new Date().getDate();
            return (
              <motion.span
                key={i}
                className={`text-xs font-orbitron ${
                  isCurrentDay 
                    ? 'text-primary text-glow' 
                    : 'text-primary/30'
                }`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                {day.toString().padStart(2, '0')}
              </motion.span>
            );
          })}
          <span className="text-primary/20 mx-2">...</span>
          {Array.from({ length: 10 }).map((_, i) => {
            const day = 20 + i;
            const isCurrentDay = day === new Date().getDate();
            return (
              <motion.span
                key={i + 20}
                className={`text-xs font-orbitron ${
                  isCurrentDay 
                    ? 'text-primary text-glow' 
                    : 'text-primary/30'
                }`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (i + 15) * 0.03 }}
              >
                {day}
              </motion.span>
            );
          })}
        </div>
      </div>

      {/* Corner decorations */}
      <CornerDecoration position="top-left" />
      <CornerDecoration position="top-right" />
      <CornerDecoration position="bottom-left" />
      <CornerDecoration position="bottom-right" />

      {/* Left panel: Clock + System Diagnostics */}
      <motion.div
        className="absolute left-6 top-20 space-y-6 pointer-events-auto"
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <FuturisticClock />
        <SystemDiagnostics />
      </motion.div>

      {/* Central Orb */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
        <CentralOrb state={orbState} />
      </div>

      {/* Right panel: Weather + Calendar + Radar */}
      <motion.div
        className="absolute right-6 top-20 space-y-4 pointer-events-auto"
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
      >
        <WeatherWidget />
        <CalendarWidget />
      </motion.div>

      {/* Radar bottom left */}
      <motion.div
        className="absolute left-6 bottom-8 pointer-events-auto"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        <RadarWidget />
      </motion.div>

      {/* Holographic Sidebar */}
      <div className="pointer-events-auto">
        <HolographicSidebar
          onActivateVoice={handleActivateVoice}
          onIntelScan={handleIntelScan}
          onSettings={onSettings}
          onHover={handleHover}
          onClick={handleClick}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
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
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, hsl(185 100% 50% / 0.02) 0%, transparent 60%)',
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
      className={`absolute ${positionClasses[position]} w-12 h-12`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      <svg viewBox="0 0 48 48" className="w-full h-full">
        <path
          d="M0 24 L0 0 L24 0"
          fill="none"
          stroke="hsl(185 100% 50% / 0.25)"
          strokeWidth="1"
        />
        <path
          d="M0 16 L0 0 L16 0"
          fill="none"
          stroke="hsl(185 100% 50% / 0.4)"
          strokeWidth="1"
        />
        <circle cx="0" cy="0" r="2" fill="hsl(185 100% 50% / 0.4)" />
      </svg>
    </motion.div>
  );
};

export default HUDOverlay;
