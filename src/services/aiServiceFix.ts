// ARQUIVO DESABILITADO - PATCHES DO TAVILY REMOVIDOS

/*
// Patch para corrigir aiService com Tavily
import { aiService } from './aiService';
// import { tavilyService } from './tavilyService'; // TAVILY DESABILITADO

// Sobrescrever métodos para usar Tavily
const originalGenerateResponseWithContext = aiService.generateResponseWithContext.bind(aiService);
const originalGenerateResponseWithContextStream = aiService.generateResponseWithContextStream.bind(aiService);

// Patch para generateResponseWithContext
aiService.generateResponseWithContext = async function(message, professorId, conversationHistory, config, conversationId) {
  // Aplicar busca web com Tavily
  const { systemPrompt, context } = await (aiService as any).aiPersonaService.buildPersonalizedPrompt(professorId, message);
  
  let enhancedSystemPrompt = systemPrompt;
  let webSearchResult = undefined;
  
  try {
    const webSearchEnhancement = await tavilyService.enhancePromptWithWebSearch(systemPrompt, message);
    enhancedSystemPrompt = webSearchEnhancement.enhancedPrompt;
    webSearchResult = webSearchEnhancement.webResult;
  } catch (error) {
    console.error('Erro na busca Tavily:', error);
  }
  
  // Chamar método original com prompt enriquecido
  const result = await originalGenerateResponseWithContext(message, professorId, conversationHistory, config, conversationId);
  
  // Adicionar informações de busca web
  if (webSearchResult) {
    result.webSearch = {
      used: webSearchResult.searchUsed,
      sources: webSearchResult.sources.map(s => s.url),
      error: webSearchResult.error
    };
  }
  
  return result;
};

// Patch para generateResponseWithContextStream
aiService.generateResponseWithContextStream = async function(message, professorId, conversationHistory, config, conversationId) {
  // Aplicar busca web com Tavily
  const { systemPrompt, context } = await (aiService as any).aiPersonaService.buildPersonalizedPrompt(professorId, message);
  
  let enhancedSystemPrompt = systemPrompt;
  let webSearchResult = undefined;
  
  try {
    const webSearchEnhancement = await tavilyService.enhancePromptWithWebSearch(systemPrompt, message);
    enhancedSystemPrompt = webSearchEnhancement.enhancedPrompt;
    webSearchResult = webSearchEnhancement.webResult;
  } catch (error) {
    console.error('Erro na busca Tavily:', error);
  }
  
  // Chamar método original com prompt enriquecido
  const result = await originalGenerateResponseWithContextStream(message, professorId, conversationHistory, config, conversationId);
  
  // Adicionar informações de busca web
  if (webSearchResult) {
    result.webSearch = {
      used: webSearchResult.searchUsed,
      sources: webSearchResult.sources.map(s => s.url),
      error: webSearchResult.error
    };
  }
  
  return result;
};
*/

// Exportar o aiService sem patches
import { aiService } from './aiService';
export { aiService }; 