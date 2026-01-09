import { useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  x: number;
  y: number;
  z: number;
  originalX: number;
  originalY: number;
  originalZ: number;
  size: number;
  opacity: number;
  velocityX: number;
  velocityY: number;
  velocityZ: number;
}

interface ParticleSphereProps {
  isListening?: boolean;
  audioLevel?: number;
}

const ParticleSphere = ({ isListening = false, audioLevel = 0 }: ParticleSphereProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const angleRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0, active: false });
  const pulseRef = useRef(0);
  const isListeningRef = useRef(isListening);
  const audioLevelRef = useRef(audioLevel);

  // Update refs when props change
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    audioLevelRef.current = audioLevel;
  }, [audioLevel]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    mouseRef.current.x = e.clientX;
    mouseRef.current.y = e.clientY;
    mouseRef.current.active = true;
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouseRef.current.active = false;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      const particleCount = 800;
      const baseRadius = Math.min(canvas.width, canvas.height) * 0.25;

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
          size: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.5 + 0.3,
          velocityX: 0,
          velocityY: 0,
          velocityZ: 0,
        };
      });
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let animationId: number;

    const animate = () => {
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const baseRadius = Math.min(canvas.width, canvas.height) * 0.25;
      
      angleRef.current += 0.002;

      // Update pulse based on listening state - use refs
      const currentListening = isListeningRef.current;
      const currentAudioLevel = audioLevelRef.current;

      if (currentListening) {
        // Much stronger and more responsive pulse effect based on audio level
        const targetPulse = currentAudioLevel > 0.02 
          ? Math.min(1.5, currentAudioLevel * 4) // Amplified response
          : 0.15 + Math.sin(Date.now() * 0.004) * 0.08; // Subtle idle breathing
        // Faster interpolation for more responsive feel
        pulseRef.current = pulseRef.current + (targetPulse - pulseRef.current) * 0.25;
      } else {
        pulseRef.current = Math.max(0, pulseRef.current - 0.03);
      }

      // Update particle positions
      particlesRef.current.forEach(p => {
        const cos = Math.cos(angleRef.current);
        const sin = Math.sin(angleRef.current);
        const rotatedX = p.x * cos - p.z * sin;
        
        const screenX = centerX + rotatedX;
        const screenY = centerY + p.y;

        // Mouse repulsion
        if (mouseRef.current.active) {
          const dx = screenX - mouseRef.current.x;
          const dy = screenY - mouseRef.current.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const repulsionRadius = 150;
          
          if (distance < repulsionRadius) {
            const force = (1 - distance / repulsionRadius) * 3;
            const angle3D = Math.atan2(dy, dx);
            
            p.velocityX += Math.cos(angle3D) * force;
            p.velocityY += Math.sin(angle3D) * force;
          }
        }

        // Voice pulse effect - radial expansion/contraction (ENHANCED)
        if (pulseRef.current > 0.005) {
          const distFromOrigin = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
          if (distFromOrigin > 0) {
            const normalX = p.x / distFromOrigin;
            const normalY = p.y / distFromOrigin;
            const normalZ = p.z / distFromOrigin;
            
            // Much stronger pulsing expansion effect
            const pulseStrength = pulseRef.current * 120; // Increased from 50
            const pulseFactor = Math.sin(Date.now() * 0.02) * pulseStrength; // Faster oscillation
            
            // Stronger velocity application
            p.velocityX += normalX * pulseFactor * 0.04;
            p.velocityY += normalY * pulseFactor * 0.04;
            p.velocityZ += normalZ * pulseFactor * 0.04;
          }
        }

        // Spring back to original position
        const springStrength = 0.04;
        p.velocityX += (p.originalX - p.x) * springStrength;
        p.velocityY += (p.originalY - p.y) * springStrength;
        p.velocityZ += (p.originalZ - p.z) * springStrength;

        // Apply friction
        const friction = 0.9;
        p.velocityX *= friction;
        p.velocityY *= friction;
        p.velocityZ *= friction;

        // Update position
        p.x += p.velocityX;
        p.y += p.velocityY;
        p.z += p.velocityZ;
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

      sortedParticles.forEach(p => {
        const depth = (p.screenZ + baseRadius) / (baseRadius * 2);
        let opacity = p.opacity * (0.3 + depth * 0.7);
        let size = p.size * (0.5 + depth * 0.5);
        
        // Add glow when listening - ENHANCED
        if (pulseRef.current > 0.005) {
          opacity = Math.min(1, opacity + pulseRef.current * 0.6);
          size = size * (1 + pulseRef.current * 0.8);
        }
        
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

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationId);
    };
  }, [handleMouseMove, handleMouseLeave]);

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
