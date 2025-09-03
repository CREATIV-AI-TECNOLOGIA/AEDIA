import React, { useState } from 'react';

const EnvDebug: React.FC = () => {
  const envVars = import.meta.env;
  const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);

  const testOpenAIKey = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      console.log('🧪 Testando chave da API OpenAI...');
      
      if (!openaiKey) {
        setTestResult('❌ Chave não encontrada');
        return;
      }

      // Teste simples da API
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🧪 Resposta da API:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (response.ok) {
        const data = await response.json();
        setTestResult(`✅ Chave válida! ${data.data?.length || 0} modelos disponíveis`);
      } else {
        const errorData = await response.text();
        setTestResult(`❌ Erro ${response.status}: ${response.statusText}\n${errorData}`);
      }
    } catch (error) {
      console.error('🧪 Erro no teste:', error);
      setTestResult(`❌ Erro de rede: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="bg-gray-100 p-4 rounded-lg m-4">
      <h3 className="font-bold text-lg mb-4">🔍 Debug - Variáveis de Ambiente</h3>
      
      <div className="space-y-2">
        <div>
          <strong>VITE_OPENAI_API_KEY:</strong>
          <span className="ml-2 font-mono text-sm">
            {openaiKey ? `${openaiKey.substring(0, 7)}... (${openaiKey.length} caracteres)` : '❌ NÃO ENCONTRADA'}
          </span>
        </div>
        
        <div>
          <strong>Modo:</strong> <span className="ml-2">{envVars.MODE}</span>
        </div>
        
        <div>
          <strong>Produção:</strong> <span className="ml-2">{envVars.PROD ? 'Sim' : 'Não'}</span>
        </div>
        
        <div>
          <strong>Desenvolvimento:</strong> <span className="ml-2">{envVars.DEV ? 'Sim' : 'Não'}</span>
        </div>
        
        <div>
          <strong>Todas as variáveis VITE_:</strong>
          <div className="ml-2 font-mono text-xs bg-white p-2 rounded mt-1">
            {Object.keys(envVars)
              .filter(key => key.startsWith('VITE_'))
              .map(key => (
                <div key={key}>
                  <span className="text-blue-600">{key}:</span> <span className="text-gray-700">***OCULTO***</span>
                </div>
              ))}
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={testOpenAIKey}
            disabled={testing || !openaiKey}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded text-sm"
          >
            {testing ? '🔄 Testando...' : '🧪 Testar Chave OpenAI'}
          </button>
          
          {testResult && (
            <div className="mt-2 p-2 bg-white rounded text-sm font-mono whitespace-pre-wrap">
              {testResult}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnvDebug; 