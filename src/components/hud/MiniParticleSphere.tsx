import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface MiniParticleSphereProps {
  onClick: () => void;
  audioLevel?: number;
}

interface Particle {
  x: number;
  y: number;
  z: number;
  originalX: number;
  originalY: number;
  originalZ: number;
  size: number;
  opacity: number;
}

const MiniParticleSphere = ({ onClick, audioLevel = 0 }: MiniParticleSphereProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const angleRef = useRef(0);
  const audioLevelRef = useRef(audioLevel);
  const pulseRef = useRef(0);

  useEffect(() => {
    audioLevelRef.current = audioLevel;
  }, [audioLevel]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 80;
    canvas.width = size;
    canvas.height = size;

    // Initialize particles
    const particleCount = 150;
    const baseRadius = 25;

    particlesRef.current = Array.from({ length: particleCount }, () => {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      const x = baseRadius * Math.sin(phi) * Math.cos(theta);
      const y = baseRadius * Math.sin(phi) * Math.sin(theta);
      const z = baseRadius * Math.cos(phi);
      
      return {
        x,
        y,
        z,
        originalX: x,
        originalY: y,
        originalZ: z,
        size: Math.random() * 1.2 + 0.3,
        opacity: Math.random() * 0.6 + 0.3,
      };
    });

    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, size, size);

      const centerX = size / 2;
      const centerY = size / 2;
      
      angleRef.current += 0.008;

      // Update pulse based on audio level
      const currentAudioLevel = audioLevelRef.current;
      if (currentAudioLevel > 0.02) {
        pulseRef.current = pulseRef.current + (currentAudioLevel * 2 - pulseRef.current) * 0.3;
      } else {
        pulseRef.current = pulseRef.current * 0.9;
      }

      // Update particle positions based on pulse
      particlesRef.current.forEach(p => {
        if (pulseRef.current > 0.01) {
          const distFromOrigin = Math.sqrt(p.originalX * p.originalX + p.originalY * p.originalY + p.originalZ * p.originalZ);
          if (distFromOrigin > 0) {
            const expansion = 1 + pulseRef.current * 0.5;
            p.x = p.originalX * expansion;
            p.y = p.originalY * expansion;
            p.z = p.originalZ * expansion;
          }
        } else {
          // Return to original position
          p.x += (p.originalX - p.x) * 0.1;
          p.y += (p.originalY - p.y) * 0.1;
          p.z += (p.originalZ - p.z) * 0.1;
        }
      });

      // Sort and render particles
      const sortedParticles = [...particlesRef.current].map(p => {
        const cos = Math.cos(angleRef.current);
        const sin = Math.sin(angleRef.current);
        const rotatedX = p.x * cos - p.z * sin;
        const rotatedZ = p.x * sin + p.z * cos;
        
        return {
          ...p,
          screenX: rotatedX,
          screenZ: rotatedZ
        };
      }).sort((a, b) => a.screenZ - b.screenZ);

      sortedParticles.forEach((p) => {
        const depth = (p.screenZ + 30) / 60;
        let opacity = p.opacity * (0.4 + depth * 0.6);
        let particleSize = p.size * (0.5 + depth * 0.5);
        
        // Enhance with pulse
        if (pulseRef.current > 0.01) {
          opacity = Math.min(1, opacity + pulseRef.current * 0.5);
          particleSize = particleSize * (1 + pulseRef.current * 0.3);
        }
        
        // Blue color - cyan hue with variation
        const hue = 190 + Math.sin(Date.now() * 0.002 + p.originalX) * 15;
        const saturation = 70 + pulseRef.current * 20;
        const lightness = 55 + pulseRef.current * 15;
        
        ctx.beginPath();
        ctx.arc(
          centerX + p.screenX,
          centerY + p.y,
          particleSize,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${opacity})`;
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, x: 100 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.5, x: 100 }}
      className="fixed bottom-6 right-6 z-50 cursor-pointer"
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-20 h-20"
        />
        {/* Glow effect - reactive to audio */}
        <motion.div 
          className="absolute inset-0 rounded-full bg-cyan-500/20 blur-xl -z-10"
          animate={{
            scale: 1 + audioLevel * 0.5,
            opacity: 0.2 + audioLevel * 0.3,
          }}
          transition={{ duration: 0.1 }}
        />
        
        {/* Pulse ring */}
        <motion.div
          className="absolute inset-0 rounded-full border border-cyan-400/30"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        
        {/* Label */}
        <motion.div
          className="absolute -top-8 left-1/2 -translate-x-1/2 text-[9px] font-mono text-cyan-400/70 whitespace-nowrap"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Diga "JARVIS"
        </motion.div>
        
        {/* Listening indicator */}
        <motion.div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-0.5"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1 bg-cyan-400/60 rounded-full"
              animate={{
                height: [2, 4 + audioLevel * 8, 2],
              }}
              transition={{
                duration: 0.4,
                repeat: Infinity,
                delay: i * 0.1,
              }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default MiniParticleSphere;
