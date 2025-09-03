import { supabase } from '../lib/supabase';
import { aiService, AIStreamResponse } from './aiService';
import { tokenService } from './tokenService';

// Interfaces para o sistema de otimização
interface CacheEntry {
  id: string;
  pergunta_hash: string;
  pergunta_original: string;
  resposta: string;
  resposta_comprimida?: string;
  modelo_usado: string;
  tokens_entrada: number;
  tokens_saida: number;
  custo_usd: number;
  expira_em: string;
  vezes_usado: number;
}

interface PreComputedAnswer {
  id: string;
  pergunta_chave: string;
  palavras_chave: string[];
  categoria: string;
  resposta: string;
  resposta_comprimida?: string;
  nivel_confianca: number;
  vezes_usada: number;
}

interface ProfessorUsageConfig {
  id: string;
  professor_id: number;
  limite_mensal_brl: number;
  limite_tokens_entrada: number;
  limite_tokens_saida: number;
  limite_mensagens_mes: number;
  limite_mensagens_dia: number;
  limite_tokens_entrada_req: number;
  limite_tokens_saida_req: number;
  compressao_ativa: boolean;
  traducao_pt_en: boolean;
  cache_ativo: boolean;
  respostas_precomputadas: boolean;
  bloquear_ao_atingir_limite: boolean;
}

interface MonthlyUsage {
  id: string;
  professor_id: number;
  ano: number;
  mes: number;
  tokens_entrada_usados: number;
  tokens_saida_usados: number;
  mensagens_enviadas: number;
  custo_total_brl: number;
  custo_total_usd: number;
  bloqueado: boolean;
  motivo_bloqueio?: string;
}

interface OptimizationResult {
  source: 'cache' | 'precomputed' | 'ai_quick' | 'ai_full' | 'compressed';
  cost_usd: number;
  cost_brl: number;
  tokens_used: {
    input: number;
    output: number;
  };
  original_tokens?: {
    input: number;
    output: number;
  };
  savings?: {
    tokens: number;
    cost_usd: number;
    cost_brl: number;
    percentage: number;
  };
  processing_time: number;
  confidence: number;
}

interface CostOptimizedResponse {
  answer: string;
  optimization: OptimizationResult;
  blocked: boolean;
  block_reason?: string;
  usage_stats: {
    monthly_used: number;
    monthly_limit: number;
    daily_used: number;
    daily_limit: number;
  };
}

interface CostOptimizedStreamResponse {
  useOptimized: boolean;
  optimizedResponse?: CostOptimizedResponse;
  streamResponse?: any; // Será o retorno do aiService.generateResponseWithContextStream
}

// --- NOVO TIPO DE RESPOSTA UNIFICADO ---
export type OptimizedOrStreamResponse = ({
  isStream: false;
} & CostOptimizedResponse) | ({
  isStream: true;
} & AIStreamResponse);

class CostOptimizedChatService {
  private static instance: CostOptimizedChatService;
  
  public static getInstance(): CostOptimizedChatService {
    if (!CostOptimizedChatService.instance) {
      CostOptimizedChatService.instance = new CostOptimizedChatService();
    }
    return CostOptimizedChatService.instance;
  }

  /**
   * Processa uma pergunta com otimizações, mas permite streaming se necessário
   */
  async processOptimizedQuestionWithStream(
    question: string,
    professorId: number,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
    config: any = {},
    conversationId?: string
  ): Promise<OptimizedOrStreamResponse> {
    const startTime = Date.now();
    
    try {
      // 1. Verificar configurações e limites do professor
      const professorConfig = await this.getProfessorConfig(professorId);
      const usage = await this.getMonthlyUsage(professorId);
      
      // 2. Verificar se está bloqueado
      if (usage.bloqueado && professorConfig.bloquear_ao_atingir_limite) {
        return {
          isStream: false,
          answer: `Acesso temporariamente bloqueado: ${usage.motivo_bloqueio}. Entre em contato com a administração.`,
          blocked: true,
          block_reason: usage.motivo_bloqueio,
          usage_stats: {
            monthly_used: 0,
            monthly_limit: 0,
            daily_used: 0,
            daily_limit: 0
          },
          optimization: {
            source: 'ai_full',
            cost_usd: 0,
            cost_brl: 0,
            tokens_used: { input: 0, output: 0 },
            processing_time: 0,
            confidence: 1.0
          }
        };
      }

      // 3. Verificar respostas pré-computadas (só se habilitado)
      if (professorConfig.respostas_precomputadas) {
        const precomputed = await this.checkPrecomputedAnswers(question);
        if (precomputed && precomputed.nivel_confianca >= 0.8) { // Só usar se alta confiança
          await this.updatePrecomputedUsage(precomputed.id);
          return {
            isStream: false,
            ...this.buildResponse(precomputed.resposta, {
              source: 'precomputed',
              cost_usd: 0,
              cost_brl: 0,
              tokens_used: { input: 0, output: tokenService.estimateTokens(precomputed.resposta) },
              processing_time: 0,
              confidence: precomputed.nivel_confianca
            }, usage, professorConfig)
          };
        }
      }

      // 4. Verificar cache (só se habilitado)
      if (professorConfig.cache_ativo) {
        const cached = await this.checkCache(question);
        if (cached) {
          await this.updateCacheUsage(cached.id);
          return {
            isStream: false,
            ...this.buildResponse(cached.resposta, {
              source: 'cache',
              cost_usd: 0,
              cost_brl: 0,
              tokens_used: { input: 0, output: cached.tokens_saida },
              processing_time: 0,
              confidence: 0.95
            }, usage, professorConfig)
          };
        }
      }

      // 5. Se chegou aqui, usar streaming da IA com configurações otimizadas
      const streamResult = await aiService.generateResponseWithContextStream(
        question,
        professorId.toString(),
        conversationHistory,
        { 
          provider: 'openai',
          model: 'gpt-4o-mini',
          maxTokens: Math.min(professorConfig.limite_tokens_saida_req, 3000),
          enableOptimization: config.enableOptimization,
          optimizationMode: config.optimizationMode,
          webSearchEnabled: config.webSearchEnabled
        },
        conversationId
      );

      return {
        isStream: true,
        ...streamResult
      };

    } catch (error) {
      console.error('❌ Erro no processamento otimizado com streaming:', error);
      throw error;
    }
  }

  /**
   * Processa uma pergunta com todas as otimizações de custo (método original)
   */
  async processOptimizedQuestion(
    question: string,
    professorId: number,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): Promise<CostOptimizedResponse> {
    const startTime = Date.now();
    
    try {
      // 1. Verificar configurações e limites do professor
      const config = await this.getProfessorConfig(professorId);
      const usage = await this.getMonthlyUsage(professorId);
      
      // 2. Verificar se está bloqueado
      if (usage.bloqueado && config.bloquear_ao_atingir_limite) {
        return {
          answer: `Acesso temporariamente bloqueado: ${usage.motivo_bloqueio}. Entre em contato com a administração.`,
          optimization: {
            source: 'ai_full',
            cost_usd: 0,
            cost_brl: 0,
            tokens_used: { input: 0, output: 0 },
            processing_time: Date.now() - startTime,
            confidence: 1.0
          },
          blocked: true,
          block_reason: usage.motivo_bloqueio,
          usage_stats: {
            monthly_used: usage.custo_total_brl,
            monthly_limit: config.limite_mensal_brl,
            daily_used: 0,
            daily_limit: config.limite_mensal_brl / 30
          }
        };
      }

      // 3. Verificar respostas pré-computadas
      if (config.respostas_precomputadas) {
        const precomputed = await this.checkPrecomputedAnswers(question);
        if (precomputed) {
          await this.updatePrecomputedUsage(precomputed.id);
          return this.buildResponse(precomputed.resposta, {
            source: 'precomputed',
            cost_usd: 0,
            cost_brl: 0,
            tokens_used: { input: 0, output: tokenService.estimateTokens(precomputed.resposta) },
            processing_time: Date.now() - startTime,
            confidence: precomputed.nivel_confianca
          }, usage, config);
        }
      }

      // 4. Fallback para IA tradicional
      const response = await aiService.generateResponseWithContext(
        question,
        professorId.toString(),
        conversationHistory,
        { 
          provider: 'openai',
          model: 'gpt-4o-mini',
          maxTokens: Math.min(config.limite_tokens_saida_req, 3000)
        }
      );

      return this.buildResponse(response.content, {
        source: 'ai_full',
        cost_usd: 0.001,
        cost_brl: 0.006,
        tokens_used: { input: 100, output: 200 },
        processing_time: Date.now() - startTime,
        confidence: 1.0
      }, usage, config);

         } catch (error) {
       console.error('❌ Erro no processamento otimizado:', error);
       throw error;
     }
   }

   /**
    * Verifica cache de respostas
    */
   private async checkCache(question: string): Promise<CacheEntry | null> {
     const questionHash = this.generateHash(question);
     
     const { data, error } = await supabase
       .from('chat_response_cache')
       .select('*')
       .eq('pergunta_hash', questionHash)
       .gt('expira_em', new Date().toISOString())
       .single();

     if (error && error.code !== 'PGRST116') {
       console.error('Erro ao verificar cache:', error);
       return null;
     }

     return data;
   }

   /**
    * Atualiza uso do cache
    */
   private async updateCacheUsage(cacheId: string): Promise<void> {
     await supabase.rpc('increment_cache_usage', { cache_id: cacheId });
   }

   /**
    * Gera hash para pergunta
    */
   private generateHash(text: string): string {
     // Implementação simples de hash
     let hash = 0;
     for (let i = 0; i < text.length; i++) {
       const char = text.charCodeAt(i);
       hash = ((hash << 5) - hash) + char;
       hash = hash & hash; // Convert to 32bit integer
     }
     return Math.abs(hash).toString();
   }

   /**
    * Obtém configurações do professor
    */
   private async getProfessorConfig(professorId: number): Promise<ProfessorUsageConfig> {
     const { data, error } = await supabase
       .from('professor_usage_config')
       .select('*')
       .eq('professor_id', professorId)
       .single();

     if (error && error.code !== 'PGRST116') {
       throw new Error(`Erro ao buscar configurações: ${error.message}`);
     }

     // Retornar configuração padrão se não existir
     if (!data) {
       return {
         id: '',
         professor_id: professorId,
         limite_mensal_brl: 1.20,
         limite_tokens_entrada: 100000,
         limite_tokens_saida: 300000,
         limite_mensagens_mes: 3030,
         limite_mensagens_dia: 100,
         limite_tokens_entrada_req: 1000,
         limite_tokens_saida_req: 3000,
         compressao_ativa: true,
         traducao_pt_en: false,
         cache_ativo: true,
         respostas_precomputadas: true,
         bloquear_ao_atingir_limite: true
       };
     }

     return data;
   }

   /**
    * Obtém uso mensal do professor
    */
   private async getMonthlyUsage(professorId: number): Promise<MonthlyUsage> {
     const now = new Date();
     const year = now.getFullYear();
     const month = now.getMonth() + 1;

     const { data, error } = await supabase
       .from('professor_monthly_usage')
       .select('*')
       .eq('professor_id', professorId)
       .eq('ano', year)
       .eq('mes', month)
       .single();

     if (error && error.code !== 'PGRST116') {
       throw new Error(`Erro ao buscar uso mensal: ${error.message}`);
     }

     if (!data) {
       // Criar registro de uso mensal
       const { data: newUsage, error: createError } = await supabase
         .from('professor_monthly_usage')
         .insert({ professor_id: professorId, ano: year, mes: month })
         .select()
         .single();

       if (createError) {
         throw new Error(`Erro ao criar uso mensal: ${createError.message}`);
       }

       return newUsage;
     }

     return data;
   }

   /**
    * Verifica respostas pré-computadas
    */
   private async checkPrecomputedAnswers(question: string): Promise<PreComputedAnswer | null> {
     const keywords = this.extractKeywords(question);
     
     const { data, error } = await supabase
       .from('precomputed_answers')
       .select('*')
       .eq('ativa', true)
       .overlaps('palavras_chave', keywords)
       .order('nivel_confianca', { ascending: false })
       .limit(1);

     if (error) {
       console.error('Erro ao verificar respostas pré-computadas:', error);
       return null;
     }

     if (data && data.length > 0) {
       const match = data[0];
       // Verificar similaridade mais detalhada
       const similarity = this.calculateSimilarity(question, match.pergunta_chave, keywords, match.palavras_chave);
       
       if (similarity >= 0.7) { // 70% de similaridade mínima
         return match;
       }
     }

     return null;
   }

   /**
    * Atualiza contadores de uso de respostas pré-computadas
    */
   private async updatePrecomputedUsage(answerId: string): Promise<void> {
     await supabase.rpc('increment_precomputed_usage', { answer_id: answerId });
   }

   /**
    * Extrai palavras-chave da pergunta
    */
   private extractKeywords(question: string): string[] {
     const stopWords = ['o', 'a', 'os', 'as', 'um', 'uma', 'de', 'do', 'da', 'em', 'no', 'na', 'para', 'por', 'com', 'como', 'que', 'é', 'são', 'foi', 'foram'];
     
     return question
       .toLowerCase()
       .replace(/[^\w\s]/g, '')
       .split(/\s+/)
       .filter(word => word.length > 2 && !stopWords.includes(word))
       .slice(0, 10); // Máximo 10 palavras-chave
   }

   /**
    * Calcula similaridade entre pergunta e resposta pré-computada
    */
   private calculateSimilarity(
     question: string, 
     precomputedKey: string, 
     questionKeywords: string[], 
     precomputedKeywords: string[]
   ): number {
     // Similaridade baseada em palavras-chave comuns
     const commonKeywords = questionKeywords.filter(kw => precomputedKeywords.includes(kw));
     const keywordSimilarity = commonKeywords.length / Math.max(questionKeywords.length, precomputedKeywords.length);
     
     // Similaridade textual simples
     const textSimilarity = question.toLowerCase().includes(precomputedKey.toLowerCase()) ? 0.5 : 0;
     
     return Math.max(keywordSimilarity, textSimilarity);
   }

   /**
    * Constrói resposta final
    */
   private buildResponse(
     answer: string, 
     optimization: OptimizationResult, 
     usage: MonthlyUsage, 
     config: ProfessorUsageConfig
   ): CostOptimizedResponse {
     return {
       answer,
       optimization,
       blocked: false,
       usage_stats: {
         monthly_used: usage.custo_total_brl,
         monthly_limit: config.limite_mensal_brl,
         daily_used: 0, // TODO: implementar
         daily_limit: config.limite_mensal_brl / 30
       }
     };
   }
}

export const costOptimizedChatService = CostOptimizedChatService.getInstance();
export type { CostOptimizedResponse, OptimizationResult, ProfessorUsageConfig, MonthlyUsage };
