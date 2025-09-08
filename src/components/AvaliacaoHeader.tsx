import React from 'react';
import { ArrowLeft, Edit, Save, X, Download, FileText, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AvaliacaoHeaderProps {
  titulo: string;
  modoEdicao: boolean;
  setModoEdicao: (modo: boolean) => void;
  salvarAlteracoes: () => void;
  salvandoAlteracoes: boolean;
  menuExportacao: boolean;
  setMenuExportacao: (aberto: boolean) => void;
  exportarPDF: () => void;
  exportarWord: () => void;
  imprimir: () => void;
}

const AvaliacaoHeader: React.FC<AvaliacaoHeaderProps> = ({
  titulo,
  modoEdicao,
  setModoEdicao,
  salvarAlteracoes,
  salvandoAlteracoes,
  menuExportacao,
  setMenuExportacao,
  exportarPDF,
  exportarWord,
  imprimir
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/avaliacoes')}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Voltar
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {titulo || 'Carregando...'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {modoEdicao ? 'Modo de edição ativo' : 'Visualização'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Botão de Edição/Salvar */}
          {modoEdicao ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={salvarAlteracoes}
                disabled={salvandoAlteracoes}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="h-4 w-4 mr-2" />
                {salvandoAlteracoes ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                onClick={() => setModoEdicao(false)}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setModoEdicao(true)}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </button>
          )}

          {/* Menu de Exportação */}
          <div className="relative">
            <button
              onClick={() => setMenuExportacao(!menuExportacao)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </button>
            
            {menuExportacao && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                <div className="py-1">
                  <button
                    onClick={() => {
                      exportarPDF();
                      setMenuExportacao(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <FileText className="h-4 w-4 mr-3" />
                    Exportar como PDF
                  </button>
                  <button
                    onClick={() => {
                      exportarWord();
                      setMenuExportacao(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <FileText className="h-4 w-4 mr-3" />
                    Exportar como Word
                  </button>
                  <button
                    onClick={() => {
                      imprimir();
                      setMenuExportacao(false);
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Printer className="h-4 w-4 mr-3" />
                    Imprimir
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvaliacaoHeader;