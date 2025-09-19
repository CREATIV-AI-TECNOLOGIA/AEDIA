const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://kdjpvjvptqikgqjtjmcp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkanB2anZwdHFpa2dxanRqbWNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0Mzc1ODgsImV4cCI6MjA2MjAxMzU4OH0.SAdHV9ba5vGnjBgKASb0hoVV7X4E-Ip-bPbSuJZNSsw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarDadosBNCC() {
  try {
    console.log('🔍 Verificando dados na tabela habilidades_bncc_v2...');
    
    // Contar total de registros
    const { count, error: countError } = await supabase
      .from('habilidades_bncc_v2')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Erro ao contar registros:', countError);
      return;
    }
    
    console.log(`📊 Total de registros na tabela: ${count}`);
    
    if (count > 0) {
      // Buscar alguns exemplos
      const { data, error } = await supabase
        .from('habilidades_bncc_v2')
        .select('codigo, disciplina, ano_serie, serie_nome, descricao')
        .order('codigo')
        .limit(5);
      
      if (error) {
        console.error('❌ Erro ao buscar exemplos:', error);
        return;
      }
      
      console.log('\n📋 Exemplos de dados inseridos:');
      data.forEach((item, index) => {
        console.log(`\n${index + 1}. Código: ${item.codigo}`);
        console.log(`   Disciplina: ${item.disciplina}`);
        console.log(`   Ano/Série: ${item.ano_serie} - ${item.serie_nome}`);
        console.log(`   Descrição: ${item.descricao.substring(0, 100)}...`);
      });
      
      // Verificar distribuição por disciplina
      const { data: disciplinas, error: discError } = await supabase
        .from('habilidades_bncc_v2')
        .select('disciplina')
        .order('disciplina');
      
      if (!discError && disciplinas) {
        const contadorDisciplinas = {};
        disciplinas.forEach(item => {
          contadorDisciplinas[item.disciplina] = (contadorDisciplinas[item.disciplina] || 0) + 1;
        });
        
        console.log('\n📚 Distribuição por disciplina:');
        Object.entries(contadorDisciplinas).forEach(([disciplina, quantidade]) => {
          console.log(`   ${disciplina}: ${quantidade} habilidades`);
        });
      }
    } else {
      console.log('⚠️  Nenhum registro encontrado na tabela habilidades_bncc_v2');
    }
    
    // Verificar outras tabelas relacionadas
    console.log('\n🔍 Verificando outras tabelas...');
    
    const { count: countVinculos } = await supabase
      .from('professor_habilidades_vinculos')
      .select('*', { count: 'exact', head: true });
    
    const { count: countPlanos } = await supabase
      .from('planos_aula_v2')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 professor_habilidades_vinculos: ${countVinculos || 0} registros`);
    console.log(`📊 planos_aula_v2: ${countPlanos || 0} registros`);
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

verificarDadosBNCC();