import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export type OrbState = 'idle' | 'listening' | 'processing';

interface CentralOrbProps {
  state?: OrbState;
}

const CentralOrb = ({ state = 'idle' }: CentralOrbProps) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = time.getHours();
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = (hours % 12 || 12).toString();

  const getRotationSpeed = () => {
    switch (state) {
      case 'listening': return 4;
      case 'processing': return 2;
      default: return 15;
    }
  };

  const getColor = () => {
    switch (state) {
      case 'listening': return 'hsl(25 70% 50%)';
      case 'processing': return 'hsl(200 80% 50%)';
      default: return 'hsl(185 100% 50%)';
    }
  };

  // Generate tick marks for rings
  const outerTicks = Array.from({ length: 60 }, (_, i) => i);
  const middleTicks = Array.from({ length: 36 }, (_, i) => i);
  const innerTicks = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="relative flex items-center justify-center">
      {/* Outermost ring - subtle glow */}
      <div
        className="absolute w-[520px] h-[520px] rounded-full"
        style={{
          background: `radial-gradient(circle, transparent 45%, hsl(185 100% 50% / 0.02) 50%, transparent 55%)`,
        }}
      />

      {/* Outer rotating ring with detailed markers */}
      <motion.div
        className="absolute w-[480px] h-[480px]"
        animate={{ rotate: 360 }}
        transition={{ duration: getRotationSpeed() * 2, repeat: Infinity, ease: 'linear' }}
      >
        <svg viewBox="0 0 480 480" className="w-full h-full">
          <circle cx="240" cy="240" r="235" fill="none" stroke="hsl(185 100% 50% / 0.15)" strokeWidth="1" />
          <circle cx="240" cy="240" r="230" fill="none" stroke="hsl(185 100% 50% / 0.08)" strokeWidth="8" />
          
          {/* Outer tick marks */}
          {outerTicks.map((i) => {
            const angle = (i * 6 - 90) * (Math.PI / 180);
            const isMain = i % 5 === 0;
            const r1 = isMain ? 220 : 224;
            const r2 = 235;
            return (
              <line
                key={i}
                x1={240 + r1 * Math.cos(angle)}
                y1={240 + r1 * Math.sin(angle)}
                x2={240 + r2 * Math.cos(angle)}
                y2={240 + r2 * Math.sin(angle)}
                stroke={isMain ? 'hsl(185 100% 50% / 0.6)' : 'hsl(185 100% 50% / 0.25)'}
                strokeWidth={isMain ? 2 : 1}
              />
            );
          })}
        </svg>
      </motion.div>

      {/* Second ring - counter rotating */}
      <motion.div
        className="absolute w-[400px] h-[400px]"
        animate={{ rotate: -360 }}
        transition={{ duration: getRotationSpeed() * 1.5, repeat: Infinity, ease: 'linear' }}
      >
        <svg viewBox="0 0 400 400" className="w-full h-full">
          <circle cx="200" cy="200" r="195" fill="none" stroke="hsl(185 100% 50% / 0.12)" strokeWidth="1" />
          
          {/* Dashed inner ring */}
          <circle 
            cx="200" cy="200" r="185" 
            fill="none" 
            stroke="hsl(185 100% 50% / 0.3)" 
            strokeWidth="4"
            strokeDasharray="20 10"
          />
          
          {/* Tick marks */}
          {middleTicks.map((i) => {
            const angle = (i * 10 - 90) * (Math.PI / 180);
            return (
              <line
                key={i}
                x1={200 + 170 * Math.cos(angle)}
                y1={200 + 170 * Math.sin(angle)}
                x2={200 + 180 * Math.cos(angle)}
                y2={200 + 180 * Math.sin(angle)}
                stroke="hsl(185 100% 50% / 0.5)"
                strokeWidth="2"
              />
            );
          })}
        </svg>
      </motion.div>

      {/* Third ring - detailed tech ring */}
      <motion.div
        className="absolute w-[340px] h-[340px]"
        animate={{ rotate: 360 }}
        transition={{ duration: getRotationSpeed(), repeat: Infinity, ease: 'linear' }}
      >
        <svg viewBox="0 0 340 340" className="w-full h-full">
          <circle cx="170" cy="170" r="165" fill="none" stroke="hsl(185 100% 50% / 0.1)" strokeWidth="1" />
          <circle cx="170" cy="170" r="155" fill="none" stroke="hsl(185 100% 50% / 0.2)" strokeWidth="2" />
          
          {/* Arrow markers */}
          {[0, 90, 180, 270].map((deg) => {
            const angle = (deg - 90) * (Math.PI / 180);
            const cx = 170 + 160 * Math.cos(angle);
            const cy = 170 + 160 * Math.sin(angle);
            return (
              <polygon
                key={deg}
                points={`${cx},${cy - 6} ${cx + 4},${cy + 4} ${cx - 4},${cy + 4}`}
                fill="hsl(185 100% 50% / 0.6)"
                transform={`rotate(${deg}, ${cx}, ${cy})`}
              />
            );
          })}
          
          {/* Inner ticks */}
          {innerTicks.map((i) => {
            const angle = (i * 15 - 90) * (Math.PI / 180);
            return (
              <rect
                key={i}
                x={170 + 140 * Math.cos(angle) - 2}
                y={170 + 140 * Math.sin(angle) - 1}
                width="8"
                height="3"
                fill="hsl(185 100% 50% / 0.4)"
                transform={`rotate(${i * 15}, ${170 + 140 * Math.cos(angle)}, ${170 + 140 * Math.sin(angle)})`}
              />
            );
          })}
        </svg>
      </motion.div>

      {/* Inner pulsing ring */}
      <motion.div
        className="absolute w-[260px] h-[260px]"
        animate={{ 
          scale: state === 'listening' ? [1, 1.02, 1] : [1, 1.01, 1],
          opacity: [0.6, 1, 0.6] 
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg viewBox="0 0 260 260" className="w-full h-full">
          <circle 
            cx="130" cy="130" r="125" 
            fill="none" 
            stroke={getColor()}
            strokeWidth="3"
            style={{
              filter: `drop-shadow(0 0 10px ${getColor()})`,
            }}
          />
          <circle cx="130" cy="130" r="115" fill="none" stroke="hsl(185 100% 50% / 0.15)" strokeWidth="1" />
        </svg>
      </motion.div>

      {/* Innermost ring with data */}
      <div className="absolute w-[200px] h-[200px]">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <circle cx="100" cy="100" r="95" fill="hsl(220 30% 6% / 0.6)" stroke="hsl(185 100% 50% / 0.2)" strokeWidth="1" />
          <circle cx="100" cy="100" r="85" fill="none" stroke="hsl(185 100% 50% / 0.1)" strokeWidth="1" strokeDasharray="4 4" />
        </svg>
      </div>

      {/* Center content */}
      <div className="absolute flex flex-col items-center justify-center">
        {/* Time display */}
        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-4xl font-bold font-orbitron text-primary text-glow">
            {displayHours}:{minutes}
          </span>
          <span className="text-sm text-primary/60 font-orbitron">{period}</span>
        </div>
        
        {/* Status indicator */}
        <motion.div
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{
            background: `radial-gradient(circle, ${getColor()} 0%, transparent 70%)`,
            boxShadow: `0 0 20px ${getColor()}`,
          }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-3 h-3 rounded-full bg-primary" />
        </motion.div>
      </div>

      {/* Date display at bottom of orb */}
      <div className="absolute bottom-[-60px] text-center">
        <motion.span
          className="text-xs uppercase tracking-[0.3em] font-orbitron text-primary/70"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          {time.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).toUpperCase()}
        </motion.span>
      </div>

      {/* Corner labels */}
      {['UP', 'CORP', 'CTRL', 'DESK'].map((label, i) => {
        const positions = [
          { top: '-180px', left: '-60px' },
          { top: '-180px', right: '-60px' },
          { bottom: '-180px', left: '-60px' },
          { bottom: '-180px', right: '-60px' },
        ];
        return (
          <div
            key={label}
            className="absolute text-[8px] font-mono text-primary/40 tracking-widest"
            style={positions[i] as any}
          >
            {label}
          </div>
        );
      })}
    </div>
  );
};

export default CentralOrb;
