import { supabase } from '../lib/supabase';

export interface Professor {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  escola_id: string;
  created_at: string;
  carga_horaria_semanal_total?: string | null;
  carga_horaria_mensal_total?: string | null;
  avatar_url?: string | null;
}

export interface Modalidade {
  id: string;
  nome: string;
  descricao: string | null;
}

export interface ProfessorComModalidades extends Professor {
  modalidades: Modalidade[];
}


// Nova interface para detalhar as turmas do professor
export interface TurmaDetalhadaProfessor {
  id: number; // ID da tabela turmas
  nome_turma: string;
  ano_turma: string;
  nome_disciplina: string;
  modalidade_id?: number;
  modalidade_nome?: string;
}

/**
 * Obtém as informações do professor a partir do ID do usuário
 * @param userId ID do usuário autenticado ou email
 * @returns Professor com suas informações
 */
export const getProfessorByUserId = async (userId: string): Promise<Professor | null> => {
  try {
    console.log(`[ProfessorService] getProfessorByUserId chamado com: ${userId}`);
    
    // Se userId for um email, tente buscar diretamente por email primeiro
    if (userId.includes('@')) {
      console.log(`[ProfessorService] Tentando buscar por email: ${userId}`);
      const { data: dataEmail, error: errorEmail } = await supabase
        .from('professores')
        .select('id, nome, email, telefone, escola_id, created_at, carga_horaria_semanal_total, carga_horaria_mensal_total, user_id, avatar_url')
        .eq('email', userId)
        .maybeSingle();
        
      if (errorEmail) {
        console.error('[ProfessorService] Erro ao buscar por email:', errorEmail);
      }
      if (dataEmail) {
        console.log('[ProfessorService] Professor encontrado por email:', dataEmail);
        return dataEmail;
      }
      console.log('[ProfessorService] Professor NÃO encontrado por email, ou houve erro mas dataEmail é null.');
    } else {
      // Se userId não for email, tenta buscar por user_id primeiro
      console.log(`[ProfessorService] Tentando buscar por user_id: ${userId}`);
      const { data: dataUserId, error: errorUserId } = await supabase
        .from('professores')
        .select('id, nome, email, telefone, escola_id, created_at, carga_horaria_semanal_total, carga_horaria_mensal_total, user_id, avatar_url')
        .eq('user_id', userId)
        .maybeSingle();

      if (!errorUserId && dataUserId) {
        console.log('[ProfessorService] Professor encontrado por user_id:', dataUserId);
        return dataUserId;
      }
      
      console.log('[ProfessorService] Professor não encontrado por user_id.');
    }
    
    console.log('[ProfessorService] Professor não encontrado por nenhum método.');
    return null;
  } catch (error) {
    console.error('Erro ao buscar professor:', error);
    return null;
  }
};

/**
 * Obtém todas as modalidades disponíveis no sistema
 * @returns Lista de modalidades
 */
export const getTodasModalidades = async (): Promise<Modalidade[]> => {
  try {
    const { data, error } = await supabase
      .from('modalidades')
      .select('*')
      .order('nome');
      
    if (error) {
      console.error('Erro ao buscar modalidades:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar modalidades:', error);
    return [];
  }
};

/**
 * Obtém todas as modalidades de ensino do professor baseado nas turmas em que leciona
 * @param professorId ID do professor
 * @returns Array de modalidades únicas do professor
 */
export const getModalidadesDoProfessor = async (professorId: string): Promise<Modalidade[]> => {
  try {
    // Buscar modalidades através das turmas do professor usando SQL bruto
    const { data, error } = await supabase
      .rpc('get_modalidades_do_professor', {
        p_professor_id: professorId
      });

    if (error) {
      console.error('Erro ao buscar modalidades do professor:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar modalidades do professor:', error);
    return [];
  }
};

/**
 * Obtém as informações do professor com suas modalidades
 * @param userId ID do usuário autenticado ou email
 * @returns Professor com informações de modalidades
 */
export const getProfessorComModalidades = async (userId: string): Promise<ProfessorComModalidades | null> => {
  try {
    // Buscar o professor primeiro
    const professor = await getProfessorByUserId(userId);
    
    if (!professor) {
      return null;
    }
    
    // Buscar todas as modalidades do professor através das turmas
    const modalidades = await getModalidadesDoProfessor(professor.id);
    
    // Retorna o professor com suas modalidades
    return {
      ...professor,
      modalidades
    };
  } catch (error) {
    console.error('Erro ao buscar professor com modalidades:', error);
    return null;
  }
};

/**
 * Obtém todas as turmas e disciplinas que um professor leciona.
 * @param professorId ID do professor.
 * @returns Array de turmas detalhadas do professor.
 */
export const getTurmasDoProfessorDetalhado = async (professorId: string): Promise<TurmaDetalhadaProfessor[]> => {
  if (!professorId) {
    console.warn('[ProfessorService] professorId não fornecido para getTurmasDoProfessorDetalhado.');
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('professores_turmas_disciplinas')
      .select(`
        turma_id, 
        turmas!inner ( id, nome, ano, modalidade_id, modalidades ( nome ) ),
        disciplinas!inner ( nome )
      `)
      .eq('professor_id', professorId);

    if (error) {
      console.error('[ProfessorService] Erro ao buscar turmas detalhadas do professor:', error);
      throw error;
    }

    if (!data) {
      return [];
    }

    // Mapear os dados para a interface TurmaDetalhadaProfessor
    const turmasDetalhadas: TurmaDetalhadaProfessor[] = data.map((item: any) => ({
      id: item.turmas.id,
      nome_turma: item.turmas.nome,
      ano_turma: item.turmas.ano,
      nome_disciplina: item.disciplinas.nome,
      modalidade_id: item.turmas?.modalidade_id ?? undefined,
      modalidade_nome: item.turmas?.modalidades?.nome ?? undefined,
    }));

    return turmasDetalhadas;

  } catch (error) {
    console.error('[ProfessorService] Exceção em getTurmasDoProfessorDetalhado:', error);
    return []; // Retorna array vazio em caso de exceção
  }
};

/**
 * Obtém o nome de uma escola pelo seu ID.
 * @param escolaId ID da escola.
 * @returns Nome da escola ou null se não encontrada ou erro.
 */
export const getEscolaNomeById = async (escolaId: string): Promise<string | null> => {
  if (!escolaId) {
    console.warn('[ProfessorService] escolaId não fornecido para getEscolaNomeById.');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('escolas') // Supondo que o nome da tabela seja 'escolas'
      .select('nome')
      .eq('id', escolaId)
      .maybeSingle();

    if (error) {
      console.error(`[ProfessorService] Erro ao buscar nome da escola ID ${escolaId}:`, error);
      return null;
    }

    return data?.nome || null;

  } catch (error) {
    console.error(`[ProfessorService] Exceção em getEscolaNomeById para ID ${escolaId}:`, error);
    return null;
  }
};

/**
 * Obtém todos os professores do sistema.
 * @returns Lista de todos os professores com id, nome e email.
 */
export const getAllProfessores = async (): Promise<Pick<Professor, 'id' | 'nome' | 'email'>[]> => {
  try {
    const { data, error } = await supabase
      .from('professores')
      .select('id, nome, email');

    if (error) {
      console.error('[ProfessorService] Erro ao buscar todos os professores:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('[ProfessorService] Exceção em getAllProfessores:', error);
    return [];
  }
};