import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import HUDOverlay from '@/components/hud/HUDOverlay';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading, subscriptionStatus, isSubscribed } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/landing');
    }
  }, [user, loading, navigate]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in - redirect handled by useEffect
  if (!user) {
    return null;
  }

  // User logged in but no active subscription - show upgrade prompt
  if (!isSubscribed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
        </div>
        
        {/* Scanlines */}
        <div className="absolute inset-0 scanlines pointer-events-none opacity-50" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="hud-glass rounded-lg p-8 max-w-md text-center holo-border"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center border border-primary/30"
          >
            <Lock className="w-10 h-10 text-primary" />
          </motion.div>

          <h1 className="text-2xl font-bold text-primary text-glow tracking-wider mb-4">
            ACESSO RESTRITO
          </h1>
          
          <p className="text-muted-foreground terminal-text mb-6">
            Para acessar o JARVIS e seus recursos de inteligência artificial, 
            você precisa ter uma assinatura ativa.
          </p>

          <div className="space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/plans')}
              className="w-full hud-button py-4 text-lg"
            >
              VER PLANOS
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/profile')}
              className="w-full py-3 text-muted-foreground hover:text-primary transition-colors terminal-text"
            >
              Ir para Perfil
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // User has active subscription - show JARVIS
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <HUDOverlay />
    </div>
  );
};

export default Index;
