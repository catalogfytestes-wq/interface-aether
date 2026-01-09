import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  x: number;
  y: number;
  z: number;
  size: number;
  opacity: number;
}

const ParticleSphere = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const angleRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Create particles on sphere surface
    const particleCount = 800;
    const radius = Math.min(canvas.width, canvas.height) * 0.25;

    particlesRef.current = Array.from({ length: particleCount }, () => {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      return {
        x: radius * Math.sin(phi) * Math.cos(theta),
        y: radius * Math.sin(phi) * Math.sin(theta),
        z: radius * Math.cos(phi),
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.5 + 0.3
      };
    });

    const animate = () => {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      angleRef.current += 0.002;

      // Sort particles by z-depth for proper rendering
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

      sortedParticles.forEach(p => {
        const depth = (p.screenZ + radius) / (radius * 2);
        const opacity = p.opacity * (0.3 + depth * 0.7);
        const size = p.size * (0.5 + depth * 0.5);
        
        ctx.beginPath();
        ctx.arc(
          centerX + p.screenX,
          centerY + p.y,
          size,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <motion.canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2 }}
    />
  );
};

export default ParticleSphere;
