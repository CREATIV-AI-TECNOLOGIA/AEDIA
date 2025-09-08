import React from 'react';
import { Upload, Image } from 'lucide-react';

interface EditorToolbarProps {
  executarComando: (comando: string) => void;
  abrirSeletorImagem: () => void;
  uploadandoImagem: boolean;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({
  executarComando,
  abrirSeletorImagem,
  uploadandoImagem
}) => {
  return (
    <div className="bg-gray-50 border-b border-gray-300 p-2">
      <div className="flex flex-wrap items-center gap-2">
        {/* Formatação de texto */}
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => executarComando('bold')}
            className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 font-bold"
            title="Negrito (Ctrl+B)"
          >
            B
          </button>
          <button
            type="button"
            onClick={() => executarComando('italic')}
            className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 italic"
            title="Itálico (Ctrl+I)"
          >
            I
          </button>
          <button
            type="button"
            onClick={() => executarComando('underline')}
            className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 underline"
            title="Sublinhado (Ctrl+U)"
          >
            U
          </button>
        </div>
        
        <div className="w-px h-4 bg-gray-300"></div>
        
        {/* Upload de Imagem */}
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={abrirSeletorImagem}
            disabled={uploadandoImagem}
            className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 flex items-center space-x-1 disabled:opacity-50"
            title="Adicionar Imagem"
          >
            {uploadandoImagem ? (
              <Upload className="h-3 w-3 animate-spin" />
            ) : (
              <Image className="h-3 w-3" />
            )}
            <span>{uploadandoImagem ? 'Enviando...' : 'Imagem'}</span>
          </button>
        </div>
        
        <div className="w-px h-4 bg-gray-300"></div>
        
        {/* Desfazer/Refazer */}
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => executarComando('undo')}
            className="px-2 py-1 text-xs bg-gray-50 border border-gray-300 rounded hover:bg-gray-100"
            title="Desfazer (Ctrl+Z)"
          >
            ↶ Desfazer
          </button>
          <button
            type="button"
            onClick={() => executarComando('redo')}
            className="px-2 py-1 text-xs bg-gray-50 border border-gray-300 rounded hover:bg-gray-100"
            title="Refazer (Ctrl+Y ou Ctrl+Shift+Z)"
          >
            ↷ Refazer
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditorToolbar;