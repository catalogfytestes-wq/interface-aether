import { useState, useEffect, MutableRefObject } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  Clock, 
  Cloud, 
  Calendar, 
  Music, 
  Activity,
  Radio,
  Settings,
  Mic,
  MicOff,
  Bell,
  Cpu,
  Wifi,
  Battery,
  User,
  CreditCard,
  LogIn,
  LogOut,
  MonitorPlay
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import FuturisticClock from './FuturisticClock';
import WeatherWidget from './WeatherWidget';
import CalendarWidget from './CalendarWidget';
import MusicPlayer from './MusicPlayer';
import RadarWidget from './RadarWidget';
import SystemDiagnostics from './SystemDiagnostics';
import ScreenAgentPanel from './ScreenAgentPanel';

interface MinimizedMenuProps {
  onPlaySound?: (type: 'hover' | 'click' | 'activate') => void;
  isVoiceActive?: boolean;
  onVoiceToggle?: () => void;
  onWidgetCommandRef?: MutableRefObject<(widget: string | null) => void>;
  transparentMode?: boolean;
  onTTSSpeakingChange?: (isSpeaking: boolean) => void;
}

type WidgetType = 'clock' | 'weather' | 'calendar' | 'music' | 'radar' | 'diagnostics' | 'notifications' | 'network' | 'battery' | 'screenagent' | null;

const MinimizedMenu = ({ onPlaySound, isVoiceActive, onVoiceToggle, onWidgetCommandRef, transparentMode = false, onTTSSpeakingChange }: MinimizedMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeWidget, setActiveWidget] = useState<WidgetType>(null);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  // Register voice command handler
  useEffect(() => {
    if (onWidgetCommandRef) {
      onWidgetCommandRef.current = (widget: string | null) => {
        if (widget === null) {
          setActiveWidget(null);
        } else {
          setActiveWidget(widget as WidgetType);
          if (!isOpen) setIsOpen(true);
        }
      };
    }
  }, [onWidgetCommandRef, isOpen]);

  const menuItems = [
    { id: 'screenagent' as WidgetType, icon: MonitorPlay, label: 'Screen Agent', highlight: true },
    { id: 'clock' as WidgetType, icon: Clock, label: 'Relógio' },
    { id: 'weather' as WidgetType, icon: Cloud, label: 'Clima' },
    { id: 'calendar' as WidgetType, icon: Calendar, label: 'Calendário' },
    { id: 'music' as WidgetType, icon: Music, label: 'Música' },
    { id: 'radar' as WidgetType, icon: Radio, label: 'Radar' },
    { id: 'diagnostics' as WidgetType, icon: Activity, label: 'Sistema' },
    { id: 'notifications' as WidgetType, icon: Bell, label: 'Alertas' },
    { id: 'network' as WidgetType, icon: Wifi, label: 'Rede' },
    { id: 'battery' as WidgetType, icon: Battery, label: 'Energia' },
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

  const handleVoiceClick = () => {
    onPlaySound?.('activate');
    onVoiceToggle?.();
  };

  const handleUserAction = async (action: 'profile' | 'plans' | 'login' | 'logout') => {
    onPlaySound?.('click');
    switch (action) {
      case 'profile':
        navigate('/profile');
        break;
      case 'plans':
        navigate('/plans');
        break;
      case 'login':
        navigate('/auth');
        break;
      case 'logout':
        await signOut();
        break;
    }
  };

  const renderWidget = () => {
    // Screen Agent uses a separate panel, not inline widget
    if (activeWidget === 'screenagent') {
      return null;
    }
    
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
      case 'notifications':
        return (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white/80">Notificações</h3>
            <div className="space-y-2 text-xs text-white/60">
              <div className="p-2 rounded bg-white/5 border border-white/10">
                Sistema iniciado com sucesso
              </div>
              <div className="p-2 rounded bg-white/5 border border-white/10">
                Conexão estável
              </div>
            </div>
          </div>
        );
      case 'network':
        return (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white/80">Status da Rede</h3>
            <div className="space-y-2 text-xs text-white/60">
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="text-green-400">Conectado</span>
              </div>
              <div className="flex justify-between">
                <span>Latência:</span>
                <span>24ms</span>
              </div>
              <div className="flex justify-between">
                <span>Download:</span>
                <span>125 Mbps</span>
              </div>
              <div className="flex justify-between">
                <span>Upload:</span>
                <span>50 Mbps</span>
              </div>
            </div>
          </div>
        );
      case 'battery':
        return (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-white/80">Energia</h3>
            <div className="space-y-2 text-xs text-white/60">
              <div className="flex justify-between">
                <span>Nível:</span>
                <span className="text-green-400">85%</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span>Carregando</span>
              </div>
              <div className="flex justify-between">
                <span>Tempo restante:</span>
                <span>4h 30m</span>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-50">
      {/* Voice Toggle Button */}
      <motion.button
        onClick={handleVoiceClick}
        onMouseEnter={() => onPlaySound?.('hover')}
        className={`absolute -top-16 left-0 w-12 h-12 rounded-full border flex items-center justify-center transition-all ${
          isVoiceActive 
            ? 'border-green-500/50 bg-green-500/20 text-green-400' 
            : transparentMode
              ? 'border-white/30 bg-white/10 text-white/80 hover:text-white hover:border-white/50 hover:bg-white/20'
              : 'border-white/20 bg-black/50 text-white/70 hover:text-white hover:border-white/40'
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={isVoiceActive ? { 
          boxShadow: ['0 0 10px rgba(34, 197, 94, 0.3)', '0 0 20px rgba(34, 197, 94, 0.5)', '0 0 10px rgba(34, 197, 94, 0.3)']
        } : {}}
        transition={{ duration: 1, repeat: isVoiceActive ? Infinity : 0 }}
      >
        {isVoiceActive ? <Mic size={20} /> : <MicOff size={20} />}
      </motion.button>

      {/* Menu Toggle Button */}
      <motion.button
        onClick={handleToggle}
        onMouseEnter={() => onPlaySound?.('hover')}
        className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all ${
          transparentMode
            ? 'border-white/30 bg-white/10 backdrop-blur-md text-white/80 hover:text-white hover:border-white/50 hover:bg-white/20'
            : 'border-white/20 bg-black/50 backdrop-blur-sm text-white/70 hover:text-white hover:border-white/40'
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </motion.button>

      {/* Menu Items with Labels */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="absolute left-16 top-1/2 -translate-y-1/2 flex flex-col gap-2 max-h-[80vh] overflow-y-auto pr-1"
          >
            {menuItems.map((item, index) => (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => handleWidgetSelect(item.id)}
                onMouseEnter={() => onPlaySound?.('hover')}
                className={`flex items-center gap-3 px-3 py-2 rounded-full border transition-all ${
                  activeWidget === item.id
                    ? transparentMode 
                      ? 'border-white/60 bg-white/20 backdrop-blur-md text-white'
                      : 'border-white/60 bg-white/10 text-white'
                    : 'highlight' in item && item.highlight
                      ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:text-cyan-300 hover:border-cyan-500/50'
                      : transparentMode
                        ? 'border-white/30 bg-white/10 backdrop-blur-md text-white/70 hover:text-white hover:border-white/50'
                        : 'border-white/20 bg-black/50 text-white/50 hover:text-white hover:border-white/40'
                }`}
                whileHover={{ scale: 1.05, x: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <item.icon size={16} />
                <span className="text-xs font-light tracking-wider whitespace-nowrap">
                  {item.label}
                </span>
                {'highlight' in item && item.highlight && (
                  <span className="px-1.5 py-0.5 rounded text-[8px] bg-cyan-500/20 text-cyan-400 font-medium">
                    NOVO
                  </span>
                )}
              </motion.button>
            ))}
            
            {/* Divider */}
            <div className={`my-2 border-t ${transparentMode ? 'border-white/20' : 'border-white/10'}`} />
            
            {/* User actions */}
            {user ? (
              <>
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: menuItems.length * 0.03 }}
                  onClick={() => handleUserAction('profile')}
                  onMouseEnter={() => onPlaySound?.('hover')}
                  className={`flex items-center gap-3 px-3 py-2 rounded-full border transition-all ${
                    transparentMode
                      ? 'border-white/30 bg-white/10 backdrop-blur-md text-white/70 hover:text-white hover:border-white/50'
                      : 'border-white/20 bg-black/50 text-white/50 hover:text-white hover:border-white/40'
                  }`}
                  whileHover={{ scale: 1.05, x: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <User size={16} />
                  <span className="text-xs font-light tracking-wider whitespace-nowrap">Perfil</span>
                </motion.button>
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: (menuItems.length + 1) * 0.03 }}
                  onClick={() => handleUserAction('plans')}
                  onMouseEnter={() => onPlaySound?.('hover')}
                  className={`flex items-center gap-3 px-3 py-2 rounded-full border transition-all ${
                    transparentMode
                      ? 'border-white/30 bg-white/10 backdrop-blur-md text-white/70 hover:text-white hover:border-white/50'
                      : 'border-white/20 bg-black/50 text-white/50 hover:text-white hover:border-white/40'
                  }`}
                  whileHover={{ scale: 1.05, x: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <CreditCard size={16} />
                  <span className="text-xs font-light tracking-wider whitespace-nowrap">Planos</span>
                </motion.button>
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: (menuItems.length + 2) * 0.03 }}
                  onClick={() => handleUserAction('logout')}
                  onMouseEnter={() => onPlaySound?.('hover')}
                  className={`flex items-center gap-3 px-3 py-2 rounded-full border transition-all border-red-500/30 text-red-400/70 hover:text-red-400 hover:border-red-500/50 ${
                    transparentMode ? 'bg-white/10 backdrop-blur-md' : 'bg-black/50'
                  }`}
                  whileHover={{ scale: 1.05, x: 5 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <LogOut size={16} />
                  <span className="text-xs font-light tracking-wider whitespace-nowrap">Sair</span>
                </motion.button>
              </>
            ) : (
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: menuItems.length * 0.03 }}
                onClick={() => handleUserAction('login')}
                onMouseEnter={() => onPlaySound?.('hover')}
                className={`flex items-center gap-3 px-3 py-2 rounded-full border transition-all border-primary/30 text-primary/70 hover:text-primary hover:border-primary/50 ${
                  transparentMode ? 'bg-white/10 backdrop-blur-md' : 'bg-black/50'
                }`}
                whileHover={{ scale: 1.05, x: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <LogIn size={16} />
                <span className="text-xs font-light tracking-wider whitespace-nowrap">Entrar</span>
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Widget Panel */}
      <AnimatePresence>
        {activeWidget && activeWidget !== 'screenagent' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, x: -20 }}
            transition={{ duration: 0.3 }}
            className={`absolute left-56 top-1/2 -translate-y-1/2 backdrop-blur-md border rounded-lg p-4 min-w-[280px] ${
              transparentMode 
                ? 'bg-white/10 border-white/20' 
                : 'bg-black/80 border-white/10'
            }`}
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

      {/* Screen Agent Panel - Separate full panel */}
      <ScreenAgentPanel
        isOpen={activeWidget === 'screenagent'}
        onClose={() => setActiveWidget(null)}
        transparentMode={transparentMode}
        onPlaySound={onPlaySound}
        onTTSSpeakingChange={onTTSSpeakingChange}
      />
    </div>
  );
};

export default MinimizedMenu;
