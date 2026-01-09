import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Cloud, CloudRain, Sun, CloudSnow, Wind, CloudLightning, Loader2 } from 'lucide-react';

type WeatherCondition = 'clear' | 'cloudy' | 'rain' | 'snow' | 'windy' | 'storm';

interface WeatherData {
  temperature: number;
  condition: WeatherCondition;
  humidity: number;
  location: string;
  feelsLike: number;
  windSpeed: number;
}

interface WeatherWidgetProps {
  data?: WeatherData;
}

const WeatherWidget = ({ data: externalData }: WeatherWidgetProps) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (externalData) {
      setWeather(externalData);
      setLoading(false);
      return;
    }

    const fetchWeather = async () => {
      try {
        // Get user location
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
            enableHighAccuracy: false,
          });
        });

        const { latitude, longitude } = position.coords;

        // Fetch weather from wttr.in (no API key needed)
        const response = await fetch(
          `https://wttr.in/${latitude},${longitude}?format=j1`
        );

        if (!response.ok) throw new Error('Erro ao buscar clima');

        const data = await response.json();
        const current = data.current_condition[0];
        const location = data.nearest_area[0];

        // Map weather codes to conditions
        const weatherCode = parseInt(current.weatherCode);
        let condition: WeatherCondition = 'clear';
        
        if (weatherCode >= 200 && weatherCode < 300) condition = 'storm';
        else if (weatherCode >= 300 && weatherCode < 600) condition = 'rain';
        else if (weatherCode >= 600 && weatherCode < 700) condition = 'snow';
        else if (weatherCode >= 700 && weatherCode < 800) condition = 'windy';
        else if (weatherCode >= 803) condition = 'cloudy';
        else if (weatherCode >= 801) condition = 'cloudy';
        else condition = 'clear';

        // Handle wttr.in specific codes
        if (current.weatherDesc[0]?.value?.toLowerCase().includes('rain')) condition = 'rain';
        if (current.weatherDesc[0]?.value?.toLowerCase().includes('cloud')) condition = 'cloudy';
        if (current.weatherDesc[0]?.value?.toLowerCase().includes('sun') || 
            current.weatherDesc[0]?.value?.toLowerCase().includes('clear')) condition = 'clear';

        setWeather({
          temperature: parseInt(current.temp_C),
          condition,
          humidity: parseInt(current.humidity),
          location: `${location.areaName[0].value}, ${location.country[0].value}`,
          feelsLike: parseInt(current.FeelsLikeC),
          windSpeed: parseInt(current.windspeedKmph),
        });
      } catch (err) {
        console.error('Weather fetch error:', err);
        // Fallback to demo data
        setWeather({
          temperature: 25,
          condition: 'cloudy',
          humidity: 68,
          location: 'SÃO PAULO, BR',
          feelsLike: 27,
          windSpeed: 12,
        });
        setError('Usando dados de demonstração');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    
    // Refresh every 10 minutes
    const interval = setInterval(fetchWeather, 600000);
    return () => clearInterval(interval);
  }, [externalData]);

  const getWeatherIcon = () => {
    if (!weather) return <Cloud className="w-8 h-8 text-primary/50" />;
    
    const iconProps = { className: 'w-8 h-8 text-primary' };
    
    switch (weather.condition) {
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
      case 'storm':
        return <CloudLightning {...iconProps} />;
      default:
        return <Sun {...iconProps} />;
    }
  };

  const getConditionText = () => {
    if (!weather) return 'CARREGANDO';
    
    switch (weather.condition) {
      case 'clear': return 'LIMPO';
      case 'cloudy': return 'NUBLADO';
      case 'rain': return 'CHUVA';
      case 'snow': return 'NEVE';
      case 'windy': return 'VENTOSO';
      case 'storm': return 'TEMPESTADE';
      default: return 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="relative w-40 h-40 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Large circular temperature display */}
      <div className="relative w-40 h-40">
        <svg viewBox="0 0 160 160" className="w-full h-full">
          {/* Outer glow ring */}
          <circle cx="80" cy="80" r="78" fill="none" stroke="hsl(185 100% 50% / 0.2)" strokeWidth="2" />
          <circle cx="80" cy="80" r="72" fill="hsl(220 30% 6% / 0.5)" stroke="hsl(185 100% 50% / 0.3)" strokeWidth="3" />
          
          {/* Inner decorative */}
          <circle cx="80" cy="80" r="62" fill="none" stroke="hsl(185 100% 50% / 0.1)" strokeWidth="1" strokeDasharray="4 4" />
        </svg>

        {/* Temperature */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            key={weather?.temperature}
            className="text-5xl font-bold font-orbitron text-primary text-glow"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            {weather?.temperature}
          </motion.span>
          <span className="text-lg text-primary/60 -mt-1">°C</span>
        </div>
      </div>

      {/* Condition info */}
      <div className="mt-3 text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          {getWeatherIcon()}
          <span className="text-[10px] uppercase tracking-wider text-primary/60 font-orbitron">
            {getConditionText()}
          </span>
        </div>

        {/* Location */}
        <div className="text-[9px] uppercase tracking-widest text-primary/40 font-mono">
          📍 {weather?.location}
        </div>

        {/* Additional info */}
        <div className="flex justify-center gap-4 text-[8px] font-mono text-primary/50">
          <span>💧 {weather?.humidity}%</span>
          <span>💨 {weather?.windSpeed}km/h</span>
        </div>
      </div>

      {/* Analysis label */}
      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
        <span className="text-[8px] uppercase tracking-widest text-primary/40 font-orbitron">
          ANÁLISE ATMOSFÉRICA
        </span>
      </div>
    </div>
  );
};

export default WeatherWidget;
