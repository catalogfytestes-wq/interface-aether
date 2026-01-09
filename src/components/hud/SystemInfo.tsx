import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { HardDrive, Cpu, Zap } from 'lucide-react';

interface StorageData {
  total: number;
  used: number;
  label: string;
}

interface SystemInfoProps {
  storageData?: StorageData[];
}

const SystemInfo = ({ storageData }: SystemInfoProps) => {
  const [power, setPower] = useState(100);

  const defaultStorage: StorageData[] = [
    { total: 450, used: 241, label: 'C' },
    { total: 209, used: 148, label: 'D' },
    { total: 500, used: 312, label: 'E' },
  ];

  const storage = storageData || defaultStorage;

  // Simulate power fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setPower(98 + Math.random() * 2);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      {/* Storage info */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <HardDrive className="w-3 h-3 text-primary/60" />
          <span className="text-[9px] uppercase tracking-widest text-primary/60 font-orbitron">
            ARMAZENAMENTO
          </span>
        </div>

        {storage.map((drive, i) => {
          const percentage = (drive.used / drive.total) * 100;
          const freeSpace = drive.total - drive.used;
          
          return (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between text-[9px] font-mono">
                <span className="text-primary/50">{drive.label}:</span>
                <span className="text-primary/70">{freeSpace}G livres</span>
              </div>
              <div className="h-1.5 bg-primary/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary/60 to-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 1, delay: i * 0.2 }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Power indicator */}
      <div className="relative w-28 h-28 mx-auto">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Background ring */}
          <circle
            cx="50" cy="50" r="42"
            fill="none"
            stroke="hsl(185 100% 50% / 0.1)"
            strokeWidth="6"
          />
          
          {/* Power ring */}
          <motion.circle
            cx="50" cy="50" r="42"
            fill="none"
            stroke="hsl(185 100% 50%)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${(power / 100) * 264} 264`}
            style={{ transformOrigin: 'center', transform: 'rotate(-90deg)' }}
            animate={{ strokeDasharray: `${(power / 100) * 264} 264` }}
          />
          
          {/* Inner ring */}
          <circle cx="50" cy="50" r="35" fill="hsl(220 30% 6% / 0.6)" stroke="hsl(185 100% 50% / 0.2)" strokeWidth="1" />
        </svg>

        {/* Power text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Zap className="w-4 h-4 text-primary mb-1" />
          <span className="text-xl font-bold font-mono text-primary text-glow">
            {Math.round(power)}%
          </span>
          <span className="text-[8px] uppercase tracking-widest text-primary/50">
            ENERGIA
          </span>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-2 text-[8px] font-mono">
        <div className="flex items-center gap-1 text-primary/50">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
          <span>ONLINE</span>
        </div>
        <div className="flex items-center gap-1 text-primary/50">
          <Cpu className="w-2.5 h-2.5" />
          <span>24%</span>
        </div>
      </div>
    </div>
  );
};

export default SystemInfo;
