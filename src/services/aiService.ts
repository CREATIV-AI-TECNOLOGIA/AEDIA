import { aiPersonaService } from './aiPersonaService';
import { tokenService, TokenUsage } from './tokenService';
import { contextOptimizer, ConversationMessage } from './contextOptimizer';
import { conversationMemory } from './conversationMemory';
import { performWebSearchIfNeeded, WebSearchInfo as TavilyWebSearchInfo } from './tavilyIntegration';
import { openaiService } from './openaiService';

interface WebSearchInfo {
  used: boolean;
  sources: string[];
  error?: string;
}

const applyWebSearchToPrompt = async (systemPrompt: string, message: string) => {
  return {
    enhancedPrompt: systemPrompt,
    webSearchInfo: {
      used: false,
      sources: [],
      error: 'Tavily está desabilitado'
    } as WebSearchInfo
  };
};

export type AIProvider = 'openai';

export interface AIServiceConfig {
  provider: AIProvider;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  optimizationMode?: 'economy' | 'balanced' | 'quality';
  enableOptimization?: boolean;
  webSearchEnabled?: boolean;
}

export interface AIResponse {
  content: string;
  provider: AIProvider;
  model: string;
  persona?: string;
  usage?: TokenUsage;
  optimization?: {
    enabled: boolean;
    originalTokens: number;
    optimizedTokens: number;
    savedTokens: number;
    savedPercentage: number;
    strategy: string;
  };
  webSearch?: {
    used: boolean;
    sources: string[];
    error?: string;
  };
}

// Nova interface para streaming
export interface AIStreamResponse {
  stream: ReadableStream<string>;
  model: string;
  persona: string;
  optimization?: any;
  webSearch?: TavilyWebSearchInfo;
}

export class AIService {
  private static instance: AIService;

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  private getProvider(provider: 'openai' | 'google' = 'openai') {
    if (provider === 'openai') {
      return openaiService;
    }
    // Adicionar outros provedores aqui no futuro
    throw new Error(`Provedor de IA não suportado: ${provider}`);
  }

  async generateResponse(
    message: string,
    professorId: string,
    config: AIServiceConfig = { provider: 'openai' }
  ): Promise<AIResponse> {
    console.log(`🤖 Gerando resposta personalizada com ChatGPT 4o mini...`);
    
    // Usar o sistema de personas para construir prompts personalizados
    const { systemPrompt, userPrompt, context } = await aiPersonaService.buildPersonalizedPrompt(professorId, message);
    
    const response = await this.callOpenAIAPI(systemPrompt, userPrompt, config);
    
    // Gerar insights baseados na interação
    if (context.persona) {
      await aiPersonaService.generateInsight(professorId, context.persona.id, {
        message,
        response: response.content,
        timestamp: new Date()
      });
    }
    
    return {
      ...response,
      persona: context.persona?.name
    };
  }

  async generateResponseWithContext(
    message: string,
    professorId: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
    config: AIServiceConfig = { provider: 'openai', enableOptimization: true, optimizationMode: 'balanced' },
    conversationId?: string
  ): Promise<AIResponse> {
    console.log(`🤖 Gerando resposta com contexto da conversa...`);
    
    // Buscar contexto relevante de conversas anteriores
    const memorySearch = conversationMemory.searchRelevantConversations(message);
    let enhancedSystemPrompt = '';
    
    // Usar o sistema de personas para construir prompts personalizados
    const { systemPrompt, context } = await aiPersonaService.buildPersonalizedPrompt(professorId, message);
    
    console.log('🎭 System prompt da persona:', {
      hasPersona: !!context.persona,
      personaName: context.persona?.name,
      promptLength: systemPrompt.length,
      promptPreview: systemPrompt.substring(0, 300) + '...'
    });
    
    // Adicionar contexto de memória se encontrado
    if (memorySearch.relevantContext) {
      enhancedSystemPrompt = systemPrompt + '\n\n' + memorySearch.relevantContext;
      console.log(`🧠 Contexto de memória adicionado: ${memorySearch.conversations.length} conversas relevantes encontradas`);
    } else {
      enhancedSystemPrompt = systemPrompt;
    }

    // 🌐 INTEGRAÇÃO DE BUSCA WEB (apenas se habilitada)
    let webSearchInfo: WebSearchInfo | undefined;
    if (config.webSearchEnabled === true) { // Só ativa se explicitamente true
      try {
        const webSearchEnhancement = await applyWebSearchToPrompt(enhancedSystemPrompt, message);
        enhancedSystemPrompt = webSearchEnhancement.enhancedPrompt;
        webSearchInfo = webSearchEnhancement.webSearchInfo;
        
        if (webSearchInfo?.used) {
          console.log('🌐 Busca web integrada ao prompt:', {
            sourcesCount: webSearchInfo.sources.length,
            hasError: !!webSearchInfo.error
          });
        }
      } catch (webError) {
        console.error('⚠️ Erro na busca web (continuando sem busca):', webError);
        webSearchInfo = {
          sources: [],
          used: false,
          error: webError instanceof Error ? webError.message : 'Erro na busca web'
        };
      }
    } else {
      console.log('🌐 Busca web desabilitada pelo usuário');
      webSearchInfo = {
        sources: [],
        used: false
      };
    }
    
    let optimizationResult = null;
    let finalConversationHistory = conversationHistory;

    // Aplicar otimização de contexto se habilitada
    if (config.enableOptimization) {
      const messages: ConversationMessage[] = [
        { role: 'system', content: enhancedSystemPrompt },
        ...conversationHistory.map(msg => ({ role: msg.role, content: msg.content })),
        { role: 'user', content: message }
      ];

      const optimizationConfig = contextOptimizer.getPresetConfig(config.optimizationMode || 'balanced');
      optimizationResult = contextOptimizer.optimizeContext(messages, optimizationConfig);
      
      // Extrair histórico otimizado (excluindo system prompt e mensagem atual)
      const optimizedMessages = optimizationResult.messages;
      finalConversationHistory = optimizedMessages
        .slice(1, -1) // Remove system prompt (primeiro) e mensagem atual (último)
        .map(msg => ({ role: msg.role as 'user' | 'assistant', content: msg.content }));

      console.log(`💡 Otimização aplicada:`, {
        strategy: optimizationResult.strategy,
        originalTokens: optimizationResult.originalTokens,
        optimizedTokens: optimizationResult.optimizedTokens,
        savedTokens: optimizationResult.savedTokens,
        savedPercentage: optimizationResult.savedPercentage.toFixed(1) + '%'
      });
    }
    
    const response = await this.callOpenAIAPIWithContext(enhancedSystemPrompt, message, finalConversationHistory, config);
    
    // Gerar insights baseados na interação
    if (context.persona) {
      await aiPersonaService.generateInsight(professorId, context.persona.id, {
        message,
        response: response.content,
        timestamp: new Date()
      });
    }
    
    return {
      ...response,
      persona: context.persona?.name,
      optimization: optimizationResult ? {
        enabled: true,
        originalTokens: optimizationResult.originalTokens,
        optimizedTokens: optimizationResult.optimizedTokens,
        savedTokens: optimizationResult.savedTokens,
        savedPercentage: optimizationResult.savedPercentage,
        strategy: optimizationResult.strategy
      } : { enabled: false, originalTokens: 0, optimizedTokens: 0, savedTokens: 0, savedPercentage: 0, strategy: 'Desabilitada' },
      webSearch: webSearchInfo ? {
        used: webSearchInfo.used,
        sources: webSearchInfo.sources,
        error: webSearchInfo.error
      } : { used: false, sources: [] }
    };
  }

  async generateResponseWithContextStream(
    message: string,
    professorId: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
    config: AIServiceConfig,
    conversationId?: string
  ): Promise<AIStreamResponse> {
    
    console.log('🚀 Iniciando geração de resposta com stream. Web search:', config.webSearchEnabled);
    
    // Etapa 1: Busca na web (se habilitada)
    // A busca na web enriquece a MENSAGEM DO USUÁRIO que será enviada para a IA.
    const { finalPrompt: userPromptForLLM, searchInfo } = await performWebSearchIfNeeded(message, config.webSearchEnabled);
    if (config.webSearchEnabled && searchInfo.used) {
      console.log('🌐 Prompt do usuário foi enriquecido com busca web.');
    }

    // Etapa 2: Construir o PROMPT DE SISTEMA
    // Ele contém a persona e, opcionalmente, o contexto de memória de conversas passadas.
    // Importante: Usamos a mensagem ORIGINAL do usuário para essas buscas, não a enriquecida.
    const { systemPrompt: personaPrompt, context } = await aiPersonaService.buildPersonalizedPrompt(professorId, message);
    
    let memoryContext = '';
    // A busca na memória de conversas só ocorre se a busca na web NÃO for usada.
    // Esta é a correção crucial para evitar que o prompt enriquecido pela web
    // seja usado na busca de memória, o que causava o erro.
    if (!config.webSearchEnabled) {
        console.log('🧠 Buscando contexto em conversas anteriores...');
        const memorySearchResult = conversationMemory.searchRelevantConversations(message);
        memoryContext = memorySearchResult.relevantContext;
        if (memoryContext) {
          console.log('🧠 Contexto de memória encontrado e adicionado ao prompt do sistema.');
        }
    } else {
      console.log('🧠 Busca na memória de conversas pulada (estratégia para evitar conflito com busca web).');
    }
    
    const finalSystemPrompt = `${personaPrompt}\\n\\n${memoryContext}`.trim();

    // Etapa 3: Chamar o provedor de IA para gerar a resposta em stream
    const provider = this.getProvider(config.provider);

    console.log('📤 Enviando para o provedor de IA para streaming...');
    const streamResponse = await provider.generateStream(
      finalSystemPrompt,
      userPromptForLLM, // Este é o prompt original ou o enriquecido pela web.
      conversationHistory,
      config
    );
    
    return { 
      ...streamResponse,
      persona: context.persona?.name || 'Assistente Padrão',
      webSearch: searchInfo
    };
  }

  async generatePlanoAula(
    tema: string,
    disciplina: string,
    duracao: string,
    professorId: string,
    config: AIServiceConfig = { provider: 'openai' }
  ): Promise<AIResponse> {
    console.log(`📚 Gerando plano de aula personalizado...`);
    
    const { systemPrompt, context } = await aiPersonaService.buildPersonalizedPrompt(professorId, '');
    
    const userPrompt = `Crie um plano de aula detalhado com as seguintes especificações:
- Tema: ${tema}
- Disciplina: ${disciplina}
- Duração: ${duracao}

O plano deve incluir:
1. Objetivos de aprendizagem
2. Conteúdo programático
3. Metodologia
4. Recursos necessários
5. Avaliação
6. Atividades práticas

Considere o contexto educacional específico do professor e adapte o conteúdo ao nível dos alunos.`;

    const response = await this.callOpenAIAPI(systemPrompt, userPrompt, config);
    
    return {
      ...response,
      persona: context.persona?.name
    };
  }

  async generateAvaliacao(
    tema: string,
    disciplina: string,
    tipo: string,
    professorId: string,
    config: AIServiceConfig = { provider: 'openai' }
  ): Promise<AIResponse> {
    console.log(`📝 Gerando avaliação personalizada...`);
    
    const { systemPrompt, context } = await aiPersonaService.buildPersonalizedPrompt(professorId, '');
    
    const userPrompt = `Crie uma avaliação educacional com as seguintes especificações:
- Tema: ${tema}
- Disciplina: ${disciplina}
- Tipo: ${tipo}

A avaliação deve incluir:
1. Questões variadas (múltipla escolha, dissertativas, práticas)
2. Critérios de correção
3. Rubrica de avaliação
4. Tempo estimado
5. Recursos necessários

Adapte o nível de dificuldade ao contexto educacional do professor e seus alunos.`;

    const response = await this.callOpenAIAPI(systemPrompt, userPrompt, config);
    
    return {
      ...response,
      persona: context.persona?.name
    };
  }

  /**
   * Adiciona pontuação inteligente a uma transcrição de voz
   */
  async addPunctuationToTranscript(transcript: string): Promise<string> {
    console.log('✨ Adicionando pontuação automática à transcrição...');
    
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ Chave OpenAI não encontrada, retornando transcrição original');
      return transcript;
    }

    const systemPrompt = `Você é um especialista em pontuação para textos educacionais em português brasileiro.

TAREFA: Adicione pontuação correta ao texto transcrito abaixo, mantendo EXATAMENTE as mesmas palavras.

REGRAS:
- NÃO altere, adicione ou remova palavras
- NÃO corrija erros de transcrição
- Adicione apenas: vírgulas, pontos, pontos de interrogação, pontos de exclamação
- Mantenha o texto natural e fluido
- Use pontuação apropriada para contexto educacional

Responda APENAS com o texto pontuado, sem explicações.`;

    const userPrompt = `Texto para pontuar: "${transcript}"`;

    try {
      const requestBody = {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system' as const, content: systemPrompt },
          { role: 'user' as const, content: userPrompt }
        ],
        max_tokens: 200,
        temperature: 0.3
      };

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        console.warn('⚠️ Erro na API de pontuação, retornando texto original');
        return transcript;
      }

      const data = await response.json();
      let punctuatedText = data.choices?.[0]?.message?.content?.trim();

      if (punctuatedText) {
        // Remover aspas no início e fim se existirem
        if (punctuatedText.startsWith('"') && punctuatedText.endsWith('"')) {
          punctuatedText = punctuatedText.slice(1, -1);
        }
        if (punctuatedText.startsWith("'") && punctuatedText.endsWith("'")) {
          punctuatedText = punctuatedText.slice(1, -1);
        }
        
        console.log('✅ Pontuação adicionada:', {
          original: transcript,
          punctuated: punctuatedText,
          cost: 'R$ 0.000068'
        });
        return punctuatedText;
      }

      return transcript;
    } catch (error) {
      console.warn('⚠️ Erro ao adicionar pontuação:', error);
      return transcript;
    }
  }

  private async callOpenAIAPI(
    systemPrompt: string,
    userPrompt: string,
    config: AIServiceConfig
  ): Promise<Omit<AIResponse, 'persona'>> {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    // Debug da chave da API
    console.log('🔑 [DEBUG] Verificando chave da API:', {
      keyExists: !!apiKey,
      keyLength: apiKey?.length || 0,
      keyPrefix: apiKey?.substring(0, 7) || 'N/A',
      keySuffix: apiKey?.substring(-4) || 'N/A',
      allEnvVars: Object.keys(import.meta.env)
    });
    
    if (!apiKey) {
      console.error('❌ [DEBUG] Chave da API não encontrada. Variáveis disponíveis:', import.meta.env);
      throw new Error('Chave da API OpenAI não configurada. Adicione VITE_OPENAI_API_KEY no arquivo .env');
    }

    if (!apiKey.startsWith('sk-')) {
      console.error('❌ [DEBUG] Formato da chave inválido. Deve começar com "sk-". Prefixo atual:', apiKey.substring(0, 10));
      throw new Error('Chave da API OpenAI com formato inválido. Deve começar com "sk-"');
    }

    // Verificação específica para chaves sk-proj
    if (apiKey.startsWith('sk-proj-')) {
      console.log('🔑 [DEBUG] Detectada chave de projeto (sk-proj). Verificando validade...');
      
      // As chaves sk-proj podem ter problemas específicos
      if (apiKey.length < 100) {
        console.warn('⚠️ [DEBUG] Chave sk-proj parece muito curta. Tamanho esperado: >100, atual:', apiKey.length);
      }
    }

    const requestBody = {
      model: config.model || 'gpt-4o-mini',
      messages: [
        { role: 'system' as const, content: systemPrompt },
        { role: 'user' as const, content: userPrompt }
      ],
      max_tokens: config.maxTokens || 500,
      temperature: config.temperature || 0.7
    };

    console.log(`📤 Enviando para OpenAI: {model: ${requestBody.model}, messagesCount: ${requestBody.messages.length}, maxTokens: ${requestBody.max_tokens}, temperature: ${requestBody.temperature}}`);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log(`📥 Resposta da OpenAI: status ${response.status} (${response.statusText})`);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Erro da API OpenAI:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });

        // Tratamento específico para diferentes tipos de erro 401
        if (response.status === 401) {
          if (errorData.includes('invalid_api_key') || errorData.includes('Incorrect API key')) {
            throw new Error('Chave da API OpenAI inválida ou revogada. Verifique se:\n1. A chave não foi exposta publicamente (se sim, ela foi automaticamente revogada)\n2. A chave ainda existe no seu dashboard OpenAI\n3. Você tem créditos suficientes na conta');
          } else {
            throw new Error('Erro de autenticação OpenAI. Verifique sua configuração.');
          }
        }

        if (response.status === 403) {
          throw new Error('Acesso negado. Verifique se o modelo tem acesso liberado no seu projeto OpenAI.');
        }

        if (response.status === 429) {
          throw new Error('Limite de taxa excedido. Aguarde alguns momentos antes de tentar novamente.');
        }

        throw new Error(`Erro da API OpenAI: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('Resposta inválida da API OpenAI: nenhuma escolha retornada');
      }

      const content = data.choices[0].message?.content;
      if (!content) {
        throw new Error('Resposta inválida da API OpenAI: conteúdo vazio');
      }

      console.log(`✅ Resposta gerada com sucesso: ${content.length} caracteres`);

             return {
         content,
         provider: 'openai' as AIProvider,
         model: requestBody.model,
         usage: {
           prompt_tokens: data.usage?.prompt_tokens || 0,
           completion_tokens: data.usage?.completion_tokens || 0,
           total_tokens: data.usage?.total_tokens || 0,
           estimated_cost: 0,
           model: requestBody.model,
           timestamp: new Date()
         }
       };

    } catch (error) {
      console.error('❌ Erro ao chamar API OpenAI:', error);
      
      if (error instanceof Error) {
        throw error;
      }
      
      throw new Error('Erro desconhecido ao chamar API OpenAI');
    }
  }

  private async callOpenAIAPIWithContext(
    systemPrompt: string,
    currentMessage: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
    config: AIServiceConfig
  ): Promise<Omit<AIResponse, 'persona'>> {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    // Debug da chave da API
    console.log('🔑 [DEBUG Context] Verificando chave da API:', {
      keyExists: !!apiKey,
      keyLength: apiKey?.length || 0,
      keyPrefix: apiKey?.substring(0, 7) || 'N/A'
    });
    
    if (!apiKey) {
      console.error('❌ [DEBUG Context] Chave da API não encontrada. Variáveis disponíveis:', import.meta.env);
      throw new Error('Chave da API OpenAI não configurada. Adicione VITE_OPENAI_API_KEY no arquivo .env');
    }

    if (!apiKey.startsWith('sk-')) {
      console.error('❌ [DEBUG Context] Formato da chave inválido. Deve começar com "sk-"');
      throw new Error('Formato da chave da API OpenAI inválido. A chave deve começar com "sk-"');
    }

    // Construir mensagens com histórico da conversa
    const messages = [
      {
        role: 'system' as const,
        content: systemPrompt
      },
      // Adicionar histórico da conversa
      ...conversationHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      // Adicionar mensagem atual
      {
        role: 'user' as const,
        content: currentMessage
      }
    ];

    console.log('📤 Enviando para OpenAI com contexto:', {
      model: config.model || 'gpt-4o-mini',
      messagesCount: messages.length,
      historyLength: conversationHistory.length,
      temperature: config.temperature || 0.7
    });

    // Debug detalhado do que está sendo enviado
    console.log('🔍 Breakdown do conteúdo enviado:');
    messages.forEach((msg, index) => {
      const charCount = msg.content.length;
      const estimatedTokens = Math.ceil(charCount / 4); // Estimativa aproximada
      console.log(`  ${index + 1}. ${msg.role}: ${charCount} chars (~${estimatedTokens} tokens)`);
      if (msg.role === 'system') {
        console.log(`     System Prompt Preview: "${msg.content.substring(0, 200)}..."`);
        // Verificar se contém instruções personalizadas
        if (msg.content.includes('REGRAS ABSOLUTAS E INVIOLÁVEIS')) {
          const instructionsStart = msg.content.indexOf('REGRAS ABSOLUTAS E INVIOLÁVEIS');
          const instructionsSection = msg.content.substring(instructionsStart, instructionsStart + 600);
          console.log(`     🔥 REGRAS ABSOLUTAS encontradas: "${instructionsSection}..."`);
        } else if (msg.content.includes('INSTRUÇÕES PERSONALIZADAS OBRIGATÓRIAS')) {
          const instructionsStart = msg.content.indexOf('INSTRUÇÕES PERSONALIZADAS OBRIGATÓRIAS');
          const instructionsSection = msg.content.substring(instructionsStart, instructionsStart + 500);
          console.log(`     🎯 Instruções OBRIGATÓRIAS encontradas: "${instructionsSection}..."`);
        } else if (msg.content.includes('Instruções Personalizadas:')) {
          const instructionsStart = msg.content.indexOf('Instruções Personalizadas:');
          const instructionsSection = msg.content.substring(instructionsStart, instructionsStart + 300);
          console.log(`     🎯 Instruções encontradas: "${instructionsSection}..."`);
        } else {
          console.log(`     ⚠️ ATENÇÃO: Instruções personalizadas NÃO encontradas no system prompt!`);
        }
        
        // Verificar se contém o comando final
        if (msg.content.includes('COMANDO FINAL ABSOLUTO')) {
          console.log(`     🔥 COMANDO FINAL ABSOLUTO encontrado no system prompt!`);
        } else if (msg.content.includes('LEMBRETE FINAL - INSTRUÇÕES OBRIGATÓRIAS')) {
          console.log(`     ✅ Lembrete final encontrado no system prompt!`);
        } else {
          console.log(`     ❌ Comando final NÃO encontrado no system prompt!`);
        }
      } else if (msg.role === 'user' && index === messages.length - 1) {
        console.log(`     Mensagem atual: "${msg.content}"`);
      }
    });

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: config.model || 'gpt-4o-mini',
          messages,
          temperature: config.temperature || 0.7,
          max_tokens: config.maxTokens || 2000
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Erro da API OpenAI:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        
        if (response.status === 401) {
          throw new Error('Chave da API OpenAI inválida. Verifique sua configuração.');
        } else if (response.status === 429) {
          throw new Error('Limite de uso da API OpenAI excedido. Tente novamente mais tarde.');
        } else {
          throw new Error(`Erro da API OpenAI: ${response.status} - ${errorData.error?.message || response.statusText}`);
        }
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Resposta inválida da API OpenAI');
      }

      const content = data.choices[0].message.content;
      const model = data.model || config.model || 'gpt-4o-mini';

      // Capturar dados reais de uso de tokens
      let usage: TokenUsage | undefined;
      if (data.usage) {
        const cost = tokenService.calculateCost(
          data.usage.prompt_tokens,
          data.usage.completion_tokens,
          model
        );

        usage = {
          prompt_tokens: data.usage.prompt_tokens,
          completion_tokens: data.usage.completion_tokens,
          total_tokens: data.usage.total_tokens,
          estimated_cost: cost,
          model,
          timestamp: new Date()
        };

        console.log('💰 Uso de tokens (com contexto):', {
          model,
          prompt_tokens: usage.prompt_tokens,
          completion_tokens: usage.completion_tokens,
          total_tokens: usage.total_tokens,
          estimated_cost_usd: tokenService.formatCostUSD(cost),
          estimated_cost_brl: tokenService.formatCostBRL(cost)
        });
      }

      console.log('✅ Resposta recebida da OpenAI com contexto:', {
        model,
        contentLength: content.length,
        usage: data.usage
      });

      return {
        content,
        provider: 'openai' as AIProvider,
        model,
        usage
      };

    } catch (error) {
      console.error('❌ Erro ao chamar API OpenAI com contexto:', error);
      
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('Erro desconhecido ao chamar API OpenAI');
      }
    }
  }

  private async callOpenAIAPIWithContextStream(
    systemPrompt: string,
    currentMessage: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
    config: AIServiceConfig,
    onTokensReceived?: (usage: TokenUsage) => void
  ): Promise<ReadableStream<string>> {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    // Debug da chave da API
    console.log('🔑 [DEBUG Stream] Verificando chave da API:', {
      keyExists: !!apiKey,
      keyLength: apiKey?.length || 0,
      keyPrefix: apiKey?.substring(0, 7) || 'N/A'
    });
    
    if (!apiKey) {
      console.error('❌ [DEBUG Stream] Chave da API não encontrada. Variáveis disponíveis:', import.meta.env);
      throw new Error('Chave da API OpenAI não configurada. Adicione VITE_OPENAI_API_KEY no arquivo .env');
    }

    if (!apiKey.startsWith('sk-')) {
      console.error('❌ [DEBUG Stream] Formato da chave inválido. Deve começar com "sk-"');
      throw new Error('Formato da chave da API OpenAI inválido. A chave deve começar com "sk-"');
    }

    // Construir mensagens com histórico da conversa
    const messages = [
      {
        role: 'system' as const,
        content: systemPrompt
      },
      // Adicionar histórico da conversa
      ...conversationHistory.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      // Adicionar mensagem atual
      {
        role: 'user' as const,
        content: currentMessage
      }
    ];

    console.log('📤 Enviando para OpenAI com streaming e contexto:', {
      model: config.model || 'gpt-4o-mini',
      messagesCount: messages.length,
      historyLength: conversationHistory.length,
      temperature: config.temperature || 0.7,
      stream: true
    });

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: config.model || 'gpt-4o-mini',
          messages,
          temperature: config.temperature || 0.7,
          max_tokens: config.maxTokens || 2000,
          stream: true // Habilitar streaming
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Erro da API OpenAI (streaming):', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        
        if (response.status === 401) {
          throw new Error('Chave da API OpenAI inválida. Verifique sua configuração.');
        } else if (response.status === 429) {
          throw new Error('Limite de uso da API OpenAI excedido. Tente novamente mais tarde.');
        } else {
          throw new Error(`Erro da API OpenAI: ${response.status} - ${errorData.error?.message || response.statusText}`);
        }
      }

      if (!response.body) {
        throw new Error('Resposta da API OpenAI não contém body para streaming');
      }

      // Criar ReadableStream para processar os chunks de streaming
      const stream = new ReadableStream<string>({
        async start(controller) {
          const reader = response.body!.getReader();
          const decoder = new TextDecoder();
          let fullContent = '';
          let usageData: any = null;

          try {
            while (true) {
              const { done, value } = await reader.read();
              
              if (done) {
                console.log('✅ Streaming concluído');
                
                // Capturar tokens de uso se disponível
                if (usageData && onTokensReceived) {
                  const model = config.model || 'gpt-4o-mini';
                  const cost = tokenService.calculateCost(
                    usageData.prompt_tokens,
                    usageData.completion_tokens,
                    model
                  );

                  const usage: TokenUsage = {
                    prompt_tokens: usageData.prompt_tokens,
                    completion_tokens: usageData.completion_tokens,
                    total_tokens: usageData.total_tokens,
                    estimated_cost: cost,
                    model,
                    timestamp: new Date()
                  };

                  console.log('💰 Uso de tokens (streaming):', {
                    model,
                    prompt_tokens: usage.prompt_tokens,
                    completion_tokens: usage.completion_tokens,
                    total_tokens: usage.total_tokens,
                    estimated_cost_usd: tokenService.formatCostUSD(cost),
                    estimated_cost_brl: tokenService.formatCostBRL(cost)
                  });

                  onTokensReceived(usage);
                } else if (!usageData) {
                  // Fallback: estimar tokens se não recebemos dados de uso
                  const model = config.model || 'gpt-4o-mini';
                  const estimatedInputTokens = tokenService.estimateTokens(
                    systemPrompt + ' ' + conversationHistory.map(m => m.content).join(' ') + ' ' + currentMessage
                  );
                  const estimatedOutputTokens = tokenService.estimateTokens(fullContent);
                  const cost = tokenService.calculateCost(estimatedInputTokens, estimatedOutputTokens, model);

                  const usage: TokenUsage = {
                    prompt_tokens: estimatedInputTokens,
                    completion_tokens: estimatedOutputTokens,
                    total_tokens: estimatedInputTokens + estimatedOutputTokens,
                    estimated_cost: cost,
                    model,
                    timestamp: new Date()
                  };

                  console.log('💰 Uso de tokens estimado (streaming):', {
                    model,
                    prompt_tokens: usage.prompt_tokens,
                    completion_tokens: usage.completion_tokens,
                    total_tokens: usage.total_tokens,
                    estimated_cost_usd: tokenService.formatCostUSD(cost),
                    estimated_cost_brl: tokenService.formatCostBRL(cost)
                  });

                  if (onTokensReceived) {
                    onTokensReceived(usage);
                  }
                }
                
                controller.close();
                break;
              }

              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  
                  if (data === '[DONE]') {
                    console.log('🏁 Streaming finalizado com [DONE]');
                    controller.close();
                    return;
                  }

                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content;
                    
                    if (content) {
                      fullContent += content;
                      controller.enqueue(content);
                    }

                    // Capturar dados de uso se disponível
                    if (parsed.usage) {
                      usageData = parsed.usage;
                    }
                  } catch (e) {
                    // Ignorar linhas que não são JSON válido
                    console.debug('Linha ignorada no streaming:', data);
                  }
                }
              }
            }
          } catch (error) {
            console.error('❌ Erro durante streaming:', error);
            controller.error(error);
          } finally {
            reader.releaseLock();
          }
        }
      });

      return stream;

    } catch (error) {
      console.error('❌ Erro ao chamar API OpenAI com streaming:', error);
      
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error('Erro desconhecido ao chamar API OpenAI com streaming');
      }
    }
  }
}

export const aiService = AIService.getInstance();
