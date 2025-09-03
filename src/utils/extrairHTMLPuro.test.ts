/**
 * Testes unitários para a função extrairHTMLPuro
 * 
 * Este arquivo contém os testes que anteriormente estavam executando
 * no navegador dos usuários dentro do componente PlanoAulaFullView.tsx
 */

// Função extrairHTMLPuro (copiada do componente para teste isolado)
function extrairHTMLPuro(texto: string | null | undefined): string {
  if (!texto) return '';
  
  let newTexto = texto;
  
  // Remove blocos de código markdown (```html ... ```)
  newTexto = newTexto.replace(/```html\s*([\s\S]*?)\s*```/g, '$1');
  newTexto = newTexto.replace(/```\s*([\s\S]*?)\s*```/g, '$1');
  
  // Remove tags <pre> e <code>
  newTexto = newTexto.replace(/<pre>([\s\S]*?)<\/pre>/g, '$1');
  newTexto = newTexto.replace(/<code>([\s\S]*?)<\/code>/g, '$1');
  
  // Remove aspas duplas ou simples do início/fim
  newTexto = newTexto.trim().replace(/^['\"]+|['\"]+$/g, '');
  
  // Remove crases do início/fim
  newTexto = newTexto.replace(/^`+|`+$/g, '');
  
  return newTexto.trim();
}

// Função de teste simples (sem framework de teste)
function runTests() {
  console.log('🧪 Iniciando testes da função extrairHTMLPuro...');
  
  const tests = [
    {
      name: 'Deve extrair HTML de bloco markdown com ```html',
      input: '```html\n<h1>Teste</h1>\n<ol>...</ol>\n```',
      expected: '<h1>Teste</h1>\n<ol>...</ol>',
    },
    {
      name: 'Deve extrair HTML de tags <pre><code>',
      input: '<pre><code><h1>Teste</h1>\n<ol>...</ol></code></pre>',
      expected: '<h1>Teste</h1>\n<ol>...</ol>',
    },
    {
      name: 'Deve remover aspas duplas do início e fim',
      input: '"<h1>Teste</h1>\n<ol>...</ol>"',
      expected: '<h1>Teste</h1>\n<ol>...</ol>',
    },
    {
      name: 'Deve remover crases do início e fim',
      input: '`<h1>Teste</h1>\n<ol>...</ol>`',
      expected: '<h1>Teste</h1>\n<ol>...</ol>',
    },
    {
      name: 'Deve retornar HTML puro sem modificações',
      input: '<h1>Teste</h1>\n<ol>...</ol>',
      expected: '<h1>Teste</h1>\n<ol>...</ol>',
    },
    {
      name: 'Deve lidar com string vazia',
      input: '',
      expected: '',
    },
    {
      name: 'Deve lidar com null',
      input: null,
      expected: '',
    },
    {
      name: 'Deve lidar com undefined',
      input: undefined,
      expected: '',
    },
    {
      name: 'Deve remover múltiplas aspas',
      input: '"""<div>Conteúdo</div>"""',
      expected: '<div>Conteúdo</div>',
    },
    {
      name: 'Deve remover múltiplas crases',
      input: '```<span>Texto</span>```',
      expected: '<span>Texto</span>',
    },
    {
      name: 'Deve processar HTML complexo com múltiplas tags',
      input: '```html\n<div class="container">\n  <h1>Título</h1>\n  <p>Parágrafo</p>\n  <ul>\n    <li>Item 1</li>\n    <li>Item 2</li>\n  </ul>\n</div>\n```',
      expected: '<div class="container">\n  <h1>Título</h1>\n  <p>Parágrafo</p>\n  <ul>\n    <li>Item 1</li>\n    <li>Item 2</li>\n  </ul>\n</div>',
    }
  ];

  let passedTests = 0;
  let failedTests = 0;

  tests.forEach((test, index) => {
    try {
      const result = extrairHTMLPuro(test.input);
      
      if (result === test.expected) {
        console.log(`✅ Teste ${index + 1}: ${test.name} - PASSOU`);
        passedTests++;
      } else {
        console.error(`❌ Teste ${index + 1}: ${test.name} - FALHOU`);
        console.error(`   Entrada: ${JSON.stringify(test.input)}`);
        console.error(`   Esperado: ${JSON.stringify(test.expected)}`);
        console.error(`   Recebido: ${JSON.stringify(result)}`);
        failedTests++;
      }
    } catch (error) {
      console.error(`💥 Teste ${index + 1}: ${test.name} - ERRO`);
      console.error(`   Erro: ${error}`);
      failedTests++;
    }
  });

  console.log(`\n📊 Resumo dos testes:`);
  console.log(`   ✅ Passou: ${passedTests}`);
  console.log(`   ❌ Falhou: ${failedTests}`);
  console.log(`   📈 Total: ${tests.length}`);
  
  if (failedTests === 0) {
    console.log(`🎉 Todos os testes passaram!`);
  } else {
    console.log(`⚠️  ${failedTests} teste(s) falharam. Verifique a implementação.`);
  }

  return { passed: passedTests, failed: failedTests, total: tests.length };
}

// Exportar para uso em outros arquivos de teste ou ferramentas de build
export { extrairHTMLPuro, runTests };

// Executar testes automaticamente quando o arquivo for importado em ambiente de desenvolvimento
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
  runTests();
}

// Para execução manual no console do navegador (apenas para debug)
if (typeof window !== 'undefined') {
  (window as any).testExtrairHTMLPuro = runTests;
  console.log('💡 Para executar os testes manualmente, digite: testExtrairHTMLPuro()');
} 