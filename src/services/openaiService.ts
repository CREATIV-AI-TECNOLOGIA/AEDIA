import DOMPurify from 'dompurify';
import { ProfessorIAConfigService } from './ProfessorIAConfigService';
import type { ProfessorIAConfiguracoes } from '../types/ProfessorIAConfig';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  choices: {
    message: {
      content: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface LessonPlanParams {
  disciplina: string;
  serie: string;
  topico: string;
  duracao: string;
  objetivos: string[];
  habilidadesBNCC: string[]; 
  recursos: string[];
  metodologia: string;
  avaliacao: string;
  observacoes?: string;
  nomePlano?: string;
  instrucoesAdicionais?: string;
  nomeTurma?: string;
  modalidadeAula?: string;
  frequenciaAula?: string;
  conhecimentosPrevios?: string;
  abordagemPedagogica?: string;
  professorId?: number;
  escolaId?: number;
  quantidadeAlunos?: number;
  generosTextuais?: string[];
  objetosConhecimento?: string[];
  praticasLinguagem?: string[];
  trimestre?: string;
}

export interface AvaliacaoParams {
  planoAula: {
    titulo: string;
    disciplinaNome: string;
    turmaAno: string;
    turmaNome: string;
    modalidadeNome: string;
    trimestre: string;
    professorNome: string;
    professorId?: number;
    escolaId?: number;
  };
  configuracoes: {
    titulo: string;
    tipo: string;
    descricao: string;
    dataAplicacao?: string;
    quantidadeQuestoes: number;
    notaMaxima: number;
    tempoEstimado: number;
    focoAvaliacao: string;
    incluirImagens: boolean;
    incluirAudio: boolean;
    instrucoesPersonalizadas?: string;
  };
  configuracaoFaixa: {
    nome_exibicao: string;
    tipos_questoes_permitidas: string[];
    recursos_obrigatorios: string[];
    distribuicao_dificuldade_padrao: any;
  };
  detalhesConteudo: {
    meses: any[];
    semanas: any[];
  };
}

const MODEL_NAME = 'gpt-4o-mini';

export async function generateLessonPlanWithOpenAI(params: LessonPlanParams): Promise<string> {
  const apiKey = (import.meta.env.VITE_OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY) as string;
  if (!apiKey) {
    throw new Error("A chave da API da OpenAI (VITE_OPENAI_API_KEY) não foi encontrada nas variáveis de ambiente.");
  }
  const apiUrl = 'https://api.openai.com/v1/chat/completions';
  
  let configuracoes: ProfessorIAConfiguracoes | null = null;
  if (params.professorId && params.escolaId) {
    try {
      configuracoes = await ProfessorIAConfigService.getConfiguracaoesOuPadrao(params.professorId, params.escolaId);
    } catch (error) {
      console.warn('Não foi possível carregar configurações da IA:', error);
    }
  }

  const promptText = buildCustomPrompt(params, configuracoes);

  const messages: OpenAIMessage[] = [{
    role: 'system',
    content: 'Você é um especialista em design instrucional e pedagogia com domínio da BNCC. Sua tarefa é criar planos de aula TRIMESTRAIS COMPLETOS (3 meses inteiros) com formatação HTML rica e visualmente atrativa. CRÍTICO: O plano deve ter exatamente 12 semanas distribuídas em 3 meses. NÃO PARE antes de completar todos os 3 meses. IMPORTANTE: Retorne APENAS HTML bem formatado, sem blocos de código, sem crases, sem aspas. Use tags HTML como <h1>, <h2>, <h3>, <strong>, <p>, <ul>, <li> para criar um layout profissional e bem estruturado.'
  }, {
    role: 'user',
    content: promptText
  }];

  const requestBody = {
    model: MODEL_NAME,
    messages,
    temperature: 0.7,
    max_tokens: 8000,
    top_p: 0.95,
    frequency_penalty: 0,
    presence_penalty: 0
  };

  // --- LOG DE DIAGNÓSTICO DETALHADO ---
  console.log('🔵 [OpenAI Request - generateLessonPlan] Enviando para a API:', JSON.stringify(requestBody, null, 2));
  // ------------------------------------

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(`Erro na API OpenAI: ${response.status} ${response.statusText}. Detalhes: ${JSON.stringify(errorBody.error || errorBody)}`);
    }

    const responseData: OpenAIResponse = await response.json();
    if (responseData.choices?.[0]?.message?.content) {
      return DOMPurify.sanitize(responseData.choices[0].message.content);
    }
    throw new Error("A API OpenAI retornou uma resposta inesperada ou sem conteúdo.");
  } catch (error) {
    console.error("Falha ao gerar plano de aula com OpenAI:", error);
    throw error instanceof Error ? error : new Error("Ocorreu um erro desconhecido ao se comunicar com a API OpenAI.");
  }
}

export async function generateAvaliacaoWithOpenAI(params: AvaliacaoParams): Promise<string> {
  console.log("[DEBUG] generateAvaliacaoWithOpenAI chamada com:", {
    planoAula: params.planoAula ? 'PRESENTE' : 'AUSENTE',
    configuracoes: params.configuracoes ? 'PRESENTE' : 'AUSENTE',
    configuracaoFaixa: params.configuracaoFaixa ? 'PRESENTE' : 'AUSENTE',
    detalhesConteudo: {
      meses: params.detalhesConteudo?.meses?.length || 0,
      semanas: params.detalhesConteudo?.semanas?.length || 0
    }
  });
  
  try {
    console.log('[DEBUG] Carregando configurações do professor...');
    const profId = params.planoAula.professorId || 0;
    const escolaId = params.planoAula.escolaId || 0;
    const configuracoes = await ProfessorIAConfigService.getConfiguracaoesOuPadrao(profId, escolaId);
    console.log('[DEBUG] Configurações carregadas:', configuracoes ? 'PRESENTE' : 'AUSENTE');
    
    console.log('[DEBUG] Construindo prompt...');
    const prompt = await buildAvaliacaoPrompt(params, configuracoes);
    console.log('[DEBUG] Prompt construído com sucesso');
    
    const apiKey = (import.meta.env.VITE_OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY) as string;
    console.log('[DEBUG] Verificando chave da API:', apiKey ? 'PRESENTE' : 'AUSENTE');
    if (!apiKey) {
      console.log('[DEBUG] ❌ Chave da API não encontrada - usando fallback');
      throw new Error("A chave da API da OpenAI (VITE_OPENAI_API_KEY) não foi encontrada.");
    }
    
    const apiUrl = 'https://api.openai.com/v1/chat/completions';
    console.log('[DEBUG] URL da API:', apiUrl);
    
    const messages: OpenAIMessage[] = [
      {
        role: 'system',
        content: `Você é um assistente especializado em criar avaliações educacionais e DEVE seguir estritamente as instruções do usuário.

OBJETIVO
- Gerar APENAS o HTML (sem comentários, sem explicações, sem markdown) de uma avaliação, bem estruturada e pronta para impressão/edição.
- O conteúdo (temas, habilidades, objetivos, textos, imagens) DEVE vir EXCLUSIVAMENTE do que o usuário forneceu.

REGRAS CRÍTICAS (CUMPRIR À RISCA)
1) Baseie-se EXCLUSIVAMENTE no conteúdo fornecido (conteúdos de meses/semanas selecionados, habilidades/objetivos/BNCC, textos/imagens).
2) NÃO invente habilidades, objetivos, exemplos, dados, imagens, fontes, rubricas ou links.
3) Se algum dado essencial NÃO for fornecido, OMITA o item completamente. NUNCA use marcadores como "[DADO NÃO FORNECIDO]".
4) Idioma: pt-BR.
5) Retorne APENAS HTML válido. NENHUMA explicação adicional.
6) NÃO inclua <script>, bibliotecas externas ou CSS extenso. Classes CSS apenas quando necessário.

VALIDAÇÕES AUTOMÁTICAS
- Garanta que a soma dos pontos das questões == Nota Máxima.
  • Se o usuário já distribuiu pontos, mantenha exatamente como enviado.
  • Se não houver distribuição, divida proporcionalmente e deixe explícito no texto da questão "(X pontos)".
- Liste somente códigos BNCC/objetivos que o usuário forneceu. Não crie códigos.
- Para imagens, só renderize se o usuário fornecer URL ou instrução explícita; caso contrário, mantenha "Descrição da imagem" se vier no prompt.
- Preserve a ordem e o tipo de cada questão conforme instruído.

TIPOS DE QUESTÃO (conforme o que o usuário solicitar)
- Múltipla escolha (uma correta): enunciado + instruções + <ol><li>Alternativa A…</li>…</ol>.
- Múltipla escolha (múltiplas corretas): explicite "Marque todas as corretas".
- Dissertativa: inclua espaço de resposta (ver "Formatação exigida").
- Leitura oral/ditado/desenho: inclua instruções claras e espaço adequado para resposta/registro.
- Itens com texto-base: inclua o texto-base exatamente como fornecido (sem reescrever).

FORMATAÇÃO EXIGIDA (HTML SEMÂNTICO, MÍNIMO E LIMPO)
- Use estas tags: <html>, <head>, <meta charset="utf-8">, <title>, <body>, <h1>, <h2>, <h3>, <p>, <ul>, <li>, <ol>, <figure>, <img>, <figcaption>, <em>, <strong>, <br>.
- Para alternativas, SEMPRE use <ol><li>…</li></ol>.
- Para espaço de resposta dissertativa, use:
  <p class="answer" aria-label="Espaço para resposta" style="min-height:80px;border:1px solid #e5e7eb;padding:8px;"></p>
  (Pode repetir ou ajustar min-height se o usuário pedir.)
- Use classes somente quando necessário: "meta", "badge", "answer". Evite CSS extenso; apenas styles inline mínimos para impressão/legibilidade.

ESTRUTURA OBRIGATÓRIA DO HTML DE SAÍDA
<html>
  <head>
    <meta charset="utf-8">
    <title>[Tipo] de [Disciplina]</title>
  </head>
  <body>
    <h1>[Tipo] de [Disciplina]</h1>

    <h2>Identificação</h2>
    <ul class="meta">
      <li><strong>Disciplina:</strong> [Disciplina]</li>
      <li><strong>Ano/Série:</strong> [Ano/Série]</li>
      <li><strong>Turma:</strong> [Turma]</li>
      <li><strong>Modalidade:</strong> [Modalidade]</li>
      <li><strong>Período/Trimestre:</strong> [Período]</li>
      <li><strong>Professor(a):</strong> [Professor]</li>
      <li><strong>Escola:</strong> [Nome da Escola]</li>
      <li><strong>Tipo de Avaliação:</strong> [Tipo]</li>
      <li><strong>Nota Máxima:</strong> [Nota Máxima]</li>
      <li><strong>Tempo Estimado:</strong> [Tempo]</li>
      <li><strong>Foco da Avaliação:</strong> [Foco]</li>
      <!-- Liste BNCC/Objetivos SOMENTE se o usuário fornecer -->
      <li><strong>BNCC/Habilidades:</strong> [Códigos BNCC fornecidos]</li>
      <li><strong>Objetivos:</strong> [Objetivos fornecidos]</li>
      <li><strong>Data:</strong> [Data se fornecida]</li>
      <li><strong>Nome do(a) Aluno(a):</strong> ___________________________</li>
      <li><strong>Nota:</strong> ___________________________</li>
    </ul>

    <h2>Instruções</h2>
    <p>[Instruções gerais fornecidas pelo usuário. Não inventar.]</p>

    <h2>Questões</h2>
    <ol>
      <!-- Para cada questão na ordem fornecida -->
      <li>
        <h3>Questão [n] <span class="badge">( [pontos] pontos )</span></h3>
        <p>[Enunciado exatamente como fornecido]</p>

        <!-- Se houver texto-base -->
        <p><strong>Texto-base:</strong> [texto-base fornecido]</p>

        <!-- Se houver imagem e URL fornecida -->
        <figure>
          <img src="[URL]" alt="[Descrição fornecida]" style="max-width:100%;height:auto;">
          <figcaption>[Legenda fornecida, se houver]</figcaption>
        </figure>

        <!-- Tipos -->
        <!-- Múltipla escolha -->
        <p><em>[Instruções para a questão, conforme o usuário: "Assinale a alternativa correta." ou "Marque todas as corretas."]</em></p>
        <ol>
          <li>[Alternativa A fornecida]</li>
          <li>[Alternativa B fornecida]</li>
          <li>[Alternativa C fornecida]</li>
          <li>[Alternativa D fornecida]</li>
        </ol>

        <!-- Dissertativa -->
        <p><em>[Instruções para resposta dissertativa, se aplicável]</em></p>
        <p class="answer" aria-label="Espaço para resposta" style="min-height:120px;border:1px solid #e5e7eb;padding:8px;"></p>

        <!-- Para leitura oral/ditado/desenho, siga as instruções do usuário -->
      </li>
      <!-- repetir para todas as questões -->
    </ol>

    <!-- Se o usuário fornecer critérios/rúbrica, incluir seção -->
    <h2>Critérios de Correção</h2>
    <ul>
      <li>[Critério 1 fornecido]</li>
      <li>[Critério 2 fornecido]</li>
    </ul>
  </body>
</html>

Considerações finais — versão ultracurta
Sem invenções; se faltar dados essenciais, OMITA o campo completamente.
Sem textos extras (motivação/notas/dicas/explicações).
HTML válido e bem formado (tags semânticas fechadas).
Saída = somente o HTML completo, preenchido apenas com os dados do usuário.`
      },
      {
        role: 'user',
        content: prompt
      }
    ];
    
    const requestBody = {
      model: MODEL_NAME,
      messages,
      temperature: 0.3,
      max_tokens: 8000
    };
    
    console.log('[DEBUG] Preparando requisição para OpenAI:', {
      model: MODEL_NAME,
      messagesCount: messages.length,
      temperature: 0.7,
      max_tokens: 4000
    });
    
    console.log('[DEBUG] Enviando requisição para OpenAI...');
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('[DEBUG] Resposta recebida da OpenAI:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    if (!response.ok) {
      console.log('[DEBUG] ❌ Erro na resposta da OpenAI');
      const errorBody = await response.json();
      console.log('[DEBUG] Detalhes do erro:', errorBody);
      throw new Error(`Erro na API OpenAI: ${response.status} ${response.statusText}. Detalhes: ${JSON.stringify(errorBody.error || errorBody)}`);
    }
    
    console.log('[DEBUG] Processando resposta da OpenAI...');
    const responseData: OpenAIResponse = await response.json();
    
    console.log('[DEBUG] Dados da resposta:', {
      hasChoices: !!responseData.choices,
      choicesLength: responseData.choices?.length || 0,
      hasContent: !!responseData.choices?.[0]?.message?.content,
      contentLength: responseData.choices?.[0]?.message?.content?.length || 0
    });
    
    if (responseData.choices?.[0]?.message?.content) {
      const htmlContent = responseData.choices[0].message.content.trim();
      console.log('[DEBUG] ✅ Conteúdo HTML recebido da OpenAI:', {
        length: htmlContent.length,
        preview: htmlContent.substring(0, 200)
      });
      // Sanitizar o HTML para segurança
      const sanitizedContent = DOMPurify.sanitize(htmlContent);
      console.log('[DEBUG] ✅ Conteúdo sanitizado:', {
        originalLength: htmlContent.length,
        sanitizedLength: sanitizedContent.length
      });
      return sanitizedContent;
    }
    
    console.log('[DEBUG] ❌ API OpenAI retornou resposta sem conteúdo');
    throw new Error("A API OpenAI retornou uma resposta inesperada ou sem conteúdo.");
    
  } catch (error) {
    console.error('[DEBUG] ❌ Erro ao gerar avaliação com OpenAI:', error);
    console.error('[DEBUG] ❌ Stack trace do erro:', error instanceof Error ? error.stack : 'Não é um objeto Error');
    console.error('[DEBUG] ❌ Mensagem completa do erro:', error instanceof Error ? error.message : String(error));
    console.error('[DEBUG] ❌ Tipo do erro:', typeof error);
    console.log('[DEBUG] 🔄 Usando fallback para geração básica');
    // Em caso de erro, retornar uma avaliação básica em HTML
    const fallbackContent = generateFallbackAvaliacao(params);
    console.log('[DEBUG] ✅ Fallback gerado:', {
      length: fallbackContent.length,
      preview: fallbackContent.substring(0, 200)
    });
    return fallbackContent;
  }
}

function buildCustomPrompt(params: LessonPlanParams, configuracoes: ProfessorIAConfiguracoes | null): string {
  return `Gere um plano de aula para ${params.disciplina}.`;
}

async function buildAvaliacaoPrompt(params: AvaliacaoParams, configuracoes: ProfessorIAConfiguracoes | null): Promise<string> {
  const { planoAula, configuracoes: configAvaliacao, configuracaoFaixa, detalhesConteudo } = params;
  
  console.log('[DEBUG] buildAvaliacaoPrompt - Parâmetros recebidos:', {
    planoAula: planoAula ? 'PRESENTE' : 'AUSENTE',
    configAvaliacao: configAvaliacao ? 'PRESENTE' : 'AUSENTE',
    configuracaoFaixa: configuracaoFaixa ? 'PRESENTE' : 'AUSENTE',
    detalhesConteudo: {
      meses: detalhesConteudo?.meses?.length || 0,
      semanas: detalhesConteudo?.semanas?.length || 0
    },
    incluirImagens: configAvaliacao?.incluirImagens,
    incluirAudio: configAvaliacao?.incluirAudio
  });
  
  // Buscar nome da escola se escolaId estiver disponível
  let nomeEscola = 'Escola';
  if (planoAula.escolaId) {
    try {
      const { getEscolaNomeById } = await import('./ProfessorService');
      const escolaNome = await getEscolaNomeById(planoAula.escolaId.toString());
      if (escolaNome) {
        nomeEscola = escolaNome;
      }
    } catch (error) {
      console.warn('[buildAvaliacaoPrompt] Erro ao buscar nome da escola:', error);
    }
  }
  
  let prompt = `AVISO IMPORTANTE: Esta avaliação DEVE ser baseada EXCLUSIVAMENTE no conteúdo específico do plano de aula fornecido abaixo. NÃO crie questões genéricas ou conteúdo inventado. Use APENAS os elementos dos meses e semanas selecionados.

CRIE UMA AVALIAÇÃO EDUCACIONAL COM AS SEGUINTES ESPECIFICAÇÕES:

`;
  
  // Informações básicas
  prompt += `**INFORMAÇÕES BÁSICAS DA AVALIAÇÃO:**
- Título: ${configAvaliacao.titulo}
- Disciplina: ${planoAula.disciplinaNome}
- Ano/Série: ${planoAula.turmaAno}
- Turma: ${planoAula.turmaNome}
- Modalidade: ${planoAula.modalidadeNome}
- Trimestre: ${planoAula.trimestre}
- Professor: ${planoAula.professorNome}
- Escola: ${nomeEscola}
- Tipo de Avaliação: ${configAvaliacao.tipo}
- Quantidade de Questões: ${configAvaliacao.quantidadeQuestoes}
- Nota Máxima: ${configAvaliacao.notaMaxima}
- Tempo Estimado: ${configAvaliacao.tempoEstimado} minutos
- Foco da Avaliação: ${configAvaliacao.focoAvaliacao}

`;
  
  // Descrição da avaliação
  if (configAvaliacao.descricao) {
    prompt += `**DESCRIÇÃO DA AVALIAÇÃO:**
${configAvaliacao.descricao}

`;
  }
  
  // Configurações da faixa etária
  prompt += `**CONFIGURAÇÕES PEDAGÓGICAS:**
- Faixa Etária: ${configuracaoFaixa.nome_exibicao}
- Tipos de Questões Permitidas: ${configuracaoFaixa.tipos_questoes_permitidas.join(', ')}
`;
  // Usar recursos opcionais selecionados pelo professor, se houver
  const recursosParaUsar = configuracoes.recursosOpcionais && configuracoes.recursosOpcionais.length > 0 
    ? configuracoes.recursosOpcionais 
    : [];
  
  if (recursosParaUsar.length > 0) {
    prompt += `- Recursos Incluídos: ${recursosParaUsar.join(', ')}
`;
  }
  prompt += `\n`;
  
  // Conteúdo específico detalhado
  console.log('[DEBUG] buildAvaliacaoPrompt - Verificando conteúdo:', {
    temMeses: detalhesConteudo.meses.length > 0,
    temSemanas: detalhesConteudo.semanas.length > 0,
    mesesDetalhes: detalhesConteudo.meses.map(m => ({
      titulo: m.titulo,
      numero: m.numero,
      habilidades: m.habilidades?.length || 0,
      objetivos: m.objetivos?.length || 0,
      desenvolvimento: m.desenvolvimento?.length || 0,
      atividades: m.atividades?.length || 0
    })),
    semanasDetalhes: detalhesConteudo.semanas.map(s => ({
      titulo: s.titulo,
      numero: s.numero,
      objetivos: s.objetivos?.length || 0,
      desenvolvimento: s.desenvolvimento?.length || 0,
      observacoes: s.observacoes?.length || 0
    }))
  });
  
  if (detalhesConteudo.meses.length > 0 || detalhesConteudo.semanas.length > 0) {
    prompt += `**CONTEÚDO ESPECÍFICO DO PLANO DE AULA A SER AVALIADO:**

IMPORTANTE: As questões da avaliação DEVEM ser criadas com base SOMENTE neste conteúdo específico. NÃO invente ou crie conteúdo genérico.

`;
    
    if (detalhesConteudo.meses.length > 0) {
      prompt += `=== MESES SELECIONADOS DO PLANO DE AULA ===
`;
      detalhesConteudo.meses.forEach((mes: any) => {
        prompt += `\n📅 ${mes.titulo} (Mês ${mes.numero}):
`;
        if (mes.habilidades && mes.habilidades.length > 0) {
          prompt += `\n🎯 HABILIDADES ESPECÍFICAS:
`;
          mes.habilidades.forEach((hab: string, index: number) => {
            prompt += `${index + 1}. ${hab}
`;
          });
        }
        if (mes.objetivos && mes.objetivos.length > 0) {
          prompt += `\n📚 OBJETIVOS ESPECÍFICOS:
`;
          mes.objetivos.forEach((obj: string, index: number) => {
            prompt += `${index + 1}. ${obj}
`;
          });
        }
        if (mes.desenvolvimento && mes.desenvolvimento.length > 0) {
          prompt += `\n📖 DESENVOLVIMENTO/CONTEÚDO:
`;
          mes.desenvolvimento.forEach((dev: string, index: number) => {
            prompt += `${index + 1}. ${dev}
`;
          });
        }
        if (mes.atividades && mes.atividades.length > 0) {
          prompt += `\n✏️ ATIVIDADES REALIZADAS:
`;
          mes.atividades.forEach((ativ: string, index: number) => {
            prompt += `${index + 1}. ${ativ}
`;
          });
        }
        prompt += `\n`;
      });
    }
    
    if (detalhesConteudo.semanas.length > 0) {
      prompt += `\n=== SEMANAS SELECIONADAS DO PLANO DE AULA ===
`;
      detalhesConteudo.semanas.forEach((semana: any) => {
        prompt += `\n📅 ${semana.titulo} (Semana ${semana.numero}):
`;
        if (semana.objetivos && semana.objetivos.length > 0) {
          prompt += `\n📚 OBJETIVOS ESPECÍFICOS:
`;
          semana.objetivos.forEach((obj: string, index: number) => {
            prompt += `${index + 1}. ${obj}
`;
          });
        }
        if (semana.desenvolvimento && semana.desenvolvimento.length > 0) {
          prompt += `\n📖 DESENVOLVIMENTO/CONTEÚDO:
`;
          semana.desenvolvimento.forEach((dev: string, index: number) => {
            prompt += `${index + 1}. ${dev}
`;
          });
        }
        if (semana.observacoes && semana.observacoes.length > 0) {
          prompt += `\n💡 OBSERVAÇÕES/RECURSOS:
`;
          semana.observacoes.forEach((obs: string, index: number) => {
            prompt += `${index + 1}. ${obs}
`;
          });
        }
        prompt += `\n`;
      });
    }
    
    prompt += `
========================
INSTRUÇÕES ESPECÍFICAS PARA CRIAÇÃO DAS QUESTÕES:
========================

🔴 OBRIGATÓRIO: Todas as questões DEVEM ser baseadas nos conteúdos específicos listados acima.
🔴 PROIBIDO: Criar questões genéricas ou inventar conteúdo não listado.
🔴 OBRIGATÓRIO: Referenciar diretamente os objetivos, habilidades e desenvolvimento mencionados.
🔴 OBRIGATÓRIO: Usar os termos e conceitos exatos do plano de aula.

`;
  } else {
    prompt += `**ATENÇÃO: NENHUM CONTEÚDO ESPECÍFICO FOI SELECIONADO**
Por favor, crie uma avaliação básica para a disciplina ${planoAula.disciplinaNome} (${planoAula.turmaAno}).

`;
  }
  
  // Instruções personalizadas
  if (configAvaliacao.instrucoesPersonalizadas) {
    prompt += `**INSTRUÇÕES PERSONALIZADAS DO PROFESSOR:**
${configAvaliacao.instrucoesPersonalizadas}

`;
  }
  
  // Configurações do professor (se disponível)
  if (configuracoes) {
    prompt += `**PREFERÊNCIAS PEDAGÓGICAS DO PROFESSOR:**
`;
    if (configuracoes.estilo_ensino) {
      prompt += `- Estilo de Ensino: ${configuracoes.estilo_ensino}
`;
    }
    if (configuracoes.abordagem_pedagogica) {
      prompt += `- Abordagem Pedagógica: ${configuracoes.abordagem_pedagogica}
`;
    }
    if (configuracoes.nivel_detalhamento) {
      prompt += `- Nível de Detalhamento: ${configuracoes.nivel_detalhamento}
`;
    }
    prompt += `\n`;
  }
  
  // Instruções técnicas finais
  prompt += `**INSTRUÇÕES TÉCNICAS PARA GERAÇÃO:**
1. ✅ Crie EXATAMENTE ${configAvaliacao.quantidadeQuestoes} questões
2. ✅ Base TODAS as questões no conteúdo específico listado acima
3. ✅ Use os tipos de questões permitidos: ${configuracaoFaixa.tipos_questoes_permitidas.join(', ')}
4. ✅ Adeque a linguagem para ${configuracaoFaixa.nome_exibicao}
5. ✅ Distribua ${configAvaliacao.notaMaxima} pontos entre as questões
6. ✅ Formate em HTML semântico válido
7. ✅ Inclua cabeçalho com informações da avaliação
8. ✅ Inclua instruções claras para os alunos
9. ✅ Deixe espaços adequados para respostas
`;
  
  if (configAvaliacao.incluirImagens) {
    prompt += `10. ✅ Inclua placeholders para imagens: [IMAGEM: descrição]
`;
  } else {
    prompt += `10. ❌ NÃO inclua questões que solicitem análise de imagens, figuras ou elementos visuais
`;
  }
  
  if (configAvaliacao.incluirAudio) {
    prompt += `11. ✅ Inclua instruções para áudio: [ÁUDIO: descrição]
`;
  } else {
    prompt += `11. ❌ NÃO inclua questões que solicitem análise de áudio ou sons
`;
  }
  
  prompt += `
LEMBRE-SE: Esta avaliação deve refletir EXATAMENTE o que foi ensinado no plano de aula selecionado. Não crie conteúdo genérico!`;
  
  console.log('[DEBUG] buildAvaliacaoPrompt - Prompt final gerado:');
  console.log('[DEBUG] Tamanho do prompt:', prompt.length);
  console.log('[DEBUG] Primeiros 500 caracteres:', prompt.substring(0, 500));
  console.log('[DEBUG] Últimos 500 caracteres:', prompt.substring(Math.max(0, prompt.length - 500)));
  
  return prompt;
}

class OpenAIChatService {
    private apiKey: string;
    private apiUrl = 'https://api.openai.com/v1/chat/completions';

    constructor() {
        this.apiKey = (import.meta.env.VITE_OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY) as string;
        if (!this.apiKey) {
            console.warn("OpenAIChatService: VITE_OPENAI_API_KEY ausente. Streaming desabilitado; chamadas irão falhar com erro específico até a chave ser configurada.");
        }
    }

    async generateStream(
      systemPrompt: string,
      userPrompt: string,
      conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
      config: any
    ): Promise<{ stream: ReadableStream<string>, model: string }> {
      if (!this.apiKey) {
        throw new Error('OPENAI_API_KEY_MISSING: Defina VITE_OPENAI_API_KEY para habilitar o streaming com OpenAI.');
      }
      const messages: OpenAIMessage[] = [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
          { role: 'user', content: userPrompt }
      ];

      const requestBody = {
          model: config.model || 'gpt-4o-mini',
          messages,
          temperature: 0.7,
          stream: true,
      };

      // --- LOG DE DIAGNÓSTICO ---
      console.log('🔵 [OpenAI Request] Enviando para a API:', JSON.stringify(requestBody, null, 2));
      // ---------------------------

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok || !response.body) {
        const errorBody = await response.json();
        throw new Error(`Erro na API OpenAI: ${response.status} ${JSON.stringify(errorBody)}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      const stream = new ReadableStream<string>({
        async start(controller) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split('\\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.substring(6);
                if (data.trim() === '[DONE]') {
                  controller.close();
                  return;
                }
                try {
                  const json = JSON.parse(data);
                  const text = json.choices[0]?.delta?.content || '';
                  if (text) controller.enqueue(text);
                } catch (e) { /* Ignorar erros de JSON */ }
              }
            }
          }
          controller.close();
        }
      });

      return {
        stream,
        model: config.model || 'gpt-4o-mini',
      };
    }
}

function generateFallbackAvaliacao(params: AvaliacaoParams): string {
  const { planoAula, configuracoes: configAvaliacao, detalhesConteudo } = params;
  
  console.log('[DEBUG] generateFallbackAvaliacao - Usando conteúdo detalhado:', {
    meses: detalhesConteudo?.meses?.length || 0,
    semanas: detalhesConteudo?.semanas?.length || 0
  });
  
  // Criar título baseado na disciplina e tipo
  const tituloAvaliacao = `${configAvaliacao.tipo} de ${planoAula.disciplinaNome}`;
  
  let html = `<div class="avaliacao-fallback">
`;
  
  // Cabeçalho
  html += `  <header class="avaliacao-header">
`;
  html += `    <h1>${tituloAvaliacao}</h1>
`;
  html += `    <div class="info-basica">
`;
  html += `      <p><strong>Disciplina:</strong> ${planoAula.disciplinaNome}</p>
`;
  html += `      <p><strong>Ano/Série:</strong> ${planoAula.turmaAno}</p>
`;
  html += `      <p><strong>Turma:</strong> ${planoAula.turmaNome}</p>
`;
  html += `      <p><strong>Modalidade:</strong> ${planoAula.modalidadeNome}</p>
`;
  html += `      <p><strong>Professor:</strong> ${planoAula.professorNome}</p>
`;
  html += `      <p><strong>Escola:</strong> Escola</p>
`;
  html += `      <p><strong>Tipo de Avaliação:</strong> ${configAvaliacao.tipo}</p>
`;
  html += `      <p><strong>Tempo Estimado:</strong> ${configAvaliacao.tempoEstimado} minutos</p>
`;
  html += `      <p><strong>Nota Máxima:</strong> ${configAvaliacao.notaMaxima} pts</p>
`;
  if (configAvaliacao.dataAplicacao) {
    html += `      <p><strong>Data:</strong> ${configAvaliacao.dataAplicacao}</p>
`;
  }
  html += `      <p><strong>Nome do(a) Aluno(a):</strong> ___________________________</p>
`;
  html += `      <p><strong>Nota:</strong> ___________________________</p>
`;
  html += `    </div>
`;
  html += `  </header>
\n`;
  
  // Instruções
  html += `  <section class="instrucoes">
`;
  html += `    <h2>Instruções</h2>
`;
  html += `    <ul>
`;
  html += `      <li>Leia todas as questões com atenção antes de responder.</li>
`;
  html += `      <li>Responda todas as questões de forma clara e completa.</li>
`;
  html += `      <li>Use caneta azul ou preta.</li>
`;
  html += `      <li>Não é permitido o uso de corretor.</li>
`;
  html += `    </ul>
`;
  
  if (configAvaliacao.instrucoesPersonalizadas) {
    html += `    <div class="instrucoes-personalizadas">
`;
    html += `      <h3>Instruções Específicas</h3>
`;
    html += `      <p>${configAvaliacao.instrucoesPersonalizadas}</p>
`;
    html += `    </div>
`;
  }
  
  html += `  </section>
\n`;
  
  // Questões
  html += `  <section class="questoes">
`;
  html += `    <h2>Questões</h2>
\n`;
  
  const numQuestoes = configAvaliacao.quantidadeQuestoes || 5;
  const pontosPorQuestao = Math.round((configAvaliacao.notaMaxima || 10) / numQuestoes * 10) / 10;
  
  // Coletar conteúdo específico dos meses e semanas
  const conteudoEspecifico = [];
  
  if (detalhesConteudo?.meses) {
    detalhesConteudo.meses.forEach((mes: any) => {
      if (mes.habilidades) conteudoEspecifico.push(...mes.habilidades);
      if (mes.objetivos) conteudoEspecifico.push(...mes.objetivos);
      if (mes.desenvolvimento) conteudoEspecifico.push(...mes.desenvolvimento);
    });
  }
  
  if (detalhesConteudo?.semanas) {
    detalhesConteudo.semanas.forEach((semana: any) => {
      if (semana.objetivos) conteudoEspecifico.push(...semana.objetivos);
      if (semana.desenvolvimento) conteudoEspecifico.push(...semana.desenvolvimento);
    });
  }
  
  console.log('[DEBUG] generateFallbackAvaliacao - Conteúdo específico coletado:', {
    total: conteudoEspecifico.length,
    exemplos: conteudoEspecifico.slice(0, 3)
  });
  
  for (let i = 1; i <= numQuestoes; i++) {
    html += `    <div class="questao">
`;
    html += `      <h3>Questão ${i} (${pontosPorQuestao} pontos)</h3>
`;
    
    // Selecionar conteúdo específico para a questão
    const conteudoQuestao = conteudoEspecifico.length > 0 
      ? conteudoEspecifico[Math.floor(Math.random() * conteudoEspecifico.length)]
      : `conteúdo de ${planoAula.disciplinaNome}`;
    
    if (i <= Math.ceil(numQuestoes * 0.6)) {
      // Questões objetivas (60% das questões)
      html += `      <p>Questão de múltipla escolha sobre: <strong>${conteudoQuestao}</strong></p>
`;
      html += `      <p>Marque a alternativa correta:</p>
`;
      html += `      <ol type="a">
`;
      html += `        <li>( ) Alternativa A</li>
`;
      html += `        <li>( ) Alternativa B</li>
`;
      html += `        <li>( ) Alternativa C</li>
`;
      html += `        <li>( ) Alternativa D</li>
`;
      html += `      </ol>
`;
    } else {
      // Questões dissertativas (40% das questões)
      html += `      <p>Questão dissertativa sobre: <strong>${conteudoQuestao}</strong></p>
`;
      html += `      <p>Desenvolva sua resposta de forma clara e organizada, explicando os conceitos estudados.</p>
`;
      html += `      <div class="espaco-resposta">
`;
      html += `        <p>Resposta:</p>
`;
      html += `        <div class="linhas-resposta">
`;
      for (let linha = 0; linha < 8; linha++) {
        html += `          <p class="linha">_________________________________________________________________</p>
`;
      }
      html += `        </div>
`;
      html += `      </div>
`;
    }
    
    html += `    </div>
\n`;
  }
  
  html += `  </section>
\n`;
  
  // Rodapé
  html += `  <footer class="avaliacao-footer">
`;
  html += `    <p><strong>Nota obtida:</strong> _____ / ${configAvaliacao.notaMaxima}</p>
`;
  html += `    <p><strong>Observações do professor:</strong></p>
`;
  html += `    <div class="observacoes">
`;
  for (let i = 0; i < 3; i++) {
    html += `      <p class="linha">_________________________________________________________________</p>
`;
  }
  html += `    </div>
`;
  html += `  </footer>
`;
  
  html += `</div>
`;
  
  // CSS básico inline para formatação
  html += `\n<style>
`;
  html += `.avaliacao-fallback { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
`;
  html += `.avaliacao-header { border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px; }
`;
  html += `.avaliacao-header h1 { text-align: center; margin-bottom: 15px; }
`;
  html += `.info-basica { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
`;
  html += `.instrucoes { margin-bottom: 25px; }
`;
  html += `.instrucoes h2 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
`;
  html += `.questao { margin-bottom: 25px; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
`;
  html += `.questao h3 { color: #444; margin-bottom: 10px; }
`;
  html += `.espaco-resposta { margin-top: 15px; }
`;
  html += `.linha { margin: 5px 0; }
`;
  html += `.avaliacao-footer { border-top: 2px solid #333; padding-top: 15px; margin-top: 30px; }
`;
  html += `.observacoes { margin-top: 10px; }
`;
  html += `@media print { .avaliacao-fallback { padding: 10px; } }
`;
  html += `</style>`;
  
  return html;
}

export const openaiService = new OpenAIChatService();