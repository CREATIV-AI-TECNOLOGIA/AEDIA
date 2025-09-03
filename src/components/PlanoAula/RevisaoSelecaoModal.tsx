import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchDetalhesHabilidadeContextual, fetchCamposCurricularesTrimestre } from '../../services/apiPlanoAula';
import SolicitacaoIAPlanoAulaModal from './SolicitacaoIAPlanoAulaModal';
import toast from 'react-hot-toast';
import { generateLessonPlanWithOpenAI, LessonPlanParams } from '../../services/openaiService';
import { supabase } from '../../lib/supabaseClient';
import { useEscola } from '../../context/EscolaContext';
// Ex: import { salvarPlanoDeAula } from '../../services/planosAulaService';



interface HabilidadeDetalhadaParaModal {
  codigo: string;
  descricao: string;
  praticasLinguagem?: string[];
  unidadesTematicas?: string[];
  erro?: boolean;
}

interface RevisaoSelecaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  disciplinaNome: string;
  anoEnsino: string;
  habilidadesSelecionadas: Array<{ codigo: string; descricao: string }>; 
  disciplinaId: number; 
  trimestre: string;    
  modalidade: string; // Nome da modalidade geral (ex: Fundamental 1)
  professorId: number | null;
  modalidadeId: number | null; // ID da modalidade geral
  // Adicionando props da turma que virão da tela anterior
  turmaId: number;
  turmaNome: string;
  turmaAno?: string; // Ano específico da turma (ex: 1° Ano)
  turmaModalidadeNome?: string; // Nome da modalidade específica da turma (ex: Ciclo de Alfabetização)
}

const RevisaoSelecaoModal: React.FC<RevisaoSelecaoModalProps> = ({
  isOpen,
  onClose,
  disciplinaNome,
  anoEnsino,
  habilidadesSelecionadas,
  disciplinaId,
  trimestre,
  modalidade,
  professorId,
  modalidadeId,
  turmaId,
  turmaNome,
  turmaAno,
  turmaModalidadeNome
}) => {
  const navigate = useNavigate();
  const { escolaAtiva } = useEscola();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [erroBuscaGeral, setErroBuscaGeral] = useState<string | null>(null);
  const [habilidadesDetalhadas, setHabilidadesDetalhadas] = useState<HabilidadeDetalhadaParaModal[]>([]);
  const [planoEditado, setPlanoEditado] = useState<string>('');
  const [nomeDoPlanoParaSalvar, setNomeDoPlanoParaSalvar] = useState<string>('');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState<boolean>(false);
  const [isSubmittingToIA, setIsSubmittingToIA] = useState<boolean>(false);
  const isLinguaPortuguesa = disciplinaNome?.toLowerCase().includes('língua portuguesa') ?? false;

  const [quantidadeAlunos, setQuantidadeAlunos] = useState<number | null>(null);
  const [loadingAlunos, setLoadingAlunos] = useState<boolean>(false);

  const fetchQuantidadeAlunos = async (turmaId: number) => {
    if (!turmaId) {
      setQuantidadeAlunos(null);
      return;
    }
    setLoadingAlunos(true);
    try {
      const { count, error } = await supabase
        .from('alunos')
        .select('*', { count: 'exact', head: true })
        .eq('turma_id', turmaId);

      if (error) {
        throw error;
      }
      setQuantidadeAlunos(count ?? 0);
    } catch (error) {
      console.error('Erro ao buscar quantidade de alunos:', error);
      // Não mostraremos toast aqui para não poluir, mas o erro é logado.
      setQuantidadeAlunos(null); 
    } finally {
      setLoadingAlunos(false);
    }
  };
  
  useEffect(() => {
    if (turmaId) {
      fetchQuantidadeAlunos(turmaId);
    } else {
      setQuantidadeAlunos(null); 
    }
  }, [turmaId]);

  const handleGerarPlanoSubmit = async (nomePlanoInput: string, sugestao?: string) => {
    if (!turmaId) {
      toast.error('Informações da turma não encontradas. Não é possível gerar o plano.');
      return;
    }
    console.log('[RevisaoSelecaoModal] handleGerarPlanoSubmit: Iniciando...', { nomePlanoInput, turmaId });

    setIsSubmittingToIA(true);
    setNomeDoPlanoParaSalvar(nomePlanoInput); 

    const abordagemPedagogicaSelecionada = "Usar configurações da IA do professor";

    try {
      const params: LessonPlanParams = {
        disciplina: disciplinaNome,
        serie: anoEnsino,
        topico: 'Conteúdo baseado nas habilidades BNCC selecionadas e contexto da turma',
        duracao: '1 aula (aproximadamente 50 minutos)',
        objetivos: [],
        habilidadesBNCC: habilidadesDetalhadas.map(h => `${h.codigo}: ${h.descricao}`),
        recursos: [],
        metodologia: 'Descrever uma metodologia ativa e engajadora, com clara introdução, desenvolvimento e conclusão, adequada à turma e ao conteúdo.',
        avaliacao: 'Sugerir formas de avaliação formativa e somativa relevantes.',
        observacoes: 'Plano gerado por IA. Revise e adapte conforme necessário.',
        nomePlano: nomePlanoInput,
        instrucoesAdicionais: sugestao || 'Manter um tom adequado para professores e focar na praticidade do plano.',
        abordagemPedagogica: abordagemPedagogicaSelecionada,
        // Dados adicionais do sistema
        nomeTurma: turmaNome,
        modalidadeAula: turmaModalidadeNome || modalidade,
        trimestre: trimestre,
        quantidadeAlunos: quantidadeAlunos || undefined,
        professorId: professorId || undefined,
        escolaId: escolaAtiva?.id,
        // Extrair gêneros textuais e objetos de conhecimento das habilidades se for Língua Portuguesa
        generosTextuais: disciplinaNome?.toLowerCase().includes('língua portuguesa') 
          ? habilidadesDetalhadas.flatMap(h => h.praticasLinguagem || []).filter((v, i, a) => a.indexOf(v) === i)
          : undefined,
        objetosConhecimento: habilidadesDetalhadas.flatMap(h => h.unidadesTematicas || []).filter((v, i, a) => a.indexOf(v) === i)
      };
      console.log('[RevisaoSelecaoModal] handleGerarPlanoSubmit: Parâmetros para IA:', params);

      const planoGeradoPelaIA = await generateLessonPlanWithOpenAI(params);
      console.log('[RevisaoSelecaoModal] handleGerarPlanoSubmit: Plano gerado pela IA:', planoGeradoPelaIA);

      if (!planoGeradoPelaIA || planoGeradoPelaIA.trim() === '') {
        toast.error('A IA não retornou um conteúdo para o plano de aula. Tente novamente.');
        setIsSubmittingToIA(false);
        return;
      }

      setPlanoEditado(planoGeradoPelaIA); 

      setIsSubmittingToIA(false); 
      toast('Plano de aula gerado pela IA. Salvando automaticamente...', { icon: '🤖' });
      console.log('[RevisaoSelecaoModal] handleGerarPlanoSubmit: Chamando handleSalvarPlano...');
      
      await handleSalvarPlano(planoGeradoPelaIA, nomePlanoInput); 

      console.log('[RevisaoSelecaoModal] handleGerarPlanoSubmit: handleSalvarPlano completou. Fechando modal.');
      onClose(); 

    } catch (error) {
      console.error('[RevisaoSelecaoModal] Erro em handleGerarPlanoSubmit:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao gerar.';
      toast.error(`Erro ao gerar o plano de aula: ${errorMessage}. Por favor, tente novamente.`);
      setIsSubmittingToIA(false);
    }
  };

  const handleSalvarPlano = async (planoConteudo?: string, nomePlano?: string) => {
    // Usa os parâmetros diretamente, com fallback para o estado se não fornecidos (embora no fluxo principal sempre serão)
    const conteudoFinalParaSalvar = planoConteudo || planoEditado;
    const nomeFinalParaSalvar = nomePlano || nomeDoPlanoParaSalvar;

    console.log('[RevisaoSelecaoModal] handleSalvarPlano: Iniciando salvamento...', {
      turmaSelecionadaId: turmaId,
      planoEditadoPresente: !!conteudoFinalParaSalvar && conteudoFinalParaSalvar.length > 0,
      professorId,
      modalidadeId,
      nomeDoPlanoParaSalvar: nomeFinalParaSalvar,
      escolaAtivaId: escolaAtiva?.id
    });

    if (!turmaId || !conteudoFinalParaSalvar || !professorId || !modalidadeId || !nomeFinalParaSalvar) {
      toast.error('Dados incompletos para salvar o plano. Verifique turma, conteúdo, nome, professor e modalidade.');
      console.error('[RevisaoSelecaoModal] handleSalvarPlano: Dados incompletos', { turmaId, conteudoFinalParaSalvar, nomeFinalParaSalvar, professorId, modalidadeId });
      return;
    }

    if (!escolaAtiva || !escolaAtiva.id) {
      toast.error('Nenhuma escola ativa selecionada. Não é possível salvar o plano.');
      return;
    }

    const codigosHabilidades = habilidadesSelecionadas.map(h => h.codigo);

    setIsLoading(true);
    try {
      const { data: planoSalvo, error } = await supabase
        .from('planos_aula')
        .insert([
          {
            titulo: nomeFinalParaSalvar,
            descricao: conteudoFinalParaSalvar,
            data: new Date().toISOString().split('T')[0],
            disciplina_id: disciplinaId,
            turma_id: turmaId,
            professor_id: professorId,
            trimestre: trimestre,
            modalidade_id: modalidadeId,
            habilidades: codigosHabilidades,
            escola_id: escolaAtiva.id
          }
        ])
        .select()
        .single(); 

      if (error) {
        console.error('Erro detalhado do Supabase ao salvar plano:', error);
        const errorMessage = error.details || error.message || 'Erro desconhecido ao salvar.';
        toast.error(`Falha ao salvar o plano: ${errorMessage}`, { id: `salvar-plano-erro-${Date.now()}` });
        setIsLoading(false);
        return; 
      }
      
      if (planoSalvo) {
        toast.success('Plano de aula salvo com sucesso!');
        localStorage.setItem('planoParaAbrirEmTelaCheia', JSON.stringify(planoSalvo));
        navigate('/planos-aula'); 
      } else {
        console.error('Situação inesperada ao salvar plano. Nenhum dado retornado e nenhum erro claro.');
        toast.error('Não foi possível confirmar o salvamento do plano.');
      }

    } catch (err) {
      console.error('Erro geral no catch ao salvar plano:', err);
      toast.error('Ocorreu um erro inesperado ao tentar salvar o plano.', { id: `salvar-plano-catch-erro-${Date.now()}` });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && habilidadesSelecionadas.length > 0 && disciplinaId && trimestre && anoEnsino) {
      const buscarDados = async () => {
        setIsLoading(true);
        setErroBuscaGeral(null);
        setPlanoEditado('');

        const promessasDetalhesHabilidades = habilidadesSelecionadas.map(async (hab) => {
          try {
            const detalhes = await fetchDetalhesHabilidadeContextual( hab.codigo, anoEnsino, trimestre, disciplinaId );
            return { codigo: hab.codigo, descricao: hab.descricao, praticasLinguagem: detalhes.praticasLinguagem, unidadesTematicas: detalhes.unidadesTematicas };
          } catch (error) {
            console.error(`Erro ao buscar Práticas/Unidades para ${hab.codigo}:`, error);
            return { codigo: hab.codigo, descricao: hab.descricao, erro: true };
          }
        });

        const promessaCamposTrimestre = fetchCamposCurricularesTrimestre( disciplinaId, anoEnsino, trimestre ).catch(error => {
          console.error("Erro ao buscar Gêneros/Objetos do trimestre:", error);
          setErroBuscaGeral((prev) => prev ? prev + " Falha ao buscar Gêneros/Objetos." : "Falha ao buscar Gêneros/Objetos.");
          return { generosTextuais: [], objetosConhecimento: [] };
        });

        try {
          const [resultadosHabilidades, resultadoCamposTrimestre] = await Promise.all([ Promise.all(promessasDetalhesHabilidades), promessaCamposTrimestre ]);
          setHabilidadesDetalhadas(resultadosHabilidades);
        } catch (error) {
          console.error("Erro geral ao processar todos os dados:", error);
          setErroBuscaGeral("Falha crítica ao carregar dados curriculares.");
        } finally {
          setIsLoading(false);
        }
      };
      buscarDados();
    } else if (!isOpen) {
      setHabilidadesDetalhadas([]);
      setIsLoading(false);
      setErroBuscaGeral(null);
      setIsGeneratingPlan(false);
      setPlanoEditado('');
      setNomeDoPlanoParaSalvar('');
    }
  }, [isOpen, habilidadesSelecionadas, anoEnsino, disciplinaId, trimestre, disciplinaNome]); 

  if (!isOpen) {
    return null;
  }

  const handleAbrirSolicitacaoModal = () => { setIsGeneratingPlan(true); };
  const handleFecharSolicitacaoModal = () => { setIsGeneratingPlan(false); };

  if (isSubmittingToIA) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300 lg:pl-64">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col items-center justify-center p-10">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mb-6"></div>
          <p className="text-gray-700 font-semibold text-lg mb-2">Gerando seu plano de aula...</p>
          <p className="text-gray-500 text-sm">Aguarde um momento, a IA está trabalhando! ✨</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-opacity duration-300 lg:pl-64">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl flex flex-col">
        {/* Cabeçalho */}
        <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-blue-50">
          <h2 className="text-xl font-semibold text-gray-800">Revisão da Seleção para Plano de Aula</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 hover:bg-gray-100"
            aria-label="Fechar modal"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
            
        {/* Corpo */}
        <div className="p-6 flex-grow overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {isLoading && !isSubmittingToIA && (
            <div className="flex flex-col items-center justify-center py-10">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent mb-4"></div>
              <p className="text-gray-600 font-medium">Carregando detalhes curriculares...</p>
              <p className="text-sm text-gray-500 mt-1">Isso pode levar alguns instantes.</p>
            </div>
          )}

          {!isLoading && erroBuscaGeral && !isSubmittingToIA && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
              <p className="font-bold">Erro ao Carregar Dados</p>
              <p>{erroBuscaGeral}</p>
            </div>
          )}
        
          {!isLoading && !erroBuscaGeral && !isSubmittingToIA && (
            <div className="space-y-6">
              {/* Primeira linha: Escola Ativa e Turma alinhados na mesma altura */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Coluna 1: Escola Ativa */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex flex-col justify-between h-24">
                  <label className="block text-sm font-semibold text-indigo-700 mb-1">Escola Ativa:</label>
                  <p className="text-indigo-800 text-base font-medium">{escolaAtiva?.nome || 'Nenhuma escola selecionada'}</p>
                </div>

                {/* Coluna 2: Seleção de Turma */}
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 flex flex-col justify-start h-auto min-h-24">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Turma Selecionada:</label>
                  <p className="text-gray-800 text-base font-medium">
                    {turmaNome || 'Nome da turma não informado'} 
                    {turmaAno && ` (${turmaAno}${turmaModalidadeNome ? ' - ' + turmaModalidadeNome : ''})`}
                  </p>
                  
                  {turmaId && (
                    <div className="mt-2 text-xs text-gray-600">
                      {loadingAlunos ? (
                        <span>Carregando quantidade de alunos...</span>
                      ) : (
                        <span>
                          Alunos na turma: {quantidadeAlunos !== null ? quantidadeAlunos : 'N/A'}
                        </span>
                      )}
                    </div>
                  )}
                  {!turmaId && (
                     <p className="text-xs text-red-500 mt-1">Informações da turma não disponíveis.</p>
                  )}
                </div>
              </div>
              
              {/* Segunda linha: 4 cards de informações básicas, todos com a mesma altura */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 h-20 flex flex-col justify-between">
                  <label className="block text-sm font-semibold text-gray-700">Disciplina:</label>
                  <p className="text-gray-800">{disciplinaNome}</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 h-20 flex flex-col justify-between">
                  <label className="block text-sm font-semibold text-gray-700">Ano/Série:</label>
                  <p className="text-gray-800">{anoEnsino}</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 h-20 flex flex-col justify-between">
                  <label className="block text-sm font-semibold text-gray-700">Trimestre:</label>
                  <p className="text-gray-800">{trimestre}</p>
                </div>
                
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 h-20 flex flex-col justify-between">
                  <label className="block text-sm font-semibold text-gray-700">Modalidade Geral:</label>
                  <p className="text-gray-800">{modalidade}</p>
                </div>
              </div>
              

              
              {/* Habilidades Selecionadas */}
              <div className="mt-8">
                <label className="block text-lg font-semibold text-gray-800 mb-3">Habilidades Selecionadas:</label>
                {habilidadesDetalhadas.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {habilidadesDetalhadas.map((hab, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <p className="text-gray-800"><strong className="text-indigo-700">{hab.codigo}:</strong> {hab.descricao}</p>
                        {hab.erro && <span className="text-red-500 text-sm ml-2">(Erro ao buscar detalhes)</span>}
                        {isLinguaPortuguesa && hab.praticasLinguagem && hab.praticasLinguagem.length > 0 && (
                          <p className="text-sm text-blue-600 mt-2">
                            <span className="font-medium">Práticas de Linguagem:</span> {hab.praticasLinguagem.join(', ')}
                          </p>
                        )}
                        {isLinguaPortuguesa && hab.unidadesTematicas && hab.unidadesTematicas.length > 0 && (
                          <p className="text-sm text-purple-600 mt-1">
                            <span className="font-medium">Unidades Temáticas:</span> {hab.unidadesTematicas.join(', ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Nenhuma habilidade para detalhar ou carregando...</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé */}
        {!isSubmittingToIA && (
          <div className="p-4 bg-gradient-to-r from-gray-50 to-indigo-50 border-t border-gray-200 flex justify-end">
            {!isLoading && !erroBuscaGeral && ( 
              <button
                onClick={handleAbrirSolicitacaoModal}
                disabled={!turmaId || isLoading || !!erroBuscaGeral}
                className="px-5 py-2.5 text-base font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 active:bg-indigo-800 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
              >
                {!turmaId ? 'Informações da turma pendentes' : 'Definir Nome e Gerar Plano com IA'}
              </button>
            )}
          </div>
        )}
        

        <SolicitacaoIAPlanoAulaModal
          isOpen={isGeneratingPlan}
          onClose={handleFecharSolicitacaoModal}
          onSubmit={handleGerarPlanoSubmit}
        />
      </div>
    </div>
  );
};

export default RevisaoSelecaoModal; 