import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Mic, ScanSearch, Settings, ChevronRight, Volume2, VolumeX } from 'lucide-react';

interface SidebarButton {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
}

interface HolographicSidebarProps {
  onActivateVoice?: () => void;
  onIntelScan?: () => void;
  onSettings?: () => void;
  onHover?: () => void;
  onClick?: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
}

const HolographicSidebar = ({
  onActivateVoice,
  onIntelScan,
  onSettings,
  onHover,
  onClick,
  soundEnabled = true,
  onToggleSound,
}: HolographicSidebarProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  const buttons: SidebarButton[] = [
    {
      id: 'voice',
      label: 'ATIVAR VOZ',
      icon: <Mic className="w-5 h-5" />,
      onClick: onActivateVoice,
    },
    {
      id: 'scan',
      label: 'SCAN DE INTELIGÊNCIA',
      icon: <ScanSearch className="w-5 h-5" />,
      onClick: onIntelScan,
    },
    {
      id: 'settings',
      label: 'CONFIGURAÇÕES',
      icon: <Settings className="w-5 h-5" />,
      onClick: onSettings,
    },
  ];

  const handleButtonHover = (id: string) => {
    setHoveredButton(id);
    onHover?.();
  };

  const handleButtonClick = (callback?: () => void) => {
    onClick?.();
    callback?.();
  };

  return (
    <>
      {/* Hover trigger zone */}
      <div
        className="fixed left-0 top-0 w-16 h-full z-40"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      />

      <AnimatePresence>
        {isVisible && (
          <motion.div
            className="fixed left-0 top-0 h-full z-50"
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
          >
            {/* Main sidebar panel */}
            <div className="h-full w-64 hud-glass holo-border relative overflow-hidden">
              {/* Scanlines overlay */}
              <div className="absolute inset-0 scanlines pointer-events-none" />

              {/* Header */}
              <div className="p-6 border-b border-primary/20">
                <motion.h2
                  className="text-primary text-glow text-sm uppercase tracking-[0.2em] font-orbitron"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  MENU PRINCIPAL
                </motion.h2>
                <motion.div
                  className="h-px bg-gradient-to-r from-primary via-primary/50 to-transparent mt-3"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                />
              </div>

              {/* Navigation buttons */}
              <nav className="p-4 space-y-2">
                {buttons.map((button, index) => (
                  <motion.button
                    key={button.id}
                    className="w-full group relative"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.1 }}
                    onMouseEnter={() => handleButtonHover(button.id)}
                    onMouseLeave={() => setHoveredButton(null)}
                    onClick={() => handleButtonClick(button.onClick)}
                  >
                    <div
                      className={`
                        flex items-center gap-4 p-4 rounded transition-all duration-300
                        ${hoveredButton === button.id
                          ? 'bg-primary/20 border border-primary/50'
                          : 'bg-primary/5 border border-primary/10'
                        }
                      `}
                    >
                      <span
                        className={`
                          transition-all duration-300
                          ${hoveredButton === button.id ? 'text-primary text-glow' : 'text-primary/60'}
                        `}
                      >
                        {button.icon}
                      </span>
                      <span
                        className={`
                          text-xs uppercase tracking-wider font-orbitron transition-all duration-300
                          ${hoveredButton === button.id ? 'text-primary text-glow' : 'text-primary/60'}
                        `}
                      >
                        {button.label}
                      </span>
                      <ChevronRight
                        className={`
                          w-4 h-4 ml-auto transition-all duration-300
                          ${hoveredButton === button.id
                            ? 'opacity-100 translate-x-0 text-primary'
                            : 'opacity-0 -translate-x-2 text-primary/40'
                          }
                        `}
                      />
                    </div>

                    {/* Hover glow effect */}
                    {hoveredButton === button.id && (
                      <motion.div
                        className="absolute inset-0 rounded pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                          boxShadow: '0 0 30px hsl(185 100% 50% / 0.2), inset 0 0 20px hsl(185 100% 50% / 0.1)',
                        }}
                      />
                    )}
                  </motion.button>
                ))}

                {/* Sound toggle button */}
                <motion.button
                  className="w-full group relative mt-4"
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  onMouseEnter={() => handleButtonHover('sound')}
                  onMouseLeave={() => setHoveredButton(null)}
                  onClick={() => handleButtonClick(onToggleSound)}
                >
                  <div
                    className={`
                      flex items-center gap-4 p-4 rounded transition-all duration-300
                      ${hoveredButton === 'sound'
                        ? 'bg-primary/20 border border-primary/50'
                        : 'bg-primary/5 border border-primary/10'
                      }
                    `}
                  >
                    <span className={`transition-all duration-300 ${hoveredButton === 'sound' ? 'text-primary' : 'text-primary/60'}`}>
                      {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </span>
                    <span className={`text-xs uppercase tracking-wider font-orbitron transition-all duration-300 ${hoveredButton === 'sound' ? 'text-primary' : 'text-primary/60'}`}>
                      SOM: {soundEnabled ? 'LIGADO' : 'DESLIGADO'}
                    </span>
                  </div>
                </motion.button>
              </nav>

              {/* Footer status */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-primary/20">
                <motion.div
                  className="flex items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] uppercase tracking-widest text-primary/60 font-mono">
                    CONEXÃO ESTÁVEL
                  </span>
                </motion.div>
              </div>

              {/* Edge glow effect */}
              <div
                className="absolute right-0 top-0 bottom-0 w-px"
                style={{
                  background: 'linear-gradient(to bottom, transparent, hsl(185 100% 50% / 0.5), transparent)',
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Indicator when hidden */}
      <AnimatePresence>
        {!isVisible && (
          <motion.div
            className="fixed left-2 top-1/2 -translate-y-1/2 z-30"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
          >
            <div className="flex flex-col gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1 h-6 rounded-full bg-primary/30"
                  animate={{
                    opacity: [0.3, 0.6, 0.3],
                    scaleY: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.3,
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default HolographicSidebar;
