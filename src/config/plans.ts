// Plan tiers configuration with Stripe IDs
export const PLAN_TIERS = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 99.90,
    priceFormatted: 'R$ 99,90',
    price_id: 'price_1SpIJEGLFhKcnQJ3GlVQAjIP',
    product_id: 'prod_Tms35MHEzolpvU',
    features: [
      'Chat com Jarvis',
      'Execução simples de comandos',
      'Limite diário de ações',
      'Automação básica',
      'Sem visão em tempo real contínua',
      'Menos tentativas automáticas',
      'Mais confirmações',
      'Menos paralelismo',
    ],
    highlighted: false,
    color: 'cyan',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 299.90,
    priceFormatted: 'R$ 299,90',
    price_id: 'price_1SpIJTGLFhKcnQJ3VXhs3yD7',
    product_id: 'prod_Tms3uWEAIsHvEf',
    features: [
      'Visão computacional ativa',
      'Automação gráfica completa',
      'Mais execuções simultâneas',
      'Histórico de ações',
      'Respostas mais detalhadas do Jarvis',
      'Mais autonomia',
      'Menos confirmações',
      'Melhor visão',
    ],
    highlighted: true,
    color: 'blue',
  },
  business: {
    id: 'business',
    name: 'Business',
    price: 699.90,
    priceFormatted: 'R$ 699,90',
    price_id: 'price_1SpIJgGLFhKcnQJ3WZRCoP9I',
    product_id: 'prod_Tms3DCHIZA9BD6',
    features: [
      'Execuções longas',
      'Menos limites',
      'Prioridade de processamento',
      'Personalização de fluxos',
      'Logs avançados',
      'Planejamento longo',
      'Execuções contínuas',
      'Decisões mais autônomas',
    ],
    highlighted: false,
    color: 'purple',
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 1549.90,
    priceFormatted: 'R$ 1.549,90',
    price_id: 'price_1SpIJtGLFhKcnQJ3hO1eKqOk',
    product_id: 'prod_Tms4YUGymMxC6z',
    features: [
      'Uso ilimitado',
      'Execução paralela',
      'Modelos de visão mais avançados',
      'Configurações personalizadas',
      'Uso comercial liberado',
      'Suporte dedicado',
      'Autonomia total',
      'Menos interrupções',
      'Fluxos complexos',
    ],
    highlighted: false,
    color: 'orange',
  },
} as const;

export type PlanId = keyof typeof PLAN_TIERS;

export const getPlanById = (planId: string | null): typeof PLAN_TIERS[PlanId] | null => {
  if (!planId) return null;
  return PLAN_TIERS[planId as PlanId] || null;
};

export const getPlanByProductId = (productId: string): typeof PLAN_TIERS[PlanId] | null => {
  const entry = Object.entries(PLAN_TIERS).find(([_, plan]) => plan.product_id === productId);
  return entry ? entry[1] : null;
};
