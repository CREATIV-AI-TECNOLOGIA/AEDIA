import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProcessarProvaRequest {
  imagem: string;
  turmaId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { imagem, turmaId }: ProcessarProvaRequest = await req.json()

    if (!imagem || !turmaId) {
      return new Response(
        JSON.stringify({ error: 'Imagem e turmaId são obrigatórios' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Inicializar Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log('🔍 Iniciando processamento da prova para turma:', turmaId)

    // 1. Detectar nome do aluno usando OpenAI
    const nomeAluno = await detectarNomeAluno(imagem)
    console.log('👤 Nome detectado:', nomeAluno)

    // 2. Detectar código da avaliação
    const codigoAvaliacao = await detectarCodigoAvaliacao(imagem)
    console.log('📝 Código detectado:', codigoAvaliacao)

    // 3. Buscar aluno na base de dados
    let alunoId = null
    if (nomeAluno) {
      const { data: alunos } = await supabase
        .from('alunos')
        .select('id, nome')
        .eq('turma_id', turmaId)
        .ilike('nome', `%${nomeAluno}%`)
        .limit(1)

      if (alunos && alunos.length > 0) {
        alunoId = alunos[0].id
        console.log('✅ Aluno encontrado:', alunos[0].nome)
      }
    }

    // 4. Buscar avaliação na base de dados
    let avaliacaoId = null
    if (codigoAvaliacao) {
      const { data: avaliacoes } = await supabase
        .from('avaliacoes')
        .select('id, titulo')
        .eq('turma_id', turmaId)
        .eq('codigo', codigoAvaliacao)
        .limit(1)

      if (avaliacoes && avaliacoes.length > 0) {
        avaliacaoId = avaliacoes[0].id
        console.log('✅ Avaliação encontrada:', avaliacoes[0].titulo)
      }
    }

    // 5. Salvar prova na base de dados
    const { data: prova, error: provaError } = await supabase
      .from('provas_corrigidas')
      .insert({
        turma_id: turmaId,
        aluno_id: alunoId,
        avaliacao_id: avaliacaoId,
        imagem_original: imagem,
        nome_detectado: nomeAluno,
        codigo_detectado: codigoAvaliacao,
        status: 'pendente_processamento',
        data_envio: new Date().toISOString()
      })
      .select()
      .single()

    if (provaError) {
      console.error('❌ Erro ao salvar prova:', provaError)
      throw provaError
    }

    console.log('✅ Prova salva com ID:', prova.id)

    // 6. Processar correção em background (opcional)
    // Aqui você pode adicionar lógica para processar a correção automaticamente
    // ou apenas marcar como "aguardando_correcao"

    return new Response(
      JSON.stringify({
        success: true,
        provaId: prova.id,
        alunoDetectado: nomeAluno,
        codigoDetectado: codigoAvaliacao,
        alunoEncontrado: !!alunoId,
        avaliacaoEncontrada: !!avaliacaoId
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Erro no processamento:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// Função para detectar nome do aluno usando OpenAI
async function detectarNomeAluno(imagemBase64: string): Promise<string | null> {
  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      console.log('⚠️ OpenAI API Key não configurada')
      return null
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analise esta imagem de uma prova escolar e identifique o NOME DO ALUNO. Retorne APENAS o nome, sem explicações. Se não conseguir identificar, retorne "null".'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imagemBase64
                }
              }
            ]
          }
        ],
        max_tokens: 50,
        temperature: 0
      })
    })

    const data = await response.json()
    const nomeDetectado = data.choices?.[0]?.message?.content?.trim()
    
    return nomeDetectado && nomeDetectado !== 'null' ? nomeDetectado : null
  } catch (error) {
    console.error('❌ Erro na detecção do nome:', error)
    return null
  }
}

// Função para detectar código da avaliação
async function detectarCodigoAvaliacao(imagemBase64: string): Promise<string | null> {
  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      console.log('⚠️ OpenAI API Key não configurada')
      return null
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analise esta imagem de uma prova escolar e identifique o CÓDIGO DA AVALIAÇÃO no formato AV-2024-XXX. Retorne APENAS o código, sem explicações. Se não conseguir identificar, retorne "null".'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imagemBase64
                }
              }
            ]
          }
        ],
        max_tokens: 50,
        temperature: 0
      })
    })

    const data = await response.json()
    const codigoDetectado = data.choices?.[0]?.message?.content?.trim()
    
    return codigoDetectado && codigoDetectado !== 'null' ? codigoDetectado : null
  } catch (error) {
    console.error('❌ Erro na detecção do código:', error)
    return null
  }
} 