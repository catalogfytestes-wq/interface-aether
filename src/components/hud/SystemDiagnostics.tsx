import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Cpu, HardDrive, Wifi, Battery, Activity } from 'lucide-react';

interface SystemStats {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  battery: number;
}

interface SystemDiagnosticsProps {
  stats?: SystemStats;
}

const defaultStats: SystemStats = {
  cpu: 24,
  memory: 58,
  disk: 45,
  network: 87,
  battery: 100,
};

const SystemDiagnostics = ({ stats: externalStats }: SystemDiagnosticsProps) => {
  const [stats, setStats] = useState<SystemStats>(externalStats || defaultStats);

  // Simulate changing stats for demo
  useEffect(() => {
    if (externalStats) return;

    const interval = setInterval(() => {
      setStats({
        cpu: Math.floor(Math.random() * 40) + 10,
        memory: Math.floor(Math.random() * 30) + 40,
        disk: 45,
        network: Math.floor(Math.random() * 30) + 60,
        battery: 100,
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [externalStats]);

  const metrics = [
    { label: 'CPU', value: stats.cpu, icon: Cpu, unit: '%' },
    { label: 'MEMÓRIA', value: stats.memory, icon: Activity, unit: '%' },
    { label: 'DISCO', value: stats.disk, icon: HardDrive, unit: '%' },
    { label: 'REDE', value: stats.network, icon: Wifi, unit: '%' },
    { label: 'ENERGIA', value: stats.battery, icon: Battery, unit: '%' },
  ];

  const getBarColor = (value: number) => {
    if (value > 80) return 'bg-destructive';
    if (value > 60) return 'bg-hud-orange';
    return 'bg-primary';
  };

  return (
    <div className="hud-glass holo-border p-4 w-48">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <span className="text-[9px] uppercase tracking-widest text-primary/60 font-orbitron">
          DIAGNÓSTICO
        </span>
      </div>

      {/* Metrics */}
      <div className="space-y-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.label} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="w-3 h-3 text-primary/50" />
                  <span className="text-[8px] uppercase tracking-wider text-primary/50 font-mono">
                    {metric.label}
                  </span>
                </div>
                <motion.span
                  key={metric.value}
                  className="text-[10px] font-mono text-primary"
                  initial={{ opacity: 0, x: 5 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  {metric.value}{metric.unit}
                </motion.span>
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-primary/10 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${getBarColor(metric.value)} rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${metric.value}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Activity graph */}
      <div className="mt-4 pt-3 border-t border-primary/10">
        <div className="text-[8px] uppercase tracking-wider text-primary/40 mb-2">
          ATIVIDADE DO SISTEMA
        </div>
        <div className="h-8 flex items-end gap-0.5">
          {Array.from({ length: 20 }).map((_, i) => {
            const height = Math.random() * 100;
            return (
              <motion.div
                key={i}
                className="flex-1 bg-primary/40 rounded-t-sm"
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{
                  duration: 0.3,
                  delay: i * 0.05,
                  repeat: Infinity,
                  repeatType: 'reverse',
                  repeatDelay: 2,
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SystemDiagnostics;
