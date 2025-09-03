// Serviço para otimização de contexto e redução de custos
export interface OptimizationConfig {
  maxHistoryMessages: number;
  maxTokensPerMessage: number;
  summarizeAfterMessages: number;
  enableSmartTruncation: boolean;
  prioritizeRecentMessages: boolean;
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  tokens?: number;
}

export interface OptimizationResult {
  originalTokens: number;
  optimizedTokens: number;
  savedTokens: number;
  savedPercentage: number;
  strategy: string;
  messages: ConversationMessage[];
}

export class ContextOptimizer {
  private static instance: ContextOptimizer;

  // Configurações padrão otimizadas para economia
  private defaultConfig: OptimizationConfig = {
    maxHistoryMessages: 6,        // Máximo 6 mensagens de histórico (3 pares)
    maxTokensPerMessage: 500,     // Truncar mensagens muito longas
    summarizeAfterMessages: 10,   // Resumir após 10 mensagens
    enableSmartTruncation: true,  // Truncar inteligentemente
    prioritizeRecentMessages: true // Priorizar mensagens recentes
  };

  public static getInstance(): ContextOptimizer {
    if (!ContextOptimizer.instance) {
      ContextOptimizer.instance = new ContextOptimizer();
    }
    return ContextOptimizer.instance;
  }

  /**
   * Estima tokens em um texto
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Trunca uma mensagem mantendo o contexto essencial
   */
  private smartTruncate(content: string, maxTokens: number): string {
    const estimatedTokens = this.estimateTokens(content);
    
    if (estimatedTokens <= maxTokens) {
      return content;
    }

    const maxChars = maxTokens * 4;
    const truncated = content.substring(0, maxChars - 50);
    
    // Tentar cortar em uma frase completa
    const lastSentence = truncated.lastIndexOf('.');
    const lastQuestion = truncated.lastIndexOf('?');
    const lastExclamation = truncated.lastIndexOf('!');
    
    const cutPoint = Math.max(lastSentence, lastQuestion, lastExclamation);
    
    if (cutPoint > maxChars * 0.7) {
      return truncated.substring(0, cutPoint + 1) + '\n\n[...mensagem truncada para economia de tokens...]';
    }
    
    return truncated + '\n\n[...mensagem truncada para economia de tokens...]';
  }

  /**
   * Cria um resumo das mensagens antigas
   */
  private createSummary(messages: ConversationMessage[]): string {
    const topics = new Set<string>();
    let keyPoints: string[] = [];

    messages.forEach(msg => {
      if (msg.role === 'user') {
        // Extrair tópicos principais das perguntas do usuário
        const content = msg.content.toLowerCase();
        if (content.includes('plano de aula')) topics.add('planos de aula');
        if (content.includes('avaliação')) topics.add('avaliações');
        if (content.includes('atividade')) topics.add('atividades');
        if (content.includes('metodologia')) topics.add('metodologias');
        if (content.includes('recurso')) topics.add('recursos educacionais');
        
        // Adicionar pontos-chave curtos
        if (msg.content.length > 100) {
          keyPoints.push(msg.content.substring(0, 80) + '...');
        }
      }
    });

    const topicsArray = Array.from(topics);
    const summary = [
      `Resumo da conversa anterior (${messages.length} mensagens):`,
      topicsArray.length > 0 ? `Tópicos discutidos: ${topicsArray.join(', ')}` : '',
      keyPoints.length > 0 ? `Principais questões: ${keyPoints.slice(0, 2).join('; ')}` : ''
    ].filter(Boolean).join('\n');

    return summary || 'Conversa anterior sobre temas educacionais.';
  }

  /**
   * Otimiza o contexto da conversa para reduzir tokens
   */
  optimizeContext(
    messages: ConversationMessage[],
    config: Partial<OptimizationConfig> = {}
  ): OptimizationResult {
    const finalConfig = { ...this.defaultConfig, ...config };
    const originalTokens = messages.reduce((sum, msg) => sum + this.estimateTokens(msg.content), 0);
    
    let optimizedMessages: ConversationMessage[] = [...messages];
    let strategy = 'Sem otimização necessária';

    // Estratégia 1: Limitar número de mensagens históricas
    if (optimizedMessages.length > finalConfig.maxHistoryMessages + 1) { // +1 para mensagem atual
      const messagesToKeep = finalConfig.maxHistoryMessages;
      const oldMessages = optimizedMessages.slice(0, -messagesToKeep - 1);
      const recentMessages = optimizedMessages.slice(-messagesToKeep - 1);
      
      // Criar resumo das mensagens antigas
      if (oldMessages.length > 0) {
        const summary = this.createSummary(oldMessages);
        const summaryMessage: ConversationMessage = {
          role: 'system',
          content: summary,
          timestamp: new Date()
        };
        
        optimizedMessages = [summaryMessage, ...recentMessages];
        strategy = `Resumo de ${oldMessages.length} mensagens antigas + ${messagesToKeep} recentes`;
      } else {
        optimizedMessages = recentMessages;
        strategy = `Mantidas apenas ${messagesToKeep} mensagens mais recentes`;
      }
    }

    // Estratégia 2: Truncar mensagens muito longas
    if (finalConfig.enableSmartTruncation) {
      optimizedMessages = optimizedMessages.map(msg => {
        if (msg.role !== 'system' && this.estimateTokens(msg.content) > finalConfig.maxTokensPerMessage) {
          return {
            ...msg,
            content: this.smartTruncate(msg.content, finalConfig.maxTokensPerMessage)
          };
        }
        return msg;
      });
      
      if (strategy === 'Sem otimização necessária') {
        strategy = 'Truncamento inteligente de mensagens longas';
      } else {
        strategy += ' + truncamento inteligente';
      }
    }

    // Estratégia 3: Priorizar mensagens recentes
    if (finalConfig.prioritizeRecentMessages && optimizedMessages.length > 4) {
      // Manter sempre as 2 últimas interações completas
      const lastMessages = optimizedMessages.slice(-4);
      const olderMessages = optimizedMessages.slice(0, -4);
      
      // Resumir mensagens mais antigas mais agressivamente
      const condensedOlder = olderMessages.map(msg => {
        if (msg.role !== 'system' && msg.content.length > 200) {
          return {
            ...msg,
            content: msg.content.substring(0, 150) + '...'
          };
        }
        return msg;
      });
      
      optimizedMessages = [...condensedOlder, ...lastMessages];
    }

    const optimizedTokens = optimizedMessages.reduce((sum, msg) => sum + this.estimateTokens(msg.content), 0);
    const savedTokens = originalTokens - optimizedTokens;
    const savedPercentage = originalTokens > 0 ? (savedTokens / originalTokens) * 100 : 0;

    return {
      originalTokens,
      optimizedTokens,
      savedTokens,
      savedPercentage,
      strategy,
      messages: optimizedMessages
    };
  }

  /**
   * Configurações predefinidas para diferentes cenários
   */
  getPresetConfig(preset: 'economy' | 'balanced' | 'quality'): OptimizationConfig {
    switch (preset) {
      case 'economy':
        return {
          maxHistoryMessages: 4,      // Apenas 2 pares de mensagens
          maxTokensPerMessage: 300,   // Mensagens bem curtas
          summarizeAfterMessages: 6,  // Resumir rapidamente
          enableSmartTruncation: true,
          prioritizeRecentMessages: true
        };
      
      case 'balanced':
        return this.defaultConfig;
      
      case 'quality':
        return {
          maxHistoryMessages: 10,     // Mais contexto
          maxTokensPerMessage: 800,   // Mensagens mais longas
          summarizeAfterMessages: 15, // Resumir menos frequentemente
          enableSmartTruncation: true,
          prioritizeRecentMessages: false
        };
      
      default:
        return this.defaultConfig;
    }
  }

  /**
   * Calcula economia estimada em custos
   */
  calculateCostSavings(result: OptimizationResult, model: string = 'gpt-4o-mini'): {
    originalCostUSD: number;
    optimizedCostUSD: number;
    savedCostUSD: number;
    savedCostBRL: number;
  } {
    // Preços do GPT-4o-mini por 1K tokens
    const inputCostPer1K = 0.00015;
    
    const originalCostUSD = (result.originalTokens / 1000) * inputCostPer1K;
    const optimizedCostUSD = (result.optimizedTokens / 1000) * inputCostPer1K;
    const savedCostUSD = originalCostUSD - optimizedCostUSD;
    const savedCostBRL = savedCostUSD * 5.50; // Taxa de câmbio aproximada
    
    return {
      originalCostUSD,
      optimizedCostUSD,
      savedCostUSD,
      savedCostBRL
    };
  }
}

export const contextOptimizer = ContextOptimizer.getInstance(); 