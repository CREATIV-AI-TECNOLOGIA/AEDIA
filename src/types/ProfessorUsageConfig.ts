export interface ProfessorUsageConfig {
  id?: string;
  professor_id: number;
  escola_id: number;
  
  // Limites mensais
  limite_mensal_usd: number; // Limite em dólares
  limite_mensal_brl: number; // Limite em reais (calculado automaticamente)
  limite_tokens_entrada: number; // Limite de tokens de entrada por mês
  limite_tokens_saida: number; // Limite de tokens de saída por mês
  limite_conversas_mes: number; // Limite de conversas por mês
  limite_mensagens_dia: number; // Limite de mensagens por dia
  
  // Configurações de alertas
  alerta_80_porcento: boolean; // Alerta aos 80% do limite
  alerta_90_porcento: boolean; // Alerta aos 90% do limite
  bloquear_ao_atingir_limite: boolean; // Bloquear uso ao atingir 100%
  
  // Configurações de reset
  dia_reset_mensal: number; // Dia do mês para reset (1-28)
  auto_reset_enabled: boolean; // Reset automático habilitado
  
  // Configurações de notificação
  notificar_admin_limite: boolean; // Notificar admin quando atingir limite
  email_notificacao?: string; // Email para notificações
  
  // Metadados
  created_at?: string;
  updated_at?: string;
  created_by?: number; // ID do admin que criou
}

export interface ProfessorUsageStats {
  professor_id: number;
  periodo: string; // YYYY-MM
  
  // Uso atual
  gasto_atual_usd: number;
  gasto_atual_brl: number;
  tokens_entrada_usados: number;
  tokens_saida_usados: number;
  conversas_criadas: number;
  mensagens_enviadas: number;
  
  // Percentuais de uso
  percentual_gasto: number;
  percentual_tokens_entrada: number;
  percentual_tokens_saida: number;
  percentual_conversas: number;
  percentual_mensagens: number;
  
  // Status
  limite_atingido: boolean;
  bloqueado: boolean;
  alertas_enviados: string[]; // ['80%', '90%', '100%']
  
  // Última atualização
  last_updated: string;
}

export interface UsageScenario {
  nome: string;
  descricao: string;
  uso_diario: {
    conversas: number;
    mensagens_por_conversa: number;
    tokens_entrada_media: number;
    tokens_saida_media: number;
  };
  custo_mensal: {
    usd: number;
    brl: number;
  };
  recomendacao_limite: {
    usd: number;
    brl: number;
  };
}

// Cenários pré-definidos baseados no dólar atual (R$ 5,64)
export const CENARIOS_USO: UsageScenario[] = [
  {
    nome: "Uso Básico",
    descricao: "Professor que usa ocasionalmente para tirar dúvidas e criar planos simples",
    uso_diario: {
      conversas: 1,
      mensagens_por_conversa: 3,
      tokens_entrada_media: 800,
      tokens_saida_media: 400
    },
    custo_mensal: {
      usd: 0.85,
      brl: 4.79
    },
    recomendacao_limite: {
      usd: 2.00,
      brl: 11.28
    }
  },
  {
    nome: "Uso Moderado",
    descricao: "Professor que usa regularmente para planos de aula e correções",
    uso_diario: {
      conversas: 2,
      mensagens_por_conversa: 5,
      tokens_entrada_media: 1200,
      tokens_saida_media: 600
    },
    custo_mensal: {
      usd: 2.55,
      brl: 14.38
    },
    recomendacao_limite: {
      usd: 5.00,
      brl: 28.20
    }
  },
  {
    nome: "Uso Intenso",
    descricao: "Professor que usa diariamente para múltiplas atividades pedagógicas",
    uso_diario: {
      conversas: 3,
      mensagens_por_conversa: 8,
      tokens_entrada_media: 1800,
      tokens_saida_media: 900
    },
    custo_mensal: {
      usd: 5.10,
      brl: 28.76
    },
    recomendacao_limite: {
      usd: 10.00,
      brl: 56.40
    }
  },
  {
    nome: "Uso Profissional",
    descricao: "Professor coordenador ou que usa para múltiplas turmas",
    uso_diario: {
      conversas: 5,
      mensagens_por_conversa: 10,
      tokens_entrada_media: 2500,
      tokens_saida_media: 1200
    },
    custo_mensal: {
      usd: 10.20,
      brl: 57.53
    },
    recomendacao_limite: {
      usd: 20.00,
      brl: 112.80
    }
  }
];

// Configurações padrão para novos professores
export const USAGE_CONFIG_PADRAO: Omit<ProfessorUsageConfig, 'id' | 'professor_id' | 'escola_id' | 'created_at' | 'updated_at' | 'created_by'> = {
  limite_mensal_usd: 5.00, // Limite padrão de $5 USD
  limite_mensal_brl: 28.20, // R$ 28,20 (5 * 5.64)
  limite_tokens_entrada: 150000, // ~150k tokens de entrada
  limite_tokens_saida: 75000, // ~75k tokens de saída
  limite_conversas_mes: 60, // 2 conversas por dia útil
  limite_mensagens_dia: 20, // 20 mensagens por dia
  
  alerta_80_porcento: true,
  alerta_90_porcento: true,
  bloquear_ao_atingir_limite: false, // Por padrão não bloqueia
  
  dia_reset_mensal: 1, // Reset no dia 1 de cada mês
  auto_reset_enabled: true,
  
  notificar_admin_limite: true,
  email_notificacao: undefined
};

export interface ExchangeRate {
  usd_to_brl: number;
  last_updated: string;
  source: string;
}

// Taxa de câmbio atual
export const CURRENT_EXCHANGE_RATE: ExchangeRate = {
  usd_to_brl: 5.64,
  last_updated: new Date().toISOString(),
  source: 'manual'
}; 