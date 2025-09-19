import React, { useState } from 'react';
import { testarIntegracao } from '../scripts/testeIntegracao';
import { useHabilidades, usePraticas } from '../hooks/useHabilidades';

const TesteIntegracao: React.FC = () => {
  const [testeLogs, setTesteLogs] = useState<string[]>([]);
  const [testando, setTestando] = useState(false);
  
  // Teste dos hooks
  const professorId = 7;
  const { 
    habilidades, 
    loadingHabilidades, 
    errorHabilidades, 
    contexto, 
    loadingContexto 
  } = useHabilidades(professorId);
  
  const filtrosPraticas = React.useMemo(() => ({
    disciplina: contexto?.disciplina || '',
    serie: contexto?.serie || '',
    periodo: contexto?.periodo || ''
  }), [contexto]);
  
  const { 
    praticas, 
    loadingPraticas, 
    errorPraticas 
  } = usePraticas(filtrosPraticas);

  const executarTeste = async () => {
    setTestando(true);
    setTesteLogs([]);
    
    // Capturar logs do console
    const originalLog = console.log;
    const originalError = console.error;
    const logs: string[] = [];
    
    console.log = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      logs.push(message);
      originalLog(...args);
    };
    
    console.error = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      logs.push(`ERROR: ${message}`);
      originalError(...args);
    };
    
    try {
      await testarIntegracao();
    } catch (error) {
      logs.push(`ERRO CRÍTICO: ${error}`);
    }
    
    // Restaurar console original
    console.log = originalLog;
    console.error = originalError;
    
    setTesteLogs(logs);
    setTestando(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            🧪 Teste de Integração - Habilidades BNCC
          </h1>
          
          {/* Status dos Hooks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">📊 Status dos Hooks</h3>
              <div className="space-y-2 text-sm">
                <div>Contexto: {loadingContexto ? '⏳ Carregando...' : contexto ? '✅ Carregado' : '❌ Erro'}</div>
                <div>Habilidades: {loadingHabilidades ? '⏳ Carregando...' : habilidades.length > 0 ? `✅ ${habilidades.length} encontradas` : '❌ Nenhuma'}</div>
                <div>Práticas: {loadingPraticas ? '⏳ Carregando...' : praticas.length > 0 ? `✅ ${praticas.length} encontradas` : '❌ Nenhuma'}</div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">🎯 Contexto do Professor</h3>
              {contexto ? (
                <div className="space-y-1 text-sm">
                  <div>Disciplina: {contexto.disciplina}</div>
                  <div>Série: {contexto.serie}</div>
                  <div>Período: {contexto.periodo}</div>
                </div>
              ) : (
                <div className="text-gray-500 text-sm">Carregando contexto...</div>
              )}
            </div>
          </div>
          
          {/* Erros */}
          {(errorHabilidades || errorPraticas) && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-red-900 mb-2">⚠️ Erros Detectados</h3>
              {errorHabilidades && <div className="text-red-700 text-sm mb-1">Habilidades: {errorHabilidades}</div>}
              {errorPraticas && <div className="text-red-700 text-sm">Práticas: {errorPraticas}</div>}
            </div>
          )}
          
          {/* Botão de Teste */}
          <div className="mb-6">
            <button
              onClick={executarTeste}
              disabled={testando}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {testando ? '🔄 Executando Teste...' : '🚀 Executar Teste Completo'}
            </button>
          </div>
          
          {/* Logs do Teste */}
          {testeLogs.length > 0 && (
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto max-h-96">
              <h3 className="text-white font-semibold mb-2">📋 Logs do Teste:</h3>
              {testeLogs.map((log, index) => (
                <div key={index} className={log.startsWith('ERROR') || log.startsWith('ERRO') ? 'text-red-400' : ''}>
                  {log}
                </div>
              ))}
            </div>
          )}
          
          {/* Dados Carregados */}
          {habilidades.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-gray-900 mb-3">📚 Habilidades Carregadas (Primeiras 3):</h3>
              <div className="space-y-2">
                {habilidades.slice(0, 3).map((habilidade, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded border text-sm">
                    <div className="font-medium">{habilidade.codigo}</div>
                    <div className="text-gray-600">{habilidade.descricao}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {habilidade.disciplina} | {habilidade.serie} | {habilidade.pratica_linguagem}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TesteIntegracao;