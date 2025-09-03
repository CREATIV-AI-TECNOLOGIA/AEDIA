import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, FileImage, ChevronDown } from 'lucide-react';
import { exportToPDF, exportToDOCX } from '../../utils/exportUtils';
import toast from 'react-hot-toast';

interface ExportMenuProps {
  planoData: {
    titulo: string;
    disciplinaNome?: string;
    turmaAno?: string;
    modalidadeNome?: string;
    conteudoHTML: string;
  };
}

const ExportMenu: React.FC<ExportMenuProps> = ({ planoData }) => {
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

  const handleExport = async (format: 'pdf' | 'docx') => {
    if (isExporting) return;

    setIsExporting(true);
    setIsOpen(false);

    try {
      switch (format) {
        case 'pdf':
          toast.loading('Gerando PDF...', { id: 'export-pdf' });
          await exportToPDF(planoData);
          toast.success('PDF exportado com sucesso!', { id: 'export-pdf' });
          break;
        
        case 'docx':
          toast.loading('Gerando documento Word...', { id: 'export-docx' });
          await exportToDOCX(planoData);
          toast.success('Documento Word exportado com sucesso!', { id: 'export-docx' });
          break;
      }
    } catch (error) {
      console.error('Erro na exportação:', error);
      toast.error(`Erro ao exportar: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, { 
        id: `export-${format}` 
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
        title="Exportar plano de aula"
      >
        <Download size={18} className="transition-transform duration-300 group-hover:scale-110" />
        <span className="text-sm font-medium">Exportar</span>
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
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
              className="group w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] hover:translate-x-1"
            >
              <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-lg group-hover:bg-red-200 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                <FileImage size={16} className="text-red-600 group-hover:text-red-700 transition-colors duration-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 group-hover:text-red-800 transition-colors duration-300">PDF</p>
                <p className="text-xs text-gray-500 group-hover:text-red-600 transition-colors duration-300">Documento portátil para impressão</p>
              </div>
            </button>

            {/* Opção DOCX */}
            <button
              onClick={() => handleExport('docx')}
              disabled={isExporting}
              className="group w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] hover:translate-x-1"
            >
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                <FileText size={16} className="text-blue-600 group-hover:text-blue-700 transition-colors duration-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 group-hover:text-blue-800 transition-colors duration-300">Word (DOCX)</p>
                <p className="text-xs text-gray-500 group-hover:text-blue-600 transition-colors duration-300">Documento editável do Microsoft Word</p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportMenu; 