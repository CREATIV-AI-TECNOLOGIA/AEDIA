import { costOptimizedChatService, CostOptimizedResponse } from '../services/costOptimizedChatService';

// Simulação de como o sistema processaria a pergunta "Como é feito o açúcar refinado?"
async function demonstrateOptimization() {
  console.log('🚀 DEMONSTRAÇÃO DO SISTEMA DE OTIMIZAÇÃO DE CUSTOS');
  console.log('=' .repeat(60));
  
  const question = "Como é feito o açúcar refinado?";
  const professorId = "123"; // ID fictício para demonstração
  
  console.log(`📝 Pergunta original: "${question}"`);
  console.log('');
  
  try {
    // Processar a pergunta através do sistema otimizado
    const result: CostOptimizedResponse = await costOptimizedChatService.processOptimizedQuestion(
      question, 
      professorId
    );
    
    // Exibir resultados detalhados
    console.log('📊 RESULTADO DA OTIMIZAÇÃO:');
    console.log('-'.repeat(40));
    console.log(`🎯 Fonte: ${getSourceDescription(result.optimization.source)}`);
    console.log(`💰 Custo: $${result.cost.toFixed(6)} (R$ ${(result.cost * 5.64).toFixed(4)})`);
    console.log(`⚡ Tempo: ${result.optimization.processingTime}ms`);
    console.log(`🔢 Tokens entrada: ${result.optimization.tokensUsed.input}`);
    console.log(`🔢 Tokens saída: ${result.optimization.tokensUsed.output}`);
    
    if (result.optimization.compressionSavings) {
      console.log(`📦 Economia compressão: ${result.optimization.compressionSavings.toFixed(1)}%`);
    }
    
    console.log('');
    console.log('📋 RESPOSTA OTIMIZADA:');
    console.log('-'.repeat(40));
    console.log(result.answer);
    
    // Calcular economia vs método tradicional
    const traditionalCost = (1000 * 0.00015) + (3000 * 0.0006); // $0.00195
    const savings = ((traditionalCost - result.cost) / traditionalCost) * 100;
    
    console.log('');
    console.log('💡 ANÁLISE DE ECONOMIA:');
    console.log('-'.repeat(40));
    console.log(`💸 Custo tradicional: $${traditionalCost.toFixed(6)} (R$ ${(traditionalCost * 5.64).toFixed(4)})`);
    console.log(`💰 Custo otimizado: $${result.cost.toFixed(6)} (R$ ${(result.cost * 5.64).toFixed(4)})`);
    console.log(`🎉 Economia: ${savings.toFixed(1)}%`);
    
    // Projeção mensal
    const monthlyQuestions = 168; // Baseado no orçamento R$ 1,20
    const monthlyCostTraditional = traditionalCost * monthlyQuestions;
    const monthlyCostOptimized = result.cost * monthlyQuestions;
    
    console.log('');
    console.log('📈 PROJEÇÃO MENSAL (168 perguntas):');
    console.log('-'.repeat(40));
    console.log(`💸 Método tradicional: $${monthlyCostTraditional.toFixed(4)} (R$ ${(monthlyCostTraditional * 5.64).toFixed(2)})`);
    console.log(`💰 Método otimizado: $${monthlyCostOptimized.toFixed(4)} (R$ ${(monthlyCostOptimized * 5.64).toFixed(2)})`);
    console.log(`🎯 Economia mensal: R$ ${((monthlyCostTraditional - monthlyCostOptimized) * 5.64).toFixed(2)}`);
    
    // Estatísticas do sistema
    const stats = costOptimizedChatService.getOptimizationStats();
    console.log('');
    console.log('📊 ESTATÍSTICAS DO SISTEMA:');
    console.log('-'.repeat(40));
    console.log(`💾 Respostas em cache: ${stats.cacheSize}`);
    console.log(`🎯 Respostas pré-computadas: ${stats.preComputedAnswers}`);
    console.log(`📈 Taxa de acerto cache: ${stats.cacheHitRate.toFixed(1)}%`);
    
    return result;
    
  } catch (error) {
    console.error('❌ Erro na demonstração:', error);
    throw error;
  }
}

function getSourceDescription(source: string): string {
  const descriptions: Record<string, string> = {
    'cache': '💾 CACHE (0% custo) - Resposta já processada anteriormente',
    'precomputed': '🎯 PRÉ-COMPUTADA (0% custo) - Resposta educacional padrão',
    'ai_quick': '⚡ IA RÁPIDA (30% custo) - Resposta concisa otimizada',
    'ai_full': '🤖 IA COMPLETA (100% custo) - Resposta detalhada otimizada'
  };
  
  return descriptions[source] || source;
}

// Exemplo de múltiplas perguntas para demonstrar diferentes cenários
async function demonstrateMultipleScenarios() {
  console.log('🎭 DEMONSTRAÇÃO DE MÚLTIPLOS CENÁRIOS');
  console.log('=' .repeat(60));
  
  const scenarios = [
    {
      question: "Como é feito o açúcar refinado?",
      expectedSource: "precomputed",
      description: "Pergunta com resposta pré-computada"
    },
    {
      question: "O que é fotossíntese?",
      expectedSource: "ai_quick",
      description: "Pergunta simples - resposta rápida"
    },
    {
      question: "Explique detalhadamente as estratégias pedagógicas para ensino de matemática no ensino fundamental considerando as dificuldades de aprendizagem",
      expectedSource: "ai_full",
      description: "Pergunta complexa - resposta completa"
    },
    {
      question: "Como é feito açúcar refinado?", // Variação da primeira
      expectedSource: "cache",
      description: "Pergunta similar - deve usar cache"
    }
  ];
  
  let totalCost = 0;
  let totalTraditionalCost = 0;
  
  for (let i = 0; i < scenarios.length; i++) {
    const scenario = scenarios[i];
    console.log(`\n${i + 1}. ${scenario.description}`);
    console.log(`📝 "${scenario.question}"`);
    
    try {
      const result = await costOptimizedChatService.processOptimizedQuestion(
        scenario.question,
        "123"
      );
      
      const traditionalCost = (1000 * 0.00015) + (3000 * 0.0006);
      totalCost += result.cost;
      totalTraditionalCost += traditionalCost;
      
      console.log(`   🎯 Fonte: ${result.optimization.source}`);
      console.log(`   💰 Custo: $${result.cost.toFixed(6)} vs $${traditionalCost.toFixed(6)} (tradicional)`);
      console.log(`   📊 Economia: ${(((traditionalCost - result.cost) / traditionalCost) * 100).toFixed(1)}%`);
      
    } catch (error) {
      console.log(`   ❌ Erro: ${error}`);
    }
  }
  
  console.log('\n📈 RESUMO TOTAL:');
  console.log('-'.repeat(40));
  console.log(`💰 Custo otimizado: $${totalCost.toFixed(6)} (R$ ${(totalCost * 5.64).toFixed(4)})`);
  console.log(`💸 Custo tradicional: $${totalTraditionalCost.toFixed(6)} (R$ ${(totalTraditionalCost * 5.64).toFixed(4)})`);
  console.log(`🎉 Economia total: ${(((totalTraditionalCost - totalCost) / totalTraditionalCost) * 100).toFixed(1)}%`);
}

// Simulação específica para a pergunta do usuário
function simulateUserQuestion() {
  console.log('🎯 SIMULAÇÃO ESPECÍFICA: "Como é feito o açúcar refinado?"');
  console.log('=' .repeat(60));
  
  console.log('🔍 PROCESSAMENTO PASSO A PASSO:');
  console.log('');
  
  console.log('1️⃣ CAMADA 1 - Verificação de Cache:');
  console.log('   💾 Buscando pergunta similar no cache...');
  console.log('   ❌ Nenhuma entrada encontrada (primeira vez)');
  console.log('');
  
  console.log('2️⃣ CAMADA 2 - Respostas Pré-computadas:');
  console.log('   🎯 Analisando palavras-chave: ["açúcar", "refinado", "processo"]');
  console.log('   ✅ MATCH ENCONTRADO! ID: acucar_refinado_001');
  console.log('   📊 Similaridade: 95% com pergunta pré-computada');
  console.log('   🎉 RESPOSTA PRÉ-COMPUTADA SELECIONADA!');
  console.log('');
  
  console.log('💰 RESULTADO FINAL:');
  console.log('   🎯 Fonte: Resposta Pré-computada');
  console.log('   💰 Custo: $0.000000 (R$ 0,0000)');
  console.log('   ⚡ Tempo: ~10ms');
  console.log('   🔢 Tokens: 0 entrada + 0 saída');
  console.log('   🎉 Economia: 100% vs método tradicional');
  console.log('');
  
  console.log('📋 RESPOSTA ENTREGUE:');
  console.log('-'.repeat(40));
  console.log(`O açúcar refinado é produzido através de um processo industrial que envolve várias etapas:

**1. Extração do Caldo:**
- Cana-de-açúcar é moída para extrair o caldo
- O caldo contém sacarose, água e impurezas

**2. Clarificação:**
- Adição de cal (hidróxido de cálcio) para neutralizar ácidos
- Aquecimento para coagular impurezas
- Filtração para remover sólidos

**3. Evaporação:**
- O caldo é concentrado em evaporadores
- Remoção de água até formar xarope espesso

**4. Cristalização:**
- Aquecimento controlado do xarope
- Formação de cristais de sacarose
- Processo em tachos a vácuo

**5. Centrifugação:**
- Separação dos cristais do mel residual
- Lavagem com água quente

**6. Refinamento:**
- Dissolução dos cristais em água
- Nova clarificação com carvão ativado
- Filtração para remover cor e impurezas

**7. Secagem e Embalagem:**
- Secagem dos cristais refinados
- Peneiramento para uniformizar granulometria
- Embalagem para distribuição

O resultado é o açúcar branco refinado que conhecemos, com 99,7% de pureza em sacarose.`);
  
  console.log('');
  console.log('🎯 IMPACTO NO ORÇAMENTO MENSAL:');
  console.log('-'.repeat(40));
  console.log('   💰 Orçamento: R$ 1,20/professor/mês');
  console.log('   🎯 Esta pergunta: R$ 0,00 (pré-computada)');
  console.log('   📈 Perguntas restantes: 168 (sem impacto no limite)');
  console.log('   🎉 Professor pode fazer mais 168 perguntas no mês!');
}

export { demonstrateOptimization, demonstrateMultipleScenarios, simulateUserQuestion }; 