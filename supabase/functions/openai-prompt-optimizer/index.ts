import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// ATENÇÃO: Configure a sua OPENAI_API_KEY como uma variável de ambiente
// no painel do Supabase para esta função (em Settings > Edge Functions > openai-prompt-optimizer).
// NÃO COLOQUE A CHAVE DIRETAMENTE NO CÓDIGO.
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const allowedOrigins = [
  "http://localhost:3000", 
  "http://localhost:5173", 
  "http://localhost:4173",
  "https://localhost:3000", 
  "https://localhost:5173"
  // Adicione aqui os domínios de produção quando necessário
];

const getCorsHeaders = (origin: string | null) => {
  const isAllowedOrigin = origin && allowedOrigins.includes(origin);
  return {
    "Access-Control-Allow-Origin": isAllowedOrigin ? origin : "null",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Credentials": "true"
  };
};

interface OptimizePromptRequest {
  originalPrompt: string;
  context: {
    disciplinaNome?: string;
    anoEnsino?: string;
    modalidade?: string;
    quantidadeAlunos?: number;
    trimestre?: string;
  };
}

serve(async (req: Request) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  // Lida com a requisição preflight OPTIONS do navegador
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (!OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY não está configurada nas variáveis de ambiente da função.');
    return new Response(
      JSON.stringify({ error: 'Configuração do servidor incompleta.' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }

  try {
    const requestData: OptimizePromptRequest = await req.json();
    
    if (!requestData.originalPrompt || !requestData.originalPrompt.trim()) {
      return new Response(
        JSON.stringify({ error: 'O prompt original é obrigatório.' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    const { originalPrompt, context } = requestData;

    const promptMelhoria = `Você é um especialista em prompts para IA educacional. Sua tarefa é melhorar e expandir as instruções de um professor para gerar planos de aula mais detalhados e específicos.

CONTEXTO:
- Disciplina: ${context.disciplinaNome || 'Não informado'}
- Ano: ${context.anoEnsino || 'Não informado'} 
- Modalidade: ${context.modalidade || 'Não informado'}
- Turma: ${context.quantidadeAlunos || 'Não informado'} alunos
- Trimestre: ${context.trimestre || 'Não informado'}

INSTRUÇÕES ORIGINAIS DO PROFESSOR:
"${originalPrompt.trim()}"

TAREFA:
Transforme essas instruções em um prompt muito mais específico e detalhado que resultará em planos de aula excepcionais. 

REGRAS PARA A MELHORIA:
1. Mantenha a intenção original do professor
2. Seja MUITO específico sobre materiais, tempos, estratégias
3. Inclua exemplos concretos do que o professor quer
4. Adapte para a faixa etária específica (${context.anoEnsino || 'adequada'})
5. Considere o tamanho da turma (${context.quantidadeAlunos || 'pequena'} alunos)
6. Use linguagem clara e objetiva
7. LIMITE: máximo 450 caracteres (deixe espaço para edição)

EXEMPLO DE MELHORIA:
Original: "seja detalhista"
Melhorado: "Inclua materiais específicos (quantidades exatas), tempos precisos para cada atividade, instruções passo a passo para o professor, exemplos de falas, estratégias para turma de ${context.quantidadeAlunos || 'poucos'} alunos do ${context.anoEnsino || 'ensino fundamental'}"

RESPONDA APENAS COM O PROMPT MELHORADO, SEM EXPLICAÇÕES:`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Você é um especialista em otimização de prompts educacionais. Responda apenas com o prompt melhorado, sem explicações adicionais.'
          },
          {
            role: 'user',
            content: promptMelhoria
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Erro na API da OpenAI:', response.status, errorData);
      return new Response(
        JSON.stringify({ error: 'Erro na API da OpenAI' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: response.status,
        }
      );
    }

    const data = await response.json();
    const promptMelhorado = data.choices[0]?.message?.content?.trim();

    if (!promptMelhorado) {
      console.error('Nenhuma resposta recebida da OpenAI:', data);
      return new Response(
        JSON.stringify({ error: 'Não foi possível obter uma resposta da IA.' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    // Garantir que não ultrapasse 450 caracteres (deixando espaço para edição)
    const promptFinal = promptMelhorado.length > 450 
      ? promptMelhorado.substring(0, 450).trim() + '...'
      : promptMelhorado;

    console.log("Prompt otimizado com sucesso:", promptFinal.substring(0, 100) + "...");

    return new Response(
      JSON.stringify({ 
        optimizedPrompt: promptFinal,
        originalLength: originalPrompt.length,
        optimizedLength: promptFinal.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Erro ao processar a requisição de otimização de prompt:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor ao processar sua requisição.' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

console.log('Function "openai-prompt-optimizer" up and running!'); 