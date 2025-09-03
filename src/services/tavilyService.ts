/**
 * Serviço de integração com Tavily API para buscas web gerais
 */

import { TavilyClient } from 'tavily';

const TAVILY_API_KEY = import.meta.env.VITE_TAVILY_API_KEY || "";

export interface TavilySearchResult {
  title: string;
  url: string;
    content: string;
    score: number;
  raw_content?: string;
}

export interface TavilySearchResponse {
  answer?: string;
  query?: string;
  response_time?: number;
  results: TavilySearchResult[];
}

// Função mais robusta para detectar se o texto está em português
function isPortuguese(text: string): boolean {
  const lower = text.toLowerCase();
  
  // Caracteres acentuados e 'ç' - forte indicador de português
  const hasAccentChars = /[áàâãéêíóôõúüç]/i.test(lower);

  // Palavras comuns e distintamente portuguesas (menos prováveis de serem confundidas com inglês)
  const distinctlyPtWords = [
    'não', 'você', 'coração', 'cabeça', 'açúcar', 'obrigado', 'obrigada',
    'por favor', 'bom dia', 'boa tarde', 'boa noite', 'senhor', 'senhora',
    'muito', 'pouco', 'sempre', 'nunca', 'quase', 'apenas', 'ainda', 'já', 'também',
    'onde', 'quando', 'por que', 'quem', 'o que', 'como', 'qual', 'quanto',
    'está', 'são', 'ter', 'ser', 'fazer', 'ir', 'vir', 'dar', 'dizer', 'poder', 'querer',
    'tempo', 'coisa', 'mundo', 'país', 'cidade', 'casa', 'escola', 'professor', 'aluno',
    'brasileiro', 'português', 'educação', 'ensino', 'matemática', 'língua'
  ];

  // Contagem de palavras distintamente portuguesas
  const currentDistinctPtWordCount = distinctlyPtWords.filter(word => lower.includes(word)).length;

  // Limiar rigoroso para considerar português se não houver acentos
  const strictWordCountThreshold = 5; // Aumentado para ser mais rigoroso

  // Retorna true se houver acentos OU um número significativo de palavras distintamente portuguesas
  return hasAccentChars || (currentDistinctPtWordCount >= strictWordCountThreshold);
}

async function traduzirParaPortugues(text: string): Promise<string> {
  const prompt = `Traduza o texto abaixo para português do Brasil, mantendo o sentido original e sem adicionar comentários:\n\n${text}`;
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) throw new Error('API Key OpenAI não encontrada para tradução.');
  const apiUrl = 'https://api.openai.com/v1/chat/completions';
  const messages = [
    { role: 'system', content: 'Você é um tradutor profissional. Sempre traduza para português brasileiro.' },
    { role: 'user', content: prompt }
  ];
  const requestBody = {
    model: 'gpt-4o-mini',
    messages,
    temperature: 0.3,
    max_tokens: 800,
    top_p: 0.95,
    frequency_penalty: 0,
    presence_penalty: 0
  };
  try {
    console.log('[TAVILY] Enviando requisição para OpenAI para tradução...');
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
      const errorBody = await response.text();
      console.error('[TAVILY] Erro HTTP da OpenAI:', response.status, errorBody);
      throw new Error('Erro ao traduzir texto via OpenAI.');
    }
    const data = await response.json();
    console.log('[TAVILY] Resposta da OpenAI:', data);
    return data.choices?.[0]?.message?.content?.trim() || text;
  } catch (err) {
    console.error('[TAVILY] Erro na requisição de tradução:', err);
    throw err;
  }
}

class TavilyService {
  private client: TavilyClient | null = null;
  public isEnabled: boolean;

  constructor() {
    if (!TAVILY_API_KEY) {
      console.warn("🔑 API Key da Tavily não encontrada. A busca web está desabilitada.");
      this.isEnabled = false;
    } else {
      this.client = new TavilyClient({ apiKey: TAVILY_API_KEY });
      this.isEnabled = true;
      console.log("✅ Serviço Tavily inicializado com sucesso.");
    }
  }

  public isActive(): boolean {
    return this.isEnabled;
  }

  public async search(query: string, options?: any): Promise<TavilySearchResponse> {
    if (!this.client) {
      throw new Error("Tavily client não foi inicializado.");
    }
    try {
      const searchParams = {
        query,
        include_answer: true,
        search_depth: "advanced",
        max_results: 5,
        language: 'pt',
        ...options,
      };
      
      const rawResponse: any = await this.client.search(searchParams);

      const normalizedResponse: TavilySearchResponse = {
        ...rawResponse,
        response_time: parseFloat(rawResponse.response_time),
        results: rawResponse.results.map((res: any) => ({
          ...res,
          score: parseFloat(res.score)
        }))
      };

      return normalizedResponse;
    } catch (error) {
      console.error('❌ Erro na busca com Tavily:', error);
      throw error;
    }
  }

  public async searchAndSummarize(query: string, options?: any): Promise<{ summary: string; sources: TavilySearchResult[] }> {
    if (!this.client) {
      throw new Error("Tavily client não foi inicializado.");
    }
    try {
      const searchParams = {
        query,
      include_answer: true,
        search_depth: "advanced",
      max_results: 5,
        language: 'pt', // Força resposta em português
        ...options
      };
      
      const rawResponse: any = await this.client.search(searchParams);

      let summary = rawResponse.answer || `Não foi possível obter um resumo para "${query}".`;
      console.log('[TAVILY] Summary original:', summary);
      const isPt = isPortuguese(summary);
      console.log('[TAVILY] isPortuguese:', isPt);
      // Se não estiver em português, traduzir
      if (!isPt) {
        try {
          console.log('[TAVILY] Traduzindo texto:', summary);
          const traduzido = await traduzirParaPortugues(summary);
          console.log('[TAVILY] Tradução concluída:', traduzido);
          summary = traduzido;
        } catch (e) {
          console.error('[TAVILY] Falha ao traduzir, usando texto original:', e);
          // Continua com o texto original
        }
      }
      const sources: TavilySearchResult[] = (rawResponse.results || []).map((res: any) => ({
        ...res,
        score: parseFloat(res.score)
      }));

      return { summary, sources };
    } catch (error) {
      console.error('❌ Erro na busca com Tavily:', error);
      throw error;
    }
  }

  public getSources(results: TavilySearchResult[]): string[] {
    return results.map(r => r.url);
  }
}

export const tavilyService = new TavilyService(); 