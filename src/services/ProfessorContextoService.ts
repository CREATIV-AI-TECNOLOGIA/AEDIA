import { supabase } from '../lib/supabaseClient';

// Interfaces para tipar o retorno da query
interface DisciplinaInfo {
  nome: string;
}

interface ProfessorTurmaDisciplinaInfo {
  disciplina_id: number;
  disciplinas: DisciplinaInfo | null; // Pode ser null se o join não encontrar correspondência (improvável com !inner)
}

interface TurmaComContexto {
  ano: string;
  professores_turmas_disciplinas: ProfessorTurmaDisciplinaInfo | ProfessorTurmaDisciplinaInfo[] | null;
  id: number;
  nome: string;
}

// Interface para o retorno da função
export interface ProfessorContexto {
  ano: string; // Ex: "1º Ano"
  disciplinaId: number;
  disciplinaNome: string;
  turmaId: number;
  turmaNome: string;
}

/**
 * Busca o ano da turma e a disciplina que um professor leciona para uma dada modalidade.
 * @param professorId - O ID numérico do professor (da tabela 'professores').
 * @param modalidadeId - O ID da modalidade de ensino selecionada.
 * @returns Um objeto com ano, disciplinaId e disciplinaNome, ou null se não encontrado.
 */
export const getAnoDisciplinaParaModalidade = async (
  professorId: number,
  modalidadeId: number
): Promise<ProfessorContexto | null> => {
  if (!professorId || !modalidadeId) {
    console.warn('IDs do professor ou modalidade não fornecidos para buscar contexto.');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('turmas')
      .select(`
        ano,
        id,
        nome,
        professores_turmas_disciplinas!inner (
          disciplina_id,
          disciplinas!inner ( nome )
        )
      `)
      .eq('modalidade_id', modalidadeId)
      .eq('professores_turmas_disciplinas.professor_id', professorId)
      .limit(1) // Embora single() seja usado, o join interno para professores_turmas_disciplinas pode ser um array
      .single<TurmaComContexto>(); // Aplicando a tipagem aqui

    if (error) {
      // Código PGRST116: "failed to parse single object" - geralmente significa 0 ou >1 linhas quando 1 era esperada.
      if (error.code === 'PGRST116') { 
        console.log(`Nenhum contexto de ano/disciplina encontrado para prof ID: ${professorId}, modalidade ID: ${modalidadeId}. (PGRST116)`);
        return null;
      }
      console.error(`Erro ao buscar ano/disciplina para modalidade (prof ID: ${professorId}, mod ID: ${modalidadeId}):`, error);
      return null;
    }

    if (data && data.professores_turmas_disciplinas) {
      let ptdInfo: ProfessorTurmaDisciplinaInfo | undefined;

      // data.professores_turmas_disciplinas pode ser um objeto ou um array (geralmente array com um item devido ao filtro)
      if (Array.isArray(data.professores_turmas_disciplinas)) {
        if (data.professores_turmas_disciplinas.length > 0) {
          ptdInfo = data.professores_turmas_disciplinas[0] as ProfessorTurmaDisciplinaInfo; 
          // Validação adicional para o caso de o array conter algo inesperado (ex: null ou objeto malformado)
          if (!ptdInfo || typeof ptdInfo.disciplina_id === 'undefined') { // Checa uma propriedade chave
             console.warn(`Elemento inválido ou malformado em professores_turmas_disciplinas[0] para prof ID: ${professorId}, modalidade ID: ${modalidadeId}. Elemento:`, ptdInfo);
             ptdInfo = undefined; // Resetar se malformado ou nulo
          }
        } else {
            console.log(`professores_turmas_disciplinas é um array vazio para prof ID: ${professorId}, modalidade ID: ${modalidadeId}.`);
        }
      } else {
        // Se não for um array, trata como um objeto único ProfessorTurmaDisciplinaInfo
        ptdInfo = data.professores_turmas_disciplinas as ProfessorTurmaDisciplinaInfo;
      }

      if (ptdInfo && ptdInfo.disciplinas && typeof ptdInfo.disciplina_id === 'number' && typeof ptdInfo.disciplinas.nome === 'string') {
        return {
          ano: data.ano,
          disciplinaId: ptdInfo.disciplina_id,
          disciplinaNome: ptdInfo.disciplinas.nome,
          turmaId: data.id,
          turmaNome: data.nome,
        };
      } else {
        // Log mais detalhado se a estrutura interna de ptdInfo não for a esperada
        if (ptdInfo) {
            console.log(`Estrutura interna de ptdInfo (${typeof ptdInfo}) inesperada para prof ID: ${professorId}, modalidade ID: ${modalidadeId}. Detalhes:`, {
                hasDisciplinasProperty: Object.prototype.hasOwnProperty.call(ptdInfo, 'disciplinas'),
                disciplinasContent: ptdInfo.disciplinas,
                isDisciplinaIdNumber: typeof ptdInfo.disciplina_id === 'number',
                disciplinaIdContent: ptdInfo.disciplina_id,
                isDisciplinaNomeString: ptdInfo.disciplinas ? typeof ptdInfo.disciplinas.nome === 'string' : 'disciplinas_is_null_or_undefined',
                disciplinaNomeContent: ptdInfo.disciplinas ? ptdInfo.disciplinas.nome : undefined,
                // ptdInfoInspect: ptdInfo // Cuidado ao logar objetos grandes e complexos
            });
        } else if (data.professores_turmas_disciplinas) { 
            console.log(`Não foi possível extrair ptdInfo de data.professores_turmas_disciplinas para prof ID: ${professorId}, modalidade ID: ${modalidadeId}. Conteúdo original:`, data.professores_turmas_disciplinas);
        }
      }
    }
    
    // Se chegou aqui, os dados não foram processados corretamente ou estavam ausentes/malformados.
    // O log original "Dados de contexto incompletos ou estrutura inesperada..." será substituído pelos logs mais específicos acima.
    console.log(`Retornando null de getAnoDisciplinaParaModalidade. Condições não atendidas para prof ID: ${professorId}, modalidade ID: ${modalidadeId}. Query data (pode ser útil para depuração):`, data);
    return null;

  } catch (e) {
    console.error(`Exceção ao tentar buscar ano/disciplina para modalidade (prof ID: ${professorId}, mod ID: ${modalidadeId}):`, e);
    return null;
  }
}; 