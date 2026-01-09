import { motion, AnimatePresence } from 'framer-motion';
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

  const getOrbStyles = () => {
    switch (state) {
      case 'listening':
        return {
          borderColor: 'hsl(0, 100%, 58%)',
          boxShadow: `
            0 0 80px hsl(0 100% 58% / 0.8),
            0 0 160px hsl(25 100% 55% / 0.5),
            0 0 240px hsl(0 100% 58% / 0.3),
            inset 0 0 80px hsl(25 100% 55% / 0.4)
          `,
        };
      case 'processing':
        return {
          borderColor: 'hsl(235, 100%, 50%)',
          boxShadow: `
            0 0 60px hsl(235 100% 50% / 0.6),
            0 0 120px hsl(185 100% 50% / 0.4),
            0 0 180px hsl(235 100% 50% / 0.2),
            inset 0 0 60px hsl(185 100% 50% / 0.3)
          `,
        };
      default:
        return {
          borderColor: 'hsl(185, 100%, 50%)',
          boxShadow: `
            0 0 60px hsl(185 100% 50% / 0.6),
            0 0 120px hsl(185 100% 50% / 0.4),
            0 0 180px hsl(185 100% 50% / 0.2),
            inset 0 0 60px hsl(185 100% 50% / 0.3)
          `,
        };
    }
  };

  const getRotationSpeed = () => {
    switch (state) {
      case 'listening':
        return 1;
      case 'processing':
        return 0.5;
      default:
        return 8;
    }
  };

  const getPulseSpeed = () => {
    switch (state) {
      case 'listening':
        return 0.3;
      case 'processing':
        return 0.8;
      default:
        return 4;
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer rotating rings */}
      <motion.div
        className="absolute w-80 h-80 rounded-full border border-primary/30"
        animate={{ rotate: 360 }}
        transition={{ duration: getRotationSpeed() * 3, repeat: Infinity, ease: 'linear' }}
      >
        {/* Ring markers */}
        {[0, 90, 180, 270].map((deg) => (
          <div
            key={deg}
            className="absolute w-2 h-2 bg-primary rounded-full"
            style={{
              top: '50%',
              left: '50%',
              transform: `rotate(${deg}deg) translateX(158px) translateY(-50%)`,
            }}
          />
        ))}
      </motion.div>

      <motion.div
        className="absolute w-72 h-72 rounded-full border-2 border-dashed border-primary/20"
        animate={{ rotate: -360 }}
        transition={{ duration: getRotationSpeed() * 2, repeat: Infinity, ease: 'linear' }}
      />

      <motion.div
        className="absolute w-64 h-64 rounded-full border border-secondary/40"
        animate={{ rotate: 360 }}
        transition={{ duration: getRotationSpeed() * 1.5, repeat: Infinity, ease: 'linear' }}
      >
        {/* Secondary ring markers */}
        {[45, 135, 225, 315].map((deg) => (
          <div
            key={deg}
            className="absolute w-1.5 h-1.5 bg-secondary rounded-full"
            style={{
              top: '50%',
              left: '50%',
              transform: `rotate(${deg}deg) translateX(126px) translateY(-50%)`,
            }}
          />
        ))}
      </motion.div>

      {/* Inner hexagonal frame */}
      <motion.div
        className="absolute w-56 h-56"
        animate={{ rotate: -360 }}
        transition={{ duration: getRotationSpeed() * 2.5, repeat: Infinity, ease: 'linear' }}
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <polygon
            points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5"
            fill="none"
            stroke="hsl(185 100% 50% / 0.3)"
            strokeWidth="0.5"
          />
        </svg>
      </motion.div>

      {/* Energy particles */}
      <div className="absolute w-48 h-48">
        {particles.map((i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              background: state === 'listening' 
                ? 'hsl(0 100% 58%)' 
                : state === 'processing'
                  ? 'hsl(235 100% 50%)'
                  : 'hsl(185 100% 50%)',
              left: '50%',
              top: '50%',
            }}
            animate={{
              x: [0, Math.cos((i * 360) / 20 * Math.PI / 180) * 100],
              y: [0, Math.sin((i * 360) / 20 * Math.PI / 180) * 100],
              opacity: [0, 1, 0],
              scale: [0.5, 1.5, 0.5],
            }}
            transition={{
              duration: state === 'listening' ? 1 : state === 'processing' ? 1.5 : 3,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Main orb core */}
      <motion.div
        className={`relative w-40 h-40 rounded-full border-2 backdrop-blur-sm ${
          state === 'processing' ? 'animate-glitch' : ''
        }`}
        style={getOrbStyles()}
        animate={{
          scale: state === 'listening' ? [1, 1.1, 1] : state === 'processing' ? [1, 0.98, 1.02, 1] : [1, 1.05, 1],
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
              ? 'radial-gradient(circle, hsl(25 100% 55% / 0.3) 0%, hsl(0 100% 58% / 0.1) 50%, transparent 70%)'
              : state === 'processing'
                ? 'radial-gradient(circle, hsl(235 100% 50% / 0.4) 0%, hsl(185 100% 50% / 0.1) 50%, transparent 70%)'
                : 'radial-gradient(circle, hsl(185 100% 50% / 0.3) 0%, hsl(235 100% 50% / 0.1) 50%, transparent 70%)',
          }}
        />

        {/* Core center point */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: getPulseSpeed() / 2, repeat: Infinity }}
        >
          <div
            className="w-8 h-8 rounded-full"
            style={{
              background: state === 'listening'
                ? 'radial-gradient(circle, hsl(0 100% 70%) 0%, hsl(0 100% 58%) 50%, transparent 100%)'
                : state === 'processing'
                  ? 'radial-gradient(circle, hsl(185 100% 70%) 0%, hsl(235 100% 50%) 50%, transparent 100%)'
                  : 'radial-gradient(circle, hsl(185 100% 70%) 0%, hsl(185 100% 50%) 50%, transparent 100%)',
              boxShadow: state === 'listening'
                ? '0 0 30px hsl(0 100% 58%), 0 0 60px hsl(25 100% 55% / 0.5)'
                : state === 'processing'
                  ? '0 0 30px hsl(235 100% 50%), 0 0 60px hsl(185 100% 50% / 0.5)'
                  : '0 0 30px hsl(185 100% 50%), 0 0 60px hsl(185 100% 50% / 0.5)',
            }}
          />
        </motion.div>

        {/* Rotating inner ring */}
        <motion.div
          className="absolute inset-4 rounded-full border border-primary/40"
          animate={{ rotate: state === 'listening' ? -360 : 360 }}
          transition={{
            duration: getRotationSpeed(),
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      </motion.div>

      {/* State indicator text */}
      <AnimatePresence mode="wait">
        <motion.div
          key={state}
          className="absolute -bottom-16 text-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.3 }}
        >
          <span
            className={`text-xs uppercase tracking-[0.3em] font-orbitron ${
              state === 'listening' ? 'text-destructive text-glow-red' : 'text-primary text-glow'
            }`}
          >
            {state === 'idle' && '// AGUARDANDO COMANDO'}
            {state === 'listening' && '// ESCUTANDO...'}
            {state === 'processing' && '// PROCESSANDO...'}
          </span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default CentralOrb;
