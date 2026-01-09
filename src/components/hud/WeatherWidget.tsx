import { motion } from 'framer-motion';
import { Cloud, CloudRain, Sun, CloudSnow, Wind, Thermometer } from 'lucide-react';

type WeatherCondition = 'clear' | 'cloudy' | 'rain' | 'snow' | 'windy';

interface WeatherData {
  temperature: number;
  condition: WeatherCondition;
  humidity: number;
  location: string;
}

interface WeatherWidgetProps {
  data?: WeatherData;
}

const defaultWeather: WeatherData = {
  temperature: 22,
  condition: 'clear',
  humidity: 65,
  location: 'SÃO PAULO, BR',
};

const WeatherWidget = ({ data = defaultWeather }: WeatherWidgetProps) => {
  const getWeatherIcon = () => {
    const iconProps = { className: 'w-8 h-8 text-primary' };
    
    switch (data.condition) {
      case 'clear':
        return <Sun {...iconProps} />;
      case 'cloudy':
        return <Cloud {...iconProps} />;
      case 'rain':
        return <CloudRain {...iconProps} />;
      case 'snow':
        return <CloudSnow {...iconProps} />;
      case 'windy':
        return <Wind {...iconProps} />;
      default:
        return <Sun {...iconProps} />;
    }
  };

  const getConditionText = () => {
    switch (data.condition) {
      case 'clear':
        return 'LIMPO';
      case 'cloudy':
        return 'NUBLADO';
      case 'rain':
        return 'CHUVA';
      case 'snow':
        return 'NEVE';
      case 'windy':
        return 'VENTOSO';
      default:
        return 'N/A';
    }
  };

  return (
    <div className="hud-glass holo-border p-4 w-44">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Thermometer className="w-3 h-3 text-primary/60" />
        <span className="text-[9px] uppercase tracking-widest text-primary/60 font-orbitron">
          CLIMA
        </span>
      </div>

      {/* Main content */}
      <div className="flex items-center gap-3">
        {/* Icon */}
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          {getWeatherIcon()}
        </motion.div>

        {/* Temperature */}
        <div className="flex flex-col">
          <div className="flex items-start">
            <motion.span
              className="text-3xl font-bold font-mono text-primary text-glow"
              key={data.temperature}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              {data.temperature}
            </motion.span>
            <span className="text-sm text-primary/60 mt-1">°C</span>
          </div>
          <span className="text-[9px] uppercase tracking-wider text-primary/50">
            {getConditionText()}
          </span>
        </div>
      </div>

      {/* Humidity bar */}
      <div className="mt-3 space-y-1">
        <div className="flex items-center justify-between text-[8px] uppercase tracking-wider">
          <span className="text-primary/40">UMIDADE</span>
          <span className="text-primary/60 font-mono">{data.humidity}%</span>
        </div>
        <div className="h-1 bg-primary/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary/50"
            initial={{ width: 0 }}
            animate={{ width: `${data.humidity}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Location */}
      <div className="mt-3 pt-2 border-t border-primary/10">
        <span className="text-[8px] uppercase tracking-widest text-primary/40 font-mono">
          📍 {data.location}
        </span>
      </div>
    </div>
  );
};

export default WeatherWidget;
