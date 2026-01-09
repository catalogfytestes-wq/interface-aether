import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import CentralOrb, { OrbState } from './CentralOrb';
import DateWidget from './DateWidget';
import SystemInfo from './SystemInfo';
import WeatherWidget from './WeatherWidget';
import ReactorCore from './ReactorCore';
import QuickLinks from './QuickLinks';
import MusicPlayer from './MusicPlayer';
import NotificationArea from './NotificationArea';
import useSoundEffects from '@/hooks/useSoundEffects';

interface HUDOverlayProps {
  isListening?: boolean;
  isProcessing?: boolean;
}

const HUDOverlay = ({
  isListening = false,
  isProcessing = false,
}: HUDOverlayProps) => {
  const [orbState, setOrbState] = useState<OrbState>('idle');
  const { playSound } = useSoundEffects();

  useEffect(() => {
    if (isListening) {
      setOrbState('listening');
      playSound('activate');
    } else if (isProcessing) {
      setOrbState('processing');
    } else {
      setOrbState('idle');
    }
  }, [isListening, isProcessing, playSound]);

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-background" />
      
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(185 100% 50%) 1px, transparent 1px),
            linear-gradient(90deg, hsl(185 100% 50%) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />

      {/* ===== LEFT PANEL ===== */}
      <motion.div
        className="absolute left-6 top-6 space-y-6"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Date Widget */}
        <DateWidget />

        {/* System Info with Storage & Power */}
        <SystemInfo />

        {/* Communication status */}
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <motion.div
              className="w-20 h-20 rounded-full border-2 border-primary/30 flex items-center justify-center"
              style={{
                background: 'radial-gradient(circle, hsl(185 100% 50% / 0.1) 0%, transparent 70%)',
              }}
              animate={{ 
                boxShadow: ['0 0 20px hsl(185 100% 50% / 0.2)', '0 0 40px hsl(185 100% 50% / 0.4)', '0 0 20px hsl(185 100% 50% / 0.2)']
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <div className="text-center">
                <div className="text-[8px] uppercase tracking-wider text-primary/60">COMM</div>
                <div className="text-[10px] font-mono text-primary">ATIVO</div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* ===== CENTER - MAIN ORB ===== */}
      <div className="absolute inset-0 flex items-center justify-center">
        <CentralOrb state={orbState} />
      </div>

      {/* ===== RIGHT PANEL - TOP ===== */}
      <motion.div
        className="absolute right-6 top-6 space-y-6"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {/* Quick Links & Apps */}
        <div className="hud-glass holo-border p-4 w-48">
          <QuickLinks onLinkClick={(id) => playSound('click')} />
        </div>

        {/* System label */}
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-widest text-primary font-orbitron text-glow">
            AETHER SYSTEM
          </div>
          <div className="text-[8px] uppercase tracking-wider text-primary/40 font-mono">
            v2.0 // OPERACIONAL
          </div>
        </div>
      </motion.div>

      {/* ===== RIGHT PANEL - BOTTOM ===== */}
      <motion.div
        className="absolute right-6 bottom-6 space-y-4"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {/* Reactor Core */}
        <div className="flex justify-end">
          <ReactorCore isActive={true} />
        </div>

        {/* Weather Widget */}
        <WeatherWidget />
      </motion.div>

      {/* ===== LEFT PANEL - BOTTOM ===== */}
      <motion.div
        className="absolute left-6 bottom-6"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        {/* Music Player */}
        <MusicPlayer />
      </motion.div>

      {/* ===== BOTTOM CENTER ===== */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        {/* Status bar */}
        <div className="flex items-center gap-8 text-[9px] font-mono text-primary/50">
          <span>LATÊNCIA: 24ms</span>
          <span>|</span>
          <span>THREADS: 8</span>
          <span>|</span>
          <span>UPTIME: 4h 33m</span>
        </div>
      </motion.div>

      {/* ===== TOP CENTER ===== */}
      <motion.div
        className="absolute top-6 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {/* Title */}
        <div className="text-center">
          <motion.h1
            className="text-2xl font-bold font-orbitron text-primary text-glow tracking-[0.3em]"
            animate={{ 
              textShadow: [
                '0 0 20px hsl(185 100% 50%)',
                '0 0 40px hsl(185 100% 50%)',
                '0 0 20px hsl(185 100% 50%)',
              ]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            AETHER
          </motion.h1>
          <div className="text-[9px] uppercase tracking-[0.4em] text-primary/40 mt-1">
            INTERFACE DE CONTROLE
          </div>
        </div>
      </motion.div>

      {/* ===== NOTIFICATIONS - MIDDLE RIGHT ===== */}
      <motion.div
        className="absolute right-6 top-1/2 -translate-y-1/2"
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <NotificationArea />
      </motion.div>

      {/* Corner decorations */}
      <CornerFrame position="top-left" />
      <CornerFrame position="top-right" />
      <CornerFrame position="bottom-left" />
      <CornerFrame position="bottom-right" />
    </div>
  );
};

const CornerFrame = ({ position }: { position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }) => {
  const positionStyles: Record<string, React.CSSProperties> = {
    'top-left': { top: 0, left: 0 },
    'top-right': { top: 0, right: 0, transform: 'scaleX(-1)' },
    'bottom-left': { bottom: 0, left: 0, transform: 'scaleY(-1)' },
    'bottom-right': { bottom: 0, right: 0, transform: 'scale(-1, -1)' },
  };

  return (
    <div className="absolute w-20 h-20" style={positionStyles[position]}>
      <svg viewBox="0 0 80 80" className="w-full h-full">
        <path
          d="M0 40 L0 0 L40 0"
          fill="none"
          stroke="hsl(185 100% 50% / 0.3)"
          strokeWidth="2"
        />
        <path
          d="M0 20 L0 0 L20 0"
          fill="none"
          stroke="hsl(185 100% 50% / 0.5)"
          strokeWidth="2"
        />
        <circle cx="0" cy="0" r="3" fill="hsl(185 100% 50%)" />
      </svg>
    </div>
  );
};

export default HUDOverlay;
