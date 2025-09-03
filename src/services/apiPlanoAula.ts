import { supabase } from '../lib/supabaseClient'; // Importando o cliente Supabase configurado

/**
 * Busca o ID de uma disciplina pelo nome no Supabase.
 * @param nomeDisciplina - O nome da disciplina (ex: "Língua Portuguesa").
 * @returns O ID da disciplina ou null se não encontrada.
 */
export const fetchDisciplinaId = async (nomeDisciplina: string): Promise<number | null> => {
  console.log(`[API Service] Buscando ID para disciplina: ${nomeDisciplina}`);
  try {
    const { data, error } = await supabase
      .from('disciplinas')
      .select('id')
      .ilike('nome', `%${nomeDisciplina}%`)
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`[API Service] Disciplina "${nomeDisciplina}" não encontrada.`);
        return null;
      }
      console.error(`[API Service] Erro ao buscar ID da disciplina "${nomeDisciplina}":`, error);
      throw error;
    }
    return data ? data.id : null;
  } catch (err) {
    console.error(`[API Service] Exceção ao buscar ID da disciplina "${nomeDisciplina}":`, err);
    return null;
  }
};

// Função auxiliar para processar campos que podem ser array ou string separada por vírgula
const processField = (fieldData: unknown): string[] => {
  if (!fieldData) return [];
  if (Array.isArray(fieldData)) {
    // Se já for array, apenas garante que todos os elementos são strings e filtra vazios/nulos
    return fieldData.map(item => String(item).trim()).filter(item => item);
  }
  // Se for string, faz split, trim e filter
  return String(fieldData).split(',').map((item: string) => item.trim()).filter((item: string) => item.length > 0);
};

interface DetalhesHabilidadeContextual {
  praticasLinguagem: string[];
  unidadesTematicas: string[];
}

/**
 * Busca Práticas de Linguagem ou Unidades Temáticas para uma habilidade específica.
 * @param codigoHabilidade - O código da habilidade (ex: "EF01LP05").
 * @param anoEnsino - O ano de ensino (ex: "1º Ano").
 * @param trimestre - O trimestre (ex: "1º Trimestre").
 * @param disciplinaId - O ID da disciplina.
 * @returns Um objeto com arrays para praticasLinguagem e unidadesTematicas.
 */
export const fetchDetalhesHabilidadeContextual = async (
  codigoHabilidade: string,
  anoEnsino: string,
  trimestre: string,
  disciplinaId: number
): Promise<DetalhesHabilidadeContextual> => {
  console.log(`[API Service] Buscando Práticas/Unidades para: Hab: ${codigoHabilidade}, Ano: ${anoEnsino}, Trim: ${trimestre}, DiscId: ${disciplinaId}`);
  try {
    const { data, error } = await supabase
      .from('matriz_curricular')
      .select('praticas_linguagem, unidades_tematicas') // Apenas estes campos
      .like('habilidades', `(${codigoHabilidade})%`)
      .eq('ano', anoEnsino)
      .eq('trimestre', trimestre)
      .eq('disciplina_id', disciplinaId)
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`[API Service] Práticas/Unidades não encontradas para ${codigoHabilidade}.`);
        return { praticasLinguagem: [], unidadesTematicas: [] };
      }
      console.error(`[API Service] Erro ao buscar Práticas/Unidades para ${codigoHabilidade}:`, error);
      throw error;
    }

    const praticasLinguagem = processField(data?.praticas_linguagem);
    const unidadesTematicas = processField(data?.unidades_tematicas);

    return { praticasLinguagem, unidadesTematicas };

  } catch (err) {
    console.error(`[API Service] Exceção ao buscar Práticas/Unidades para ${codigoHabilidade}:`, err);
    return { praticasLinguagem: [], unidadesTematicas: [] };
  }
};

interface CamposCurricularesTrimestre {
  generosTextuais: string[];
  objetosConhecimento: string[];
}

/**
 * Busca Gêneros Textuais e Objetos de Conhecimento para um contexto específico.
 * @param disciplinaId - O ID da disciplina.
 * @param anoEnsino - O ano de ensino (ex: "1º Ano").
 * @param trimestre - O trimestre (ex: "1º Trimestre").
 * @returns Um objeto com arrays para generosTextuais e objetosConhecimento.
 */
export const fetchCamposCurricularesTrimestre = async (
  disciplinaId: number,
  anoEnsino: string,
  trimestre: string
): Promise<CamposCurricularesTrimestre> => {
  console.log(`[API Service] Buscando Gêneros/Objetos para: DiscId: ${disciplinaId}, Ano: ${anoEnsino}, Trim: ${trimestre}`);
  try {
    // Buscamos a primeira entrada que corresponda ao contexto. Assumimos que Gêneros/Objetos são consistentes no trimestre.
    const { data, error } = await supabase
      .from('matriz_curricular')
      .select('generos_textuais, objetos_conhecimento')
      .eq('disciplina_id', disciplinaId)
      .eq('ano', anoEnsino)
      .eq('trimestre', trimestre)
      .limit(1) // Pega a primeira linha correspondente
      .maybeSingle(); // Retorna null se não encontrar, sem erro PGRST116

    if (error) {
      console.error(`[API Service] Erro ao buscar Gêneros/Objetos para o trimestre:`, error);
      throw error;
    }

    if (!data) {
      console.log(`[API Service] Gêneros/Objetos não encontrados para DiscId: ${disciplinaId}, Ano: ${anoEnsino}, Trim: ${trimestre}`);
      return { generosTextuais: [], objetosConhecimento: [] };
    }

    const generosTextuais = processField(data?.generos_textuais);
    const objetosConhecimento = processField(data?.objetos_conhecimento);

    return { generosTextuais, objetosConhecimento };

  } catch (err) {
    console.error(`[API Service] Exceção ao buscar Gêneros/Objetos para o trimestre:`, err);
    return { generosTextuais: [], objetosConhecimento: [] };
  }
}; 