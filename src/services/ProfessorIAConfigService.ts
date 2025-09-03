import { supabase } from '../lib/supabase';
import { ProfessorIAConfiguracoes, CONFIGURACOES_PADRAO } from '../types/ProfessorIAConfig';

export class ProfessorIAConfigService {
  /**
   * Busca as configurações da IA para um professor em uma escola específica
   */
  static async getConfiguracoes(professorId: number, escolaId: number): Promise<ProfessorIAConfiguracoes | null> {
    try {
      const { data, error } = await supabase
        .from('professor_ia_configuracoes')
        .select('*')
        .eq('professor_id', professorId)
        .eq('escola_id', escolaId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Nenhuma configuração encontrada, retorna null
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar configurações da IA:', error);
      throw error;
    }
  }

  /**
   * Busca as configurações da IA ou retorna as configurações padrão se não existir
   */
  static async getConfiguracaoesOuPadrao(professorId: number, escolaId: number): Promise<ProfessorIAConfiguracoes> {
    const configuracoes = await this.getConfiguracoes(professorId, escolaId);
    
    if (configuracoes) {
      return configuracoes;
    }

    // Retorna configurações padrão com os IDs necessários
    return {
      ...CONFIGURACOES_PADRAO,
      professor_id: professorId,
      escola_id: escolaId
    };
  }

  /**
   * Salva ou atualiza as configurações da IA
   */
  static async salvarConfiguracoes(configuracoes: ProfessorIAConfiguracoes): Promise<ProfessorIAConfiguracoes> {
    try {
      // Verificar se já existe uma configuração
      const configuracaoExistente = await this.getConfiguracoes(
        configuracoes.professor_id, 
        configuracoes.escola_id
      );

      if (configuracaoExistente) {
        // Atualizar configuração existente
        const { data, error } = await supabase
          .from('professor_ia_configuracoes')
          .update({
            metodologia_preferida: configuracoes.metodologia_preferida,
            estilo_ensino: configuracoes.estilo_ensino,
            nivel_detalhamento: configuracoes.nivel_detalhamento,
            incluir_atividades_praticas: configuracoes.incluir_atividades_praticas,
            incluir_recursos_digitais: configuracoes.incluir_recursos_digitais,
            incluir_avaliacao: configuracoes.incluir_avaliacao,
            incluir_materiais_necessarios: configuracoes.incluir_materiais_necessarios,
            incluir_tempo_estimado: configuracoes.incluir_tempo_estimado,
            considerar_inclusao: configuracoes.considerar_inclusao,
            considerar_diversidade: configuracoes.considerar_diversidade,
            adaptar_para_recursos_limitados: configuracoes.adaptar_para_recursos_limitados,
            formato_preferido: configuracoes.formato_preferido,
            linguagem_nivel: configuracoes.linguagem_nivel,
            preferencias_avaliacao: configuracoes.preferencias_avaliacao,
            recursos_disponiveis: configuracoes.recursos_disponiveis,
            efemerides_periodo: configuracoes.efemerides_periodo,
            eventos_escolares: configuracoes.eventos_escolares,
            observacoes_especiais: configuracoes.observacoes_especiais,
            contexto_escola: configuracoes.contexto_escola
          })
          .eq('id', configuracaoExistente.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Criar nova configuração
        const { data, error } = await supabase
          .from('professor_ia_configuracoes')
          .insert({
            professor_id: configuracoes.professor_id,
            escola_id: configuracoes.escola_id,
            metodologia_preferida: configuracoes.metodologia_preferida,
            estilo_ensino: configuracoes.estilo_ensino,
            nivel_detalhamento: configuracoes.nivel_detalhamento,
            incluir_atividades_praticas: configuracoes.incluir_atividades_praticas,
            incluir_recursos_digitais: configuracoes.incluir_recursos_digitais,
            incluir_avaliacao: configuracoes.incluir_avaliacao,
            incluir_materiais_necessarios: configuracoes.incluir_materiais_necessarios,
            incluir_tempo_estimado: configuracoes.incluir_tempo_estimado,
            considerar_inclusao: configuracoes.considerar_inclusao,
            considerar_diversidade: configuracoes.considerar_diversidade,
            adaptar_para_recursos_limitados: configuracoes.adaptar_para_recursos_limitados,
            formato_preferido: configuracoes.formato_preferido,
            linguagem_nivel: configuracoes.linguagem_nivel,
            preferencias_avaliacao: configuracoes.preferencias_avaliacao,
            recursos_disponiveis: configuracoes.recursos_disponiveis,
            efemerides_periodo: configuracoes.efemerides_periodo,
            eventos_escolares: configuracoes.eventos_escolares,
            observacoes_especiais: configuracoes.observacoes_especiais,
            contexto_escola: configuracoes.contexto_escola
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Erro ao salvar configurações da IA:', error);
      throw error;
    }
  }

  /**
   * Deleta as configurações da IA (volta para o padrão)
   */
  static async deletarConfiguracoes(professorId: number, escolaId: number): Promise<void> {
    try {
      const { error } = await supabase
        .from('professor_ia_configuracoes')
        .delete()
        .eq('professor_id', professorId)
        .eq('escola_id', escolaId);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao deletar configurações da IA:', error);
      throw error;
    }
  }

  /**
   * Gera um prompt personalizado baseado nas configurações
   */
  static gerarPromptPersonalizado(configuracoes: ProfessorIAConfiguracoes): string {
    let prompt = "Considerando as seguintes preferências pedagógicas:\n\n";

    // Metodologia
    if (configuracoes.metodologia_preferida) {
      prompt += `- Metodologia preferida: ${configuracoes.metodologia_preferida}\n`;
    }

    // Estilo de ensino
    if (configuracoes.estilo_ensino) {
      prompt += `- Estilo de ensino: ${configuracoes.estilo_ensino}\n`;
    }

    // Nível de detalhamento
    prompt += `- Nível de detalhamento: ${configuracoes.nivel_detalhamento}\n`;

    // Formato
    prompt += `- Formato preferido: ${configuracoes.formato_preferido}\n`;
    prompt += `- Nível de linguagem: ${configuracoes.linguagem_nivel}\n`;

    // Elementos a incluir
    const elementos = [];
    if (configuracoes.incluir_atividades_praticas) elementos.push("atividades práticas");
    if (configuracoes.incluir_recursos_digitais) elementos.push("recursos digitais");
    if (configuracoes.incluir_avaliacao) elementos.push("métodos de avaliação");
    if (configuracoes.incluir_materiais_necessarios) elementos.push("lista de materiais");
    if (configuracoes.incluir_tempo_estimado) elementos.push("tempo estimado");

    if (elementos.length > 0) {
      prompt += `- Incluir: ${elementos.join(", ")}\n`;
    }

    // Considerações especiais
    const consideracoes = [];
    if (configuracoes.considerar_inclusao) consideracoes.push("práticas inclusivas");
    if (configuracoes.considerar_diversidade) consideracoes.push("diversidade cultural");
    if (configuracoes.adaptar_para_recursos_limitados) consideracoes.push("recursos limitados");

    if (consideracoes.length > 0) {
      prompt += `- Considerar: ${consideracoes.join(", ")}\n`;
    }

    // Contexto da escola
    if (configuracoes.contexto_escola) {
      prompt += `- Contexto da escola: ${configuracoes.contexto_escola}\n`;
    }

    // Observações especiais
    if (configuracoes.observacoes_especiais) {
      prompt += `- Observações especiais: ${configuracoes.observacoes_especiais}\n`;
    }

    prompt += "\nCrie um plano de aula que atenda a essas preferências e características.";

    return prompt;
  }
}