import React, { useState, useEffect } from 'react';
import ImportadorProposta from '../components/ImportadorProposta';
import PesquisaProposta from '../components/PesquisaProposta';
import { verificarPropostaSalva } from '../utils/localStorageDB';

/**
 * Página de gerenciamento da proposta curricular
 */
const PropostaCurricular: React.FC = () => {
  const [tabAtiva, setTabAtiva] = useState<'buscar' | 'importar'>('buscar');
  const [propostaImportada, setPropostaImportada] = useState<boolean>(verificarPropostaSalva());
  
  // Atualiza o estado quando a proposta for importada
  const verificarPropostaImportada = () => {
    setPropostaImportada(verificarPropostaSalva());
  };

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 via-gray-50 to-blue-100">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-foreground">Proposta Curricular</h1>
        </div>
        
        {/* Subtítulo */}
        <h2 className="text-xl text-center font-semibold text-muted-foreground mb-6">
          1° ao 5° Ano 2025
        </h2>
      
        {/* Abas de navegação */}
        <div className="bg-card rounded-xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.1)] border border-border p-6 mb-6 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] transition-shadow duration-300">
          <div className="flex justify-center border-b border-border mb-6">
            <button
              className={`px-6 py-3 font-medium ${tabAtiva === 'buscar' 
                ? 'text-primary border-b-2 border-primary' 
                : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setTabAtiva('buscar')}
            >
              Consultar Proposta
            </button>
            <button
              className={`px-6 py-3 font-medium ${tabAtiva === 'importar' 
                ? 'text-primary border-b-2 border-primary' 
                : 'text-muted-foreground hover:text-foreground'}`}
              onClick={() => setTabAtiva('importar')}
            >
              Importar/Gerenciar
            </button>
          </div>
          
          {/* Conteúdo das abas */}
          <div className="mt-6">
            {tabAtiva === 'buscar' && (
              <>
                {!propostaImportada ? (
                  <div className="text-center py-8 bg-card rounded-lg shadow-sm p-6">
                    <p className="text-lg text-muted-foreground mb-4">
                      A proposta curricular ainda não foi importada para o banco de dados local.
                    </p>
                    <button
                      onClick={() => setTabAtiva('importar')}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    >
                      Ir para a página de importação
                    </button>
                  </div>
                ) : (
                  <PesquisaProposta />
                )}
              </>
            )}
            
            {tabAtiva === 'importar' && (
              <div onChange={() => verificarPropostaImportada()}>
                <ImportadorProposta />
              </div>
            )}
          </div>
        </div>
        
        {/* Informações sobre o uso */}
        <div className="bg-muted/50 rounded-xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.1)] border border-border p-6 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] transition-shadow duration-300">
          <h3 className="text-lg font-semibold text-foreground mb-3">
            Sobre a Proposta Curricular
          </h3>
          <p className="text-muted-foreground mb-4">
            Este módulo permite importar e consultar a proposta curricular do 1° ao 5° ano de 2025 diretamente no seu navegador.
          </p>
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">• Os dados são armazenados localmente no seu navegador.</p>
            <p className="mb-2">• Você pode pesquisar por termos específicos ou consultar o conteúdo por ano escolar.</p>
            <p className="mb-2">• A importação é feita uma única vez, a menos que você decida remover os dados.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropostaCurricular;