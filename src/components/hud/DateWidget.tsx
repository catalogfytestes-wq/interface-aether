import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';

const DateWidget = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const monthNames = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];

  const dayNames = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

  const day = time.getDate();
  const month = monthNames[time.getMonth()];
  const dayName = dayNames[time.getDay()];
  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');

  return (
    <div className="relative">
      {/* Circular date display */}
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 128 128" className="w-full h-full">
          {/* Outer ring */}
          <circle cx="64" cy="64" r="62" fill="none" stroke="hsl(185 100% 50% / 0.3)" strokeWidth="2" />
          <circle cx="64" cy="64" r="56" fill="hsl(220 30% 6% / 0.5)" stroke="hsl(185 100% 50% / 0.15)" strokeWidth="1" />
          
          {/* Inner decorative ring */}
          <circle cx="64" cy="64" r="48" fill="none" stroke="hsl(185 100% 50% / 0.1)" strokeWidth="1" strokeDasharray="3 3" />
        </svg>

        {/* Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] uppercase tracking-wider text-primary/60 font-orbitron">
            {month}
          </span>
          <motion.span
            key={day}
            className="text-4xl font-bold text-primary text-glow font-orbitron"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            {day}
          </motion.span>
        </div>
      </div>

      {/* Time display */}
      <div className="mt-4 text-center">
        <div className="font-mono text-lg text-primary text-glow">
          {hours}:{minutes}:<span className="text-primary/60 text-sm">{seconds}</span>
        </div>
        <div className="text-[10px] uppercase tracking-widest text-primary/50 font-orbitron mt-1">
          {dayName}
        </div>
      </div>
    </div>
  );
};

export default DateWidget;
