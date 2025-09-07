import { supabase } from '../lib/supabase';
import { Habilidade } from '../components/PlanoAula/SeletorHabilidades';
import { habilidadesMock } from '../mocks/habilidadesMock';

/**
 * Busca habilidades por disciplina e outros filtros opcionais
 */
export const buscarHabilidades = async (
  disciplina: string,
  praticaLinguagem?: string,
  trimestre?: string,
  ano?: number
): Promise<Habilidade[]> => {
  try {
    let query = supabase
      .from('habilidades')
      .select('*')
      .eq('disciplina', disciplina);

    // Aplicar filtros adicionais se fornecidos
    if (praticaLinguagem) {
      query = query.eq('pratica_linguagem', praticaLinguagem);
    }
    
    if (trimestre) {
      query = query.eq('trimestre', trimestre);
    }
    
    if (ano) {
      query = query.eq('ano', ano);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar habilidades:', error);
      return [];
    }

    return data.map((item: any) => ({
      id: item.id,
      codigo: item.codigo,
      descricao: item.descricao
    }));
  } catch (error) {
    console.error('Erro ao buscar habilidades:', error);
    return [];
  }
};