import { supabase } from '../lib/supabase';
import { Habilidade } from '../components/PlanoAula/SeletorHabilidades';

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

/**
 * Dados mock para desenvolvimento enquanto a API não está pronta
 */
export const getHabilidadesMock = (): Habilidade[] => {
  return [
    {
      id: '1',
      codigo: 'EF01LP01',
      descricao: 'Reconhecer que textos são lidos e escritos da esquerda para a direita e de cima para baixo da página.'
    },
    {
      id: '2',
      codigo: 'EF01LP02',
      descricao: 'Escrever, espontaneamente ou por ditado, palavras e frases de forma alfabética – usando letras/grafemas que representem fonemas.'
    },
    {
      id: '3',
      codigo: 'EF01LP03',
      descricao: 'Observar escritas convencionais, comparando-as às suas produções escritas, percebendo semelhanças e diferenças.'
    },
    {
      id: '4',
      codigo: 'EF01LP04',
      descricao: 'Distinguir as letras do alfabeto de outros sinais gráficos.'
    },
    {
      id: '5',
      codigo: 'EF01LP05',
      descricao: 'Reconhecer o sistema de escrita alfabética como representação dos sons da fala.'
    },
    {
      id: '6',
      codigo: 'EF01LP06',
      descricao: 'Segmentar oralmente palavras em sílabas.'
    },
    {
      id: '7',
      codigo: 'EF01LP07',
      descricao: 'Identificar fonemas e sua representação por letras.'
    },
    {
      id: '8',
      codigo: 'EF01LP08',
      descricao: 'Relacionar elementos sonoros (sílabas, fonemas, partes de palavras) com sua representação escrita.'
    },
    {
      id: '9',
      codigo: 'EF01LP09',
      descricao: 'Comparar palavras, identificando semelhanças e diferenças entre sons de sílabas iniciais, mediais e finais.'
    },
    {
      id: '10',
      codigo: 'EF01LP10',
      descricao: 'Nomear as letras do alfabeto e recitá-lo na ordem das letras.'
    },
    {
      id: '11',
      codigo: 'EF01LP11',
      descricao: 'Conhecer, diferenciar e relacionar letras em formato imprensa e cursiva, maiúsculas e minúsculas.'
    },
    {
      id: '12',
      codigo: 'EF01LP12',
      descricao: 'Reconhecer a separação das palavras, na escrita, por espaços em branco.'
    }
  ];
};