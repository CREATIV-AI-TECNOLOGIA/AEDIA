import React, { useState } from 'react';

interface SolicitacaoIAPlanoAulaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (nomePlano: string, instrucoesAdicionais: string) => void;
  // Não vamos passar todos os dados aqui por enquanto, focando na coleta
}

const SolicitacaoIAPlanoAulaModal: React.FC<SolicitacaoIAPlanoAulaModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [nomePlano, setNomePlano] = useState('');
  const [instrucoesAdicionais, setInstrucoesAdicionais] = useState('');
  const [erroNome, setErroNome] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = () => {
    if (!nomePlano.trim()) {
      setErroNome(true);
      return;
    }
    setErroNome(false);
    setIsGenerating(true);

    setTimeout(() => {
      onSubmit(nomePlano, instrucoesAdicionais);
      setIsGenerating(false);
    }, 2000);
  };

  const handleClose = () => {
    setNomePlano('');
    setInstrucoesAdicionais('');
    setErroNome(false);
    onClose();
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300 lg:pl-64" 
      style={{ opacity: isOpen ? 1 : 0 }}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col"
      >
        {/* Cabeçalho */}
        <div className="p-5 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Gerar Plano de Aula com IA</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 hover:bg-gray-100"
            aria-label="Fechar modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Corpo */}
        <div className="p-6 space-y-5 flex-grow overflow-y-auto">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent mb-4"></div>
              <p className="text-gray-600 font-medium">Gerando plano de aula com IA...</p>
              <p className="text-sm text-gray-500 mt-1">Isso pode levar alguns instantes.</p>
            </div>
          ) : (
            <>
              <div>
                <label htmlFor="nomePlano" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Plano de Aula <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="nomePlano"
                  value={nomePlano}
                  onChange={(e) => {
                    setNomePlano(e.target.value);
                    if (erroNome) setErroNome(false);
                  }}
                  className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 ${erroNome ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder="Ex: Plano de Aula - Contos (1º Trimestre)"
                />
                {erroNome && <p className="text-xs text-red-500 mt-1">O nome do plano é obrigatório.</p>}
              </div>
              
              <div>
                <label htmlFor="instrucoesAdicionais" className="block text-sm font-medium text-gray-700 mb-1">
                  Instruções Adicionais (Opcional)
                </label>
                <textarea
                  id="instrucoesAdicionais"
                  rows={4}
                  value={instrucoesAdicionais}
                  onChange={(e) => setInstrucoesAdicionais(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 resize-none"
                  placeholder="Ex: Focar em atividades lúdicas, incluir sugestão de avaliação formativa..."
                  style={{
                    cursor: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'20\' viewBox=\'0 0 16 20\'%3E%3Cpath d=\'M8 0 L8 20 M4 2 L12 2 M4 18 L12 18\' stroke=\'%23000000\' stroke-width=\'2\' fill=\'none\'/%3E%3C/svg%3E") 8 10, text',
                    caretColor: '#000000'
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">Forneça detalhes extras para a IA gerar um plano mais personalizado.</p>
              </div>
            </>
          )}
        </div>

        {/* Rodapé */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end items-center space-x-3">
          <button
            onClick={handleClose}
            type="button"
            disabled={isGenerating}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            type="button"
            disabled={isGenerating}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Gerando...
              </>
            ) : (
              'Gerar Plano'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SolicitacaoIAPlanoAulaModal; 