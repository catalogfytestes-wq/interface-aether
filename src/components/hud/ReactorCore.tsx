import { motion } from 'framer-motion';

interface ReactorCoreProps {
  isActive?: boolean;
}

const ReactorCore = ({ isActive = true }: ReactorCoreProps) => {
  return (
    <div className="relative w-36 h-36">
      {/* Outer rings */}
      <svg viewBox="0 0 144 144" className="w-full h-full">
        {/* Outer cyan ring */}
        <circle cx="72" cy="72" r="70" fill="none" stroke="hsl(185 100% 50%)" strokeWidth="3" />
        <circle cx="72" cy="72" r="65" fill="none" stroke="hsl(185 100% 50% / 0.3)" strokeWidth="1" />
        
        {/* Middle dark ring */}
        <circle cx="72" cy="72" r="58" fill="hsl(220 30% 8%)" stroke="hsl(185 100% 50% / 0.2)" strokeWidth="1" />
        
        {/* Inner glow ring */}
        <circle cx="72" cy="72" r="50" fill="none" stroke="hsl(185 100% 50% / 0.4)" strokeWidth="2" />
      </svg>

      {/* Core center - Arc Reactor style */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={isActive ? { rotate: 360 } : {}}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      >
        <div className="relative w-24 h-24">
          {/* Inner segments */}
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * 45) * (Math.PI / 180);
            const x = 48 + 30 * Math.cos(angle);
            const y = 48 + 30 * Math.sin(angle);
            
            return (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded-full bg-primary/60"
                style={{
                  left: x - 6,
                  top: y - 6,
                  boxShadow: '0 0 8px hsl(185 100% 50%)',
                }}
                animate={{
                  opacity: [0.4, 1, 0.4],
                  scale: [0.9, 1.1, 0.9],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            );
          })}
          
          {/* Center core */}
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full"
            style={{
              background: 'radial-gradient(circle, hsl(0 0% 90%) 0%, hsl(185 100% 50%) 40%, hsl(220 30% 15%) 70%)',
              boxShadow: '0 0 30px hsl(185 100% 50%), 0 0 60px hsl(185 100% 50% / 0.5)',
            }}
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          />
        </div>
      </motion.div>
    </div>
  );
};

export default ReactorCore;
