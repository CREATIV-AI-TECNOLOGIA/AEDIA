import { supabase } from '../lib/supabase';
import { 
  ProfessorUsageConfig, 
  ProfessorUsageStats, 
  USAGE_CONFIG_PADRAO,
  CURRENT_EXCHANGE_RATE,
  CENARIOS_USO,
  UsageScenario
} from '../types/ProfessorUsageConfig';
import { TokenUsage } from './tokenService';

export class ProfessorUsageService {
  
  /**
   * Busca as configurações de uso de um professor
   */
  static async getUsageConfig(professorId: number, escolaId: number): Promise<ProfessorUsageConfig | null> {
    try {
      const { data, error } = await supabase
        .from('professor_usage_config')
        .select('*')
        .eq('professor_id', professorId)
        .eq('escola_id', escolaId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Nenhuma configuração encontrada
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar configurações de uso:', error);
      throw error;
    }
  }

  /**
   * Busca configurações ou retorna padrão
   */
  static async getUsageConfigOuPadrao(professorId: number, escolaId: number): Promise<ProfessorUsageConfig> {
    const config = await this.getUsageConfig(professorId, escolaId);
    
    if (config) {
      return config;
    }

    // Retorna configurações padrão
    return {
      ...USAGE_CONFIG_PADRAO,
      professor_id: professorId,
      escola_id: escolaId
    };
  }

  /**
   * Salva ou atualiza configurações de uso
   */
  static async salvarUsageConfig(config: ProfessorUsageConfig): Promise<ProfessorUsageConfig> {
    try {
      const configExistente = await this.getUsageConfig(config.professor_id, config.escola_id);

      if (configExistente) {
        // Atualizar
        const { data, error } = await supabase
          .from('professor_usage_config')
          .update({
            limite_mensal_usd: config.limite_mensal_usd,
            limite_mensal_brl: config.limite_mensal_brl,
            limite_tokens_entrada: config.limite_tokens_entrada,
            limite_tokens_saida: config.limite_tokens_saida,
            limite_conversas_mes: config.limite_conversas_mes,
            limite_mensagens_dia: config.limite_mensagens_dia,
            alerta_80_porcento: config.alerta_80_porcento,
            alerta_90_porcento: config.alerta_90_porcento,
            bloquear_ao_atingir_limite: config.bloquear_ao_atingir_limite,
            dia_reset_mensal: config.dia_reset_mensal,
            auto_reset_enabled: config.auto_reset_enabled,
            notificar_admin_limite: config.notificar_admin_limite,
            email_notificacao: config.email_notificacao
          })
          .eq('id', configExistente.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Criar novo
        const { data, error } = await supabase
          .from('professor_usage_config')
          .insert({
            professor_id: config.professor_id,
            escola_id: config.escola_id,
            limite_mensal_usd: config.limite_mensal_usd,
            limite_mensal_brl: config.limite_mensal_brl,
            limite_tokens_entrada: config.limite_tokens_entrada,
            limite_tokens_saida: config.limite_tokens_saida,
            limite_conversas_mes: config.limite_conversas_mes,
            limite_mensagens_dia: config.limite_mensagens_dia,
            alerta_80_porcento: config.alerta_80_porcento,
            alerta_90_porcento: config.alerta_90_porcento,
            bloquear_ao_atingir_limite: config.bloquear_ao_atingir_limite,
            dia_reset_mensal: config.dia_reset_mensal,
            auto_reset_enabled: config.auto_reset_enabled,
            notificar_admin_limite: config.notificar_admin_limite,
            email_notificacao: config.email_notificacao,
            created_by: config.created_by
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Erro ao salvar configurações de uso:', error);
      throw error;
    }
  }

  /**
   * Calcula estatísticas de uso atual do professor
   */
  static async calcularUsageStats(professorId: number, periodo?: string): Promise<ProfessorUsageStats> {
    const periodoAtual = periodo || new Date().toISOString().slice(0, 7); // YYYY-MM
    
    try {
      // Buscar configurações
      const config = await this.getUsageConfigOuPadrao(professorId, 0); // escola_id será ajustado depois
      
      // Buscar dados de uso do tokenService (localStorage)
      const allTokens = this.getTokensFromLocalStorage(professorId);
      
      // Filtrar tokens do período atual
      const tokensPeríodo = allTokens.filter(token => {
        const tokenDate = new Date(token.timestamp);
        return tokenDate.toISOString().slice(0, 7) === periodoAtual;
      });

      // Calcular totais
      const tokens_entrada_usados = tokensPeríodo.reduce((sum, token) => sum + token.prompt_tokens, 0);
      const tokens_saida_usados = tokensPeríodo.reduce((sum, token) => sum + token.completion_tokens, 0);
      const gasto_atual_usd = tokensPeríodo.reduce((sum, token) => sum + token.estimated_cost, 0);
      const gasto_atual_brl = gasto_atual_usd * CURRENT_EXCHANGE_RATE.usd_to_brl;

      // Buscar dados de conversas (simulado - seria do banco)
      const conversas_criadas = this.getConversasCount(professorId, periodoAtual);
      const mensagens_enviadas = tokensPeríodo.length;

      // Calcular percentuais
      const percentual_gasto = (gasto_atual_usd / config.limite_mensal_usd) * 100;
      const percentual_tokens_entrada = (tokens_entrada_usados / config.limite_tokens_entrada) * 100;
      const percentual_tokens_saida = (tokens_saida_usados / config.limite_tokens_saida) * 100;
      const percentual_conversas = (conversas_criadas / config.limite_conversas_mes) * 100;
      
      // Calcular mensagens por dia (aproximado)
      const diasNoMes = new Date().getDate();
      const mensagens_por_dia = mensagens_enviadas / diasNoMes;
      const percentual_mensagens = (mensagens_por_dia / config.limite_mensagens_dia) * 100;

      // Verificar alertas
      const alertas_enviados: string[] = [];
      if (percentual_gasto >= 80) alertas_enviados.push('80%');
      if (percentual_gasto >= 90) alertas_enviados.push('90%');
      if (percentual_gasto >= 100) alertas_enviados.push('100%');

      const limite_atingido = percentual_gasto >= 100;
      const bloqueado = limite_atingido && config.bloquear_ao_atingir_limite;

      return {
        professor_id: professorId,
        periodo: periodoAtual,
        gasto_atual_usd,
        gasto_atual_brl,
        tokens_entrada_usados,
        tokens_saida_usados,
        conversas_criadas,
        mensagens_enviadas,
        percentual_gasto,
        percentual_tokens_entrada,
        percentual_tokens_saida,
        percentual_conversas,
        percentual_mensagens,
        limite_atingido,
        bloqueado,
        alertas_enviados,
        last_updated: new Date().toISOString()
      };

    } catch (error) {
      console.error('Erro ao calcular estatísticas de uso:', error);
      throw error;
    }
  }

  /**
   * Verifica se o professor pode fazer uma nova requisição
   */
  static async podeUsarIA(professorId: number, escolaId: number): Promise<{
    pode: boolean;
    motivo?: string;
    stats?: ProfessorUsageStats;
  }> {
    try {
      const config = await this.getUsageConfigOuPadrao(professorId, escolaId);
      const stats = await this.calcularUsageStats(professorId);

      // Se bloqueio está desabilitado, sempre pode usar
      if (!config.bloquear_ao_atingir_limite) {
        return { pode: true, stats };
      }

      // Verificar limite de gasto
      if (stats.percentual_gasto >= 100) {
        return {
          pode: false,
          motivo: `Limite mensal de ${this.formatCurrency(config.limite_mensal_usd, 'USD')} (${this.formatCurrency(config.limite_mensal_brl, 'BRL')}) atingido`,
          stats
        };
      }

      // Verificar limite de mensagens diárias
      const hoje = new Date().toISOString().slice(0, 10);
      const mensagensHoje = this.getMensagensHoje(professorId, hoje);
      if (mensagensHoje >= config.limite_mensagens_dia) {
        return {
          pode: false,
          motivo: `Limite diário de ${config.limite_mensagens_dia} mensagens atingido`,
          stats
        };
      }

      return { pode: true, stats };

    } catch (error) {
      console.error('Erro ao verificar se pode usar IA:', error);
      return { pode: true }; // Em caso de erro, permite uso
    }
  }

  /**
   * Registra uso da IA
   */
  static async registrarUso(professorId: number, tokenUsage: TokenUsage): Promise<void> {
    try {
      // Salvar no localStorage (já é feito pelo tokenService)
      // Aqui podemos adicionar lógica adicional como alertas
      
      const stats = await this.calcularUsageStats(professorId);
      const config = await this.getUsageConfigOuPadrao(professorId, 0);

      // Verificar se deve enviar alertas
      if (config.alerta_80_porcento && stats.percentual_gasto >= 80 && !stats.alertas_enviados.includes('80%')) {
        await this.enviarAlerta(professorId, '80%', stats);
      }

      if (config.alerta_90_porcento && stats.percentual_gasto >= 90 && !stats.alertas_enviados.includes('90%')) {
        await this.enviarAlerta(professorId, '90%', stats);
      }

      if (stats.percentual_gasto >= 100 && !stats.alertas_enviados.includes('100%')) {
        await this.enviarAlerta(professorId, '100%', stats);
      }

    } catch (error) {
      console.error('Erro ao registrar uso:', error);
    }
  }

  /**
   * Calcula cenários de uso baseados no dólar atual
   */
  static calcularCenarios(): UsageScenario[] {
    return CENARIOS_USO.map(cenario => ({
      ...cenario,
      custo_mensal: {
        usd: cenario.custo_mensal.usd,
        brl: cenario.custo_mensal.usd * CURRENT_EXCHANGE_RATE.usd_to_brl
      },
      recomendacao_limite: {
        usd: cenario.recomendacao_limite.usd,
        brl: cenario.recomendacao_limite.usd * CURRENT_EXCHANGE_RATE.usd_to_brl
      }
    }));
  }

  /**
   * Atualiza taxa de câmbio
   */
  static atualizarTaxaCambio(novaTaxa: number): void {
    CURRENT_EXCHANGE_RATE.usd_to_brl = novaTaxa;
    CURRENT_EXCHANGE_RATE.last_updated = new Date().toISOString();
    
    // Salvar no localStorage para persistir
    localStorage.setItem('exchange_rate', JSON.stringify(CURRENT_EXCHANGE_RATE));
  }

  /**
   * Converte USD para BRL
   */
  static convertUsdToBrl(usd: number): number {
    return usd * CURRENT_EXCHANGE_RATE.usd_to_brl;
  }

  /**
   * Converte BRL para USD
   */
  static convertBrlToUsd(brl: number): number {
    return brl / CURRENT_EXCHANGE_RATE.usd_to_brl;
  }

  /**
   * Formata moeda
   */
  static formatCurrency(value: number, currency: 'USD' | 'BRL'): string {
    if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(value);
    } else {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    }
  }

  // Métodos auxiliares privados
  private static getTokensFromLocalStorage(professorId: number): TokenUsage[] {
    try {
      const key = `token_usage_${professorId}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private static getConversasCount(professorId: number, periodo: string): number {
    // Simulado - seria uma consulta ao banco
    // Por enquanto, estima baseado no número de tokens únicos por dia
    const tokens = this.getTokensFromLocalStorage(professorId);
    const tokensPeríodo = tokens.filter(token => {
      const tokenDate = new Date(token.timestamp);
      return tokenDate.toISOString().slice(0, 7) === periodo;
    });

    // Estima 1 conversa a cada 5 mensagens
    return Math.ceil(tokensPeríodo.length / 5);
  }

  private static getMensagensHoje(professorId: number, hoje: string): number {
    const tokens = this.getTokensFromLocalStorage(professorId);
    return tokens.filter(token => {
      const tokenDate = new Date(token.timestamp);
      return tokenDate.toISOString().slice(0, 10) === hoje;
    }).length;
  }

  private static async enviarAlerta(professorId: number, tipo: string, stats: ProfessorUsageStats): Promise<void> {
    // Implementar envio de alertas (email, notificação, etc.)
    console.log(`🚨 Alerta ${tipo} para professor ${professorId}:`, {
      gasto_atual: this.formatCurrency(stats.gasto_atual_usd, 'USD'),
      percentual: stats.percentual_gasto.toFixed(1) + '%'
    });
  }
}