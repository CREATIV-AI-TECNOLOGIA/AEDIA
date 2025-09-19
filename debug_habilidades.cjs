const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://kdjpvjvptqikgqjtjmcp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkanB2anZwdHFpa2dxanRqbWNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0Mzc1ODgsImV4cCI6MjA2MjAxMzU4OH0.SAdHV9ba5vGnjBgKASb0hoVV7X4E-Ip-bPbSuJZNSsw'
);

async function debugHabilidades() {
  console.log('🔍 Verificando dados na tabela habilidades...');
  
  // Verificar todos os dados
  const { data: allData, error: allError } = await supabase
    .from('habilidades')
    .select('*')
    .limit(10);
    
  if (allError) {
    console.error('❌ Erro ao buscar habilidades:', allError);
    return;
  }
  
  console.log('📊 Primeiros 10 registros:', JSON.stringify(allData, null, 2));
  
  // Verificar disciplinas disponíveis
  const { data: disciplinas } = await supabase
    .from('disciplinas')
    .select('*');
    
  console.log('📚 Disciplinas disponíveis:', JSON.stringify(disciplinas, null, 2));
  
  // Testar uma busca específica como no código
  const disciplinaId = 1; // Português
  const ano = 3;
  const trimestre = 1;
  
  console.log(`\n🔍 Testando busca específica: disciplina_id=${disciplinaId}, ano=${ano}, trimestre=${trimestre}`);
  
  const { data: specificData, error: specificError } = await supabase
    .from('habilidades')
    .select('id, codigo, descricao, serie, trimestre, disciplina_id, ano')
    .eq('disciplina_id', disciplinaId)
    .eq('ano', ano)
    .eq('trimestre', trimestre);
    
  if (specificError) {
    console.error('❌ Erro na busca específica:', specificError);
  } else {
    console.log('📊 Resultado da busca específica:', JSON.stringify(specificData, null, 2));
  }
}

debugHabilidades().catch(console.error);