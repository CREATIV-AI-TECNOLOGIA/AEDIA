// Serviço de OCR usando ChatGPT 4o Mini
export class OCRService {
  private static readonly API_URL = 'https://api.openai.com/v1/chat/completions';
  
  /**
   * Detecta nome do aluno em imagem de prova usando ChatGPT 4o Mini
   */
  static async detectarNomeAluno(imagemBase64: string): Promise<{nome?: string, matricula?: string} | null> {
    try {
      console.log('🔍 Iniciando OCR com ChatGPT 4o Mini...');
      
      // Obter API key do ambiente
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('API Key do OpenAI não configurada');
      }

      // Preparar payload para ChatGPT 4o Mini
      const payload = {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `
                  Analise esta imagem de uma prova escolar e extraia APENAS o nome do aluno.
                  
                  Procure especificamente por:
                  1. Campo "Nome do(a) Aluno(a):" seguido de texto manuscrito
                  2. Qualquer texto manuscrito na área superior da prova
                  3. Nome escrito à mão pelo aluno
                  
                  IMPORTANTE:
                  - Retorne APENAS o nome completo detectado
                  - Ignore códigos, datas, títulos da prova
                  - Se não conseguir detectar, retorne "NOME_NAO_DETECTADO"
                  - Corrija erros óbvios de caligrafia (ex: "J0ão" → "João")
                  
                  Formato de resposta: apenas o nome, exemplo: "João Silva Santos"
                `
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imagemBase64}`,
                  detail: "low" // Usar resolução baixa para economizar tokens
                }
              }
            ]
          }
        ],
        max_tokens: 50, // Nome não precisa de muitos tokens
        temperature: 0.1 // Baixa criatividade para maior precisão
      };

      // Fazer chamada para OpenAI
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API Error: ${errorData.error?.message || 'Erro desconhecido'}`);
      }

      const data = await response.json();
      const nomeDetectado = data.choices?.[0]?.message?.content?.trim();

      if (nomeDetectado && nomeDetectado !== 'NOME_NAO_DETECTADO') {
        console.log(`✅ Nome detectado via ChatGPT: ${nomeDetectado}`);
        
        // Tentar extrair matrícula se estiver no formato "Nome (Matrícula)"
        const matriculaMatch = nomeDetectado.match(/\((\d+)\)/);
        const matricula = matriculaMatch?.[1];
        
        return {
          nome: nomeDetectado.replace(/\(\d+\)/, '').trim(),
          matricula: matricula
        };
      }
      
      console.log('❌ Nenhum nome detectado via ChatGPT');
      return null;

    } catch (error) {
      console.error('Erro no OCR com ChatGPT:', error);
      throw error;
    }
  }

  /**
   * Detecta código de avaliação na imagem
   */
  static async detectarCodigoAvaliacao(imagemBase64: string): Promise<string | null> {
    try {
      console.log('🔍 Detectando código de avaliação...');
      
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('API Key do OpenAI não configurada');
      }

      const payload = {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `
                  Procure por um código de identificação da avaliação nesta imagem.
                  
                  O código tem o formato: AV-YYYY-XXXX
                  Onde:
                  - AV = prefixo fixo
                  - YYYY = ano (ex: 2024)
                  - XXXX = número sequencial (ex: 1234)
                  
                  Exemplos: AV-2024-1234, AV-2024-5678
                  
                  Se encontrar, retorne APENAS o código.
                  Se não encontrar, retorne "CODIGO_NAO_ENCONTRADO".
                `
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imagemBase64}`,
                  detail: "low"
                }
              }
            ]
          }
        ],
        max_tokens: 30,
        temperature: 0.1
      };

      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Erro na API do OpenAI');
      }

      const data = await response.json();
      const codigoDetectado = data.choices?.[0]?.message?.content?.trim();

      if (codigoDetectado && codigoDetectado !== 'CODIGO_NAO_ENCONTRADO') {
        console.log(`✅ Código detectado: ${codigoDetectado}`);
        return codigoDetectado;
      }
      
      return null;

    } catch (error) {
      console.error('Erro na detecção de código:', error);
      return null;
    }
  }

  /**
   * Calcula custo estimado do OCR
   */
  static calcularCustoEstimado(): { porProva: number; por1000Provas: number } {
    // ChatGPT 4o Mini: ~$0.15 por 1M tokens de entrada
    // Imagem em resolução baixa: ~85 tokens
    // Prompt de OCR: ~100 tokens
    // Total por prova: ~185 tokens = $0.0000277 (~$0.000028)
    
    const custoTokens = 0.15 / 1_000_000; // $0.15 por 1M tokens
    const tokensPorProva = 185;
    const custoPorProva = custoTokens * tokensPorProva;
    
    return {
      porProva: custoPorProva,
      por1000Provas: custoPorProva * 1000
    };
  }
}

// Função auxiliar para uso direto
export const detectarNomeAluno = OCRService.detectarNomeAluno;
export const detectarCodigoAvaliacao = OCRService.detectarCodigoAvaliacao; 