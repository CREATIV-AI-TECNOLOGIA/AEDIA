import React, { useState, useEffect } from 'react';
import { 
  buscarPorTermo, 
  obterAnosEscolares, 
  obterConteudoPorAno,
  TrechoResultado
} from '../services/propostaCurricularService';
import { verificarPropostaSalva } from '../utils/localStorageDB';

/**
 * Componente para pesquisar na proposta curricular
 */
const PesquisaProposta: React.FC = () => {
  const [termo, setTermo] = useState<string>('');
  const [resultados, setResultados] = useState<TrechoResultado[]>([]);
  const [anos, setAnos] = useState<string[]>([]);
  const [anoSelecionado, setAnoSelecionado] = useState<string>('');
  const [conteudoAno, setConteudoAno] = useState<string>('');
  const [documentoDisponivel, setDocumentoDisponivel] = useState<boolean>(false);
  const [tipoVisao, setTipoVisao] = useState<'pesquisa' | 'ano'>('pesquisa');

  // Verifica se o documento está disponível e carrega os anos
  useEffect(() => {
    const verificarDocumento = () => {
      const disponivel = verificarPropostaSalva();
      setDocumentoDisponivel(disponivel);
      
      if (disponivel) {
        const listaAnos = obterAnosEscolares();
        setAnos(listaAnos);
      }
    };
    
    verificarDocumento();
  }, []);

  // Função para realizar a pesquisa
  const realizarPesquisa = () => {
    if (!termo.trim()) {
      setResultados([]);
      return;
    }
    
    const resultadosBusca = buscarPorTermo(termo);
    setResultados(resultadosBusca);
  };

  // Função para carregar conteúdo de um ano específico
  const carregarConteudoAno = (ano: string) => {
    const conteudo = obterConteudoPorAno(ano);
    setConteudoAno(conteudo || 'Conteúdo não encontrado para este ano.');
    setAnoSelecionado(ano);
  };

  // Renderiza resultados da pesquisa
  const renderizarResultadosPesquisa = () => {
    if (resultados.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          {termo ? 'Nenhum resultado encontrado' : 'Digite um termo para pesquisar'}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="text-sm text-gray-600 mb-2">
          {resultados.length} resultado(s) encontrado(s)
        </div>
        
        {resultados.map((resultado, index) => (
          <div 
            key={index} 
            className="p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100"
          >
            <div className="text-xs text-gray-500 mb-2">
              {resultado.contexto}
            </div>
            <pre className="whitespace-pre-wrap font-mono text-sm">
              {resultado.texto}
            </pre>
          </div>
        ))}
      </div>
    );
  };

  // Renderiza conteúdo por ano
  const renderizarConteudoPorAno = () => {
    if (!anoSelecionado) {
      return (
        <div className="text-center py-8 text-gray-500">
          Selecione um ano para visualizar seu conteúdo
        </div>
      );
    }

    return (
      <div className="mt-4">
        <h3 className="text-xl font-semibold mb-4">Conteúdo do {anoSelecionado}º Ano</h3>
        <pre className="p-4 border border-gray-200 rounded-lg bg-gray-50 whitespace-pre-wrap font-mono text-sm overflow-auto max-h-[500px]">
          {conteudoAno}
        </pre>
      </div>
    );
  };

  if (!documentoDisponivel) {
    return (
      <div className="p-6 max-w-4xl mx-auto bg-white rounded-xl shadow-md">
        <div className="text-center py-8 text-red-500">
          <p className="mb-4">A proposta curricular não está disponível no banco de dados local.</p>
          <p>Importe o documento antes de realizar pesquisas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Consulta à Proposta Curricular
      </h2>
      
      {/* Abas de navegação */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`px-4 py-2 font-medium text-sm ${tipoVisao === 'pesquisa' 
            ? 'text-blue-600 border-b-2 border-blue-600' 
            : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setTipoVisao('pesquisa')}
        >
          Pesquisa por Termo
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm ${tipoVisao === 'ano' 
            ? 'text-blue-600 border-b-2 border-blue-600' 
            : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setTipoVisao('ano')}
        >
          Consulta por Ano
        </button>
      </div>
      
      {/* Conteúdo da aba de pesquisa */}
      {tipoVisao === 'pesquisa' && (
        <>
          <div className="flex mb-6">
            <input
              type="text"
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              placeholder="Digite um termo para pesquisar..."
              className="flex-grow px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  realizarPesquisa();
                }
              }}
            />
            <button
              onClick={realizarPesquisa}
              className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 transition-colors"
            >
              Pesquisar
            </button>
          </div>
          
          {renderizarResultadosPesquisa()}
        </>
      )}
      
      {/* Conteúdo da aba de consulta por ano */}
      {tipoVisao === 'ano' && (
        <>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecione o Ano:
            </label>
            <div className="flex flex-wrap gap-2">
              {anos.map((ano) => (
                <button
                  key={ano}
                  onClick={() => carregarConteudoAno(ano)}
                  className={`px-4 py-2 rounded-md ${
                    anoSelecionado === ano
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  {ano}º Ano
                </button>
              ))}
            </div>
          </div>
          
          {renderizarConteudoPorAno()}
        </>
      )}
    </div>
  );
};

export default PesquisaProposta; 