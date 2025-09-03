import React, { useState, useEffect } from 'react';
import { 
  salvarPropostaCurricular, 
  obterPropostaCurricular, 
  verificarPropostaSalva,
  removerPropostaCurricular
} from '../utils/localStorageDB';

/**
 * Componente para importar e gerenciar a proposta curricular
 */
const ImportadorProposta: React.FC = () => {
  const [status, setStatus] = useState<string>('');
  const [proposta, setProposta] = useState<string>('');
  const [jaImportado, setJaImportado] = useState<boolean>(false);

  // Verifica se a proposta já está importada ao carregar o componente
  useEffect(() => {
    const verificarImportacao = () => {
      const importado = verificarPropostaSalva();
      setJaImportado(importado);
      
      if (importado) {
        const conteudo = obterPropostaCurricular();
        setProposta(conteudo || '');
      }
    };
    
    verificarImportacao();
  }, []);

  // Função para importar o documento
  const importarDocumento = async () => {
    try {
      // Buscar o arquivo no servidor
      const resposta = await fetch('/PROPOSTA CURRICULAR 1 AO 5 ANO 2025.txt');
      
      if (!resposta.ok) {
        throw new Error('Não foi possível carregar o documento');
      }
      
      const conteudo = await resposta.text();
      
      // Salvar no localStorage
      const salvo = salvarPropostaCurricular(conteudo);
      
      if (salvo) {
        setStatus('Documento importado com sucesso!');
        setProposta(conteudo);
        setJaImportado(true);
      } else {
        setStatus('Erro ao salvar o documento no armazenamento local.');
      }
    } catch (erro) {
      console.error('Erro ao importar documento:', erro);
      setStatus(`Erro ao importar documento: ${(erro as Error).message}`);
    }
  };

  // Função para remover o documento
  const removerDocumento = () => {
    const removido = removerPropostaCurricular();
    
    if (removido) {
      setStatus('Documento removido com sucesso!');
      setProposta('');
      setJaImportado(false);
    } else {
      setStatus('Erro ao remover o documento.');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Proposta Curricular - Banco de Dados Local
      </h2>
      
      {status && (
        <div className={`p-4 mb-4 rounded-md ${status.includes('Erro') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {status}
        </div>
      )}
      
      <div className="space-y-4">
        {!jaImportado ? (
          <button
            onClick={importarDocumento}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Importar Proposta Curricular para o Banco de Dados Local
          </button>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-green-600 font-medium">
                ✓ Proposta Curricular importada e disponível no banco de dados local
              </p>
              <button
                onClick={removerDocumento}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Remover Documento
              </button>
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Prévia do conteúdo:</h3>
              <div className="max-h-60 overflow-y-auto p-4 border border-gray-200 rounded-md bg-gray-50 font-mono text-sm">
                {proposta ? proposta.slice(0, 500) + '...' : 'Nenhum conteúdo disponível'}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ImportadorProposta; 