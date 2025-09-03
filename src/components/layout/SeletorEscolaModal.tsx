import React, { useState, useEffect, useRef } from 'react';
import { useEscola } from '../../context/EscolaContext';
import { ChevronDown, Check, Briefcase } from 'lucide-react';

const SeletorEscolaModal: React.FC = () => {
  const { escolasAssociadas, escolaAtiva, setEscolaAtiva, loadingEscolas } = useEscola();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  if (loadingEscolas || !escolasAssociadas || escolasAssociadas.length <= 1) {
    return null; // Não mostra nada se estiver carregando, não houver escolas ou apenas uma
  }

  const handleSelectEscola = (escola: typeof escolasAssociadas[0]) => {
    setEscolaAtiva(escola);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center text-xs text-gray-600 hover:text-indigo-600 focus:outline-none p-1 rounded-md hover:bg-gray-100 transition-colors duration-150"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="Selecionar escola"
      >
        {escolaAtiva ? (
          <span className="truncate max-w-[150px] font-medium">
            {escolaAtiva.nome}
          </span>
        ) : (
          <span className="text-gray-500">Selecionar Escola</span>
        )}
        <ChevronDown size={16} className={`ml-1.5 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div 
          className="absolute z-50 mt-2 w-64 min-w-max right-0 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none py-1 origin-top-right animate-fadeInScaleUp"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="options-menu"
        >
          <div className="px-3 py-2 text-xs text-gray-500 border-b border-gray-100">
            Mudar de organização
          </div>
          {escolasAssociadas.map((escola) => (
            <button
              key={escola.id}
              onClick={() => handleSelectEscola(escola)}
              className="w-full text-left flex items-center px-3 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 focus:bg-indigo-50 focus:text-indigo-700 focus:outline-none transition-colors duration-100"
              role="menuitem"
            >
              <Briefcase size={16} className={`mr-2.5 ${escolaAtiva?.id === escola.id ? 'text-indigo-600' : 'text-gray-400'}`} />
              <span className={`flex-1 truncate ${escolaAtiva?.id === escola.id ? 'font-semibold text-indigo-700' : 'font-normal'}`}>
                {escola.nome}
              </span>
              {escolaAtiva?.id === escola.id && (
                <Check size={16} className="ml-2 text-indigo-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SeletorEscolaModal; 