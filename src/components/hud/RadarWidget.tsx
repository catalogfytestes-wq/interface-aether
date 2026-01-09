import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface RadarPoint {
  id: string;
  angle: number;
  distance: number;
  type: 'friendly' | 'neutral' | 'alert';
}

interface RadarWidgetProps {
  points?: RadarPoint[];
  isScanning?: boolean;
}

const RadarWidget = ({ points: externalPoints, isScanning = true }: RadarWidgetProps) => {
  const [internalPoints, setInternalPoints] = useState<RadarPoint[]>([]);
  const [scanAngle, setScanAngle] = useState(0);

  // Generate demo points
  useEffect(() => {
    if (externalPoints) return;

    const generatePoints = () => {
      const newPoints: RadarPoint[] = [];
      const count = Math.floor(Math.random() * 5) + 3;
      
      for (let i = 0; i < count; i++) {
        newPoints.push({
          id: `point-${i}`,
          angle: Math.random() * 360,
          distance: 20 + Math.random() * 70,
          type: Math.random() > 0.8 ? 'alert' : Math.random() > 0.5 ? 'friendly' : 'neutral',
        });
      }
      setInternalPoints(newPoints);
    };

    generatePoints();
    const interval = setInterval(generatePoints, 8000);
    return () => clearInterval(interval);
  }, [externalPoints]);

  // Scan animation
  useEffect(() => {
    if (!isScanning) return;

    const interval = setInterval(() => {
      setScanAngle((prev) => (prev + 3) % 360);
    }, 50);

    return () => clearInterval(interval);
  }, [isScanning]);

  const points = externalPoints || internalPoints;

  const getPointColor = (type: RadarPoint['type']) => {
    switch (type) {
      case 'friendly':
        return 'hsl(185 100% 50%)';
      case 'alert':
        return 'hsl(0 100% 58%)';
      default:
        return 'hsl(185 80% 40%)';
    }
  };

  return (
    <div className="relative w-48 h-48">
      {/* Background circles */}
      <svg viewBox="0 0 200 200" className="w-full h-full">
        {/* Grid circles */}
        {[25, 50, 75, 100].map((r) => (
          <circle
            key={r}
            cx="100"
            cy="100"
            r={r}
            fill="none"
            stroke="hsl(185 100% 50% / 0.15)"
            strokeWidth="1"
          />
        ))}

        {/* Cross lines */}
        <line x1="100" y1="0" x2="100" y2="200" stroke="hsl(185 100% 50% / 0.2)" strokeWidth="1" />
        <line x1="0" y1="100" x2="200" y2="100" stroke="hsl(185 100% 50% / 0.2)" strokeWidth="1" />
        <line x1="29" y1="29" x2="171" y2="171" stroke="hsl(185 100% 50% / 0.1)" strokeWidth="1" />
        <line x1="171" y1="29" x2="29" y2="171" stroke="hsl(185 100% 50% / 0.1)" strokeWidth="1" />

        {/* Scan line */}
        <motion.line
          x1="100"
          y1="100"
          x2="100"
          y2="0"
          stroke="hsl(185 100% 50%)"
          strokeWidth="2"
          style={{
            transformOrigin: '100px 100px',
          }}
          animate={{
            rotate: scanAngle,
          }}
          transition={{
            duration: 0,
          }}
        />

        {/* Scan trail gradient */}
        <defs>
          <linearGradient id="scanGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(185 100% 50% / 0)" />
            <stop offset="100%" stopColor="hsl(185 100% 50% / 0.3)" />
          </linearGradient>
        </defs>

        <motion.path
          d={`M 100 100 L 100 0 A 100 100 0 0 1 ${100 + 100 * Math.sin((30 * Math.PI) / 180)} ${100 - 100 * Math.cos((30 * Math.PI) / 180)} Z`}
          fill="url(#scanGradient)"
          style={{
            transformOrigin: '100px 100px',
          }}
          animate={{
            rotate: scanAngle,
          }}
          transition={{
            duration: 0,
          }}
        />

        {/* Radar points */}
        {points.map((point) => {
          const x = 100 + point.distance * Math.cos((point.angle * Math.PI) / 180);
          const y = 100 + point.distance * Math.sin((point.angle * Math.PI) / 180);
          const isInScanRange = Math.abs(((scanAngle - point.angle + 360) % 360)) < 30;

          return (
            <g key={point.id}>
              <motion.circle
                cx={x}
                cy={y}
                r={4}
                fill={getPointColor(point.type)}
                animate={{
                  opacity: isInScanRange ? 1 : 0.3,
                  scale: isInScanRange ? 1.2 : 1,
                }}
                transition={{ duration: 0.2 }}
              />
              {isInScanRange && (
                <motion.circle
                  cx={x}
                  cy={y}
                  r={8}
                  fill="none"
                  stroke={getPointColor(point.type)}
                  strokeWidth="1"
                  initial={{ opacity: 1, scale: 0.5 }}
                  animate={{ opacity: 0, scale: 2 }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </g>
          );
        })}

        {/* Center dot */}
        <circle cx="100" cy="100" r="4" fill="hsl(185 100% 50%)" />
        <circle cx="100" cy="100" r="8" fill="none" stroke="hsl(185 100% 50% / 0.5)" strokeWidth="1" />
      </svg>

      {/* Label */}
      <div className="absolute -bottom-6 left-0 right-0 text-center">
        <span className="text-[10px] uppercase tracking-widest text-primary/60 font-orbitron">
          RADAR TÁTICO
        </span>
      </div>
    </div>
  );
};

export default RadarWidget;
