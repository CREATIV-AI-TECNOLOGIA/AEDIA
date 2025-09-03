import { supabase } from '../lib/supabaseClient';
import type { Habilidade } from '../components/PlanoAula/SeletorHabilidades'; // Ajuste o caminho se necessário

interface MatrizHabilidadeRawFromDB {
  id: number; 
  habilidades_texto: string | null; // Corresponde ao alias no select: "habilidades_texto:habilidades"
}

/**
 * Busca e formata as habilidades da matriz curricular com base nos filtros fornecidos.
 * @param disciplinaId - O ID da disciplina.
 * @param ano - O ano escolar (ex: "1º Ano").
 * @param trimestreNome - O nome do trimestre (ex: "1º Trimestre").
 * @returns Uma lista de objetos Habilidade formatados.
 */
export const getHabilidadesFormatadas = async (
  disciplinaId: number | null,
  ano: string | null,
  trimestreNome: string | null
): Promise<Habilidade[]> => {
  if (disciplinaId === null || ano === null || trimestreNome === null) {
    console.warn('Filtros incompletos para buscar habilidades (disciplina, ano ou trimestre ausente).');
    return [];
  }

  try {
    // O Supabase client infere os tipos do retorno do select se não houver um <T> genérico explícito.
    // Para joins ou selects complexos, às vezes é melhor tipar explicitamente o retorno do .then() ou da desestruturação.
    const { data, error } = await supabase
      .from('matriz_curricular')
      .select('id, habilidades_texto:habilidades') // Alias "habilidades" to "habilidades_texto"
      .eq('disciplina_id', disciplinaId)
      .eq('ano', ano)
      .eq('trimestre', trimestreNome);

    if (error) {
      console.error('Erro ao buscar habilidades da matriz curricular:', error);
      return [];
    }

    if (!data) {
      return [];
    }

    // Tipando 'data' explicitamente para ajudar o TypeScript dentro do map
    const rawHabilidades = data as MatrizHabilidadeRawFromDB[];

    const habilidadesFormatadas: Habilidade[] = rawHabilidades.map((item) => {
      const texto = item.habilidades_texto || ''; 
      const match = texto.match(/\(([^)]+)\)\s*(.*)/);
      
      if (match && match[1] && match[2]) {
        return {
          id: item.id.toString(), 
          codigo: match[1].trim(),
          descricao: match[2].trim(),
        };
      }
      console.warn(`Habilidade com formatação inesperada na matriz_curricular (ID: ${item.id}): ${texto}`);
      return null;
    }).filter(h => h !== null) as Habilidade[]; 

    return habilidadesFormatadas;

  } catch (e) {
    console.error('Exceção ao tentar buscar habilidades da matriz curricular:', e);
    return [];
  }
}; 