import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import EditorToolbar from './EditorToolbar';

interface WysiwygEditorProps {
  conteudo: string;
  onConteudoChange: (html: string, titulo?: string) => void;
  executarComando: (comando: string) => void;
  abrirSeletorImagem: () => void;
  uploadandoImagem: boolean;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export interface WysiwygEditorRef {
  getEditor: () => HTMLDivElement | null;
}

const WysiwygEditor = forwardRef<WysiwygEditorRef, WysiwygEditorProps>((
  {
    conteudo,
    onConteudoChange,
    executarComando,
    abrirSeletorImagem,
    uploadandoImagem,
    handleFileChange
  },
  ref
) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    getEditor: () => editorRef.current
  }));

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    // Salvar posição do scroll e cursor antes da atualização
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    // Salvar posição do cursor
    const selection = window.getSelection();
    let cursorPosition = null;
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      cursorPosition = {
        startContainer: range.startContainer,
        startOffset: range.startOffset,
        endContainer: range.endContainer,
        endOffset: range.endOffset
      };
    }
    
    const html = e.currentTarget.innerHTML;
    
    // Extrair título do conteúdo HTML automaticamente
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Procurar por texto que contenha "AVALIAÇÃO:" para extrair o título
    const textoCompleto = tempDiv.textContent || '';
    const linhas = textoCompleto.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    let tituloExtraido = '';
    for (const linha of linhas) {
      if (linha.toUpperCase().includes('AVALIAÇÃO:')) {
        // Extrair o título após "AVALIAÇÃO:"
        const match = linha.match(/AVALIAÇÃO:\s*(.+?)(\?|$)/i);
        if (match && match[1]) {
          tituloExtraido = match[1].trim();
          break;
        }
      }
    }
    
    // Atualizar tanto o conteúdo HTML quanto o título
    onConteudoChange(html, tituloExtraido);
    
    // Usar requestAnimationFrame para garantir que a atualização aconteça após o render
    requestAnimationFrame(() => {
      // Restaurar posição do scroll
      window.scrollTo(scrollLeft, scrollTop);
      
      // Restaurar posição do cursor se possível
      if (cursorPosition && selection) {
        try {
          const newRange = document.createRange();
          newRange.setStart(cursorPosition.startContainer, cursorPosition.startOffset);
          newRange.setEnd(cursorPosition.endContainer, cursorPosition.endOffset);
          selection.removeAllRanges();
          selection.addRange(newRange);
        } catch (e) {
          // Ignorar erros de seleção
          console.log('Erro ao restaurar cursor:', e);
        }
      }
    });
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Atalhos de teclado
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          executarComando('bold');
          break;
        case 'i':
          e.preventDefault();
          executarComando('italic');
          break;
        case 'u':
          e.preventDefault();
          executarComando('underline');
          break;
        case 'z':
          e.preventDefault();
          if (e.shiftKey) {
            // Ctrl+Shift+Z = Refazer
            executarComando('redo');
          } else {
            // Ctrl+Z = Desfazer
            executarComando('undo');
          }
          break;
        case 'y':
          e.preventDefault();
          // Ctrl+Y = Refazer (alternativo)
          executarComando('redo');
          break;
      }
    }
  };

  const handleBlur = () => {
    // Salvar posição quando perder foco
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    requestAnimationFrame(() => {
      window.scrollTo(scrollLeft, scrollTop);
    });
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Conteúdo da Avaliação
      </label>
      <div className="border border-gray-300 rounded-md overflow-hidden">
        <EditorToolbar
          executarComando={executarComando}
          abrirSeletorImagem={abrirSeletorImagem}
          uploadandoImagem={uploadandoImagem}
        />
        
        {/* Input de arquivo oculto para upload de imagens */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        
        {/* Editor visual */}
        <div className="relative">
          <style>
            {`
              /* Cursor preto personalizado para toda a área editável */
              .editor-content,
              .editor-content *,
              .editor-content p, 
              .editor-content span, 
              .editor-content div, 
              .editor-content h1, 
              .editor-content h2, 
              .editor-content h3, 
              .editor-content li, 
              .editor-content ul, 
              .editor-content ol,
              .editor-content strong,
              .editor-content em,
              .editor-content b,
              .editor-content i,
              .editor-content u,
              .editor-content:hover,
              .editor-content *:hover {
                cursor: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='20' viewBox='0 0 16 20'%3E%3Cpath d='M8 0 L8 20 M4 2 L12 2 M4 18 L12 18' stroke='%23000000' stroke-width='2' fill='none'/%3E%3C/svg%3E") 8 10, text !important;
              }
              
              /* Garantir que inputs também tenham cursor preto */
              input[type="text"]:focus,
              input[type="number"]:focus,
              input[type="date"]:focus,
              textarea:focus,
              select:focus {
                cursor: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='20' viewBox='0 0 16 20'%3E%3Cpath d='M8 0 L8 20 M4 2 L12 2 M4 18 L12 18' stroke='%23000000' stroke-width='2' fill='none'/%3E%3C/svg%3E") 8 10, text !important;
              }

              /* Garantir que o menu de ferramentas fique dentro do container */
              .ferramenta-questao {
                max-width: 200px;
                overflow: hidden;
              }
              
              /* Evitar que botões flutuantes se sobreponham */
              .botao-ferramenta-questao {
                pointer-events: auto;
                z-index: 10;
              }
            `}
          </style>

          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning={true}
            data-placeholder="Digite o conteúdo da avaliação aqui..."
            onInput={handleInput}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            onMouseEnter={() => {}}
            onMouseLeave={() => {}}
            onMouseMove={() => {
              // O cursor preto é aplicado via CSS
            }}
            onFocus={() => {
              // Prevenir scroll automático no foco
            }}
            onBlur={handleBlur}
            className="editor-content min-h-[400px] p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 prose prose-indigo max-w-none
              prose-headings:text-gray-900 prose-headings:hover:bg-blue-50 prose-headings:hover:rounded
              prose-p:text-gray-700 prose-p:hover:bg-blue-50 prose-p:hover:rounded prose-p:hover:px-2 prose-p:hover:py-1
              prose-strong:text-gray-900
              prose-ul:text-gray-700 prose-ul:hover:bg-blue-50 prose-ul:hover:rounded prose-ul:hover:px-2 prose-ul:hover:py-1
              prose-ol:text-gray-700 prose-ol:hover:bg-blue-50 prose-ol:hover:rounded prose-ol:hover:px-2 prose-ol:hover:py-1
              prose-li:text-gray-700 prose-li:hover:bg-blue-50 prose-li:hover:rounded prose-li:hover:px-1
              prose-h1:text-2xl prose-h1:font-bold prose-h1:mb-4 prose-h1:hover:px-2 prose-h1:hover:py-1
              prose-h2:text-xl prose-h2:font-semibold prose-h2:mb-3 prose-h2:hover:px-2 prose-h2:hover:py-1
              prose-h3:text-lg prose-h3:font-medium prose-h3:mb-2 prose-h3:hover:px-2 prose-h3:hover:py-1
              hover:bg-gray-50 transition-colors duration-200
              empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:italic
              cursor-none"
            style={{ 
              backgroundColor: 'white',
              lineHeight: '1.6',
              minHeight: '400px',
              cursor: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'20\' viewBox=\'0 0 16 20\'%3E%3Cpath d=\'M8 0 L8 20 M4 2 L12 2 M4 18 L12 18\' stroke=\'%23000000\' stroke-width=\'2\' fill=\'none\'/%3E%3C/svg%3E") 8 10, text',
              caretColor: '#000000',
              WebkitUserSelect: 'text',
              MozUserSelect: 'text',
              msUserSelect: 'text',
              userSelect: 'text',
              scrollBehavior: 'auto',
              contain: 'layout style'
            }}
            dangerouslySetInnerHTML={{ __html: conteudo }}
          />
        </div>
      </div>
      <div className="mt-2">
        <p className="text-xs text-gray-500">
          💡 Use a barra de ferramentas para formatar. <strong>Ctrl+Z</strong> desfaz, <strong>Ctrl+Y</strong> refaz. Posição mantida durante edição.
        </p>
      </div>
    </div>
  );
});

WysiwygEditor.displayName = 'WysiwygEditor';

export default WysiwygEditor;