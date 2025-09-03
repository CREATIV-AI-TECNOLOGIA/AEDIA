import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, CalendarDays, BookOpen, Users, Layers, ChevronRight, Save, X, Loader, Maximize } from 'lucide-react';
import { PlanoAulaSupabase } from '../../pages/PlanosAula';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabaseClient';

interface PlanoAulaCardExpandivelProps {
  plano: PlanoAulaSupabase;
  onDelete: (id: string) => Promise<void>;
  onFullViewClick?: (plano: PlanoAulaSupabase) => void;
  onPlanoAtualizado?: (plano: PlanoAulaSupabase) => void;
}

interface SecaoPlano {
  titulo: string;
  conteudo: string[];
}

interface CardInternoProps {
  isCurrentlyExpanded: boolean;
  plano: PlanoAulaSupabase; 
  editedContent: string; 
  saving: boolean; 
  modoVisualizacao: 'vertical' | 'grade';
  secoes: SecaoPlano[]; 
  coluna1: SecaoPlano[];
  coluna2: SecaoPlano[];
  coluna3: SecaoPlano[];
  terco: number;
  alturaHeader: number; 
  dataFormatada: string; 
  isEditMode: boolean;
  
  toggleExpandido: () => void;
  toggleEditMode: () => void;
  saveEditedContent: () => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  setEditedContent: React.Dispatch<React.SetStateAction<string>>; 
  
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  editAreaRef: React.RefObject<HTMLDivElement>;
  onFullViewClick?: (plano: PlanoAulaSupabase) => void;
}

const CardInterno: React.FC<CardInternoProps & { onFullViewClick?: (plano: PlanoAulaSupabase) => void }> = React.memo(({ 
  isCurrentlyExpanded, 
  plano, 
  editedContent,
  saving,
  modoVisualizacao,
  secoes,
  coluna1,
  coluna2,
  coluna3,
  terco,
  dataFormatada,
  isEditMode,
    toggleExpandido,   toggleEditMode,   saveEditedContent,   onDelete,   setEditedContent,  textareaRef,  editAreaRef,
    onFullViewClick
}) => {
  
  const cardBaseClasses = "bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden w-full";
  const modalTransition = { duration: 0.25 };

  const cardContentMotionProps = (isExp: boolean) => ({ 
    layoutId: `plano-aula-card-${plano.id}`,
    className: `${cardBaseClasses} ${isExp 
      ? 'shadow-2xl ring-2 ring-indigo-300' 
      : 'shadow-md mx-auto'
    }`,
    initial: false,
    animate: isExp ? {
      y: 0, scale: 1, 
      width: modoVisualizacao === 'grade' && !isEditMode ? "95%" : "90%",
      maxWidth: modoVisualizacao === 'grade' && !isEditMode ? "1400px" : "1200px",
      zIndex: 1001, position: 'relative' as 'relative', transition: modalTransition
    } : {
      y: 0, scale: 1, height: "auto", width: "100%", maxWidth: "100%",
      zIndex: 10, position: 'relative' as 'relative', transition: modalTransition
    },
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
    },
  });

  const conteudoVariants = { hidden: { opacity: 0 }, visible: (i: number) => ({ opacity: 1, transition: { opacity: { duration: 0.2, delay: 0.05 + i * 0.01 } } }) };
  const tituloVariants = { hidden: { opacity: 0 }, visible: (i: number) => ({ opacity: 1, transition: { duration: 0.15, delay: 0.05 + i * 0.01 } }) };
  const linhaVariants = { hidden: { opacity: 0 }, visible: (i: number) => ({ opacity: 1, transition: { duration: 0.1, delay: 0.03 + i * 0.004 } }) };
  
  return (
    <motion.div {...cardContentMotionProps(isCurrentlyExpanded)}>
      <div className="p-3 md:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-200"
           onClick={(e) => {
             e.stopPropagation();
             toggleExpandido();
           }}>
        <h3 className="text-lg font-semibold text-indigo-700 pr-2 flex-grow cursor-pointer" title={plano.titulo}>{plano.titulo}</h3>
        <div className="flex items-center space-x-1 flex-shrink-0 pt-2 sm:pt-0">
          {!isCurrentlyExpanded && (
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={(e) => {e.stopPropagation(); onDelete(plano.id);}} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full" title="Excluir Plano"><Trash2 size={18} /></motion.button>
          )}
          {isCurrentlyExpanded && isEditMode && (
            <>
              <motion.button whileHover={{ scale: saving ? 1 : 1.1 }} whileTap={{ scale: saving ? 1 : 0.95 }} onClick={(e) => {e.stopPropagation(); saveEditedContent();}} disabled={saving} className="p-2 text-green-500 hover:text-green-700 hover:bg-green-100 rounded-full disabled:opacity-70 flex items-center" title="Salvar Alterações">{saving ? <Loader size={22} className="animate-spin" /> : <Save size={22} />}</motion.button>
              <motion.button whileHover={{ scale: saving ? 1 : 1.1 }} whileTap={{ scale: saving ? 1 : 0.95 }} onClick={(e) => {e.stopPropagation(); toggleEditMode();}} disabled={saving} className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full disabled:opacity-70" title="Cancelar Edição"><X size={22} /></motion.button>
            </>
          )}
          {isCurrentlyExpanded && !isEditMode && (
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={(e) => {e.stopPropagation(); onDelete(plano.id);}} className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full" title="Excluir Plano"><Trash2 size={22} /></motion.button>
          )}
          
          {!(isCurrentlyExpanded && isEditMode) && (
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={(e) => { 
              e.stopPropagation(); 
              console.log('🔍 [PlanoAulaCardExpandivel] Clicando para abrir plano em tela cheia:', {
                id: plano.id, 
                titulo: plano.titulo,
                disciplina: plano.disciplinaNome,
                turma: plano.turmaAno,
                onFullViewClickExists: !!onFullViewClick
              });
              if (onFullViewClick) {
                onFullViewClick(plano);
              } else {
                console.error('❌ onFullViewClick não está definido!');
              }
            }} className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full" title="Visualizar em tela cheia"><Maximize size={18} /></motion.button>
          )}
        </div>
      </div>

      {!isCurrentlyExpanded && (
        <motion.div 
          initial={{ opacity: 1 }} 
          exit={{ opacity: 0, height: 0 }} 
          transition={{ duration: 0.2 }} 
          className="px-3 py-2 md:px-4 md:py-3 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            toggleExpandido();
          }}
        >
          {/* Layout compacto em linha única - ordem: Data, Disciplina, Modalidade, Ano */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Data */}
            <div className="flex items-center bg-gray-50 px-2 py-1 rounded text-xs">
              <CalendarDays className="h-3 w-3 mr-1.5 text-gray-500" />
              <span className="text-gray-600 font-medium">{dataFormatada}</span>
            </div>
            
            {/* Disciplina */}
            {plano.disciplinaNome && (
              <div className="flex items-center bg-blue-50 px-2 py-1 rounded text-xs">
                <BookOpen className="h-3 w-3 mr-1.5 text-blue-500" />
                <span className="text-blue-700 font-medium max-w-28 truncate" title={plano.disciplinaNome}>{plano.disciplinaNome}</span>
              </div>
            )}
            
            {/* Modalidade (antes do ano) */}
            {plano.modalidadeNome && (
              <div className="flex items-center bg-purple-50 px-2 py-1 rounded text-xs">
                <Layers className="h-3 w-3 mr-1.5 text-purple-500" />
                <span className="text-purple-700 font-medium" title={plano.modalidadeNome}>{plano.modalidadeNome}</span>
              </div>
            )}
            
            {/* Ano (por último) */}
            {plano.turmaAno && (
              <div className="flex items-center bg-green-50 px-2 py-1 rounded text-xs">
                <Users className="h-3 w-3 mr-1.5 text-green-500" />
                <span className="text-green-700 font-medium">{plano.turmaAno}</span>
              </div>
            )}
          </div>
        </motion.div>
      )}
    
      {isCurrentlyExpanded && (
        <div 
          className="flex flex-col overflow-y-auto" 
          style={{ 
            height: '80vh', 
          }}
        >
          
          <div 
            ref={editAreaRef} 
            className={`overflow-y-auto bg-white relative flex flex-col flex-grow ${isEditMode ? 'h-full' : ''}`}
          >
            {isEditMode && (
              <> 
                <textarea 
                  ref={textareaRef} 
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  className="w-full p-3 m-4 mb-0 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono text-sm flex-grow" 
                  placeholder="Conteúdo do plano de aula..."
                  disabled={saving}
                  style={{
                    cursor: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'20\' viewBox=\'0 0 16 20\'%3E%3Cpath d=\'M8 0 L8 20 M4 2 L12 2 M4 18 L12 18\' stroke=\'%23000000\' stroke-width=\'2\' fill=\'none\'/%3E%3C/svg%3E") 8 10, text',
                    caretColor: '#000000'
                  }}
                />
                <div className="mx-4 mt-2 mb-4 text-xs text-gray-500 flex-shrink-0"> 
                  <p>Use cabeçalhos em MAIÚSCULAS para definir seções...</p>
                  <p>O formato do texto será processado automaticamente...</p>
                </div>
              </>
            )}
            {!isEditMode && (
              modoVisualizacao === 'vertical' ? (
                <motion.div initial="hidden" animate="visible" exit={{ opacity: 0 }} className="px-6 py-6 bg-gray-100 rounded-lg">
                  {secoes.map((secao: SecaoPlano, index: number) => (
                    <motion.div key={index} className="mb-8 rounded-lg bg-white shadow-sm p-4" custom={index} variants={conteudoVariants}>
                      {secao.titulo && <motion.h3 className="text-lg font-bold text-indigo-700 mb-3 pb-1 border-b-2 border-indigo-300" custom={index} variants={tituloVariants}>{secao.titulo}</motion.h3>}
                      <div className="space-y-2">
                        {secao.conteudo.map((linha: string, idx: number) => (
                          <motion.div key={idx} custom={idx} variants={linhaVariants} 
                            className={
                              /EF\d{2}[A-Z]{2}\d{2}/.test(linha) 
                                ? "pl-3 border-l-4 border-indigo-500 py-1 my-2 bg-indigo-50 rounded-r" 
                                : linha.includes("Disciplina:") 
                                  ? "pl-3 border-l-4 border-blue-500 py-1 my-2 bg-blue-50 rounded-r font-medium"
                                : linha.includes("Série/Ano:") || linha.includes("Turma:") 
                                  ? "pl-3 border-l-4 border-green-500 py-1 my-2 bg-green-50 rounded-r font-medium"
                                : linha.includes("Modalidade da Turma:") 
                                  ? "pl-3 border-l-4 border-purple-500 py-1 my-2 bg-purple-50 rounded-r font-medium"
                                : linha.includes("Tópico/Conteúdo Principal:") || linha.includes("Conteúdo:") 
                                  ? "pl-3 border-l-4 border-amber-500 py-1 my-2 bg-amber-50 rounded-r font-medium"
                                : linha.includes("Duração da Aula:") 
                                  ? "pl-3 border-l-4 border-rose-500 py-1 my-2 bg-rose-50 rounded-r font-medium"
                                : linha.includes("OBJETIVO") || linha.includes("PROPÓSITO") || linha.toLowerCase().includes("objetivo") || linha.toLowerCase().includes("propósito")
                                  ? "pl-3 border-l-4 border-teal-500 py-1 my-2 bg-teal-50 rounded-r font-medium"
                                : linha.includes("RECURSOS") || linha.includes("MATERIAIS") || linha.toLowerCase().includes("recursos") || linha.toLowerCase().includes("materiais")
                                  ? "pl-3 border-l-4 border-orange-500 py-1 my-2 bg-orange-50 rounded-r font-medium"
                                : linha.includes("METODOLOGIA") || linha.includes("ESTRATÉGIA") || linha.toLowerCase().includes("metodologia") || linha.toLowerCase().includes("estratégia") || linha.toLowerCase().includes("desenvolvimento")
                                  ? "pl-3 border-l-4 border-cyan-500 py-1 my-2 bg-cyan-50 rounded-r font-medium"
                                : linha.includes("AVALIAÇÃO") || linha.toLowerCase().includes("avaliação") || linha.toLowerCase().includes("avaliar")
                                  ? "pl-3 border-l-4 border-red-500 py-1 my-2 bg-red-50 rounded-r font-medium"
                                : linha.includes("INTRODUÇÃO") || linha.includes("ACOLHIDA") || linha.toLowerCase().includes("introdução") || linha.toLowerCase().includes("acolhida")
                                  ? "pl-3 border-l-4 border-violet-500 py-1 my-2 bg-violet-50 rounded-r font-medium"
                                : linha.includes("ATIVIDADE") || linha.includes("EXERCÍCIO") || linha.toLowerCase().includes("atividade") || linha.toLowerCase().includes("exercício") || linha.toLowerCase().includes("exercicio")
                                  ? "pl-3 border-l-4 border-pink-500 py-1 my-2 bg-pink-50 rounded-r font-medium"
                                : linha.includes("ENCERRAMENTO") || linha.includes("SISTEMATIZAÇÃO") || linha.toLowerCase().includes("encerramento") || linha.toLowerCase().includes("sistematização")
                                  ? "pl-3 border-l-4 border-emerald-500 py-1 my-2 bg-emerald-50 rounded-r font-medium"
                                : (linha.trim().startsWith('•') || linha.trim().startsWith('-')) 
                                  ? "pl-6 py-0.5 my-1 text-gray-700"
                                : linha.trim().length > 0 && !linha.includes(":") && !linha.includes("•") && !linha.includes("-")
                                  ? "pl-1 py-1 my-1 leading-relaxed text-gray-800 bg-gray-50 rounded px-2"
                                : "leading-relaxed text-gray-800"
                            } 
                          >
                            <span className={
                              /EF\d{2}[A-Z]{2}\d{2}/.test(linha) 
                                ? "font-medium text-indigo-700" 
                                : linha.includes(":") && !linha.includes("Disciplina:") && !linha.includes("Série/Ano:") && !linha.includes("Turma:") && !linha.includes("Modalidade da Turma:") && !linha.includes("Tópico/Conteúdo Principal:") && !linha.includes("Duração da Aula:")
                                  ? "font-medium text-gray-700"
                                  : ""
                            }>{linha}</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : ( 
                <motion.div initial="hidden" animate="visible" exit={{ opacity: 0 }} className="px-6 py-6 grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-100 rounded-lg">
                  {[coluna1, coluna2, coluna3].map((coluna: SecaoPlano[], colIndex: number) => (
                    <div key={colIndex} className="space-y-6">
                      {coluna.map((secao: SecaoPlano, index: number) => (
                        <motion.div key={`col${colIndex}-${index}`} className="mb-2 bg-gray-50 rounded-lg p-4 shadow-sm" custom={colIndex * terco + index} variants={conteudoVariants}>
                          {secao.titulo && <motion.div className="flex items-center mb-2.5"><ChevronRight size={16} className="text-indigo-500 mr-1.5" /><motion.h3 className="text-base font-bold text-indigo-700 pb-1 border-b-2 border-indigo-300 w-full" custom={colIndex * terco + index} variants={tituloVariants}>{secao.titulo}</motion.h3></motion.div>}
                          <div className="space-y-1.5">
                            {secao.conteudo.map((linha: string, idx: number) => (
                              <motion.div key={idx} custom={idx} variants={linhaVariants} 
                                className={`text-sm ${
                                  /EF\d{2}[A-Z]{2}\d{2}/.test(linha) 
                                    ? "pl-3 border-l-3 border-indigo-500 py-1 my-1 bg-indigo-50 rounded-r" 
                                    : linha.includes("Disciplina:") 
                                      ? "pl-3 border-l-3 border-blue-500 py-1 my-1 bg-blue-50 rounded-r font-medium"
                                    : linha.includes("Série/Ano:") || linha.includes("Turma:") 
                                      ? "pl-3 border-l-3 border-green-500 py-1 my-1 bg-green-50 rounded-r font-medium"
                                    : linha.includes("Modalidade da Turma:") 
                                      ? "pl-3 border-l-3 border-purple-500 py-1 my-1 bg-purple-50 rounded-r font-medium"
                                    : linha.includes("Tópico/Conteúdo Principal:") || linha.includes("Conteúdo:") 
                                      ? "pl-3 border-l-3 border-amber-500 py-1 my-1 bg-amber-50 rounded-r font-medium"
                                    : linha.includes("Duração da Aula:") 
                                      ? "pl-3 border-l-3 border-rose-500 py-1 my-1 bg-rose-50 rounded-r font-medium"
                                    : linha.includes("OBJETIVO") || linha.includes("PROPÓSITO") || linha.toLowerCase().includes("objetivo") || linha.toLowerCase().includes("propósito")
                                      ? "pl-3 border-l-3 border-teal-500 py-1 my-1 bg-teal-50 rounded-r font-medium"
                                    : linha.includes("RECURSOS") || linha.includes("MATERIAIS") || linha.toLowerCase().includes("recursos") || linha.toLowerCase().includes("materiais")
                                      ? "pl-3 border-l-3 border-orange-500 py-1 my-1 bg-orange-50 rounded-r font-medium"
                                    : linha.includes("METODOLOGIA") || linha.includes("ESTRATÉGIA") || linha.toLowerCase().includes("metodologia") || linha.toLowerCase().includes("estratégia") || linha.toLowerCase().includes("desenvolvimento")
                                      ? "pl-3 border-l-3 border-cyan-500 py-1 my-1 bg-cyan-50 rounded-r font-medium"
                                    : linha.includes("AVALIAÇÃO") || linha.toLowerCase().includes("avaliação") || linha.toLowerCase().includes("avaliar")
                                      ? "pl-3 border-l-3 border-red-500 py-1 my-1 bg-red-50 rounded-r font-medium"
                                    : linha.includes("INTRODUÇÃO") || linha.includes("ACOLHIDA") || linha.toLowerCase().includes("introdução") || linha.toLowerCase().includes("acolhida")
                                      ? "pl-3 border-l-3 border-violet-500 py-1 my-1 bg-violet-50 rounded-r font-medium"
                                    : linha.includes("ATIVIDADE") || linha.includes("EXERCÍCIO") || linha.toLowerCase().includes("atividade") || linha.toLowerCase().includes("exercício") || linha.toLowerCase().includes("exercicio")
                                      ? "pl-3 border-l-3 border-pink-500 py-1 my-1 bg-pink-50 rounded-r font-medium"
                                    : linha.includes("ENCERRAMENTO") || linha.includes("SISTEMATIZAÇÃO") || linha.toLowerCase().includes("encerramento") || linha.toLowerCase().includes("sistematização")
                                      ? "pl-3 border-l-3 border-emerald-500 py-1 my-1 bg-emerald-50 rounded-r font-medium"
                                    : (linha.trim().startsWith('•') || linha.trim().startsWith('-')) 
                                      ? "pl-4 py-0.5 text-gray-700"
                                    : linha.trim().length > 0 && !linha.includes(":") && !linha.includes("•") && !linha.includes("-")
                                      ? "pl-1 py-0.5 leading-snug text-gray-800 bg-gray-50 rounded px-2"
                                    : "leading-snug text-gray-800"
                                }`} 
                              >
                                <span className={
                                  /EF\d{2}[A-Z]{2}\d{2}/.test(linha) 
                                    ? "font-medium text-indigo-700" 
                                    : linha.includes(":") && !linha.includes("Disciplina:") && !linha.includes("Série/Ano:") && !linha.includes("Turma:") && !linha.includes("Modalidade da Turma:") && !linha.includes("Tópico/Conteúdo Principal:") && !linha.includes("Duração da Aula:")
                                      ? "font-medium text-gray-700"
                                      : ""
                                }>{linha}</span>
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ))}
                </motion.div>
              )
            )}
          </div> 
          {!isEditMode && ( 
            <motion.div className="flex justify-end px-6 py-4 border-t border-gray-200 bg-white sticky bottom-0 z-10 flex-shrink-0" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.3 }}>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={toggleExpandido} className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Fechar</motion.button>
            </motion.div>
          )}
        </div> 
      )}
    </motion.div> 
  );
});
CardInterno.displayName = 'CardInterno';

const PlanoAulaCardExpandivel: React.FC<PlanoAulaCardExpandivelProps> = ({ plano, onDelete, onFullViewClick, onPlanoAtualizado }) => {
  const [expandido, setExpandido] = useState(false);
  const [modoVisualizacao] = useState<'vertical' | 'grade'>('vertical');
  const [alturaHeader, setAlturaHeader] = useState(0);
  const [sidebarWidth, setSidebarWidth] = useState(0);
  const [isEditModeState, setIsEditModeState] = useState(false); 
  const [editedContent, setEditedContent] = useState(plano.descricao);
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const editAreaRef = useRef<HTMLDivElement | null>(null);

  const dataFormatada = plano.data 
    ? new Date(plano.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) 
    : 'Data não definida';

  useEffect(() => {
    const headerElement = document.querySelector('header');
    const sidebarElement = document.querySelector('.sidebar') || document.querySelector('aside') || document.querySelector('nav[role="navigation"], nav[aria-label*="sidebar"i], nav[class*="sidebar"i]');
    
    const updateDimensions = () => {
      if (headerElement) setAlturaHeader(headerElement.getBoundingClientRect().height);
      else setAlturaHeader(80); 
      
      if (sidebarElement) setSidebarWidth(sidebarElement.getBoundingClientRect().width);
      else {
        const mainLayoutSidebar = document.querySelector('body > div > aside');
        if (mainLayoutSidebar) setSidebarWidth(mainLayoutSidebar.getBoundingClientRect().width);
        else setSidebarWidth(0);
      }
    };
    updateDimensions();    
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);
  
  useEffect(() => {
    if (expandido && isEditModeState) { 
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 100); 
    }
  }, [expandido, isEditModeState]); 

   useEffect(() => {
    if (expandido) {
      document.body.style.overflow = 'hidden';
      
      const handleEscKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !saving) {
          toggleExpandido();
        }
      };
      
      document.addEventListener('keydown', handleEscKey);
      return () => {
        document.removeEventListener('keydown', handleEscKey);
        document.body.style.overflow = '';
      };
    } else {
      document.body.style.overflow = '';
      setIsEditModeState(false);
      setEditedContent(plano.descricao);
    }
  }, [expandido, plano.descricao, saving]);

  let savingToastIdRef = useRef<string | null>(null);

  const saveEditedContent = useCallback(async () => {
    try {
      setSaving(true);
      savingToastIdRef.current = toast.loading('Salvando alterações...');
      
      const { data: updatedPlanoFromDb, error } = await supabase
        .from('planos_aula')
        .update({ descricao: editedContent })
        .eq('id', plano.id)
        .select('*')
        .single();
        
      if (error) throw error;
      
      if(savingToastIdRef.current) toast.dismiss(savingToastIdRef.current);
      setIsEditModeState(false); 

      if (onPlanoAtualizado && updatedPlanoFromDb) {
        onPlanoAtualizado(updatedPlanoFromDb as PlanoAulaSupabase);
      }

    } catch (errorCaught) {
      if(savingToastIdRef.current) toast.dismiss(savingToastIdRef.current);
      console.error('Erro ao salvar alterações:', errorCaught);
      toast.error('Erro ao salvar alterações. Tente novamente.');
    } finally {
      setSaving(false);
      savingToastIdRef.current = null;
    }
  }, [plano.id, editedContent, onPlanoAtualizado]);

  const toggleExpandido = useCallback(() => {
    if (saving) return; 
    if (expandido && editedContent !== plano.descricao && isEditModeState) {
      if (confirm('Você tem alterações não salvas. Deseja salvá-las antes de fechar?')) {
        saveEditedContent().then(() => {
          setExpandido(false);
        });
        return;
      }
    }
    setExpandido(!expandido);
    
    if (expandido) {
      setEditedContent(plano.descricao);
      setIsEditModeState(false);
    }
  }, [expandido, saving, editedContent, plano.descricao, isEditModeState, saveEditedContent]);

  const toggleEditMode = useCallback(() => {
    if (saving) return; 
    if (isEditModeState) { 
      if (editedContent !== plano.descricao) {
        if (window.confirm('Você tem alterações não salvas. Deseja descartá-las?')) {
          setEditedContent(plano.descricao); 
          setIsEditModeState(false); 
        }
      } else {
        setIsEditModeState(false); 
      }
    } else {
      setEditedContent(plano.descricao); 
      setIsEditModeState(true); 
    }
  }, [saving, isEditModeState, editedContent, plano.descricao]);

  const processarConteudoLocal = (descricao: string): SecaoPlano[] => {
    const secoesProcessadas: SecaoPlano[] = [];
    const linhas = descricao.split('\n');
    let secaoAtual: SecaoPlano = { titulo: '', conteudo: [] };
    const titulosConhecidos = [
      'IDENTIFICAÇÃO', 'HABILIDADES DA BNCC', 'OBJETIVOS ESPECÍFICOS DA AULA',
      'OBJETIVOS ESPECÍFICOS', 'RECURSOS E MATERIAIS NECESSÁRIOS', 'RECURSOS E MATERIAIS',
      'METODOLOGIA', 'AVALIAÇÃO', 'DESENVOLVIMENTO', 'INTRODUÇÃO', 'ACOLHIDA',
      'ATIVIDADE PRÁTICA/FIXAÇÃO', 'ENCERRAMENTO/SISTEMATIZAÇÃO'
    ];
    for (const linha of linhas) {
      let linhaProcessada = linha.trim();
      if (linhaProcessada.toUpperCase().startsWith('DATA:')) continue;
      if (/^\s*\*\s*EF\d{2}[A-Z]{2}\d{2}/.test(linhaProcessada)) {
        linhaProcessada = linhaProcessada.replace(/^\s*\*\s*/, '');
      }
      const linhaUpperComparavel = linhaProcessada.toUpperCase().replace(/(\n|\r|\*\*|--|:)$/g, '').trim();
      let ehTituloDefinido = false;
      for (const tk of titulosConhecidos) {
        if (linhaUpperComparavel.startsWith(tk)) { 
          if (secaoAtual.titulo || secaoAtual.conteudo.length > 0) {
            if (secaoAtual.conteudo.join('').trim() !== '' || secaoAtual.titulo) {
              secoesProcessadas.push(secaoAtual);
            }
          }
          secaoAtual = { titulo: linhaProcessada, conteudo: [] };
          ehTituloDefinido = true;
          break;
        }
      }
      if (!ehTituloDefinido && linhaProcessada !== '') secaoAtual.conteudo.push(linhaProcessada);
    }
    if (secaoAtual.titulo || secaoAtual.conteudo.length > 0) {
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
    })).filter(secao => secao.titulo.trim() !== '' || secao.conteudo.length > 0);
    return secoesFiltradas;
  };

  const secoes = processarConteudoLocal(isEditModeState ? editedContent : plano.descricao); 
  const terco = Math.ceil(secoes.length / 3);
  const coluna1 = secoes.slice(0, terco);
  const coluna2 = secoes.slice(terco, terco * 2);
  const coluna3 = secoes.slice(terco * 2);

  const modalTransition = { duration: 0.25 };

  const cardInternoProps: CardInternoProps = {
    isCurrentlyExpanded: expandido, 
    plano,
    editedContent,
    saving,
    modoVisualizacao,
    secoes,
    coluna1,
    coluna2,
    coluna3,
    terco,
    alturaHeader,
    dataFormatada,
    isEditMode: isEditModeState,
    toggleExpandido,
    toggleEditMode,
    saveEditedContent,
    onDelete,
    setEditedContent,
    textareaRef,
    editAreaRef,
    onFullViewClick,
  };

  return (
    <AnimatePresence>
      {expandido ? (
        <motion.div
          key={`overlay-${plano.id}`}
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          transition={modalTransition}
          className="fixed inset-0 bg-gradient-to-br from-indigo-900/40 to-purple-900/40 backdrop-blur-md z-[1000] flex items-start justify-center pt-[2vh] pb-[2vh] overflow-y-auto"
          onClick={(e) => { 
            if (!saving && e.target === e.currentTarget) {
              toggleExpandido();
            }
            e.stopPropagation();
          }}
        >
          <div className="w-full flex justify-center px-2 sm:px-5" style={{ paddingLeft: `max(1.25rem, calc(${sidebarWidth}px / 2 + 1.25rem))`, paddingRight: '1.25rem' }}> 
            <CardInterno {...cardInternoProps} />
          </div>
        </motion.div>
      ) : (
        <div className="transition-none"> 
          <CardInterno {...cardInternoProps} isCurrentlyExpanded={false} /> 
        </div>
      )}
    </AnimatePresence>
  );
}; 

export default PlanoAulaCardExpandivel; 