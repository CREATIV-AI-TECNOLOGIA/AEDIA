import React, { useState, useRef, useEffect } from 'react';
import { Download, FileImage, ChevronDown } from 'lucide-react';
import { exportAvaliacaoToPDF } from '../../utils/exportUtils';
import toast from 'react-hot-toast';

interface ExportMenuAvaliacaoProps {
  avaliacaoData: {
    id?: string; // Adicionando ID da avaliação
    titulo: string;
    disciplinaNome?: string;
    professorNome?: string;
    turmaAno?: string;
    turmaNome?: string;
    modalidade?: string;
    dataAplicacao?: string;
    tempoEstimado?: number;
    notaMaxima?: number;
    tipo?: string;
    codigoIdentificacao?: string; // Código único para identificação automática
    instrucoes?: string;
    conteudoHTML: string;
  };
}

const ExportMenuAvaliacao: React.FC<ExportMenuAvaliacaoProps> = ({ avaliacaoData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleExportPDF = async () => {
    if (isExporting) return;

    setIsExporting(true);
    setIsOpen(false);

    try {
      toast.loading('Gerando PDF da avaliação...', { id: 'export-avaliacao-pdf' });
      await exportAvaliacaoToPDF(avaliacaoData);
      toast.success('PDF da avaliação exportado com sucesso!', { id: 'export-avaliacao-pdf' });
    } catch (error) {
      console.error('Erro na exportação:', error);
      toast.error(`Erro ao exportar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, { 
        id: 'export-avaliacao-pdf' 
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Botão principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        title="Exportar avaliação"
      >
        <Download size={18} className="transition-transform duration-300 group-hover:scale-110" />
        <span className="text-sm font-medium">Exportar PDF</span>
        <ChevronDown 
          size={16} 
          className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Menu dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 z-50 animate-in slide-in-from-top-2 duration-200">
          <div className="py-2">
            {/* Cabeçalho do menu */}
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-700">Exportar como:</p>
            </div>

            {/* Opção PDF */}
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="group w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] hover:translate-x-1"
            >
              <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-lg group-hover:bg-red-200 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                <FileImage size={16} className="text-red-600 group-hover:text-red-700 transition-colors duration-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 group-hover:text-red-800 transition-colors duration-300">PDF</p>
                <p className="text-xs text-gray-500 group-hover:text-red-600 transition-colors duration-300">Avaliação otimizada para impressão</p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportMenuAvaliacao; 