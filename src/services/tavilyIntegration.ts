/**
 * Integração simples do Tavily para uso direto no Chat
 * TAVILY ESTÁ DESABILITADO - FUNÇÕES RETORNAM VALORES PADRÃO
 */

import { tavilyService } from './tavilyService';
import { eventEmitter } from './eventEmitter';

export interface WebSearchInfo {
  used: boolean;
  query?: string;
  summary?: string;
  sources?: string[];
  error?: string;
}

/**
 * Adiciona contexto de busca web ao prompt da IA.
 * Se a busca foi usada, anexa um resumo e as fontes.
 */
export const applyWebSearchToPrompt = (
  originalPrompt: string,
  searchInfo: WebSearchInfo
): string => {
  if (!searchInfo.used || !searchInfo.summary) {
    return originalPrompt;
  }

  // Engenharia de prompt para garantir respostas concisas e estruturadas
  const webContextPrompt = `
---
**Contexto da Web (Resumo Conciso):**
"${searchInfo.summary}"

**Fontes Principais:**
${searchInfo.sources?.slice(0, 3).map(s => `- ${s}`).join('\n') || 'Nenhuma fonte disponível'}
---

Com base no contexto da web acima, e sem mencionar a busca ou as fontes, responda à seguinte pergunta do usuário de forma clara, direta e estruturada:

**Pergunta do Usuário:**
"${originalPrompt}"
`;

  console.log("⚡ Prompt enriquecido com contexto da web.");
  return webContextPrompt;
};

/**
 * Função principal para realizar a busca web se necessário.
 * Retorna o prompt original ou um prompt enriquecido com os resultados da busca.
 */
export const performWebSearchIfNeeded = async (
  prompt: string,
  forceWebSearch: boolean = false // Parâmetro para forçar a busca (do toggle)
): Promise<{ finalPrompt: string; searchInfo: WebSearchInfo }> => {
  
  if (!tavilyService.isActive() || !forceWebSearch) {
    return {
      finalPrompt: prompt,
      searchInfo: { used: false }
    };
  }

  try {
    eventEmitter.emit('webSearchStatus', { active: true, reason: 'Iniciando busca...' });
    
    // Realiza a busca e obtém o resumo e as fontes
    const { summary, sources } = await tavilyService.searchAndSummarize(prompt);

    const searchInfo: WebSearchInfo = {
      used: true,
      query: prompt,
      summary: summary,
      sources: tavilyService.getSources(sources),
    };

    // Aplica a engenharia de prompt para enriquecer a pergunta original
    const finalPrompt = applyWebSearchToPrompt(prompt, searchInfo);
    
    eventEmitter.emit('webSearchStatus', { active: false, reason: 'Busca concluída' });

    return { finalPrompt, searchInfo };

  } catch (error) {
    console.error("❌ Erro na integração com Tavily:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    
    eventEmitter.emit('webSearchStatus', { active: false, reason: 'Erro na API' });

    // Retorna o prompt original com informações de erro
    return {
      finalPrompt: prompt,
      searchInfo: {
        used: true, // Indica que a tentativa de busca foi feita
        error: `Falha na busca web: ${errorMessage}`
      }
    };
  }
};

/**
 * Detecta se uma mensagem precisa de busca web
 * TAVILY DESABILITADO - RETORNA SEMPRE FALSE
 */
export function shouldUseWebSearch(message: string): boolean {
  console.log('🚫 Tavily está desabilitado - shouldUseWebSearch sempre retorna false');
  return false; // Sempre retorna false quando Tavily está desabilitado
} 