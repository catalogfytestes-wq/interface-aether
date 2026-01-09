import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export type OrbState = 'idle' | 'listening' | 'processing';

interface CentralOrbProps {
  state?: OrbState;
  onStateChange?: (state: OrbState) => void;
}

const CentralOrb = ({ state = 'idle' }: CentralOrbProps) => {
  const [particles, setParticles] = useState<number[]>([]);

  useEffect(() => {
    setParticles(Array.from({ length: 20 }, (_, i) => i));
  }, []);

  // Softer, safer colors for photosensitive users
  const getOrbStyles = () => {
    switch (state) {
      case 'listening':
        return {
          borderColor: 'hsl(25, 70%, 50%)',
          boxShadow: `
            0 0 40px hsl(25 70% 50% / 0.4),
            0 0 80px hsl(25 60% 45% / 0.2),
            inset 0 0 40px hsl(25 70% 50% / 0.2)
          `,
        };
      case 'processing':
        return {
          borderColor: 'hsl(200, 80%, 50%)',
          boxShadow: `
            0 0 40px hsl(200 80% 50% / 0.3),
            0 0 80px hsl(185 80% 50% / 0.2),
            inset 0 0 40px hsl(200 80% 50% / 0.15)
          `,
        };
      default:
        return {
          borderColor: 'hsl(185, 100%, 50%)',
          boxShadow: `
            0 0 40px hsl(185 100% 50% / 0.4),
            0 0 80px hsl(185 100% 50% / 0.2),
            inset 0 0 40px hsl(185 100% 50% / 0.2)
          `,
        };
    }
  };

  const getRotationSpeed = () => {
    switch (state) {
      case 'listening':
        return 3;
      case 'processing':
        return 2;
      default:
        return 12;
    }
  };

  // Slower, gentler pulse for safety
  const getPulseSpeed = () => {
    switch (state) {
      case 'listening':
        return 1.5; // Much slower than before (was 0.3)
      case 'processing':
        return 2; // Slower (was 0.8)
      default:
        return 4;
    }
  };

  const getOrbColor = () => {
    switch (state) {
      case 'listening':
        return 'hsl(25 70% 50%)';
      case 'processing':
        return 'hsl(200 80% 50%)';
      default:
        return 'hsl(185 100% 50%)';
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer rotating rings */}
      <motion.div
        className="absolute w-64 h-64 rounded-full border border-primary/20"
        animate={{ rotate: 360 }}
        transition={{ duration: getRotationSpeed() * 3, repeat: Infinity, ease: 'linear' }}
      >
        {/* Ring markers */}
        {[0, 90, 180, 270].map((deg) => (
          <div
            key={deg}
            className="absolute w-2 h-2 bg-primary/60 rounded-full"
            style={{
              top: '50%',
              left: '50%',
              transform: `rotate(${deg}deg) translateX(126px) translateY(-50%)`,
            }}
          />
        ))}
      </motion.div>

      <motion.div
        className="absolute w-56 h-56 rounded-full border border-dashed border-primary/15"
        animate={{ rotate: -360 }}
        transition={{ duration: getRotationSpeed() * 2, repeat: Infinity, ease: 'linear' }}
      />

      <motion.div
        className="absolute w-48 h-48 rounded-full border border-secondary/30"
        animate={{ rotate: 360 }}
        transition={{ duration: getRotationSpeed() * 1.5, repeat: Infinity, ease: 'linear' }}
      >
        {/* Secondary ring markers */}
        {[45, 135, 225, 315].map((deg) => (
          <div
            key={deg}
            className="absolute w-1.5 h-1.5 bg-secondary/50 rounded-full"
            style={{
              top: '50%',
              left: '50%',
              transform: `rotate(${deg}deg) translateX(94px) translateY(-50%)`,
            }}
          />
        ))}
      </motion.div>

      {/* Inner hexagonal frame */}
      <motion.div
        className="absolute w-44 h-44"
        animate={{ rotate: -360 }}
        transition={{ duration: getRotationSpeed() * 2.5, repeat: Infinity, ease: 'linear' }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon
            points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5"
            fill="none"
            stroke={state === 'listening' 
              ? 'hsl(25 70% 50% / 0.3)' 
              : state === 'processing'
                ? 'hsl(200 80% 50% / 0.3)'
                : 'hsl(185 100% 50% / 0.25)'}
            strokeWidth="0.5"
          />
        </svg>
      </motion.div>

      {/* Energy particles - gentler animation */}
      <div className="absolute w-36 h-36">
        {particles.map((i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: getOrbColor(),
              left: '50%',
              top: '50%',
            }}
            animate={{
              x: [0, Math.cos((i * 360) / 20 * Math.PI / 180) * 80],
              y: [0, Math.sin((i * 360) / 20 * Math.PI / 180) * 80],
              opacity: [0, 0.6, 0], // Reduced max opacity
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: state === 'listening' ? 2 : state === 'processing' ? 2.5 : 4,
              repeat: Infinity,
              delay: i * 0.2,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Main orb core - gentler animations */}
      <motion.div
        className="relative w-32 h-32 rounded-full border-2 backdrop-blur-sm"
        style={getOrbStyles()}
        animate={{
          scale: state === 'listening' 
            ? [1, 1.03, 1] // Much smaller scale change
            : state === 'processing' 
              ? [1, 1.01, 1.02, 1] 
              : [1, 1.02, 1],
        }}
        transition={{
          duration: getPulseSpeed(),
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Inner core gradient */}
        <div
          className="absolute inset-2 rounded-full"
          style={{
            background: state === 'listening'
              ? 'radial-gradient(circle, hsl(25 70% 50% / 0.2) 0%, hsl(25 60% 45% / 0.1) 50%, transparent 70%)'
              : state === 'processing'
                ? 'radial-gradient(circle, hsl(200 80% 50% / 0.25) 0%, hsl(185 80% 50% / 0.1) 50%, transparent 70%)'
                : 'radial-gradient(circle, hsl(185 100% 50% / 0.2) 0%, hsl(235 80% 50% / 0.08) 50%, transparent 70%)',
          }}
        />

        {/* Core center point - gentler pulse */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ opacity: [0.6, 0.9, 0.6] }} // Reduced opacity range
          transition={{ duration: getPulseSpeed(), repeat: Infinity }}
        >
          <div
            className="w-6 h-6 rounded-full"
            style={{
              background: state === 'listening'
                ? 'radial-gradient(circle, hsl(25 70% 60%) 0%, hsl(25 70% 50%) 50%, transparent 100%)'
                : state === 'processing'
                  ? 'radial-gradient(circle, hsl(200 80% 60%) 0%, hsl(200 80% 50%) 50%, transparent 100%)'
                  : 'radial-gradient(circle, hsl(185 100% 60%) 0%, hsl(185 100% 50%) 50%, transparent 100%)',
              boxShadow: state === 'listening'
                ? '0 0 20px hsl(25 70% 50% / 0.5)'
                : state === 'processing'
                  ? '0 0 20px hsl(200 80% 50% / 0.4)'
                  : '0 0 20px hsl(185 100% 50% / 0.5)',
            }}
          />
        </motion.div>

        {/* Rotating inner ring */}
        <motion.div
          className="absolute inset-3 rounded-full border border-primary/30"
          animate={{ rotate: state === 'listening' ? -360 : 360 }}
          transition={{
            duration: getRotationSpeed(),
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </motion.div>

      {/* State indicator text */}
      <motion.div
        key={state}
        className="absolute -bottom-14 text-center"
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <span
          className={`text-xs uppercase tracking-[0.25em] font-orbitron ${
            state === 'listening' 
              ? 'text-hud-orange' 
              : state === 'processing'
                ? 'text-secondary'
                : 'text-primary text-glow'
          }`}
          style={{
            textShadow: state === 'listening'
              ? '0 0 10px hsl(25 70% 50% / 0.5)'
              : state === 'processing'
                ? '0 0 10px hsl(200 80% 50% / 0.4)'
                : '0 0 10px hsl(185 100% 50%)',
          }}
        >
          {state === 'idle' && '// AGUARDANDO COMANDO'}
          {state === 'listening' && '// ESCUTANDO...'}
          {state === 'processing' && '// PROCESSANDO...'}
        </span>
      </motion.div>
    </div>
  );
};

export default CentralOrb;
