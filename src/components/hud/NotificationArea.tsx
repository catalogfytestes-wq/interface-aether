import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Bell, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
}

interface NotificationsProps {
  notifications?: Notification[];
  onDismiss?: (id: string) => void;
}

const NotificationArea = ({ notifications: externalNotifications, onDismiss }: NotificationsProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Demo notifications
  useEffect(() => {
    if (externalNotifications) {
      setNotifications(externalNotifications);
      return;
    }

    const demoNotifications: Omit<Notification, 'id' | 'timestamp'>[] = [
      { type: 'success', title: 'Sistema Iniciado', message: 'Todos os módulos carregados' },
      { type: 'info', title: 'Atualização', message: 'Nova versão disponível' },
      { type: 'warning', title: 'Memória', message: 'Uso em 75%' },
    ];

    let index = 0;
    const addNotification = () => {
      if (index >= demoNotifications.length) return;
      
      const newNotif: Notification = {
        ...demoNotifications[index],
        id: `notif-${Date.now()}`,
        timestamp: new Date(),
      };
      
      setNotifications((prev) => [newNotif, ...prev].slice(0, 5));
      index++;
    };

    addNotification();
    const interval = setInterval(addNotification, 8000);

    return () => clearInterval(interval);
  }, [externalNotifications]);

  const handleDismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    onDismiss?.(id);
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      default:
        return <Info className="w-4 h-4 text-primary" />;
    }
  };

  const getBorderColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'border-green-500/30';
      case 'warning':
        return 'border-yellow-500/30';
      case 'error':
        return 'border-red-500/30';
      default:
        return 'border-primary/30';
    }
  };

  return (
    <div className="w-72">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Bell className="w-3 h-3 text-primary/60" />
        <span className="text-[9px] uppercase tracking-widest text-primary/60 font-orbitron">
          NOTIFICAÇÕES
        </span>
        {notifications.length > 0 && (
          <span className="ml-auto text-[9px] font-mono text-primary/40">
            {notifications.length}
          </span>
        )}
      </div>

      {/* Notifications list */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {notifications.map((notif) => (
            <motion.div
              key={notif.id}
              className={`
                relative p-3 rounded backdrop-blur-sm border
                bg-background/30 ${getBorderColor(notif.type)}
              `}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -50, scale: 0.9 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              layout
            >
              <div className="flex items-start gap-2">
                {getIcon(notif.type)}
                
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-orbitron text-primary uppercase tracking-wider">
                    {notif.title}
                  </div>
                  <div className="text-[9px] text-primary/60 font-mono mt-0.5 truncate">
                    {notif.message}
                  </div>
                </div>

                <motion.button
                  className="p-0.5 hover:bg-primary/20 rounded transition-colors"
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleDismiss(notif.id)}
                >
                  <X className="w-3 h-3 text-primary/40" />
                </motion.button>
              </div>

              {/* Timestamp */}
              <div className="text-[7px] text-primary/30 font-mono mt-2">
                {notif.timestamp.toLocaleTimeString('pt-BR')}
              </div>

              {/* Glow effect on new notification */}
              <motion.div
                className="absolute inset-0 rounded pointer-events-none"
                initial={{ boxShadow: '0 0 20px hsl(185 100% 50% / 0.3)' }}
                animate={{ boxShadow: '0 0 0px transparent' }}
                transition={{ duration: 2 }}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {notifications.length === 0 && (
          <div className="text-center py-6 text-[10px] text-primary/30 font-mono">
            Sem notificações
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationArea;
