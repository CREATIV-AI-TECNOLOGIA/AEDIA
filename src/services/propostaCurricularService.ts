import { obterPropostaCurricular } from '../utils/localStorageDB';

/**
 * Serviço para processar e buscar dados da proposta curricular
 */

// Tipos
export interface TrechoResultado {
  linhaEncontrada: number;
  texto: string;
  contexto: string;
}

export interface CapituloResultado {
  titulo: string;
  conteudo: string;
  linhaInicio: number;
  linhaFim: number;
}

/**
 * Obtém o conteúdo completo da proposta curricular
 * @returns {string|null} Conteúdo completo da proposta
 */
export const obterConteudoCompleto = (): string | null => {
  return obterPropostaCurricular();
};

/**
 * Busca por um termo específico na proposta curricular
 * @param {string} termo - Termo a ser buscado
 * @returns {Array<TrechoResultado>} - Array de trechos onde o termo foi encontrado
 */
export const buscarPorTermo = (termo: string): TrechoResultado[] => {
  if (!termo || termo.trim() === '') {
    return [];
  }

  const conteudo = obterPropostaCurricular();
  if (!conteudo) {
    return [];
  }

  const termoLowerCase = termo.toLowerCase();
  const linhas = conteudo.split('\n');
  const resultados: TrechoResultado[] = [];

  // Busca por linhas que contêm o termo
  linhas.forEach((linha, indice) => {
    if (linha.toLowerCase().includes(termoLowerCase)) {
      // Obtém contexto (linhas antes e depois)
      const inicio = Math.max(0, indice - 2);
      const fim = Math.min(linhas.length - 1, indice + 2);
      
      // Cria o trecho com contexto
      const trecho: TrechoResultado = {
        linhaEncontrada: indice + 1,
        texto: linhas.slice(inicio, fim + 1).join('\n'),
        contexto: `Linha ${inicio + 1} a ${fim + 1}`
      };
      
      resultados.push(trecho);
    }
  });

  return resultados;
};

/**
 * Extrai dados de um capítulo específico da proposta
 * @param {string} titulo - Título do capítulo a ser extraído
 * @returns {CapituloResultado|null} - Dados do capítulo ou null se não encontrado
 */
export const extrairCapitulo = (titulo: string): CapituloResultado | null => {
  const conteudo = obterPropostaCurricular();
  if (!conteudo) {
    return null;
  }

  const linhas = conteudo.split('\n');
  const tituloLowerCase = titulo.toLowerCase();
  
  // Encontra o índice de início do capítulo
  let indiceInicio = -1;
  for (let i = 0; i < linhas.length; i++) {
    if (linhas[i].toLowerCase().includes(tituloLowerCase)) {
      indiceInicio = i;
      break;
    }
  }
  
  if (indiceInicio === -1) {
    return null;
  }
  
  // Procura o próximo título de capítulo ou o final do documento
  let indiceFim = linhas.length;
  for (let i = indiceInicio + 1; i < linhas.length; i++) {
    // Assume que títulos de capítulos são linhas que contêm números seguidos de hífen
    if (/^\d+\s*-/.test(linhas[i].trim())) {
      indiceFim = i;
      break;
    }
  }
  
  // Extrai o conteúdo do capítulo
  const conteudoCapitulo = linhas.slice(indiceInicio, indiceFim).join('\n');
  
  return {
    titulo,
    conteudo: conteudoCapitulo,
    linhaInicio: indiceInicio + 1,
    linhaFim: indiceFim
  };
};

/**
 * Obtém lista de anos escolares da proposta curricular
 * @returns {string[]} - Lista de anos escolares encontrados
 */
export const obterAnosEscolares = (): string[] => {
  const conteudo = obterPropostaCurricular();
  if (!conteudo) {
    return [];
  }

  // Busca por padrões como "1º ANO", "2º ANO", etc.
  const regexAno = /(\d+)º\s+ANO/gi;
  const anos: string[] = [];
  let match;
  
  while ((match = regexAno.exec(conteudo)) !== null) {
    const ano = match[1];
    if (!anos.includes(ano)) {
      anos.push(ano);
    }
  }
  
  return anos.sort((a, b) => parseInt(a) - parseInt(b));
};

/**
 * Obtém conteúdo da proposta curricular para um ano específico
 * @param {string} ano - Ano escolar (ex: "1", "2", "3"...)
 * @returns {string|null} - Conteúdo específico do ano ou null se não encontrado
 */
export const obterConteudoPorAno = (ano: string): string | null => {
  if (!ano) {
    return null;
  }
  
  const conteudo = obterPropostaCurricular();
  if (!conteudo) {
    return null;
  }
  
  // Monta o padrão de busca
  const padrao = `${ano}º ANO`;
  const linhas = conteudo.split('\n');
  
  // Encontra a primeira ocorrência do padrão
  let indiceInicio = -1;
  for (let i = 0; i < linhas.length; i++) {
    if (linhas[i].includes(padrao)) {
      indiceInicio = i;
      break;
    }
  }
  
  if (indiceInicio === -1) {
    return null;
  }
  
  // Procura pelo próximo ano ou final do documento
  let indiceFim = linhas.length;
  const proximoAno = parseInt(ano) + 1;
  const padraoProximoAno = `${proximoAno}º ANO`;
  
  for (let i = indiceInicio + 1; i < linhas.length; i++) {
    if (linhas[i].includes(padraoProximoAno)) {
      indiceFim = i;
      break;
    }
  }
  
  // Extrai o conteúdo
  return linhas.slice(indiceInicio, indiceFim).join('\n');
}; 