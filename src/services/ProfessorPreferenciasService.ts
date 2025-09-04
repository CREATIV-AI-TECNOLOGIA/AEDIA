import { supabase } from '../lib/supabase';

export interface ProfessorPreferencias {
  id?: string;
  professor_id: number; // Mantido como number para consistência com schema do banco (integer)
  plano_aula_cards_visible: boolean;
  plano_aula_conteudos_curriculares_visible: boolean;
  tema_interface: string;
  notificacoes_ativas: boolean;
  created_at?: string;
  updated_at?: string;
}

export const PREFERENCIAS_PADRAO: Omit<ProfessorPreferencias, 'id' | 'professor_id' | 'created_at' | 'updated_at'> = {
  plano_aula_cards_visible: true,
  plano_aula_conteudos_curriculares_visible: true,
  tema_interface: 'claro',
  notificacoes_ativas: true,
};

export class ProfessorPreferenciasService {
  /**
   * Busca as preferências do professor
   */
  static async getPreferencias(professorId: number): Promise<ProfessorPreferencias> {
    try {
      const { data, error } = await supabase
        .from('professor_preferencias')
        .select('*')
        .eq('professor_id', professorId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        // Nenhuma preferência encontrada, criar com valores padrão
        return await this.criarPreferenciasPadrao(professorId);
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar preferências do professor:', error);
      // Retorna preferências padrão em caso de erro
      return {
        ...PREFERENCIAS_PADRAO,
        professor_id: professorId,
      };
    }
  }

  /**
   * Atualiza uma preferência específica do professor
   */
  static async atualizarPreferencia(
    professorId: number, 
    campo: keyof Omit<ProfessorPreferencias, 'id' | 'professor_id' | 'created_at' | 'updated_at'>, 
    valor: boolean | string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('professor_preferencias')
        .upsert({
          professor_id: professorId,
          [campo]: valor,
        }, {
          onConflict: 'professor_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error(`Erro ao atualizar preferência ${campo}:`, error);
      throw error;
    }
  }

  /**
   * Cria preferências padrão para um professor
   */
  static async criarPreferenciasPadrao(professorId: number): Promise<ProfessorPreferencias> {
    try {
      const { data, error } = await supabase
        .from('professor_preferencias')
        .insert({
          professor_id: professorId,
          ...PREFERENCIAS_PADRAO,
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao criar preferências padrão:', error);
      // Retorna preferências padrão mesmo se falhar ao salvar
      return {
        ...PREFERENCIAS_PADRAO,
        professor_id: professorId,
      };
    }
  }

  /**
   * Atualiza múltiplas preferências de uma vez
   */
  static async atualizarMultiplasPreferencias(
    professorId: number, 
    preferencias: Partial<Omit<ProfessorPreferencias, 'id' | 'professor_id' | 'created_at' | 'updated_at'>>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('professor_preferencias')
        .upsert({
          professor_id: professorId,
          ...preferencias,
        }, {
          onConflict: 'professor_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao atualizar múltiplas preferências:', error);
      throw error;
    }
  }
}