// Script para testar dados do Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kdjpvjvptqikgqjtjmcp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkanB2anZwdHFpa2dxanRqbWNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0Mzc1ODgsImV4cCI6MjA2MjAxMzU4OH0.SAdHV9ba5vGnjBgKASb0hoVV7X4E-Ip-bPbSuJZNSsw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseData() {
  console.log('=== TESTE DE DADOS SUPABASE ===');
  
  try {
    // Teste 1: Verificar total de registros
    console.log('\n1. Total de registros na tabela:');
    const { data: totalData, error: totalError } = await supabase
      .from('habilidades_bncc_v2')
      .select('*', { count: 'exact', head: true });
    
    if (totalError) {
      console.error('Erro ao contar registros:', totalError);
    } else {
      console.log('Total de registros:', totalData?.length || 'N/A');
    }
    
    // Teste 2: Verificar disciplinas disponíveis
    console.log('\n2. Disciplinas disponíveis:');
    const { data: disciplinasData, error: disciplinasError } = await supabase
      .from('habilidades_bncc_v2')
      .select('disciplina')
      .not('disciplina', 'is', null);
    
    if (disciplinasError) {
      console.error('Erro ao buscar disciplinas:', disciplinasError);
    } else {
      const disciplinasUnicas = [...new Set(disciplinasData?.map(d => d.disciplina) || [])];
      console.log('Disciplinas encontradas:', disciplinasUnicas);
    }
    
    // Teste 3: Verificar dados de Língua Portuguesa
    console.log('\n3. Dados de Língua Portuguesa:');
    const { data: lpData, error: lpError } = await supabase
      .from('habilidades_bncc_v2')
      .select('*')
      .eq('disciplina', 'Língua Portuguesa')
      .limit(5);
    
    if (lpError) {
      console.error('Erro ao buscar dados de LP:', lpError);
    } else {
      console.log('Registros de Língua Portuguesa encontrados:', lpData?.length || 0);
      if (lpData && lpData.length > 0) {
        console.log('Primeiro registro:', {
          id: lpData[0].id,
          codigo: lpData[0].codigo,
          disciplina: lpData[0].disciplina,
          ano_serie: lpData[0].ano_serie,
          pratica_linguagem: lpData[0].pratica_linguagem,
          descricao: lpData[0].descricao?.substring(0, 100) + '...'
        });
      }
    }
    
    // Teste 4: Verificar práticas de linguagem
    console.log('\n4. Práticas de linguagem disponíveis:');
    const { data: praticasData, error: praticasError } = await supabase
      .from('habilidades_bncc_v2')
      .select('pratica_linguagem')
      .eq('disciplina', 'Língua Portuguesa')
      .not('pratica_linguagem', 'is', null);
    
    if (praticasError) {
      console.error('Erro ao buscar práticas:', praticasError);
    } else {
      const praticasUnicas = [...new Set(praticasData?.map(p => p.pratica_linguagem) || [])];
      console.log('Práticas de linguagem encontradas:', praticasUnicas);
    }
    
    // Teste 5: Testar filtro específico usado no componente
    console.log('\n5. Teste com filtros do componente:');
    const { data: filtroData, error: filtroError } = await supabase
      .from('habilidades_bncc_v2')
      .select('*')
      .eq('disciplina', 'Língua Portuguesa')
      .eq('ano_serie', 1);
    
    if (filtroError) {
      console.error('Erro ao aplicar filtros:', filtroError);
    } else {
      console.log('Registros com filtro (disciplina=LP, ano=1):', filtroData?.length || 0);
    }
    
  } catch (error) {
    console.error('Erro geral no teste:', error);
  }
}

testSupabaseData();