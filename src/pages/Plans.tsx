import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Star, ArrowLeft, Loader2, Zap, Crown, Rocket, Building2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { PLAN_TIERS, PlanId } from '@/config/plans';
import { supabase } from '@/integrations/supabase/client';

const iconMap = {
  starter: Rocket,
  pro: Zap,
  business: Crown,
  enterprise: Building2,
};

const Plans = () => {
  const navigate = useNavigate();
  const { subscriptionStatus, user, checkSubscription } = useAuth();
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSelectPlan = async (planId: PlanId) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const plan = PLAN_TIERS[planId];
    setLoadingPlan(planId);

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId: plan.price_id }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao iniciar checkout',
        variant: 'destructive'
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  const isCurrentPlan = (planId: string) => {
    return subscriptionStatus?.plan_name === planId;
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>
      
      {/* Scanlines */}
      <div className="absolute inset-0 scanlines pointer-events-none opacity-50" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-12"
        >
          <button
            onClick={() => navigate(-1)}
            className="hud-button p-3"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-primary text-glow tracking-wider">
              PLANOS
            </h1>
            <p className="text-muted-foreground terminal-text">
              Escolha o plano ideal para sua necessidade
            </p>
          </div>
        </motion.div>
        
        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(PLAN_TIERS).map(([id, plan], index) => {
            const Icon = iconMap[id as PlanId];
            const isCurrent = isCurrentPlan(id);
            
            return (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`hud-glass rounded-lg p-6 holo-border relative ${
                  plan.highlighted ? 'border-primary/50 lg:scale-105' : ''
                } ${isCurrent ? 'ring-2 ring-primary' : ''}`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded text-xs uppercase tracking-wider font-medium flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Popular
                  </div>
                )}
                
                {isCurrent && (
                  <div className="absolute -top-3 right-4 bg-accent text-accent-foreground px-4 py-1 rounded text-xs uppercase tracking-wider font-medium">
                    Seu Plano
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <div className={`w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center border ${
                    plan.highlighted ? 'bg-primary/20 border-primary' : 'bg-primary/10 border-primary/30'
                  }`}>
                    <Icon className={`w-7 h-7 ${plan.highlighted ? 'text-primary' : 'text-primary/70'}`} />
                  </div>
                  <h3 className="text-xl font-bold text-foreground tracking-wider">
                    {plan.name}
                  </h3>
                </div>
                
                <div className="text-center mb-6">
                  <span className="text-4xl font-bold text-primary text-glow">
                    {plan.priceFormatted}
                  </span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm terminal-text">
                      <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-foreground/80">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleSelectPlan(id as PlanId)}
                  disabled={isCurrent || loadingPlan === id}
                  className={`w-full hud-button py-3 flex items-center justify-center gap-2 ${
                    isCurrent 
                      ? 'opacity-50 cursor-not-allowed' 
                      : plan.highlighted 
                        ? 'bg-primary/20' 
                        : ''
                  }`}
                >
                  {loadingPlan === id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isCurrent ? (
                    'PLANO ATUAL'
                  ) : (
                    'ASSINAR'
                  )}
                </motion.button>
              </motion.div>
            );
          })}
        </div>

        {/* Info section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-muted-foreground terminal-text">
            Todos os planos incluem 7 dias de garantia. Cancele quando quiser.
          </p>
          {subscriptionStatus?.subscribed && (
            <p className="text-sm text-primary mt-2 terminal-text">
              Sua assinatura é válida até {new Date(subscriptionStatus.subscription_end!).toLocaleDateString('pt-BR')}
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Plans;
