import React, { useEffect } from 'react';
import { PlanoAulaSupabase } from '../../pages/PlanosAula';
import { X } from 'lucide-react';

interface DetalhePlanoAulaModalProps {
  isOpen: boolean;
  onClose: () => void;
  plano: PlanoAulaSupabase | null;
}

interface SecaoPlano {
  titulo: string;
  conteudo: string[];
}

const DetalhePlanoAulaModal: React.FC<DetalhePlanoAulaModalProps> = ({ isOpen, onClose, plano }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('pagina-modal-aberta');
    } else {
      document.body.classList.remove('pagina-modal-aberta');
    }
    // Cleanup function para remover a classe se o modal for desmontado enquanto aberto
    return () => {
      document.body.classList.remove('pagina-modal-aberta');
    };
  }, [isOpen]);

  if (!isOpen || !plano) {
    return null;
  }

  const processarConteudo = (descricao: string): SecaoPlano[] => {
    const secoesProcessadas: SecaoPlano[] = [];
    const linhas = descricao.split('\n');
    let secaoAtual: SecaoPlano = { titulo: '', conteudo: [] };

    const titulosConhecidos = [
      'IDENTIFICAÇÃO',
      'HABILIDADES DA BNCC',
      'OBJETIVOS ESPECÍFICOS DA AULA',
      'OBJETIVOS ESPECÍFICOS',
      'RECURSOS E MATERIAIS NECESSÁRIOS',
      'RECURSOS E MATERIAIS',
      'METODOLOGIA',
      'AVALIAÇÃO',
    ];

    for (const linha of linhas) {
      let linhaProcessada = linha.trim();

      // Pular linhas que são explicitamente "Data: ..." no corpo
      if (linhaProcessada.toUpperCase().startsWith('DATA:')) {
        continue;
      }

      // Remover asteriscos e espaços do início da linha para códigos de habilidade
      if (/^\s*\*\s*EF\d{2}[A-Z]{2}\d{2}/.test(linhaProcessada)) {
        linhaProcessada = linhaProcessada.replace(/^\s*\*\s*/, '');
      }

      const linhaUpperComparavel = linhaProcessada.toUpperCase().replace(/(\n|\r|\*\*|--|:)$/g, '').trim();
      let ehTituloDefinido = false;

      for (const tk of titulosConhecidos) {
        if (linhaUpperComparavel === tk) {
          if (secaoAtual.titulo || secaoAtual.conteudo.length > 0) {
            // Não adicionar seções vazias que podem ter sido esvaziadas por filtros anteriores
            if (secaoAtual.conteudo.join('').trim() !== '' || secaoAtual.titulo) {
                 secoesProcessadas.push(secaoAtual);
            }
          }
          secaoAtual = { titulo: linhaProcessada, conteudo: [] };
          ehTituloDefinido = true;
          break;
        }
      }

      if (!ehTituloDefinido) {
        if (linhaProcessada !== '') {
          secaoAtual.conteudo.push(linhaProcessada);
        }
      }
    }

    if (secaoAtual.titulo || secaoAtual.conteudo.length > 0) {
       // Não adicionar seções vazias que podem ter sido esvaziadas por filtros anteriores
       if (secaoAtual.conteudo.join('').trim() !== '' || secaoAtual.titulo) {
           secoesProcessadas.push(secaoAtual);
       }
    }

    const titulosDeSecaoParaOmitir = ['DESCRIÇÃO', 'DESCRIÇÃO GERAL', 'DETALHES'];
    
    let secoesFiltradas = secoesProcessadas.filter(s => {
      if (!s.titulo) return true; 
      const tituloLimpo = s.titulo.toUpperCase().replace(/(\n|\r|\*\*|--|:)$/g, '').trim();
      return !titulosDeSecaoParaOmitir.includes(tituloLimpo);
    });

    secoesFiltradas = secoesFiltradas.map(secao => ({
      ...secao,
      conteudo: secao.conteudo.filter(l => l.trim() !== '')
    })).filter(secao => secao.titulo || secao.conteudo.length > 0);

    return secoesFiltradas;
  };

  const secoes = processarConteudo(plano.descricao);

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out"
      style={{ opacity: isOpen ? 1 : 0 }}
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col transform transition-all duration-300 ease-in-out"
        style={{ transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(10%) scale(0.95)', opacity: isOpen ? 1 : 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Modal */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800">{plano.titulo}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            aria-label="Fechar modal"
          >
            <X size={28} />
          </button>
        </div>

        {/* Conteúdo do Plano de Aula (Scrollable) */}
        <div className="p-6 overflow-y-auto flex-grow">
          {secoes.map((secao, index) => (
            <div key={index} className="mb-6">
              {secao.titulo && (
                <h3 className="text-lg font-bold text-indigo-700 mb-2 pb-1 border-b border-indigo-200">
                  {secao.titulo}
                </h3>
              )}
              <div className="space-y-1">
                {secao.conteudo.map((linha, idx) => {
                  if (/EF\d{2}[A-Z]{2}\d{2}/.test(linha)) {
                    return (
                      <div key={idx} className="pl-2 border-l-4 border-indigo-300 py-1 my-1">
                        <span className="font-medium text-gray-800">{linha}</span>
                      </div>
                    );
                  }
                  if (linha.trim().startsWith('•') || linha.trim().startsWith('-')) {
                    return (
                      <div key={idx} className="pl-6 text-gray-700">
                        <span>{linha}</span>
                      </div>
                    );
                  }
                  return (
                    <p key={idx} className="text-gray-700 leading-relaxed">{linha}</p>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Rodapé do Modal */}
        <div className="flex justify-end p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-0 focus:border-transparent transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetalhePlanoAulaModal;