import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface MiniParticleSphereProps {
  onClick: () => void;
}

interface Particle {
  x: number;
  y: number;
  z: number;
  size: number;
  opacity: number;
}

const MiniParticleSphere = ({ onClick }: MiniParticleSphereProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const angleRef = useRef(0);

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
    const baseRadius = 30;

    particlesRef.current = Array.from({ length: particleCount }, () => {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      return {
        x: baseRadius * Math.sin(phi) * Math.cos(theta),
        y: baseRadius * Math.sin(phi) * Math.sin(theta),
        z: baseRadius * Math.cos(phi),
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
        const opacity = p.opacity * (0.4 + depth * 0.6);
        const particleSize = p.size * (0.5 + depth * 0.5);
        
        // Blue color - cyan hue
        const hue = 190 + Math.random() * 20;
        
        ctx.beginPath();
        ctx.arc(
          centerX + p.screenX,
          centerY + p.y,
          particleSize,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = `hsla(${hue}, 80%, 60%, ${opacity})`;
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
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-xl -z-10" />
        
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
      </div>
    </motion.div>
  );
};

export default MiniParticleSphere;
