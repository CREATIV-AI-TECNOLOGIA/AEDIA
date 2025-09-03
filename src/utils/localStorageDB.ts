/**
 * Utilitário para gerenciar a proposta curricular no localStorage
 */

import { PropostaCurricular, ItemProposta } from '../types/proposta';
import { PlanoAulaSupabase } from '../pages/PlanosAula';

// Definindo interfaces locais para compatibilidade
interface PlanoAula extends PlanoAulaSupabase {
  dataCriacao: Date;
  dataAtualizacao: Date;
  ano?: string;
  disciplina?: string;
  trimestre?: string;
}

interface PlanoAulaFormData {
  titulo: string;
  descricao: string;
  data: string;
  disciplina_id?: number;
  turma_id?: number;
  periodo_letivo_id?: string;
  professor_id?: number;
}

// Chaves para armazenamento no localStorage
const PROPOSTA_CURRICULAR_KEY = 'propostaCurricular';
const PLANOS_AULA_KEY = 'planosAula';

/**
 * Salva a proposta curricular no localStorage
 * @param {string} conteudo - Conteúdo da proposta curricular 
 * @returns {boolean} - Indica se a operação foi bem-sucedida
 */
export const salvarPropostaCurricular = (conteudo: string): boolean => {
  try {
    localStorage.setItem(PROPOSTA_CURRICULAR_KEY, conteudo);
    return true;
  } catch (error) {
    console.error('Erro ao salvar proposta curricular no localStorage:', error);
    return false;
  }
};

/**
 * Recupera a proposta curricular do localStorage
 * @returns {string|null} - Conteúdo da proposta curricular ou null se não encontrada
 */
export const obterPropostaCurricular = (): string | null => {
  try {
    return localStorage.getItem(PROPOSTA_CURRICULAR_KEY);
  } catch (error) {
    console.error('Erro ao recuperar proposta curricular do localStorage:', error);
    return null;
  }
};

/**
 * Verifica se a proposta curricular já está salva no localStorage
 * @returns {boolean} - Indica se a proposta já está salva
 */
export const verificarPropostaSalva = (): boolean => {
  try {
    return localStorage.getItem(PROPOSTA_CURRICULAR_KEY) !== null;
  } catch (error) {
    console.error('Erro ao verificar se proposta curricular está salva:', error);
    return false;
  }
};

/**
 * Remove a proposta curricular do localStorage
 * @returns {boolean} - Indica se a operação foi bem-sucedida
 */
export const removerPropostaCurricular = (): boolean => {
  try {
    localStorage.removeItem(PROPOSTA_CURRICULAR_KEY);
    return true;
  } catch (error) {
    console.error('Erro ao remover proposta curricular do localStorage:', error);
    return false;
  }
};

// Funções para manipulação da Proposta Curricular
export function salvarProposta(proposta: PropostaCurricular): void {
  localStorage.setItem(PROPOSTA_CURRICULAR_KEY, JSON.stringify(proposta));
}

export function obterPropostaSalva(): PropostaCurricular | null {
  const propostaJSON = localStorage.getItem(PROPOSTA_CURRICULAR_KEY);
  return propostaJSON ? JSON.parse(propostaJSON) : null;
}

export function limparProposta(): void {
  localStorage.removeItem(PROPOSTA_CURRICULAR_KEY);
}

// Funções para manipulação dos Planos de Aula
export function salvarPlanoAula(plano: PlanoAula): void {
  const planos = obterPlanosAula();
  
  // Verifica se já existe um plano com o mesmo ID
  const index = planos.findIndex(p => p.id === plano.id);
  
  if (index >= 0) {
    // Atualiza o plano existente
    planos[index] = {
      ...plano,
      dataAtualizacao: new Date()
    };
  } else {
    // Adiciona um novo plano
    planos.push({
      ...plano,
      dataCriacao: new Date(),
      dataAtualizacao: new Date()
    });
  }
  
  localStorage.setItem(PLANOS_AULA_KEY, JSON.stringify(planos));
}

export function obterPlanosAula(): PlanoAula[] {
  const planosJSON = localStorage.getItem(PLANOS_AULA_KEY);
  if (!planosJSON) return [];
  
  try {
    const planos = JSON.parse(planosJSON);
    
    // Converte strings de data para objetos Date
    return planos.map((plano: any) => ({
      ...plano,
      dataCriacao: new Date(plano.dataCriacao),
      dataAtualizacao: new Date(plano.dataAtualizacao)
    }));
  } catch (error) {
    console.error('Erro ao deserializar os planos de aula:', error);
    return [];
  }
}

export function obterPlanoAula(id: string): PlanoAula | null {
  const planos = obterPlanosAula();
  const plano = planos.find(p => p.id === id);
  return plano || null;
}

export function excluirPlanoAula(id: string): boolean {
  const planos = obterPlanosAula();
  const novaLista = planos.filter(p => p.id !== id);
  
  if (novaLista.length < planos.length) {
    localStorage.setItem(PLANOS_AULA_KEY, JSON.stringify(novaLista));
    return true;
  }
  
  return false;
}

export function filtrarPlanosAula(filtro: {
  titulo?: string;
  ano?: string;
  disciplina?: string;
  trimestre?: string;
}): PlanoAula[] {
  const planos = obterPlanosAula();
  
  return planos.filter(plano => {
    if (filtro.titulo && !plano.titulo.toLowerCase().includes(filtro.titulo.toLowerCase())) {
      return false;
    }
    
    if (filtro.ano && plano.ano !== filtro.ano) {
      return false;
    }
    
    if (filtro.disciplina && plano.disciplina !== filtro.disciplina) {
      return false;
    }
    
    if (filtro.trimestre && plano.trimestre !== filtro.trimestre) {
      return false;
    }
    
    return true;
  });
}

export function limparTodosPlanos(): void {
  localStorage.removeItem(PLANOS_AULA_KEY);
}

// Função para exportar dados
export function exportarDados(): string {
  const dados = {
    proposta: obterPropostaSalva(),
    planos: obterPlanosAula()
  };
  
  return JSON.stringify(dados, null, 2);
}

// Função para importar dados
export function importarDados(dadosJSON: string): boolean {
  try {
    const dados = JSON.parse(dadosJSON);
    
    if (dados.proposta) {
      salvarProposta(dados.proposta);
    }
    
    if (Array.isArray(dados.planos)) {
      localStorage.setItem(PLANOS_AULA_KEY, JSON.stringify(dados.planos));
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao importar dados:', error);
    return false;
  }
}

// Função para criar um novo plano de aula
export function criarPlanoAula(formData: PlanoAulaFormData): PlanoAula {
  const agora = new Date();
  const id = Date.now().toString(36) + Math.random().toString(36).substring(2);
  
  const novoPlano: PlanoAula = {
    ...formData,
    id,
    professor_id: formData.professor_id || 0,
    created_at: agora.toISOString(),
    updated_at: agora.toISOString(),
    dataCriacao: agora,
    dataAtualizacao: agora
  };
  
  salvarPlanoAula(novoPlano);
  return novoPlano;
}

// Função para atualizar um plano de aula existente
export function atualizarPlanoAula(id: string, formData: PlanoAulaFormData): PlanoAula | null {
  const planoExistente = obterPlanoAula(id);
  
  if (!planoExistente) {
    return null;
  }
  
  const planoAtualizado: PlanoAula = {
    ...planoExistente,
    ...formData,
    dataAtualizacao: new Date()
  };
  
  salvarPlanoAula(planoAtualizado);
  return planoAtualizado;
} 