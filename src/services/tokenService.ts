// Serviço para monitoramento de tokens e custos da OpenAI
export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  estimated_cost: number;
  model: string;
  timestamp: Date;
}

export interface TokenPricing {
  input_per_1k: number;  // Preço por 1000 tokens de entrada
  output_per_1k: number; // Preço por 1000 tokens de saída
  cached_input_per_1k?: number; // Preço para tokens em cache (75% desconto)
}

export interface ConversationCost {
  conversation_id: string;
  total_input_tokens: number;
  total_output_tokens: number;
  total_cost: number;
  message_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface ExchangeRateConfig {
  usd_to_brl: number;
  last_updated: Date;
  source?: string; // 'manual' | 'api' para futuras integrações
}

// Preços atualizados da OpenAI (Janeiro 2025)
export const MODEL_PRICING: Record<string, TokenPricing> = {
  'gpt-4o-mini': {
    input_per_1k: 0.00015,   // $0.15 por 1M tokens = $0.00015 por 1K
    output_per_1k: 0.0006,   // $0.60 por 1M tokens = $0.0006 por 1K
    cached_input_per_1k: 0.0000375 // 75% desconto
  },
  'gpt-4o-mini-optimized': {
    input_per_1k: 0.00015,   // Mesmo preço do gpt-4o-mini
    output_per_1k: 0.0006,   // Mesmo preço do gpt-4o-mini
    cached_input_per_1k: 0.0000375 // 75% desconto
  },
  'gpt-4o': {
    input_per_1k: 0.0025,    // $2.50 por 1M tokens
    output_per_1k: 0.01,     // $10.00 por 1M tokens
    cached_input_per_1k: 0.000625
  },
  'gpt-4-turbo': {
    input_per_1k: 0.01,      // $10.00 por 1M tokens
    output_per_1k: 0.03,     // $30.00 por 1M tokens
    cached_input_per_1k: 0.0025
  },
  'gpt-3.5-turbo': {
    input_per_1k: 0.0005,    // $0.50 por 1M tokens
    output_per_1k: 0.0015,   // $1.50 por 1M tokens
    cached_input_per_1k: 0.000125
  }
};

export class TokenService {
  private static instance: TokenService;
  private static readonly EXCHANGE_RATE_KEY = 'token_service_exchange_rate';
  private static readonly DEFAULT_EXCHANGE_RATE = 5.50;

  public static getInstance(): TokenService {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService();
    }
    return TokenService.instance;
  }

  /**
   * Obtém a taxa de câmbio atual (USD para BRL)
   */
  getExchangeRate(): ExchangeRateConfig {
    const stored = localStorage.getItem(TokenService.EXCHANGE_RATE_KEY);
    
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return {
          ...parsed,
          last_updated: new Date(parsed.last_updated)
        };
      } catch (error) {
        console.warn('Erro ao carregar taxa de câmbio salva, usando padrão:', error);
      }
    }

    // Retornar taxa padrão se não houver dados salvos
    return {
      usd_to_brl: TokenService.DEFAULT_EXCHANGE_RATE,
      last_updated: new Date(),
      source: 'default'
    };
  }

  /**
   * Define uma nova taxa de câmbio
   */
  setExchangeRate(rate: number, source: string = 'manual'): void {
    if (rate <= 0) {
      throw new Error('Taxa de câmbio deve ser maior que zero');
    }

    const config: ExchangeRateConfig = {
      usd_to_brl: rate,
      last_updated: new Date(),
      source
    };

    localStorage.setItem(TokenService.EXCHANGE_RATE_KEY, JSON.stringify(config));
    console.log(`💱 Taxa de câmbio atualizada: 1 USD = ${rate.toFixed(2)} BRL`);
  }

  /**
   * Reseta a taxa de câmbio para o valor padrão
   */
  resetExchangeRate(): void {
    localStorage.removeItem(TokenService.EXCHANGE_RATE_KEY);
    console.log(`💱 Taxa de câmbio resetada para padrão: 1 USD = ${TokenService.DEFAULT_EXCHANGE_RATE} BRL`);
  }

  /**
   * Estima o número de tokens em um texto
   * Baseado na regra aproximada: 1 token ≈ 4 caracteres em português
   * Para maior precisão, seria necessário usar a biblioteca tiktoken
   */
  estimateTokens(text: string): number {
    if (!text) return 0;
    
    // Regra aproximada para português/inglês
    // 1 token ≈ 4 caracteres ou 0.75 palavras
    const charCount = text.length;
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    
    // Usar a estimativa mais conservadora (maior)
    const tokensByChars = Math.ceil(charCount / 4);
    const tokensByWords = Math.ceil(wordCount / 0.75);
    
    return Math.max(tokensByChars, tokensByWords);
  }

  /**
   * Calcula o custo baseado no uso de tokens
   */
  calculateCost(
    inputTokens: number, 
    outputTokens: number, 
    model: string = 'gpt-4o-mini',
    cachedInputTokens: number = 0
  ): number {
    const pricing = MODEL_PRICING[model];
    if (!pricing) {
      console.warn(`Preço não encontrado para o modelo: ${model}`);
      return 0;
    }

    const freshInputTokens = inputTokens - cachedInputTokens;
    
    const inputCost = (freshInputTokens / 1000) * pricing.input_per_1k;
    const cachedCost = cachedInputTokens > 0 && pricing.cached_input_per_1k 
      ? (cachedInputTokens / 1000) * pricing.cached_input_per_1k 
      : 0;
    const outputCost = (outputTokens / 1000) * pricing.output_per_1k;
    
    return inputCost + cachedCost + outputCost;
  }

  /**
   * Analisa o uso de tokens de uma conversa completa
   */
  analyzeConversationUsage(messages: Array<{content: string, sender: string}>): {
    totalInputTokens: number;
    totalOutputTokens: number;
    estimatedCost: number;
    breakdown: Array<{
      message: string;
      tokens: number;
      type: 'input' | 'output';
      cost: number;
    }>;
  } {
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    const breakdown: Array<{
      message: string;
      tokens: number;
      type: 'input' | 'output';
      cost: number;
    }> = [];

    messages.forEach((message, index) => {
      const tokens = this.estimateTokens(message.content);
      const isInput = message.sender === 'user';
      const type = isInput ? 'input' : 'output';
      
      if (isInput) {
        totalInputTokens += tokens;
      } else {
        totalOutputTokens += tokens;
      }

      const cost = isInput 
        ? this.calculateCost(tokens, 0)
        : this.calculateCost(0, tokens);

      breakdown.push({
        message: message.content.substring(0, 100) + (message.content.length > 100 ? '...' : ''),
        tokens,
        type,
        cost
      });
    });

    const estimatedCost = this.calculateCost(totalInputTokens, totalOutputTokens);

    return {
      totalInputTokens,
      totalOutputTokens,
      estimatedCost,
      breakdown
    };
  }

  /**
   * Formata o custo em reais usando a taxa de câmbio atual
   */
  formatCostBRL(costUSD: number): string {
    const exchangeRate = this.getExchangeRate();
    const costBRL = costUSD * exchangeRate.usd_to_brl;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 4
    }).format(costBRL);
  }

  /**
   * Formata o custo em dólares
   */
  formatCostUSD(costUSD: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4
    }).format(costUSD);
  }

  /**
   * Gera relatório detalhado de uso
   */
  generateUsageReport(usage: TokenUsage[]): {
    totalCost: number;
    totalTokens: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    averageCostPerMessage: number;
    mostExpensiveCall: TokenUsage | null;
    dailyUsage: Record<string, {cost: number, tokens: number, calls: number}>;
  } {
    if (usage.length === 0) {
      return {
        totalCost: 0,
        totalTokens: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        averageCostPerMessage: 0,
        mostExpensiveCall: null,
        dailyUsage: {}
      };
    }

    const totalCost = usage.reduce((sum, u) => sum + u.estimated_cost, 0);
    const totalInputTokens = usage.reduce((sum, u) => sum + u.prompt_tokens, 0);
    const totalOutputTokens = usage.reduce((sum, u) => sum + u.completion_tokens, 0);
    const totalTokens = totalInputTokens + totalOutputTokens;
    const averageCostPerMessage = totalCost / usage.length;
    
    const mostExpensiveCall = usage.reduce((max, current) => 
      current.estimated_cost > (max?.estimated_cost || 0) ? current : max, 
      null as TokenUsage | null
    );

    // Agrupar por dia
    const dailyUsage: Record<string, {cost: number, tokens: number, calls: number}> = {};
    usage.forEach(u => {
      const day = u.timestamp.toISOString().split('T')[0];
      if (!dailyUsage[day]) {
        dailyUsage[day] = {cost: 0, tokens: 0, calls: 0};
      }
      dailyUsage[day].cost += u.estimated_cost;
      dailyUsage[day].tokens += u.total_tokens;
      dailyUsage[day].calls += 1;
    });

    return {
      totalCost,
      totalTokens,
      totalInputTokens,
      totalOutputTokens,
      averageCostPerMessage,
      mostExpensiveCall,
      dailyUsage
    };
  }

  /**
   * Salva dados de uso no localStorage para persistência
   */
  saveUsageData(usage: TokenUsage, professorId: number): void {
    const key = `token_usage_${professorId}`;
    const existing = this.getUsageData(professorId);
    existing.push(usage);
    
    // Manter apenas os últimos 1000 registros
    if (existing.length > 1000) {
      existing.splice(0, existing.length - 1000);
    }
    
    localStorage.setItem(key, JSON.stringify(existing));
  }

  /**
   * Recupera dados de uso do localStorage
   */
  getUsageData(professorId: number): TokenUsage[] {
    const key = `token_usage_${professorId}`;
    const data = localStorage.getItem(key);
    if (!data) return [];
    
    try {
      const parsed = JSON.parse(data);
      return parsed.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      }));
    } catch (error) {
      console.error('Erro ao carregar dados de uso:', error);
      return [];
    }
  }

  /**
   * Limpa dados de uso antigos (mais de 30 dias)
   */
  cleanOldUsageData(professorId: number): void {
    const usage = this.getUsageData(professorId);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const filtered = usage.filter(u => u.timestamp > thirtyDaysAgo);
    
    const key = `token_usage_${professorId}`;
    localStorage.setItem(key, JSON.stringify(filtered));
  }
}

export const tokenService = TokenService.getInstance(); 