import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  Clock, 
  Cloud, 
  Calendar, 
  Music, 
  Bell, 
  Activity,
  Radio,
  Settings,
  Mic
} from 'lucide-react';
import FuturisticClock from './FuturisticClock';
import WeatherWidget from './WeatherWidget';
import CalendarWidget from './CalendarWidget';
import MusicPlayer from './MusicPlayer';
import RadarWidget from './RadarWidget';
import SystemDiagnostics from './SystemDiagnostics';

interface MinimizedMenuProps {
  onPlaySound?: (type: 'hover' | 'click' | 'activate') => void;
}

type WidgetType = 'clock' | 'weather' | 'calendar' | 'music' | 'radar' | 'diagnostics' | null;

const MinimizedMenu = ({ onPlaySound }: MinimizedMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeWidget, setActiveWidget] = useState<WidgetType>(null);

  const menuItems = [
    { id: 'clock' as WidgetType, icon: Clock, label: 'Relógio' },
    { id: 'weather' as WidgetType, icon: Cloud, label: 'Clima' },
    { id: 'calendar' as WidgetType, icon: Calendar, label: 'Calendário' },
    { id: 'music' as WidgetType, icon: Music, label: 'Música' },
    { id: 'radar' as WidgetType, icon: Radio, label: 'Radar' },
    { id: 'diagnostics' as WidgetType, icon: Activity, label: 'Sistema' },
  ];

  const handleToggle = () => {
    onPlaySound?.('click');
    setIsOpen(!isOpen);
    if (isOpen) setActiveWidget(null);
  };

  const handleWidgetSelect = (widget: WidgetType) => {
    onPlaySound?.('activate');
    setActiveWidget(activeWidget === widget ? null : widget);
  };

  const renderWidget = () => {
    switch (activeWidget) {
      case 'clock':
        return <FuturisticClock />;
      case 'weather':
        return <WeatherWidget />;
      case 'calendar':
        return <CalendarWidget />;
      case 'music':
        return <MusicPlayer />;
      case 'radar':
        return <RadarWidget />;
      case 'diagnostics':
        return <SystemDiagnostics />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-50">
      {/* Menu Toggle Button */}
      <motion.button
        onClick={handleToggle}
        onMouseEnter={() => onPlaySound?.('hover')}
        className="w-12 h-12 rounded-full border border-white/20 bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:border-white/40 transition-all"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </motion.button>

      {/* Menu Items */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="absolute left-16 top-1/2 -translate-y-1/2 flex flex-col gap-2"
          >
            {menuItems.map((item, index) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleWidgetSelect(item.id)}
                onMouseEnter={() => onPlaySound?.('hover')}
                className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all ${
                  activeWidget === item.id
                    ? 'border-white/60 bg-white/10 text-white'
                    : 'border-white/20 bg-black/50 text-white/50 hover:text-white hover:border-white/40'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <item.icon size={16} />
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Widget Panel */}
      <AnimatePresence>
        {activeWidget && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: -20 }}
            transition={{ duration: 0.3 }}
            className="absolute left-32 top-1/2 -translate-y-1/2 bg-black/80 backdrop-blur-md border border-white/10 rounded-lg p-4 min-w-[280px]"
          >
            <button
              onClick={() => setActiveWidget(null)}
              className="absolute top-2 right-2 text-white/40 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
            <div className="text-white">
              {renderWidget()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MinimizedMenu;
