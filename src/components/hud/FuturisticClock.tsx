import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface FuturisticClockProps {
  showDate?: boolean;
  showSeconds?: boolean;
}

const FuturisticClock = ({ showDate = true, showSeconds = true }: FuturisticClockProps) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');

  const dayNames = ['DOMINGO', 'SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO'];
  const monthNames = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

  const dayName = dayNames[time.getDay()];
  const monthName = monthNames[time.getMonth()];
  const day = time.getDate().toString().padStart(2, '0');
  const year = time.getFullYear();

  return (
    <div className="relative">
      {/* Circular frame */}
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 128 128" className="w-full h-full">
          {/* Outer ring */}
          <circle
            cx="64"
            cy="64"
            r="62"
            fill="none"
            stroke="hsl(185 100% 50% / 0.3)"
            strokeWidth="1"
          />

          {/* Progress ring for seconds */}
          <motion.circle
            cx="64"
            cy="64"
            r="58"
            fill="none"
            stroke="hsl(185 100% 50%)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={`${(parseInt(seconds) / 60) * 364} 364`}
            style={{
              transformOrigin: 'center',
              transform: 'rotate(-90deg)',
            }}
          />

          {/* Hour markers */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 - 90) * (Math.PI / 180);
            const x1 = 64 + 52 * Math.cos(angle);
            const y1 = 64 + 52 * Math.sin(angle);
            const x2 = 64 + 56 * Math.cos(angle);
            const y2 = 64 + 56 * Math.sin(angle);
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="hsl(185 100% 50% / 0.5)"
                strokeWidth="1"
              />
            );
          })}

          {/* Inner decorative ring */}
          <circle
            cx="64"
            cy="64"
            r="45"
            fill="none"
            stroke="hsl(185 100% 50% / 0.15)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        </svg>

        {/* Time display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="flex items-baseline gap-1 font-mono">
            <motion.span
              key={hours}
              className="text-2xl font-bold text-primary text-glow"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {hours}
            </motion.span>
            <motion.span
              className="text-xl text-primary"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              :
            </motion.span>
            <motion.span
              key={minutes}
              className="text-2xl font-bold text-primary text-glow"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {minutes}
            </motion.span>
            {showSeconds && (
              <>
                <span className="text-xs text-primary/60">:</span>
                <motion.span
                  key={seconds}
                  className="text-xs text-primary/60 font-mono"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {seconds}
                </motion.span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Date display */}
      {showDate && (
        <div className="mt-2 text-center space-y-1">
          <div className="text-[10px] uppercase tracking-widest text-primary/60 font-orbitron">
            {dayName}
          </div>
          <div className="flex items-center justify-center gap-2 text-xs font-mono">
            <span className="text-primary">{day}</span>
            <span className="text-primary/50">{monthName}</span>
            <span className="text-primary/40">{year}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FuturisticClock;
