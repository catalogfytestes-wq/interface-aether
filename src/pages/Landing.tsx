import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, Shield, Brain, Eye, Cpu, MessageCircle, 
  ChevronRight, Check, Star, ArrowRight, Sparkles,
  Bot, Layers, Clock, Users
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { PLAN_TIERS } from '@/config/plans';

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCTA = () => {
    if (user) {
      navigate('/plans');
    } else {
      navigate('/auth');
    }
  };

  const features = [
    {
      icon: Brain,
      title: 'Inteligência Artificial Avançada',
      description: 'IA de última geração que entende contexto e executa tarefas complexas automaticamente.'
    },
    {
      icon: Eye,
      title: 'Visão Computacional',
      description: 'Veja o que o JARVIS vê. Análise visual em tempo real para automação gráfica.'
    },
    {
      icon: Zap,
      title: 'Execução Autônoma',
      description: 'Deixe o JARVIS trabalhar por você. Menos confirmações, mais resultados.'
    },
    {
      icon: Shield,
      title: 'Segurança Total',
      description: 'Seus dados protegidos com criptografia de ponta e controle total.'
    },
    {
      icon: Cpu,
      title: 'Processamento Paralelo',
      description: 'Execute múltiplas tarefas simultaneamente sem perda de performance.'
    },
    {
      icon: MessageCircle,
      title: 'Conversação Natural',
      description: 'Fale com JARVIS como faria com um assistente humano.'
    },
  ];

  const stats = [
    { value: '99.9%', label: 'Uptime' },
    { value: '< 100ms', label: 'Latência' },
    { value: '10M+', label: 'Ações/dia' },
    { value: '24/7', label: 'Disponível' },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/3 rounded-full blur-[200px]" />
      </div>
      
      {/* Scanlines */}
      <div className="absolute inset-0 scanlines pointer-events-none opacity-30" />

      {/* Header */}
      <header className="relative z-10 py-6 px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Bot className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-primary text-glow tracking-widest">JARVIS</span>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            {user ? (
              <>
                <button
                  onClick={() => navigate('/')}
                  className="px-4 py-2 text-sm text-foreground/70 hover:text-foreground transition-colors"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => navigate('/profile')}
                  className="hud-button"
                >
                  Meu Perfil
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/auth')}
                  className="px-4 py-2 text-sm text-foreground/70 hover:text-foreground transition-colors"
                >
                  Entrar
                </button>
                <button
                  onClick={() => navigate('/auth')}
                  className="hud-button"
                >
                  Começar Agora
                </button>
              </>
            )}
          </motion.div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary/80 terminal-text">Próxima geração de automação</span>
            </div>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight"
          >
            Seu assistente
            <br />
            <span className="text-primary text-glow">inteligente</span> pessoal
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto mb-12 terminal-text"
          >
            JARVIS é mais que um assistente. É uma extensão da sua mente. 
            Automatize tarefas, execute comandos e controle tudo com a voz.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCTA}
              className="group px-8 py-4 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-lg font-medium text-lg flex items-center gap-2 shadow-lg shadow-primary/25"
            >
              {user ? 'Ver Planos' : 'Começar Gratuitamente'}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
            
            <button
              onClick={() => navigate('/plans')}
              className="px-8 py-4 text-foreground/70 hover:text-foreground transition-colors flex items-center gap-2"
            >
              Ver todos os planos
              <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>

          {/* Animated orb preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="mt-20 relative"
          >
            <div className="w-64 h-64 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 blur-3xl absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            <div className="w-48 h-48 mx-auto rounded-full border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent backdrop-blur-xl flex items-center justify-center relative">
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 blur-xl absolute"
              />
              <Bot className="w-16 h-16 text-primary relative z-10" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 py-16 px-8 border-y border-primary/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl font-bold text-primary text-glow mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground terminal-text">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 py-24 px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Recursos <span className="text-primary">poderosos</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto terminal-text">
              Tudo que você precisa para automatizar seu trabalho e aumentar sua produtividade.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="hud-glass rounded-lg p-6 holo-border group hover:border-primary/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground terminal-text">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="relative z-10 py-24 px-8 bg-gradient-to-b from-transparent to-primary/5">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Escolha seu <span className="text-primary">plano</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto terminal-text">
              Planos flexíveis para cada necessidade. Escale conforme você cresce.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.values(PLAN_TIERS).map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`hud-glass rounded-lg p-6 holo-border relative ${
                  plan.highlighted ? 'border-primary/50 scale-105' : ''
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded text-xs uppercase tracking-wider font-medium flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Popular
                  </div>
                )}
                
                <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-primary">{plan.priceFormatted}</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                
                <ul className="space-y-2 mb-6">
                  {plan.features.slice(0, 4).map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-foreground/70 terminal-text">{feature}</span>
                    </li>
                  ))}
                  {plan.features.length > 4 && (
                    <li className="text-sm text-muted-foreground terminal-text">
                      +{plan.features.length - 4} mais recursos
                    </li>
                  )}
                </ul>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCTA}
                  className={`w-full hud-button py-3 ${plan.highlighted ? 'bg-primary/20' : ''}`}
                >
                  Escolher Plano
                </motion.button>
              </motion.div>
            ))}
          </div>
          
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <button
              onClick={() => navigate('/plans')}
              className="text-primary hover:underline flex items-center gap-2 mx-auto"
            >
              Ver comparativo completo
              <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-24 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="hud-glass rounded-2xl p-12 holo-border"
          >
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Pronto para <span className="text-primary text-glow">começar</span>?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto terminal-text">
              Junte-se a milhares de usuários que já automatizam suas tarefas com JARVIS.
            </p>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCTA}
              className="group px-8 py-4 bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-lg font-medium text-lg inline-flex items-center gap-2 shadow-lg shadow-primary/25"
            >
              {user ? 'Escolher Meu Plano' : 'Criar Conta Agora'}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-8 border-t border-primary/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Bot className="w-6 h-6 text-primary" />
            <span className="text-sm text-muted-foreground terminal-text">
              © 2025 JARVIS. Todos os direitos reservados.
            </span>
          </div>
          
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Termos</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacidade</a>
            <a href="#" className="hover:text-foreground transition-colors">Suporte</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
