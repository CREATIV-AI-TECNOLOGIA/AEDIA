import { supabase } from '../lib/supabaseClient';

/**
 * Busca o nome do trimestre letivo atual para um professor específico.
 * @param professorId - O ID numérico do professor (da tabela 'professores').
 * @returns O nome do trimestre atual (ex: "1º Trimestre") ou null se não encontrado.
 */
export const getTrimestreAtualNome = async (professorId: number): Promise<string | null> => {
  if (!professorId) {
    console.warn('ID do professor não fornecido para buscar trimestre atual.');
    return null;
  }

  const hojeString = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
  const anoAtual = new Date().getFullYear();

  try {
    const { data, error } = await supabase
      .from('periodos_letivos')
      .select('nome')
      .eq('professor_id', professorId)
      .eq('ano', anoAtual) // Comparando com o ano numérico
      .eq('tipo', 'trimestre')
      .lte('data_inicio', hojeString) // data_inicio <= hoje
      .gte('data_fim', hojeString)    // data_fim >= hoje
      .order('data_inicio', { ascending: false })
      .limit(1)
      .maybeSingle(); // .maybeSingle() evita erro 406 quando não há registros

    if (error) {
      console.error('Erro ao buscar trimestre atual:', error);
      return null;
    }

    if (!data) {
      console.log(`Nenhum trimestre atual encontrado para professor ID: ${professorId} no ano ${anoAtual}.`);
      return null;
    }

    return data.nome;

  } catch (e) {
    console.error('Exceção ao tentar buscar trimestre atual:', e);
    return null;
  }
};