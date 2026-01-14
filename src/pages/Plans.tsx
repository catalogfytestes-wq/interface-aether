import { motion } from 'framer-motion';
import { Check, Zap, Crown, Sparkles, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const plans = [
  {
    id: 'free',
    name: 'Gratuito',
    price: 'R$ 0',
    period: '/mês',
    description: 'Ideal para começar',
    icon: Sparkles,
    features: [
      'Comandos de voz básicos',
      'Widgets padrão',
      '5 comandos por dia',
      'Suporte por email'
    ],
    highlighted: false
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'R$ 29',
    period: '/mês',
    description: 'Para usuários avançados',
    icon: Zap,
    features: [
      'Comandos ilimitados',
      'Todos os widgets',
      'Integração com APIs',
      'Vozes personalizadas',
      'Suporte prioritário'
    ],
    highlighted: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'R$ 99',
    period: '/mês',
    description: 'Para empresas',
    icon: Crown,
    features: [
      'Tudo do Pro',
      'API dedicada',
      'Múltiplos usuários',
      'Customização completa',
      'SLA garantido',
      'Suporte 24/7'
    ],
    highlighted: false
  }
];

const Plans = () => {
  const navigate = useNavigate();
  const { subscription, user } = useAuth();
  const { toast } = useToast();

  const handleSelectPlan = (planId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (planId === 'free') {
      toast({
        title: 'Plano Gratuito',
        description: 'Você já está no plano gratuito!'
      });
      return;
    }

    // TODO: Integrate with Stripe for paid plans
    toast({
      title: 'Em breve!',
      description: 'Sistema de pagamentos será implementado em breve.'
    });
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
      
      <div className="max-w-6xl mx-auto relative z-10">
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
              Escolha o plano ideal para você
            </p>
          </div>
        </motion.div>
        
        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`hud-glass rounded-lg p-6 holo-border relative ${
                plan.highlighted ? 'border-primary/50 scale-105' : ''
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded text-xs uppercase tracking-wider font-medium">
                  Popular
                </div>
              )}
              
              {subscription?.plan_id === plan.id && (
                <div className="absolute -top-3 right-4 bg-accent text-accent-foreground px-4 py-1 rounded text-xs uppercase tracking-wider font-medium">
                  Atual
                </div>
              )}
              
              <div className="text-center mb-6">
                <div className={`w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center border ${
                  plan.highlighted ? 'bg-primary/20 border-primary' : 'bg-primary/10 border-primary/30'
                }`}>
                  <plan.icon className={`w-7 h-7 ${plan.highlighted ? 'text-primary' : 'text-primary/70'}`} />
                </div>
                <h3 className="text-xl font-bold text-foreground tracking-wider">
                  {plan.name}
                </h3>
                <p className="text-muted-foreground text-sm terminal-text">
                  {plan.description}
                </p>
              </div>
              
              <div className="text-center mb-6">
                <span className="text-4xl font-bold text-primary text-glow">
                  {plan.price}
                </span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
              
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm terminal-text">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-foreground/80">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectPlan(plan.id)}
                disabled={subscription?.plan_id === plan.id}
                className={`w-full hud-button py-3 ${
                  subscription?.plan_id === plan.id 
                    ? 'opacity-50 cursor-not-allowed' 
                    : plan.highlighted 
                      ? 'bg-primary/20' 
                      : ''
                }`}
              >
                {subscription?.plan_id === plan.id ? 'PLANO ATUAL' : 'SELECIONAR'}
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Plans;
