import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkSubscription, user, loading } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyPayment = async () => {
      // Wait a bit for Stripe to process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check subscription status
      await checkSubscription();
      setIsVerifying(false);
    };

    if (user && !loading) {
      verifyPayment();
    }
  }, [checkSubscription, user, loading]);

  const handleContinue = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>
      
      {/* Scanlines */}
      <div className="absolute inset-0 scanlines pointer-events-none opacity-50" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="hud-glass rounded-lg p-12 holo-border text-center max-w-md"
      >
        {isVerifying ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-20 h-20 mx-auto mb-6 rounded-full border-4 border-primary/30 border-t-primary"
            />
            <h1 className="text-2xl font-bold text-foreground mb-4">
              Verificando pagamento...
            </h1>
            <p className="text-muted-foreground terminal-text">
              Aguarde enquanto confirmamos sua assinatura.
            </p>
          </>
        ) : (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center"
            >
              <CheckCircle className="w-12 h-12 text-green-500" />
            </motion.div>
            
            <h1 className="text-2xl font-bold text-foreground mb-4 text-glow">
              Pagamento Confirmado!
            </h1>
            
            <p className="text-muted-foreground terminal-text mb-8">
              Sua assinatura foi ativada com sucesso. Agora você tem acesso a todos os recursos do JARVIS.
            </p>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleContinue}
              className="hud-button py-4 px-8 flex items-center justify-center gap-2 mx-auto"
            >
              ACESSAR JARVIS
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;
