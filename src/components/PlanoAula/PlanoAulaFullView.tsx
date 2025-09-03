import React, { useState, useEffect, useCallback, memo } from 'react';
import { X, Save, Bold, Italic, Underline, Strikethrough, List, ListOrdered, Quote, Heading1, Heading2, AlignLeft, AlignCenter, AlignRight, Undo2, Redo2, Highlighter, Palette } from 'lucide-react';
import type { PlanoAulaSupabase } from '../../pages/PlanosAula';
import { supabase } from '../../lib/supabaseClient';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
// import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import UnderlineExtension from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import ExportMenu from './ExportMenu';
import { useLayout } from '../../context/LayoutContext';

// Função para limpar blocos de código, <pre>, <code>, crases e aspas
function extrairHTMLPuro(texto: string | null | undefined): string {
  if (texto === null || texto === undefined) {
    return "";
  }
  // Remove blocos de código markdown
  let newTexto = texto.replace(/```[a-zA-Z]*\n([\s\S]*?)```/g, '$1');
  // Remove tags <pre> e <code>
  newTexto = newTexto.replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/g, '$1');
  newTexto = newTexto.replace(/<pre>([\s\S]*?)<\/pre>/g, '$1');
  newTexto = newTexto.replace(/<code>([\s\S]*?)<\/code>/g, '$1');
  // Remove aspas duplas ou simples do início/fim
  newTexto = newTexto.trim().replace(/^['\"]+|['\"]+$/g, '');
  // Remove crases do início/fim
  newTexto = newTexto.replace(/^`+|`+$/g, '');
  return newTexto.trim();
}

interface PlanoAulaFullViewProps {
  plano: PlanoAulaSupabase;
  onClose: () => void;
  onEdit?: () => void;
  onRefazerIA?: () => void;
  onAdaptar?: () => void;
  onPlanoAtualizado: (planoAtualizado: PlanoAulaSupabase) => void;
  onDelete: (id: string) => void;
}

const PlanoAulaFullView: React.FC<PlanoAulaFullViewProps> = ({ plano, onClose, onPlanoAtualizado }) => {
  // Hook do LayoutContext para gerenciar layout de forma declarativa
  const { enterFullscreenMode, exitFullscreenMode } = useLayout();
  
  // Log apenas na primeira montagem do componente
  const [componenteMontado, setComponenteMontado] = useState(false);
  
  useEffect(() => {
    if (!componenteMontado) {
      console.log('🖥️ [PlanoAulaFullView] Montado com plano:', {
        id: plano.id, 
        titulo: plano.titulo,
        disciplina: plano.disciplinaNome,
        turma: plano.turmaAno,
        descricaoLength: plano.descricao?.length || 0
      });
      setComponenteMontado(true);
    }
  }, [componenteMontado, plano.id, plano.titulo]);

  // Efeito para entrar em modo fullscreen quando o componente monta
  useEffect(() => {
    console.log('🖥️ [PlanoAulaFullView] Entrando em modo fullscreen');
    enterFullscreenMode();

    // Cleanup ao desmontar - sair do modo fullscreen
    return () => {
      console.log('🖥️ [PlanoAulaFullView] Saindo do modo fullscreen');
      exitFullscreenMode();
    };
  }, []); // Array vazio para executar apenas uma vez
  
  const [titulo, setTitulo] = useState<string>(plano.titulo);
  const [editandoTitulo, setEditandoTitulo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [ultimoSalvo, setUltimoSalvo] = useState<Date | null>(null);
  const [mudancasPendentes, setMudancasPendentes] = useState(false);
  const [conteudoEditor, setConteudoEditor] = useState(extrairHTMLPuro(plano.descricao));
  const [lastSavedTitulo, setLastSavedTitulo] = useState(plano.titulo); // Para comparar se o título mudou

  // Editor Tiptap
  const editor = useEditor({
    extensions: [
      StarterKit,
      UnderlineExtension,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Color,
      TextStyle,
      Highlight,
      Placeholder.configure({
        placeholder: "Comece a digitar o conteúdo do seu plano de aula aqui...",
      })
    ],
    content: conteudoEditor,
    editable: true,
    onUpdate: ({ editor }) => {
      setConteudoEditor(editor.getHTML());
      setMudancasPendentes(true);
    },
  });
  
  const handleTituloChange = (newTitulo: string) => {
    setTitulo(newTitulo);
    setMudancasPendentes(true);
  };
  
  const updateTituloInputHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleTituloChange(event.target.value);
  };

  // Efeito para atualizar o editor se o 'plano' prop mudar externamente
  useEffect(() => {
    console.log('🔄 [PlanoAulaFullView] Plano prop mudou:', {
      id: plano.id,
      titulo: plano.titulo,
      disciplina: plano.disciplinaNome,
      turma: plano.turmaAno
    });
    
    const novoConteudo = extrairHTMLPuro(plano.descricao);
    setConteudoEditor(novoConteudo);
    if (editor && editor.isEditable) {
        // Verifica se o conteúdo realmente mudou para evitar atualizações desnecessárias e perda de cursor
        if (editor.getHTML() !== novoConteudo) {
            editor.commands.setContent(novoConteudo, false); // false para não disparar onUpdate
        }
    }
    setTitulo(plano.titulo); // Atualiza o título também
    setLastSavedTitulo(plano.titulo);
    setMudancasPendentes(false); // Reseta as mudanças pendentes pois o conteúdo foi atualizado de fora
  }, [plano, editor]);

  // Função para salvar conteúdo no Supabase
  const salvarConteudo = useCallback(async () => {
    console.log('[PlanoAulaFullView] salvarConteudo: Iniciando...', { planoId: plano.id, editorExists: !!editor });
    if (!plano.id || !editor) {
      console.warn('[PlanoAulaFullView] salvarConteudo: Plano ID ou editor não encontrado. Abortando.');
      return;
    }
    setSalvando(true);
    const htmlContent = editor.getHTML(); 

    const payload = {
      titulo: titulo,
      descricao: htmlContent, 
      updated_at: new Date().toISOString(),
      // As colunas conteudo_html e conteudo_json foram removidas na correção anterior
      // pois não parecem existir na tabela planos_aula segundo o erro PGRST204.
      // Se precisar delas, a tabela no Supabase precisa ser ajustada.
    };
    console.log('[PlanoAulaFullView] salvarConteudo: Payload para Supabase:', payload);

    try {
      const { data, error } = await supabase
        .from('planos_aula')
        .update(payload)
        .eq('id', plano.id)
        .select() 
        .single(); 

      console.log('[PlanoAulaFullView] salvarConteudo: Resposta do Supabase:', { data, error });

      if (error) {
        console.error('[PlanoAulaFullView] Erro ao salvar plano de aula via Supabase:', error);
      } else if (data) {
        console.log('[PlanoAulaFullView] Plano salvo com sucesso. Data:', data);
        setUltimoSalvo(new Date());
        setMudancasPendentes(false);
        setConteudoEditor(htmlContent); 
        setLastSavedTitulo(titulo); 
        console.log('[PlanoAulaFullView] Chamando onPlanoAtualizado...');
        onPlanoAtualizado(data as PlanoAulaSupabase);
      } else {
        console.warn('[PlanoAulaFullView] salvarConteudo: Supabase não retornou erro nem dados.');
      }
    } catch (err) {
      console.error('[PlanoAulaFullView] Exceção ao salvar plano de aula:', err);
    } finally {
      console.log('[PlanoAulaFullView] salvarConteudo: Finalizando.');
      setSalvando(false);
    }
  }, [plano.id, titulo, editor, onPlanoAtualizado]);

  // Salvamento automático a cada 30 segundos se houver mudanças pendentes
  useEffect(() => {
    const interval = setInterval(() => {
      if (mudancasPendentes && !salvando) {
        // Verifica se o título realmente mudou ou se o conteúdo do editor mudou
        const conteudoAtualEditor = editor?.getHTML() || "";
        if (titulo !== lastSavedTitulo || conteudoAtualEditor !== extrairHTMLPuro(plano.descricao)) {
        salvarConteudo();
        }
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [mudancasPendentes, salvando, salvarConteudo, titulo, lastSavedTitulo, editor, plano.descricao]);

  // Adicionar evento de salvamento antes de fechar/recarregar a página
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (mudancasPendentes && (e.type === 'beforeunload')) {
        e.preventDefault();
        e.returnValue = 'Existem alterações não salvas. Tem certeza que deseja sair?';
        // Tentativa de salvar antes de sair - pode não funcionar em todos os navegadores
        // if (!salvando) {
        //   salvarConteudo();
        // }
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [mudancasPendentes]);

  // Funções de desfazer/refazer
  const handleUndo = () => {
    editor?.commands.undo();
  };
  const handleRedo = () => {
    editor?.commands.redo();
  };

  // Formatar hora de último salvamento
  const formatarHoraSalvamento = () => {
    if (!ultimoSalvo) return '';
    return `Salvo às ${ultimoSalvo.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-start overflow-auto" style={{ background: '#f6f8fa', paddingTop: 0, paddingBottom: '2rem' }}>
      {/* Estilos para o editor e página */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        
        /* Fallback para fonte personalizada */
        @font-face {
          font-family: 'Palo Wide Bold';
          src: local('Arial Black'), local('Helvetica Neue Bold'), local('Inter ExtraBold');
          font-weight: bold;
          font-style: normal;
        }
        /* Base para todo o conteúdo do editor */
        .custom-quill-content {
          font-family: Arial, Helvetica, sans-serif;
          font-weight: normal; /* Peso normal como padrão */
          color: #333; /* Cor base para o texto */
        }
        .custom-quill-content * {
          /* Evitar seletores muito genéricos que possam causar conflitos */
          /* A herança deve cuidar da maioria dos casos */
        }

        .custom-quill-content h1, 
        .custom-quill-content h2 {
          font-family: 'Inter', 'Palo Wide Bold', Arial, sans-serif; /* Fonte bold para cabeçalhos */
          font-weight: 800; /* Extra bold para cabeçalhos */
          font-size: 2rem;
          margin-top: 2rem;
          margin-bottom: 1rem;
          color: #18181b; /* Cor específica para cabeçalhos */
          line-height: 1.2;
        }
        .custom-quill-content h2 {
          font-size: 1.5rem;
        }

        .custom-quill-content ol, 
        .custom-quill-content ul {
          margin-left: 2rem;
          margin-bottom: 1.5rem;
          font-size: 1.15rem; /* Herda cor e fonte base */
        }
        .custom-quill-content li {
          margin-bottom: 0.7rem;
          line-height: 1.6; /* Herda cor e fonte base */
        }

        /* Estilo para texto explicitamente em negrito */
        .custom-quill-content strong {
          font-family: 'Inter', 'Palo Wide Bold', Arial, sans-serif; /* Fonte bold apenas para strong */
          font-weight: 700; /* Bold para texto strong */
          /* Não definir cor aqui, para permitir que o Tiptap Color funcione sobre o negrito */
        }

        .custom-quill-content p {
          margin-bottom: 1.2rem;
          font-size: 1.1rem;
          text-indent: 1cm;
          /* Herda font-family, font-weight e color de .custom-quill-content */
        }
        .custom-quill-content li p {
          text-indent: 0 !important;
        }
        .custom-quill-content img {
          max-width: 100%;
          /* height: auto; */ /* Removido para melhor comportamento com resize */
          display: block;
          margin: 1rem auto;
          cursor: pointer;
          border: 1px dashed #ccc; /* Borda sempre visível para identificar a área e alça */
          overflow: auto;      /* 'auto' ou 'hidden' são comuns para 'resize' */
          resize: both;       /* Habilita o redimensionamento pelo usuário */
          min-width: 50px;    /* Evitar que a imagem fique muito pequena */
          min-height: 50px;   /* Evitar que a imagem fique muito pequena */
          box-sizing: border-box;
          /* transition: all 0.2s; */ /* Transições podem interferir com resize */
        }
        .custom-quill-content img:hover {
          border-color: #4e9bff; /* Mudar a cor da borda no hover */
        }
        .pagina-centralizada {
          background: white;
          max-width: 1100px;
          width: 100%;
          margin: 0 auto;
          padding: 2rem 3.5rem;
          display: flex;
          flex-direction: column;
          min-height: 0;
          height: auto;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          border-radius: 0.5rem;
        }
        @media (max-width: 1000px) {
          .pagina-centralizada {
            padding: 1.5rem 1.2rem;
          }
        }
        .status-salvamento {
          font-size: 0.8rem;
          color: #6b7280;
        }
        .btn-salvar {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: #e9f7fe;
          color: #0284c7;
          padding: 6px 12px;
          border-radius: 4px;
          font-weight: 500;
          transition: all 0.2s;
        }
        .btn-salvar:hover {
          background-color: #dbeafe;
        }
        .btn-salvar:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .btn-salvar-pendente {
          background-color: #fffbeb;
          color: #d97706;
        }
        .botoes-undo-redo {
          display: flex;
          gap: 8px;
          margin-bottom: 10px;
        }
        /* Remover contorno preto do editor ao focar */
        .ProseMirror:focus {
          outline: none !important;
          border: none !important;
          box-shadow: none !important;
        }
        
        /* Cursor preto personalizado para o editor Tiptap */
        .ProseMirror,
        .ProseMirror *,
        .ProseMirror p, 
        .ProseMirror span, 
        .ProseMirror div, 
        .ProseMirror h1, 
        .ProseMirror h2, 
        .ProseMirror h3, 
        .ProseMirror li, 
        .ProseMirror ul, 
        .ProseMirror ol,
        .ProseMirror strong,
        .ProseMirror em,
        .ProseMirror b,
        .ProseMirror i,
        .ProseMirror u,
        .ProseMirror:hover,
        .ProseMirror *:hover {
          cursor: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='20' viewBox='0 0 16 20'%3E%3Cpath d='M8 0 L8 20 M4 2 L12 2 M4 18 L12 18' stroke='%23000000' stroke-width='2' fill='none'/%3E%3C/svg%3E") 8 10, text !important;
          caret-color: #000000 !important;
        }
        /* Barra de ferramentas Tiptap */
        .toolbar-tiptap {
          display: flex;
          flex-wrap: nowrap;
          justify-content: center;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
          background: #f8fafc;
          border-radius: 10px;
          padding: 10px 18px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          overflow-x: auto;
          white-space: nowrap;
          /* Adicionando propriedades para fixar a barra */
          position: sticky;
          top: 64px; /* Ajustar este valor conforme a altura do header acima */
          z-index: 19; 
        }
        .toolbar-tiptap .group {
          display: flex;
          gap: 6px;
          align-items: center;
          background: none;
          border-right: 1.5px solid #e0e7ef;
          padding-right: 10px;
          margin-right: 10px;
        }
        .toolbar-tiptap .group:last-child {
          border-right: none;
          margin-right: 0;
          padding-right: 0;
        }
        .toolbar-tiptap button, .toolbar-tiptap label {
          background: none;
          color: #0284c7;
          border: none;
          border-radius: 6px;
          padding: 7px 10px;
          font-weight: 500;
          font-size: 1.1rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: background 0.2s, color 0.2s;
        }
        .toolbar-tiptap button.active, .toolbar-tiptap label.active {
          background: #bae6fd;
          color: #0369a1;
        }
        .toolbar-tiptap button:hover, .toolbar-tiptap label:hover {
          background: #e0f2fe;
        }
        .toolbar-tiptap input[type='color'] {
          border: none;
          background: none;
          width: 28px;
          height: 28px;
          padding: 0;
          margin-left: 4px;
          cursor: pointer;
        }
      `}</style>
      {/* Header simplificado */}
      <header className="w-full flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200 sticky top-0 z-20" style={{ minHeight: 64 }}>
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Inter, Palo Wide Bold, Arial, sans-serif', fontWeight: 800 }}>
            {editandoTitulo ? (
              <input
                className="text-2xl font-bold text-gray-900 border-b border-gray-300 focus:outline-none focus:border-blue-500 bg-transparent"
                value={titulo}
                onChange={updateTituloInputHandler}
                onBlur={() => setEditandoTitulo(false)}
                autoFocus
                style={{
                  cursor: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'20\' viewBox=\'0 0 16 20\'%3E%3Cpath d=\'M8 0 L8 20 M4 2 L12 2 M4 18 L12 18\' stroke=\'%23000000\' stroke-width=\'2\' fill=\'none\'/%3E%3C/svg%3E") 8 10, text',
                  caretColor: '#000000'
                }}
              />
            ) : (
              <span onClick={() => setEditandoTitulo(true)}>{titulo}</span>
            )}
          </h1>
          <span className="text-base text-gray-500">{plano.disciplinaNome} {plano.turmaAno ? `- ${plano.turmaAno}` : ''}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="status-salvamento">
            {salvando ? 'Salvando...' : (mudancasPendentes ? 'Alterações não salvas' : formatarHoraSalvamento())}
          </span>
          <button 
            onClick={async () => { await salvarConteudo(); }} 
            className={`btn-salvar ${mudancasPendentes ? 'btn-salvar-pendente' : ''}`}
            disabled={salvando || !mudancasPendentes}
            title="Salvar manualmente"
          >
            <Save size={18} />
            <span className="text-sm">Salvar</span>
          </button>
          <ExportMenu 
            planoData={{
              titulo: titulo,
              disciplinaNome: plano.disciplinaNome,
              turmaAno: plano.turmaAno,
              modalidadeNome: plano.modalidadeNome,
              conteudoHTML: editor?.getHTML() || plano.descricao
            }}
          />
          <button onClick={onClose} className="p-2 rounded hover:bg-gray-100 text-gray-700" title="Fechar">
            <X size={24} />
          </button>
        </div>
      </header>
      
      {/* Container principal para o conteúdo */}
      <div className="w-full max-w-1100 p-4 flex-1">
        {/* Página centralizada com bordas suaves */}
        <div className="pagina-centralizada">
          {/* Barra de ferramentas visual Tiptap */}
          <div className="toolbar-tiptap">
            <div className="group">
              <button onClick={handleUndo} title="Desfazer" type="button"><Undo2 size={18}/></button>
              <button onClick={handleRedo} title="Refazer" type="button"><Redo2 size={18}/></button>
            </div>
            <div className="group">
              <button onClick={() => editor?.chain().focus().toggleBold().run()} className={editor?.isActive('bold') ? 'active' : ''} type="button"><Bold size={18}/></button>
              <button onClick={() => editor?.chain().focus().toggleItalic().run()} className={editor?.isActive('italic') ? 'active' : ''} type="button"><Italic size={18}/></button>
              <button onClick={() => editor?.chain().focus().toggleUnderline().run()} className={editor?.isActive('underline') ? 'active' : ''} type="button"><Underline size={18}/></button>
              <button onClick={() => editor?.chain().focus().toggleStrike().run()} className={editor?.isActive('strike') ? 'active' : ''} type="button"><Strikethrough size={18}/></button>
              <button onClick={() => editor?.chain().focus().toggleHighlight().run()} className={editor?.isActive('highlight') ? 'active' : ''} type="button"><Highlighter size={18}/></button>
            </div>
            <div className="group">
              <button onClick={() => editor?.chain().focus().toggleBulletList().run()} className={editor?.isActive('bulletList') ? 'active' : ''} type="button"><List size={18}/></button>
              <button onClick={() => editor?.chain().focus().toggleOrderedList().run()} className={editor?.isActive('orderedList') ? 'active' : ''} type="button"><ListOrdered size={18}/></button>
              <button onClick={() => editor?.chain().focus().toggleBlockquote().run()} className={editor?.isActive('blockquote') ? 'active' : ''} type="button"><Quote size={18}/></button>
            </div>
            <div className="group">
              <button onClick={() => editor?.chain().focus().setParagraph().run()} className={editor?.isActive('paragraph') ? 'active' : ''} type="button">P</button>
              <button onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} className={editor?.isActive('heading', { level: 1 }) ? 'active' : ''} type="button"><Heading1 size={18}/></button>
              <button onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} className={editor?.isActive('heading', { level: 2 }) ? 'active' : ''} type="button"><Heading2 size={18}/></button>
            </div>
            <div className="group">
              <button onClick={() => editor?.chain().focus().setTextAlign('left').run()} className={editor?.isActive({ textAlign: 'left' }) ? 'active' : ''} type="button"><AlignLeft size={18}/></button>
              <button onClick={() => editor?.chain().focus().setTextAlign('center').run()} className={editor?.isActive({ textAlign: 'center' }) ? 'active' : ''} type="button"><AlignCenter size={18}/></button>
              <button onClick={() => editor?.chain().focus().setTextAlign('right').run()} className={editor?.isActive({ textAlign: 'right' }) ? 'active' : ''} type="button"><AlignRight size={18}/></button>
            </div>
            <div className="group">
              <label title="Cor do texto" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Palette size={18}/>
                <input type="color" onInput={e => editor?.chain().focus().setColor((e.target as HTMLInputElement).value).run()} />
              </label>
            </div>
          </div>
          {/* Editor de texto rico com barra de ferramentas integrada */}
          <div className="w-full custom-quill-content">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(PlanoAulaFullView, (prevProps, nextProps) => {
  // Só re-renderiza se o plano realmente mudou
  const shouldNotRerender = (
    prevProps.plano.id === nextProps.plano.id &&
    prevProps.plano.titulo === nextProps.plano.titulo &&
    prevProps.plano.descricao === nextProps.plano.descricao &&
    prevProps.plano.updated_at === nextProps.plano.updated_at
  );
  
  console.log('🔍 [PlanoAulaFullView] React.memo comparação:', {
    shouldNotRerender,
    prevId: prevProps.plano.id,
    nextId: nextProps.plano.id,
    prevTitulo: prevProps.plano.titulo,
    nextTitulo: nextProps.plano.titulo,
    idsIguais: prevProps.plano.id === nextProps.plano.id
  });
  
  return shouldNotRerender;
}); 