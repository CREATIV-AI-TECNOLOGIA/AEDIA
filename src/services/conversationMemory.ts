// Serviço de memória de conversas - funciona silenciosamente em background
export interface ConversationSummary {
  id: string;
  title: string;
  summary: string;
  topics: string[];
  keyPoints: string[];
  personalInfo: string[]; // Nova propriedade para informações pessoais
  date: Date;
  messageCount: number;
  lastMessage: string;
  relevanceScore?: number;
}

export interface MemorySearchResult {
  conversations: ConversationSummary[];
  relevantContext: string;
  foundTopics: string[];
}

export class ConversationMemoryService {
  private static instance: ConversationMemoryService;
  private readonly STORAGE_KEY = 'conversation_memory';
  private readonly MAX_SUMMARIES = 100; // Limite para não sobrecarregar localStorage

  // 🚀 CACHE DE CONTEXTO para economia de tokens
  private contextCache = new Map<string, {
    context: string;
    timestamp: number;
    conversations: ConversationSummary[];
  }>();
  private readonly CACHE_DURATION = 3600000; // 1 hora em millisegundos

  public static getInstance(): ConversationMemoryService {
    if (!ConversationMemoryService.instance) {
      ConversationMemoryService.instance = new ConversationMemoryService();
    }
    return ConversationMemoryService.instance;
  }

  /**
   * Gera hash simples de uma string para usar como chave de cache
   */
  private generateCacheKey(message: string): string {
    // Normalizar mensagem para cache
    const normalized = message
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ');
    
    // Hash simples
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
      const char = normalized.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Converter para 32 bits
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Verifica se o cache está válido
   */
  private isCacheValid(timestamp: number): boolean {
    return (Date.now() - timestamp) < this.CACHE_DURATION;
  }

  /**
   * Limpa entradas expiradas do cache
   */
  private cleanExpiredCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.contextCache.entries()) {
      if (!this.isCacheValid(entry.timestamp)) {
        this.contextCache.delete(key);
      }
    }
  }

  /**
   * Extrai informações pessoais do texto
   */
  private extractPersonalInfo(text: string): string[] {
    const personalInfo: string[] = [];
    
    // Buscar nomes (várias variações)
    const namePatterns = [
      /(?:me chamo|meu nome é|sou|eu sou)\s+([A-Z][a-z]+)/gi,
      /(?:nome|chamo)\s+([A-Z][a-z]+)/gi,
      /(?:qual é o meu nome|meu nome)/gi
    ];
    
    namePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        if (match[1]) {
          personalInfo.push(`nome: ${match[1]}`);
        }
      }
    });
    
    // Buscar outras informações pessoais
    const patterns = [
      { regex: /(?:trabalho|leciono|ensino)\s+([a-zA-ZÀ-ÿ\s]+)/gi, prefix: 'matéria' },
      { regex: /(?:escola|colégio)\s+([a-zA-ZÀ-ÿ\s]+)/gi, prefix: 'escola' },
      { regex: /(?:turma|série|ano)\s+([0-9º°]+)/gi, prefix: 'turma' },
      { regex: /(?:tenho|possuo)\s+([0-9]+)\s+(?:anos|ano)/gi, prefix: 'idade' }
    ];
    
    patterns.forEach(({ regex, prefix }) => {
      let match;
      while ((match = regex.exec(text)) !== null) {
        personalInfo.push(`${prefix}: ${match[1].trim()}`);
      }
    });
    
    return personalInfo;
  }

  /**
   * Extrai tópicos automaticamente do texto de forma UNIVERSAL
   * Captura QUALQUER conceito relevante, não apenas educacionais
   */
  private extractTopics(text: string): string[] {
    const textLower = text.toLowerCase();
    const extractedTopics: string[] = [];
    
    // 1. SUBSTANTIVOS DE 3+ LETRAS (captura tudo: açúcar, diabetes, pessoas, lugares, etc.)
    const words = textLower
      .replace(/[^\wáàâãéêíóôõúçñü\s]/g, ' ') // Manter acentos
      .split(/\s+/)
      .filter(word => word.length >= 3)
      .filter(word => !this.isStopWord(word));
    
    extractedTopics.push(...words);
    
    // 2. ENTIDADES NOMEADAS (nomes próprios, lugares, marcas)
    const namedEntities = text.match(/\b[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+(?:\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][a-záàâãéêíóôõúç]+)*/g) || [];
    extractedTopics.push(...namedEntities.map(entity => entity.toLowerCase()));
    
    // 3. NÚMEROS + UNIDADES (anos, valores, medidas)
    const numbersWithUnits = text.match(/\b\d+\s*(?:anos?|reais?|%|kg|mg|ml|litros?|metros?|cm|gramas?|°C|horas?|minutos?)\b/gi) || [];
    extractedTopics.push(...numbersWithUnits.map(num => num.toLowerCase()));
    
    // 4. EXPRESSÕES COMPOSTAS importantes (duas palavras)
    const compounds = text.match(/\b(?:plano de aula|sala de aula|ensino médio|educação física|meio ambiente|sistema nervoso|guerra mundial|açúcar refinado|diabetes tipo|vitamina [a-z]|covid-19)\b/gi) || [];
    extractedTopics.push(...compounds.map(comp => comp.toLowerCase()));
    
    // Remover duplicatas e retornar máximo 20 tópicos mais relevantes
    const uniqueTopics = [...new Set(extractedTopics)]
      .filter(topic => topic.length >= 3)
      .slice(0, 20);
    
    return uniqueTopics;
  }

  /**
   * Lista expandida de stop words (palavras que devem ser ignoradas)
   */
  private isStopWord(word: string): boolean {
    const stopWords = [
      // Artigos e preposições
      'que', 'para', 'com', 'por', 'sobre', 'como', 'mais', 'muito', 'bem', 'então',
      'quando', 'onde', 'porque', 'assim', 'também', 'ainda', 'sempre', 'depois',
      'antes', 'entre', 'sem', 'até', 'desde', 'contra', 'pela', 'pelo', 'numa',
      'nesta', 'neste', 'nessa', 'nesse', 'deste', 'desta', 'disso', 'isso', 'isto',
      
      // Verbos auxiliares comuns
      'ser', 'ter', 'estar', 'haver', 'fazer', 'dizer', 'dar', 'ver', 'saber',
      'poder', 'querer', 'vir', 'ficar', 'passar', 'pegar', 'colocar', 'usar',
      
      // Pronomes e advérbios
      'ela', 'ele', 'eles', 'elas', 'você', 'vocês', 'meu', 'minha', 'seu', 'sua',
      'nosso', 'nossa', 'deles', 'delas', 'aqui', 'aquilo', 'outro', 'outra',
      'cada', 'todo', 'toda', 'alguns', 'algumas', 'qualquer',
      
      // Conectivos
      'mas', 'porém', 'contudo', 'entretanto', 'todavia', 'embora', 'enquanto',
      'portanto', 'logo', 'então'
    ];
    
    return stopWords.includes(word);
  }

  /**
   * Extrai pontos-chave da conversa
   */
  private extractKeyPoints(messages: Array<{content: string, sender: string}>): string[] {
    const keyPoints: string[] = [];
    
    messages.forEach(msg => {
      if (msg.sender === 'assistant' && msg.content.length > 100) {
        // Procurar por listas, passos, recomendações
        const lines = msg.content.split('\n');
        lines.forEach(line => {
          const trimmed = line.trim();
          if (
            (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) ||
            (trimmed.match(/^\d+\./) || trimmed.includes('Exemplo:') || trimmed.includes('Dica:'))
          ) {
            if (trimmed.length > 20 && trimmed.length < 150) {
              keyPoints.push(trimmed.replace(/^[•\-*\d\.]\s*/, ''));
            }
          }
        });
      }
    });

    return keyPoints.slice(0, 8); // Máximo 8 pontos-chave
  }

  /**
   * Gera resumo automático da conversa
   */
  private generateSummary(messages: Array<{content: string, sender: string}>): string {
    const userMessages = messages.filter(msg => msg.sender === 'user');
    const assistantMessages = messages.filter(msg => msg.sender === 'assistant');

    if (userMessages.length === 0) return 'Conversa sem mensagens do usuário';

    // Pegar principais perguntas do usuário
    const mainQuestions = userMessages
      .map(msg => msg.content.substring(0, 100))
      .slice(0, 3)
      .join('; ');

    // Pegar temas das respostas da IA
    const topics = this.extractTopics(assistantMessages.map(msg => msg.content).join(' '));
    const topicsText = topics.length > 0 ? ` Tópicos abordados: ${topics.slice(0, 5).join(', ')}.` : '';

    return `Conversa sobre: ${mainQuestions}.${topicsText}`;
  }

  /**
   * Salva resumo da conversa automaticamente
   */
  async saveConversationSummary(
    conversationId: string,
    title: string,
    messages: Array<{content: string, sender: string}>
  ): Promise<void> {
    try {
      if (messages.length < 2) return; // Não salvar conversas muito curtas

      const allText = messages.map(msg => msg.content).join(' ');
      
      const summary: ConversationSummary = {
        id: conversationId,
        title,
        summary: this.generateSummary(messages),
        topics: this.extractTopics(allText),
        keyPoints: this.extractKeyPoints(messages),
        personalInfo: this.extractPersonalInfo(allText),
        date: new Date(),
        messageCount: messages.length,
        lastMessage: messages[messages.length - 1]?.content.substring(0, 200) || ''
      };

      const existingSummaries = this.getAllSummaries();
      
      // Remover resumo antigo se existir
      const filteredSummaries = existingSummaries.filter(s => s.id !== conversationId);
      
      // Adicionar novo resumo
      filteredSummaries.push(summary);
      
      // Manter apenas os mais recentes
      const sortedSummaries = filteredSummaries
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, this.MAX_SUMMARIES);

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(sortedSummaries));
      
      console.log(`💾 Resumo salvo automaticamente: "${title}" (${messages.length} mensagens, ${summary.topics.length} tópicos)`);
    } catch (error) {
      console.error('❌ Erro ao salvar resumo da conversa:', error);
    }
  }

  /**
   * Busca conversas relevantes baseado na mensagem atual
   * VERSÃO MELHORADA: busca universal e fuzzy matching + cache
   */
  searchRelevantConversations(currentMessage: string, limit: number = 3): MemorySearchResult {
    try {
      // 🚀 VERIFICAR CACHE PRIMEIRO (economia massiva de tokens)
      this.cleanExpiredCache(); // Limpar cache expirado
      const cacheKey = this.generateCacheKey(currentMessage);
      const cached = this.contextCache.get(cacheKey);
      
      if (cached && this.isCacheValid(cached.timestamp)) {
        console.log('⚡ Contexto recuperado do cache (0 tokens processados):', {
          cacheKey,
          conversationsCount: cached.conversations.length,
          contextLength: cached.context.length
        });
        
        return {
          conversations: cached.conversations,
          relevantContext: cached.context,
          foundTopics: [...new Set(cached.conversations.flatMap(conv => conv.topics))]
        };
      }

      const summaries = this.getAllSummaries();
      if (summaries.length === 0) {
        return { conversations: [], relevantContext: '', foundTopics: [] };
      }

      const messageLower = currentMessage.toLowerCase();
      const messageTopics = this.extractTopics(currentMessage);

      console.log(`🔍 Buscando por: "${currentMessage.substring(0, 50)}..."`, {
        messageTopics: messageTopics.slice(0, 5),
        totalConversations: summaries.length
      });

      // Calcular relevância para cada conversa
      const scoredConversations = summaries.map(summary => {
        let score = 0;

        // 1. PONTUAÇÃO POR TÓPICOS EM COMUM (melhorada)
        const commonTopics = summary.topics.filter(topic => 
          messageTopics.some(msgTopic => 
            this.fuzzyMatch(topic, msgTopic, 0.8) || // 80% similaridade
            topic.includes(msgTopic) || 
            msgTopic.includes(topic)
          )
        );
        score += commonTopics.length * 15; // Aumentei a pontuação

        // 2. BUSCA FUZZY NO RESUMO (NOVA)
        const fuzzyScore = this.calculateFuzzyRelevance(messageLower, summary.summary.toLowerCase());
        score += fuzzyScore;

        // 3. PONTUAÇÃO POR PALAVRAS-CHAVE NO RESUMO (melhorada)
        const summaryWords = summary.summary.toLowerCase().split(/\W+/);
        const messageWords = messageLower.split(/\W+/).filter(word => word.length >= 3);
        const commonWords = summaryWords.filter(word => messageWords.includes(word));
        score += commonWords.length * 3; // Mais peso

        // 4. BUSCA NO TÍTULO (melhorada)
        if (this.fuzzyMatch(summary.title.toLowerCase(), messageLower, 0.6)) {
          score += 20; // Mais peso para títulos
        }

        // 5. INFORMAÇÕES PESSOAIS (prioridade alta)
        if (summary.personalInfo && summary.personalInfo.length > 0) {
          score += 25;
        }

        // 6. RECÊNCIA (conversas mais recentes têm prioridade)
        const daysSince = (Date.now() - new Date(summary.date).getTime()) / (1000 * 60 * 60 * 24);
        score += Math.max(0, 15 - daysSince); // Mais peso para recência

        // 7. BUSCA APROXIMADA EM CONTEÚDO ESPECÍFICO (NOVA)
        if (summary.keyPoints.some(point => 
          this.fuzzyMatch(point.toLowerCase(), messageLower, 0.7)
        )) {
          score += 10;
        }

        return { ...summary, relevanceScore: score };
      });

      // REDUZIR FILTRO: de score > 5 para score > 2 (mais inclusivo)
      const relevantConversations = scoredConversations
        .filter(conv => conv.relevanceScore! > 2) // Muito mais inclusivo
        .sort((a, b) => b.relevanceScore! - a.relevanceScore!)
        .slice(0, limit);

      // Gerar contexto relevante
      const relevantContext = this.generateRelevantContext(relevantConversations);
      
      // Coletar tópicos encontrados
      const foundTopics = [...new Set(relevantConversations.flatMap(conv => conv.topics))];

      console.log(`📋 Resultado da busca:`, {
        conversationsFound: relevantConversations.length,
        topScores: relevantConversations.map(c => ({ title: c.title, score: c.relevanceScore })).slice(0, 3),
        foundTopics: foundTopics.slice(0, 5)
      });

      if (relevantConversations.length > 0) {
        console.log(`✅ Encontradas ${relevantConversations.length} conversas relevantes para: "${currentMessage.substring(0, 50)}..."`);
      } else {
        console.log(`❌ Nenhuma conversa relevante encontrada para: "${currentMessage.substring(0, 50)}..."`);
      }

      // 🚀 SALVAR NO CACHE para próximas consultas similares
      if (relevantConversations.length > 0) {
        this.contextCache.set(cacheKey, {
          context: relevantContext,
          timestamp: Date.now(),
          conversations: relevantConversations
        });
        console.log(`💾 Contexto salvo no cache:`, { cacheKey, contextsInCache: this.contextCache.size });
      }

      return {
        conversations: relevantConversations,
        relevantContext,
        foundTopics
      };
    } catch (error) {
      console.error('❌ Erro na busca de conversas:', error);
      return { conversations: [], relevantContext: '', foundTopics: [] };
    }
  }

  /**
   * Calcula relevância fuzzy entre duas strings
   */
  private calculateFuzzyRelevance(message: string, summary: string): number {
    const messageWords = message.split(/\W+/).filter(w => w.length >= 3);
    let totalScore = 0;
    
    for (const word of messageWords) {
      if (summary.includes(word)) {
        totalScore += 5; // Palavra exata
      } else {
        // Busca por palavras similares
        const summaryWords = summary.split(/\W+/);
        for (const sumWord of summaryWords) {
          if (this.fuzzyMatch(word, sumWord, 0.8)) {
            totalScore += 3; // Palavra similar
          }
        }
      }
    }
    
    return totalScore;
  }

  /**
   * Fuzzy matching entre duas strings
   */
  private fuzzyMatch(str1: string, str2: string, threshold: number): boolean {
    if (str1.length < 3 || str2.length < 3) return false;
    
    // Remover acentos para comparação
    const normalize = (s: string) => s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    
    const s1 = normalize(str1);
    const s2 = normalize(str2);
    
    // Se uma string está contida na outra
    if (s1.includes(s2) || s2.includes(s1)) {
      return true;
    }
    
    // Calcular similaridade por caracteres em comum
    let matches = 0;
    let lastIndex = 0;
    
    for (const char of s1) {
      const index = s2.indexOf(char, lastIndex);
      if (index !== -1) {
        matches++;
        lastIndex = index + 1;
      }
    }
    
    const similarity = matches / Math.max(s1.length, s2.length);
    return similarity >= threshold;
  }

  /**
   * Gera contexto relevante para incluir na conversa atual
   */
  private generateRelevantContext(conversations: ConversationSummary[]): string {
    if (conversations.length === 0) return '';

    const contextParts: string[] = [];
    const allPersonalInfo: string[] = [];

    // Coletar todas as informações pessoais
    conversations.forEach(conv => {
      if (conv.personalInfo && conv.personalInfo.length > 0) {
        allPersonalInfo.push(...conv.personalInfo);
      }
    });

    // Adicionar informações pessoais no início se existirem
    if (allPersonalInfo.length > 0) {
      const uniquePersonalInfo = [...new Set(allPersonalInfo)];
      contextParts.push(`INFORMAÇÕES PESSOAIS DO USUÁRIO: ${uniquePersonalInfo.join(', ')}`);
    }

    conversations.forEach((conv, index) => {
      const daysSince = Math.floor((Date.now() - new Date(conv.date).getTime()) / (1000 * 60 * 60 * 24));
      const timeRef = daysSince === 0 ? 'hoje' : daysSince === 1 ? 'ontem' : `${daysSince} dias atrás`;
      
      let contextPart = `Conversa ${timeRef}: ${conv.summary}`;
      
      if (conv.keyPoints.length > 0) {
        contextPart += ` Pontos principais: ${conv.keyPoints.slice(0, 2).join('; ')}.`;
      }

      contextParts.push(contextPart);
    });

    return `Contexto de conversas anteriores relevantes:\n${contextParts.join('\n')}\n`;
  }

  /**
   * Obtém todos os resumos salvos
   */
  private getAllSummaries(): ConversationSummary[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const summaries = JSON.parse(stored);
      return summaries.map((s: any) => ({
        ...s,
        date: new Date(s.date)
      }));
    } catch (error) {
      console.error('❌ Erro ao carregar resumos:', error);
      return [];
    }
  }

  /**
   * Limpa resumos antigos (manutenção automática)
   */
  cleanOldSummaries(daysToKeep: number = 90): void {
    try {
      const summaries = this.getAllSummaries();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const recentSummaries = summaries.filter(summary => 
        new Date(summary.date) > cutoffDate
      );

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(recentSummaries));
      
      const removedCount = summaries.length - recentSummaries.length;
      if (removedCount > 0) {
        console.log(`🧹 Limpeza automática: ${removedCount} resumos antigos removidos`);
      }
    } catch (error) {
      console.error('❌ Erro na limpeza de resumos:', error);
    }
  }

  /**
   * Obtém estatísticas da memória EXPANDIDAS
   */
  getMemoryStats(): {
    totalConversations: number;
    totalTopics: number;
    oldestConversation: Date | null;
    newestConversation: Date | null;
    cacheStats: {
      entriesInCache: number;
      cacheHitRatio: string;
      oldestCacheEntry: Date | null;
    };
  } {
    const summaries = this.getAllSummaries();
    const allTopics = [...new Set(summaries.flatMap(s => s.topics))];
    
    // Estatísticas do cache
    const cacheEntries = Array.from(this.contextCache.values());
    const oldestCacheEntry = cacheEntries.length > 0 ? 
      new Date(Math.min(...cacheEntries.map(e => e.timestamp))) : null;
    
    return {
      totalConversations: summaries.length,
      totalTopics: allTopics.length,
      oldestConversation: summaries.length > 0 ? 
        new Date(Math.min(...summaries.map(s => new Date(s.date).getTime()))) : null,
      newestConversation: summaries.length > 0 ? 
        new Date(Math.max(...summaries.map(s => new Date(s.date).getTime()))) : null,
      cacheStats: {
        entriesInCache: this.contextCache.size,
        cacheHitRatio: this.contextCache.size > 0 ? 'Cache ativo' : 'Cache vazio',
        oldestCacheEntry
      }
    };
  }

  /**
   * Obtém estatísticas de economia de tokens (para administradores)
   */
  getCacheEfficiencyStats(): {
    totalCacheEntries: number;
    estimatedTokensSaved: number;
    cacheHitRatio: number;
    averageContextLength: number;
  } {
    const cacheEntries = Array.from(this.contextCache.values());
    const totalTokensSaved = cacheEntries.reduce((sum, entry) => {
      // Estimar tokens economizados (4 chars ≈ 1 token)
      return sum + Math.ceil(entry.context.length / 4);
    }, 0);
    
    const averageContextLength = cacheEntries.length > 0 ?
      cacheEntries.reduce((sum, entry) => sum + entry.context.length, 0) / cacheEntries.length : 0;
    
    return {
      totalCacheEntries: this.contextCache.size,
      estimatedTokensSaved: totalTokensSaved,
      cacheHitRatio: 0, // Será implementado com contadores
      averageContextLength: Math.round(averageContextLength)
    };
  }

  /**
   * 🚀 MIGRAÇÃO: Atualiza conversas antigas com novo sistema de tópicos
   * Chame esta função para reprocessar conversas com o sistema universal
   */
  migrateOldConversations(): void {
    try {
      const summaries = this.getAllSummaries();
      console.log(`🔄 Migrando ${summaries.length} conversas para novo sistema de tópicos...`);
      
      let migrationCount = 0;
      
      const updatedSummaries = summaries.map(summary => {
        // Verificar se a conversa precisa de migração
        const hasOldTopics = summary.topics.some(topic => 
          ['plano de aula', 'metodologia ativa', 'matemática', 'português'].includes(topic)
        );
        
        if (hasOldTopics || summary.topics.length < 5) {
          // Reprocessar com novo sistema
          const allText = `${summary.title} ${summary.summary} ${summary.lastMessage}`;
          const newTopics = this.extractTopics(allText);
          
          migrationCount++;
          console.log(`📝 Migrando conversa: "${summary.title}" | Tópicos antigos: ${summary.topics.length} | Novos: ${newTopics.length}`);
          
          return {
            ...summary,
            topics: newTopics
          };
        }
        
        return summary;
      });
      
      // Salvar conversas atualizadas
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedSummaries));
      
      // Limpar cache para forçar reprocessamento
      this.contextCache.clear();
      
      console.log(`✅ Migração concluída: ${migrationCount} conversas atualizadas`);
      console.log(`📊 Estatísticas após migração:`, {
        totalConversations: updatedSummaries.length,
        totalTopics: [...new Set(updatedSummaries.flatMap(s => s.topics))].length,
        averageTopicsPerConversation: Math.round(updatedSummaries.reduce((sum, s) => sum + s.topics.length, 0) / updatedSummaries.length)
      });
      
    } catch (error) {
      console.error('❌ Erro durante migração:', error);
    }
  }

  /**
   * 🗑️ RESET: Limpa completamente a memória (para debug)
   */
  resetMemory(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.contextCache.clear();
    console.log('🗑️ Memória completamente resetada');
  }

  /**
   * 🔍 DEBUG: Analisa uma mensagem específica
   */
  debugMessageAnalysis(message: string): {
    extractedTopics: string[];
    cacheKey: string;
    searchWillFind: any[];
  } {
    console.log(`🔍 DEBUG: Analisando mensagem "${message}"`);
    
    const topics = this.extractTopics(message);
    const cacheKey = this.generateCacheKey(message);
    const summaries = this.getAllSummaries();
    
    // Simular busca
    const messageLower = message.toLowerCase();
    const relevantSummaries = summaries.filter(summary => {
      return summary.topics.some(topic => 
        topics.some(msgTopic => 
          this.fuzzyMatch(topic, msgTopic, 0.8) || 
          topic.includes(msgTopic) || 
          msgTopic.includes(topic)
        )
      );
    });
    
    console.log(`📊 DEBUG Resultado:`, {
      extractedTopics: topics,
      cacheKey,
      totalConversations: summaries.length,
      potentialMatches: relevantSummaries.length,
      matchingConversations: relevantSummaries.map(s => ({ title: s.title, topics: s.topics }))
    });
    
    return {
      extractedTopics: topics,
      cacheKey,
      searchWillFind: relevantSummaries
    };
  }
}

export const conversationMemory = ConversationMemoryService.getInstance();

// 🚀 Funções para debug e migração (disponíveis no console)
(window as any).debugMemory = {
  migrate: () => conversationMemory.migrateOldConversations(),
  reset: () => conversationMemory.resetMemory(),
  debug: (message: string) => conversationMemory.debugMessageAnalysis(message),
  stats: () => conversationMemory.getMemoryStats(),
  cache: () => conversationMemory.getCacheEfficiencyStats()
};

console.log('🔧 Funções de debug disponíveis:', {
  'debugMemory.migrate()': 'Migra conversas antigas para novo sistema',
  'debugMemory.reset()': 'Reseta completamente a memória',
  'debugMemory.debug("açúcar")': 'Analisa como uma mensagem seria processada',
  'debugMemory.stats()': 'Estatísticas da memória',
  'debugMemory.cache()': 'Estatísticas do cache'
}); 