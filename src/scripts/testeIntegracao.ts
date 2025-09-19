import { HabilidadesService } from '../services/HabilidadesService';
import { supabase } from '../lib/supabase';

// Teste da integração com o banco de dados
async function testarIntegracao() {
  console.log('🔍 Iniciando teste de integração...');
  
  try {
    const service = new HabilidadesService(supabase);
    
    // Teste 1: Buscar contexto do professor
    console.log('\n📋 Teste 1: Buscando contexto do professor...');
    const contexto = await service.obterContextoProfessor(7);
    console.log('Contexto encontrado:', contexto);
    
    if (!contexto) {
      console.error('❌ Erro: Contexto do professor não encontrado');
      return;
    }
    
    // Teste 2: Buscar práticas de linguagem
    console.log('\n📚 Teste 2: Buscando práticas de linguagem...');
    const praticas = await service.buscarPraticasLinguagem({
      disciplina: contexto.disciplina,
      serie: contexto.serie,
      periodo: contexto.periodo
    });
    console.log('Práticas encontradas:', praticas);
    
    // Teste 3: Buscar habilidades BNCC
    console.log('\n✨ Teste 3: Buscando habilidades BNCC...');
    const habilidades = await service.buscarHabilidadesBNCC({
      disciplina: contexto.disciplina,
      serie: contexto.serie,
      periodo: contexto.periodo
    });
    console.log(`Habilidades encontradas: ${habilidades.length}`);
    
    if (habilidades.length > 0) {
      console.log('Primeira habilidade:', habilidades[0]);
    }
    
    // Teste 4: Buscar gêneros textuais
    console.log('\n📖 Teste 4: Buscando gêneros textuais...');
    const generos = await service.buscarGenerosTextuais();
    console.log('Gêneros encontrados:', generos);
    
    // Teste 5: Buscar disciplinas
    console.log('\n🎓 Teste 5: Buscando disciplinas...');
    const disciplinas = await service.buscarDisciplinas();
    console.log('Disciplinas encontradas:', disciplinas);
    
    console.log('\n✅ Teste de integração concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante o teste de integração:', error);
  }
}

// Executar teste se este arquivo for executado diretamente
if (typeof window !== 'undefined') {
  // Executar no browser
  (window as any).testarIntegracao = testarIntegracao;
  console.log('🚀 Função testarIntegracao() disponível no console do browser');
} else {
  // Executar no Node.js
  testarIntegracao();
}

export { testarIntegracao };