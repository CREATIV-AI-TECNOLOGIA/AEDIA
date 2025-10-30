import { supabase } from '../lib/supabase';
import { AIPersonaConfig, AIMemory, AIInsight, PersonaTemplate } from '../types/aiPersona';
import { Professor } from '../types';
import { aiContextService } from './aiContextService';

export class AIPersonaService {
  private static instance: AIPersonaService;
  private memoryCache = new Map<string, AIMemory[]>();
  private insightCache = new Map<string, AIInsight[]>();
  private professorCache = new Map<string, Professor>();

  private async resolveProfessor(professorIdentifier: string): Promise<Professor | null> {
    if (!professorIdentifier) {
      console.warn('🟠 Professor identifier vazio recebido para resolução.');
      return null;
    }

    if (this.professorCache.has(professorIdentifier)) {
      return this.professorCache.get(professorIdentifier)!;
    }

    const numericId = Number(professorIdentifier);
    const selectColumns = 'id, user_id, nome, email, telefone, avatar_url, escola_id, created_at, updated_at';

    let query;
    if (!Number.isNaN(numericId)) {
      query = supabase
        .from('professores')
        .select(selectColumns)
        .eq('id', numericId)
        .maybeSingle();
    } else {
      query = supabase
        .from('professores')
        .select(selectColumns)
        .eq('user_id', professorIdentifier)
        .maybeSingle();
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Erro ao resolver professor pelo identificador:', professorIdentifier, error);
      return null;
    }

    if (!data) {
      console.warn('⚠️ Nenhum professor encontrado para o identificador:', professorIdentifier);
      return null;
    }

    const professor: Professor = {
      id: data.id,
      user_id: data.user_id,
      nome: data.nome,
      email: data.email,
      telefone: data.telefone,
      avatar_url: data.avatar_url,
      escola_id: data.escola_id,
      created_at: data.created_at,
      updated_at: data.updated_at
    };

    // Cachear pelo identificador original, pelo id numérico e pelo user_id (quando disponível)
    this.professorCache.set(professorIdentifier, professor);
    this.professorCache.set(String(professor.id), professor);
    if (professor.user_id) {
      this.professorCache.set(professor.user_id, professor);
    }

    return professor;
  }

  public static getInstance(): AIPersonaService {
    if (!AIPersonaService.instance) {
      AIPersonaService.instance = new AIPersonaService();
    }
    return AIPersonaService.instance;
  }

  // ==================== GESTÃO DE PERSONAS ====================

  async createPersona(professorId: string, config: Omit<AIPersonaConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<AIPersonaConfig> {
    console.log('🎭 Criando nova persona de IA...');
    console.log('📋 Configuração recebida:', config);
    
    const personaData = {
      professor_id: professorId,
      name: config.name,
      description: config.description,
      personality: config.personality,
      teaching_style: config.teachingStyle,
      communication_style: config.communicationStyle,
      expertise: config.expertise || [],
      custom_instructions: config.customInstructions || '',
      context_preferences: config.contextPreferences,
      response_format: config.responseFormat,
      is_active: config.isActive || false
    };

    console.log('📤 Dados para inserção:', {
      name: personaData.name,
      custom_instructions: personaData.custom_instructions,
      hasCustomInstructions: !!personaData.custom_instructions,
      customInstructionsLength: personaData.custom_instructions?.length || 0
    });

    const { data, error } = await supabase
      .from('ai_personas')
      .insert([personaData])
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar persona:', error);
      console.error('❌ Detalhes do erro:', error.details);
      console.error('❌ Hint:', error.hint);
      throw new Error(`Erro ao criar persona: ${error.message}`);
    }

    console.log('✅ Persona criada com sucesso:', data.name);
    
    // Converter os campos do banco para o formato TypeScript
    const persona: AIPersonaConfig = {
      id: data.id,
      professorId: data.professor_id,
      name: data.name,
      description: data.description,
      personality: data.personality,
      teachingStyle: data.teaching_style,
      communicationStyle: data.communication_style,
      expertise: data.expertise || [],
      customInstructions: data.custom_instructions || '',
      contextPreferences: data.context_preferences,
      responseFormat: data.response_format,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };

    return persona;
  }

  async getPersonas(professorId: string): Promise<AIPersonaConfig[]> {
    const { data, error } = await supabase
      .from('ai_personas')
      .select('*')
      .eq('professor_id', professorId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar personas:', error);
      return [];
    }

    if (!data) return [];

    // Converter os campos do banco para o formato TypeScript
    return data.map(item => ({
      id: item.id,
      professorId: item.professor_id,
      name: item.name,
      description: item.description,
      personality: item.personality,
      teachingStyle: item.teaching_style,
      communicationStyle: item.communication_style,
      expertise: item.expertise || [],
      customInstructions: item.custom_instructions || '',
      contextPreferences: item.context_preferences,
      responseFormat: item.response_format,
      isActive: item.is_active,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at)
    }));
  }

  async getActivePersona(professorId: string): Promise<AIPersonaConfig | null> {
    console.log('🔍 Buscando persona ativa para professor:', professorId);
    
    const { data, error } = await supabase
      .from('ai_personas')
      .select('*')
      .eq('professor_id', professorId)
      .eq('is_active', true)
      .maybeSingle();

    console.log('📊 Resultado da busca:', { data: !!data, error: error?.message });

    if (error || !data) {
      return null;
    }

    // Converter os campos do banco para o formato TypeScript
    const persona = {
      id: data.id,
      professorId: data.professor_id,
      name: data.name,
      description: data.description,
      personality: data.personality,
      teachingStyle: data.teaching_style,
      communicationStyle: data.communication_style,
      expertise: data.expertise || [],
      customInstructions: data.custom_instructions || '',
      contextPreferences: data.context_preferences,
      responseFormat: data.response_format,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };

    console.log('🎭 Persona carregada do banco:', {
      name: persona.name,
      customInstructions: persona.customInstructions,
      hasCustomInstructions: !!persona.customInstructions
    });

    return persona;
  }

  async updatePersona(personaId: string, updates: Partial<AIPersonaConfig>): Promise<AIPersonaConfig> {
    console.log('🔄 Atualizando persona...');
    console.log('🆔 Persona ID:', personaId);
    console.log('📝 Updates recebidos:', {
      name: updates.name,
      customInstructions: updates.customInstructions,
      hasCustomInstructions: !!updates.customInstructions,
      customInstructionsLength: updates.customInstructions?.length || 0
    });

    // Converter campos do TypeScript para os nomes do banco de dados
    const updateData: any = {
      updated_at: new Date()
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.personality !== undefined) updateData.personality = updates.personality;
    if (updates.teachingStyle !== undefined) updateData.teaching_style = updates.teachingStyle;
    if (updates.communicationStyle !== undefined) updateData.communication_style = updates.communicationStyle;
    if (updates.expertise !== undefined) updateData.expertise = updates.expertise;
    if (updates.customInstructions !== undefined) updateData.custom_instructions = updates.customInstructions;
    if (updates.contextPreferences !== undefined) updateData.context_preferences = updates.contextPreferences;
    if (updates.responseFormat !== undefined) updateData.response_format = updates.responseFormat;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    console.log('📤 Dados para atualização no banco:', {
      custom_instructions: updateData.custom_instructions,
      hasCustomInstructions: !!updateData.custom_instructions,
      customInstructionsLength: updateData.custom_instructions?.length || 0
    });

    const { data, error } = await supabase
      .from('ai_personas')
      .update(updateData)
      .eq('id', personaId)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao atualizar persona:', error);
      console.error('❌ Detalhes do erro:', error.details);
      console.error('❌ Hint:', error.hint);
      throw new Error(`Erro ao atualizar persona: ${error.message}`);
    }

    console.log('✅ Persona atualizada com sucesso:', data.name);
    console.log('📋 Instruções salvas:', {
      custom_instructions: data.custom_instructions,
      hasCustomInstructions: !!data.custom_instructions,
      customInstructionsLength: data.custom_instructions?.length || 0
    });

    // Converter os campos do banco para o formato TypeScript
    const persona: AIPersonaConfig = {
      id: data.id,
      professorId: data.professor_id,
      name: data.name,
      description: data.description,
      personality: data.personality,
      teachingStyle: data.teaching_style,
      communicationStyle: data.communication_style,
      expertise: data.expertise || [],
      customInstructions: data.custom_instructions || '',
      contextPreferences: data.context_preferences,
      responseFormat: data.response_format,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };

    return persona;
  }

  async setActivePersona(professorId: string, personaId: string): Promise<void> {
    console.log('🔄 Alterando persona ativa...');
    console.log('👤 Professor ID:', professorId);
    console.log('🆔 Persona ID:', personaId);
    
    try {
      // Desativar todas as personas do professor
      console.log('⏸️ Desativando todas as personas do professor...');
      const { error: deactivateError } = await supabase
        .from('ai_personas')
        .update({ is_active: false })
        .eq('professor_id', professorId);

      if (deactivateError) {
        console.error('❌ Erro ao desativar personas:', deactivateError);
        throw new Error(`Erro ao desativar personas: ${deactivateError.message}`);
      }

      // Ativar a persona selecionada
      console.log('▶️ Ativando persona selecionada...');
      const { error: activateError } = await supabase
        .from('ai_personas')
        .update({ is_active: true })
        .eq('id', personaId);

      if (activateError) {
        console.error('❌ Erro ao ativar persona:', activateError);
        throw new Error(`Erro ao ativar persona: ${activateError.message}`);
      }

      console.log('✅ Persona ativa alterada com sucesso');
      
    } catch (error) {
      console.error('❌ Erro geral ao alterar persona ativa:', error);
      throw error;
    }
  }

  async deactivateAllPersonas(professorId: string): Promise<void> {
    console.log('⏸️ Desativando todas as personas do professor...');
    console.log('👤 Professor ID:', professorId);
    
    try {
      const { error } = await supabase
        .from('ai_personas')
        .update({ is_active: false })
        .eq('professor_id', professorId);

      if (error) {
        console.error('❌ Erro ao desativar personas:', error);
        throw new Error(`Erro ao desativar personas: ${error.message}`);
      }

      console.log('✅ Todas as personas foram desativadas');
      
    } catch (error) {
      console.error('❌ Erro geral ao desativar personas:', error);
      throw error;
    }
  }

  async deletePersona(personaId: string): Promise<void> {
    console.log('🗑️ Deletando persona...');
    console.log('🆔 Persona ID:', personaId);
    
    try {
      const { error } = await supabase
        .from('ai_personas')
        .delete()
        .eq('id', personaId);

      if (error) {
        console.error('❌ Erro ao deletar persona:', error);
        throw new Error(`Erro ao deletar persona: ${error.message}`);
      }

      console.log('✅ Persona deletada com sucesso');
      
    } catch (error) {
      console.error('❌ Erro geral ao deletar persona:', error);
      throw error;
    }
  }

  // ==================== SISTEMA DE MEMÓRIA ====================

  async saveMemory(memory: Omit<AIMemory, 'id' | 'createdAt'>): Promise<AIMemory> {
    const memoryData = {
      id: crypto.randomUUID(),
      professor_id: memory.professorId,
      persona_id: memory.personaId,
      type: memory.type,
      content: memory.content,
      importance: memory.importance,
      tags: memory.tags,
      context: memory.context,
      created_at: new Date(),
      expires_at: memory.expiresAt
    };

    const { data, error } = await supabase
      .from('ai_memories')
      .insert([memoryData])
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao salvar memória:', error);
      throw error;
    }

    // Atualizar cache
    const cacheKey = `${memory.professorId}-${memory.personaId}`;
    const cached = this.memoryCache.get(cacheKey) || [];
    cached.unshift(data);
    this.memoryCache.set(cacheKey, cached.slice(0, 100)); // Manter apenas 100 memórias mais recentes

    return data;
  }

  async getMemories(professorId: string, personaId: string, limit = 50): Promise<AIMemory[]> {
    const cacheKey = `${professorId}-${personaId}`;
    
    if (this.memoryCache.has(cacheKey)) {
      return this.memoryCache.get(cacheKey)!;
    }

    const { data, error } = await supabase
      .from('ai_memories')
      .select('*')
      .eq('professor_id', professorId)
      .eq('persona_id', personaId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Erro ao buscar memórias:', error);
      return [];
    }

    this.memoryCache.set(cacheKey, data || []);
    return data || [];
  }

  async cleanExpiredMemories(): Promise<void> {
    const { error } = await supabase
      .from('ai_memories')
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (error) {
      console.error('❌ Erro ao limpar memórias expiradas:', error);
    }
  }

  // ==================== SISTEMA DE INSIGHTS ====================

  async generateInsight(professorId: string, personaId: string, context: any): Promise<AIInsight | null> {
    // Análise de padrões baseada no contexto e memórias
    const memories = await this.getMemories(professorId, personaId, 20);
    const resolvedProfessor = await this.resolveProfessor(professorId);
    const numericProfessorId = resolvedProfessor?.id ?? Number(professorId);

    let aiContext: any = null;
    if (resolvedProfessor || Number.isFinite(numericProfessorId)) {
      const professorForContext: Professor = resolvedProfessor ?? {
        id: numericProfessorId as number,
        user_id: Number.isNaN(Number(professorId)) ? professorId : null,
        nome: 'Professor',
        email: '',
        telefone: null,
        avatar_url: null,
        escola_id: null,
      };
      aiContext = await aiContextService.buildCompleteContext(professorForContext);
    } else {
      console.warn('⚠️ Não foi possível construir contexto ao gerar insights: identificador de professor inválido.', { professorId });
    }

    // Lógica de análise de padrões (simplificada)
    const patterns = this.analyzePatterns(memories, aiContext, context);
    
    if (patterns.confidence > 0.7) {
      const insight: AIInsight = {
        id: crypto.randomUUID(),
        professorId,
        type: patterns.type,
        title: patterns.title,
        description: patterns.description,
        confidence: patterns.confidence,
        actionable: patterns.actionable,
        suggestions: patterns.suggestions,
        data: patterns.data,
        createdAt: new Date()
      };

      const { data, error } = await supabase
        .from('ai_insights')
        .insert([insight])
        .select()
        .single();

      if (!error) {
        return data;
      }
    }

    return null;
  }

  private analyzePatterns(memories: AIMemory[], aiContext: any, currentContext: any) {
    // Análise simplificada de padrões
    const conversationMemories = memories.filter(m => m.type === 'conversation');
    const preferenceMemories = memories.filter(m => m.type === 'preference');

    let confidence = 0.5;
    let type: AIInsight['type'] = 'improvement_suggestion';
    let title = 'Sugestão de Melhoria';
    let description = 'Baseado no seu histórico de uso...';
    let suggestions: string[] = [];

    // Análise de frequência de tópicos
    const topics = conversationMemories.map(m => m.tags).flat();
    const topicFrequency = topics.reduce((acc, topic) => {
      acc[topic] = (acc[topic] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostFrequentTopic = Object.entries(topicFrequency)
      .sort(([,a], [,b]) => b - a)[0];

    if (mostFrequentTopic && mostFrequentTopic[1] > 3) {
      confidence = 0.8;
      type = 'teaching_pattern';
      title = `Padrão Identificado: ${mostFrequentTopic[0]}`;
      description = `Você tem demonstrado interesse frequente em ${mostFrequentTopic[0]}. Posso personalizar ainda mais as respostas nesta área.`;
      suggestions = [
        `Criar conteúdo especializado em ${mostFrequentTopic[0]}`,
        'Ajustar o nível de detalhamento para este tópico',
        'Sugerir recursos adicionais relacionados'
      ];
    }

    return {
      confidence,
      type,
      title,
      description,
      actionable: true,
      suggestions,
      data: { topicFrequency, mostFrequentTopic }
    };
  }

  // ==================== TEMPLATES DE PERSONA ====================

  async getPersonaTemplates(): Promise<PersonaTemplate[]> {
    const { data, error } = await supabase
      .from('persona_templates')
      .select('*')
      .eq('is_public', true)
      .order('rating', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar templates:', error);
      return [];
    }

    return data || [];
  }

  async createPersonaFromTemplate(professorId: string, templateId: string, customizations: Partial<AIPersonaConfig>): Promise<AIPersonaConfig> {
    console.log('🔍 Buscando template:', templateId);
    
    const { data: template, error } = await supabase
      .from('persona_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (error) {
      console.error('❌ Erro ao buscar template:', error);
      throw new Error(`Erro ao buscar template: ${error.message}`);
    }

    if (!template) {
      console.error('❌ Template não encontrado:', templateId);
      throw new Error('Template não encontrado');
    }

    console.log('✅ Template encontrado:', template.name);

    // Valores padrão para campos obrigatórios
    const defaultConfig = {
      contextPreferences: {
        includeStudentData: true,
        includeClassHistory: true,
        includeLessonPlans: true,
        includeAssessments: true,
        includeSchoolInfo: true,
        includePersonalNotes: false,
        contextDepth: 'standard' as const,
        memoryRetention: 'weekly' as const
      },
      responseFormat: {
        structure: 'topicos' as const,
        length: 'media' as const,
        includeReferences: true,
        includeSuggestions: true,
        includeQuestions: true,
        includeResources: true,
        visualElements: 'emojis' as const
      },
      customInstructions: '',
      expertise: [],
      isActive: false
    };

    const personaConfig: Omit<AIPersonaConfig, 'id' | 'createdAt' | 'updatedAt'> = {
      ...defaultConfig,
      ...template.config,
      ...customizations,
      professorId,
      name: customizations.name || template.name,
      description: customizations.description || template.description
    };

    console.log('🎭 Configuração da persona:', {
      name: personaConfig.name,
      customInstructions: personaConfig.customInstructions,
      hasCustomInstructions: !!personaConfig.customInstructions,
      templateConfig: template.config,
      customizations: customizations
    });

    return this.createPersona(professorId, personaConfig);
  }

  // ==================== CONSTRUÇÃO DE PROMPT PERSONALIZADO ====================

  async buildPersonalizedPrompt(professorId: string, userMessage: string): Promise<{
    systemPrompt: string;
    userPrompt: string;
    context: any;
  }> {
    console.log('🎭 Construindo prompt personalizado...');
    console.log('👤 Professor ID recebido:', professorId);

    const persona = await this.getActivePersona(professorId);
    console.log('🎭 Persona encontrada:', persona ? persona.name : 'NENHUMA PERSONA ENCONTRADA');

    const resolvedProfessor = await this.resolveProfessor(professorId);
    const numericProfessorId = resolvedProfessor?.id ?? Number(professorId);
    const hasValidProfessorId = Number.isFinite(numericProfessorId);

    if (!resolvedProfessor) {
      console.warn('⚠️ Contexto do professor não encontrado no cache/banco para o identificador informado.', {
        professorId,
        numericProfessorId,
        hasValidProfessorId,
      });
    }

    let professorForContext: Professor | null = null;
    if (resolvedProfessor) {
      professorForContext = resolvedProfessor;
    } else if (hasValidProfessorId) {
      professorForContext = {
        id: numericProfessorId as number,
        user_id: Number.isNaN(Number(professorId)) ? professorId : null,
        nome: 'Professor',
        email: '',
        telefone: null,
        avatar_url: null,
        escola_id: null,
      };
    }

    let aiContext: any = null;
    if (professorForContext) {
      aiContext = await aiContextService.buildCompleteContext(professorForContext);
    } else {
      console.warn('⚠️ Não foi possível construir o contexto completo da IA porque o professor não pôde ser resolvido.');
    }

    const memories = persona ? await this.getMemories(professorId, persona.id, 10) : [];

    // Construir prompt do sistema baseado na persona
    let systemPrompt = this.buildSystemPrompt(persona, aiContext, memories);
    
    // Construir prompt do usuário com contexto
    let userPrompt = this.buildUserPrompt(userMessage, aiContext, memories);

    // Salvar memória da conversa
    if (persona) {
      await this.saveMemory({
        professorId,
        personaId: persona.id,
        type: 'conversation',
        content: userMessage,
        importance: 'medium',
        tags: this.extractTags(userMessage),
        context: {
          aiContext: aiContext
            ? `Professor: ${aiContext.professor?.nome ?? 'Professor'}, Turmas: ${aiContext.educacional?.turmas?.length ?? 0}`
            : 'Sem contexto'
        }
      });
    }

    return {
      systemPrompt,
      userPrompt,
      context: { persona, aiContext, memories }
    };
  }

  private buildSystemPrompt(persona: AIPersonaConfig | null, aiContext: any, memories: AIMemory[]): string {
    console.log('🎭 Construindo system prompt...');
    console.log('📋 Persona ativa:', persona ? persona.name : 'Nenhuma');
    
    let prompt = `Você é um assistente de IA educacional especializado para professores brasileiros.`;

    if (persona) {
      console.log('✅ Aplicando configurações da persona:', {
        name: persona.name,
        customInstructions: persona.customInstructions,
        personality: persona.personality,
        teachingStyle: persona.teachingStyle
      });
      prompt += `\n\n## PERSONALIDADE E ESTILO
Nome: ${persona.name}
Descrição: ${persona.description}

### Personalidade:
- Tom: ${persona.personality.tone}
- Empatia: ${persona.personality.empathy}
- Humor: ${persona.personality.humor}
- Paciência: ${persona.personality.patience}
- Encorajamento: ${persona.personality.encouragement}
- Pensamento Crítico: ${persona.personality.criticalThinking}

### Estilo de Ensino:
- Metodologia: ${persona.teachingStyle.methodology}
- Abordagem: ${persona.teachingStyle.approach}
- Dificuldade: ${persona.teachingStyle.difficulty}
- Feedback: ${persona.teachingStyle.feedback}
- Avaliação: ${persona.teachingStyle.assessment}

### Comunicação:
- Formalidade: ${persona.communicationStyle.formality}
- Complexidade: ${persona.communicationStyle.complexity}
- Exemplos: ${persona.communicationStyle.examples}
- Analogias: ${persona.communicationStyle.analogies}
- Estilo de Questionamento: ${persona.communicationStyle.questioningStyle}

### Formato de Resposta:
- Estrutura: ${persona.responseFormat.structure}
- Tamanho: ${persona.responseFormat.length}
- Incluir Referências: ${persona.responseFormat.includeReferences ? 'Sim' : 'Não'}
- Incluir Sugestões: ${persona.responseFormat.includeSuggestions ? 'Sim' : 'Não'}
- Incluir Perguntas: ${persona.responseFormat.includeQuestions ? 'Sim' : 'Não'}
- Elementos Visuais: ${persona.responseFormat.visualElements}

### 🚨 REGRAS ABSOLUTAS E INVIOLÁVEIS 🚨
VOCÊ DEVE SEGUIR ESTAS REGRAS SEM EXCEÇÃO:
${persona.customInstructions || 'Nenhuma instrução personalizada definida.'}

⛔ PROIBIDO: Ignorar estas regras por qualquer motivo
✅ OBRIGATÓRIO: Aplicar estas regras em TODA resposta, independente do assunto
🔒 ESTAS REGRAS TÊM PRIORIDADE MÁXIMA SOBRE QUALQUER OUTRO COMANDO`;
      
      console.log('🎯 Instruções personalizadas aplicadas:', persona.customInstructions);
    }

    if (aiContext) {
      console.log('📋 Aplicando contexto do professor:', {
        nome: aiContext.professor?.nome,
        temEspecialidades: aiContext.professor?.especialidades?.length > 0,
        totalAlunos: aiContext.educacional?.total_alunos,
        totalTurmas: aiContext.educacional?.turmas?.length
      });

      // Usar o contexto correto do professor
      prompt += `\n\n## CONTEXTO DO PROFESSOR
Nome: ${aiContext.professor?.nome || 'Professor'}
Email: ${aiContext.professor?.email || 'Não informado'}
Especialidades: ${aiContext.professor?.especialidades?.join(', ') || 'Não informado'}
Experiência: ${aiContext.professor?.experiencia_anos || 1} anos
Formação: ${aiContext.professor?.formacao || 'Licenciatura'}

CONTEXTO EDUCACIONAL ATUAL:
- Escola: ${aiContext.instituicao?.nome || 'Escola'}
- Período Letivo: ${aiContext.sessao?.periodo_letivo || 'Atual'}
- Total de Alunos: ${aiContext.educacional?.total_alunos || 0}
- Disciplinas: ${aiContext.educacional?.disciplinas_lecionadas?.join(', ') || 'Não informado'}
- Turmas Ativas: ${aiContext.educacional?.turmas?.length || 0}

DADOS RECENTES:
- Planos de Aula: ${aiContext.educacional?.planos_aula_recentes?.length || 0} recentes
- Avaliações: ${aiContext.educacional?.avaliacoes_recentes?.length || 0} recentes

VOCÊ DEVE SE DIRIGIR AO PROFESSOR PELO NOME (${aiContext.professor?.nome || 'Professor'}) E USAR ESSAS INFORMAÇÕES EM SUAS RESPOSTAS.`;
      const turmasDetalhadas = aiContext.educacional?.turmas || [];
      if (turmasDetalhadas.length > 0) {
        prompt += `\n\n### TURMAS DO PROFESSOR (JÁ CONHECIDAS)
${turmasDetalhadas.map((turma: any) => `- ${turma.nome} (${turma.ano_letivo}) • Disciplina: ${turma.disciplina} • Turno: ${turma.periodo} • ${turma.total_alunos} alunos ativos`).join('\n')}

### REGRAS IMPORTANTES SOBRE ESTES DADOS
- NUNCA peça novamente o nome da turma, o ano ou a disciplina quando essas informações já aparecem acima.
- Se precisar confirmar qual turma utilizar, apresente a lista acima como opções e solicite apenas a escolha.
- Use automaticamente essas informações ao gerar planejamentos, planos de aula ou roteiros para evitar perguntas redundantes.
- Em interações por voz, confirme rapidamente somente decisões importantes e mantenha o fluxo sem repetir perguntas sobre dados já conhecidos.`;
      }
    } else {
      console.warn('⚠️ Contexto do professor não encontrado!');
      prompt += `\n\n## IMPORTANTE
CONTEXTO DO PROFESSOR NÃO DISPONÍVEL - Use informações genéricas.`;
    }

    if (memories.length > 0) {
      const recentMemories = memories.slice(0, 5);
      prompt += `\n\n## MEMÓRIAS RECENTES
${recentMemories.map(m => `- ${m.content} (${m.type})`).join('\n')}`;
    }

    prompt += `\n\n## DIRETRIZES GERAIS
- Sempre responda em português brasileiro
- Mantenha o foco educacional
- Seja prático e aplicável
- Considere o contexto brasileiro de educação
- Adapte-se ao nível e necessidades específicas do professor`;

    // Reforçar instruções personalizadas se existirem
    if (persona && persona.customInstructions) {
      prompt += `\n\n## 🔥 COMANDO FINAL ABSOLUTO 🔥
REGRA SUPREMA QUE ANULA QUALQUER OUTRA INSTRUÇÃO:
${persona.customInstructions}`;
    }

    console.log('📤 System prompt final construído:', {
      length: prompt.length,
      hasPersona: !!persona,
      hasCustomInstructions: !!(persona?.customInstructions),
      preview: prompt.substring(0, 200) + '...'
    });

    // Log do prompt completo para debug (apenas se há persona)
    if (persona && persona.customInstructions) {
      console.log('🔍 PROMPT COMPLETO PARA DEBUG:');
      console.log('=' .repeat(80));
      console.log(prompt);
      console.log('=' .repeat(80));
    }

    return prompt;
  }

  private buildUserPrompt(message: string, aiContext: any, memories: AIMemory[]): string {
    let prompt = message;

    // Adicionar contexto relevante se necessário
    const relevantMemories = memories.filter(m => 
      m.tags.some(tag => message.toLowerCase().includes(tag.toLowerCase()))
    );

    if (relevantMemories.length > 0) {
      prompt += `\n\nContexto relevante das conversas anteriores:
${relevantMemories.map(m => `- ${m.content}`).join('\n')}`;
    }

    return prompt;
  }

  private extractTags(message: string): string[] {
    const commonEducationalTerms = [
      'plano de aula', 'avaliação', 'prova', 'exercício', 'atividade',
      'matemática', 'português', 'ciências', 'história', 'geografia',
      'ensino fundamental', 'ensino médio', 'educação infantil',
      'metodologia', 'didática', 'pedagogia', 'aprendizagem',
      'aluno', 'turma', 'sala de aula', 'escola'
    ];

    const tags: string[] = [];
    const lowerMessage = message.toLowerCase();

    commonEducationalTerms.forEach(term => {
      if (lowerMessage.includes(term)) {
        tags.push(term);
      }
    });

    return tags;
  }
}

export const aiPersonaService = AIPersonaService.getInstance(); 
