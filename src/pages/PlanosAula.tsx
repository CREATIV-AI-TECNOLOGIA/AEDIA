import React, { useEffect, useState, useMemo, useCallback, useRef, memo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEscola } from '../context/EscolaContext';
import { getProfessorComModalidades, ProfessorComModalidades } from '../services/ProfessorService';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient'; // Importar supabase
import { FileText, AlertTriangle, PlusCircle, Search, X, BookOpen, Calendar, Clock, Filter, Target, Award, Sparkle } from 'lucide-react'; // Adicionado ícones Search e X
import toast from 'react-hot-toast'; // Para notificações
import PlanoAulaCardModerno from '../components/PlanoAula/PlanoAulaCardModerno'; // Novo card moderno
import PlanoAulaFullView from '../components/PlanoAula/PlanoAulaFullView';
import Layout from '../components/layout/Layout';
import { useDebounce } from '../hooks/useDebounce';
import ConfirmationModal from '../components/ConfirmationModal'; // Importar o novo modal de confirmação

// Interface para os dados do plano de aula como vêm do Supabase
export interface PlanoAulaSupabase { // Adicionado export
  id: string; // uuid
  titulo: string;
  descricao: string; // Conteúdo Markdown
  data: string; // date
  professor_id: number; // ou string, dependendo da sua DB
  turma_id?: number; // ou string
  disciplina_id?: number; // ou string
  periodo_letivo_id?: string; // uuid
  created_at: string;
  updated_at: string;
  // Campos adicionais para exibição
  disciplinaNome?: string;
  turmaAno?: string;
  turmaNome?: string; // Adicionado para nome da turma
  modalidadeNome?: string;
}

interface PlanosAulaProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

const PlanosAula: React.FC<PlanosAulaProps> = ({ 
  searchValue: externalSearchValue, 
  onSearchChange: externalOnSearchChange 
}) => {
  const { user } = useAuth();
  const { escolaAtiva, loadingEscolas } = useEscola();
  const navigate = useNavigate();
  const [professor, setProfessor] = useState<ProfessorComModalidades | null>(null);
  const [planosAula, setPlanosAula] = useState<PlanoAulaSupabase[]>([]);
  const [planoFullView, setPlanoFullView] = useState<PlanoAulaSupabase | null>(null);
  const [loadingProfessor, setLoadingProfessor] = useState(false);
  const [loadingPlanos, setLoadingPlanos] = useState(false);
  const [dadosCarregados, setDadosCarregados] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [planoToDeleteId, setPlanoToDeleteId] = useState<string | null>(null);

  // Usar searchValue externo se fornecido, senão usar interno
  const currentSearchTerm = externalSearchValue !== undefined ? externalSearchValue : searchTerm;
  
  // Debounce da busca para melhor performance
  const debouncedSearchTerm = useDebounce(currentSearchTerm, 300);
  
  // Função para atualizar search (interna ou externa) - memoizada
  const handleSearchChange = useCallback((value: string) => {
    if (externalOnSearchChange) {
      externalOnSearchChange(value);
    } else {
      setSearchTerm(value);
    }
  }, [externalOnSearchChange]);

  // Métricas calculadas para os sparklines

  // Efeito para verificar se há um plano para abrir em tela cheia
  useEffect(() => {
    const planoParaAbrirEmTelaCheia = localStorage.getItem('planoParaAbrirEmTelaCheia');
    if (planoParaAbrirEmTelaCheia) {
      try {
        const plano = JSON.parse(planoParaAbrirEmTelaCheia);
        console.log('Abrindo plano em tela cheia:', plano);
        setPlanoFullView(plano);
        localStorage.removeItem('planoParaAbrirEmTelaCheia');
      } catch (error) {
        console.error('Erro ao parsear plano do localStorage:', error);
        localStorage.removeItem('planoParaAbrirEmTelaCheia');
      }
    }
  }, []);

  const handlePlanoAtualizado = useCallback(async (planoDbAtualizado: PlanoAulaSupabase) => {
    try {
      // 1. Buscar nomes de disciplina, turma e modalidade para o plano atualizado
      let disciplinaNome = planoDbAtualizado.disciplinaNome;
      let turmaAno = planoDbAtualizado.turmaAno;
      let turmaNome = planoDbAtualizado.turmaNome; // Preservar se já existir
      let modalidadeNome = planoDbAtualizado.modalidadeNome;

      if (planoDbAtualizado.disciplina_id) {
        const { data: discData, error: discError } = await supabase
          .from('disciplinas')
          .select('nome')
          .eq('id', planoDbAtualizado.disciplina_id)
          .single();
        if (discError) console.error('Erro ao buscar nome da disciplina:', discError);
        else if (discData) disciplinaNome = discData.nome;
      }

      if (planoDbAtualizado.turma_id) {
        const { data: turmaData, error: turmaError } = await supabase
          .from('turmas')
          .select('nome, ano, modalidade_id')
          .eq('id', planoDbAtualizado.turma_id)
          .single();

        if (turmaError) console.error('Erro ao buscar dados da turma:', turmaError);
        else if (turmaData) {
          turmaAno = turmaData.ano;
          turmaNome = turmaData.nome;
          if (turmaData.modalidade_id) {
            const { data: modData, error: modError } = await supabase
              .from('modalidades')
              .select('nome')
              .eq('id', turmaData.modalidade_id)
              .single();
            if (modError) console.error('Erro ao buscar nome da modalidade:', modError);
            else if (modData) modalidadeNome = modData.nome;
          }
        }
      }

      const planoEnriquecidoFinal = {
        ...planoDbAtualizado,
        disciplinaNome,
        turmaAno,
        turmaNome,
        modalidadeNome,
      };

      // 2. Atualizar o estado da lista de planos e do full view (se aplicável)
      setPlanosAula(prevPlanos =>
        prevPlanos.map(p => (p.id === planoEnriquecidoFinal.id ? planoEnriquecidoFinal : p))
      );
      if (planoFullView && planoFullView.id === planoEnriquecidoFinal.id) {
        setPlanoFullView(planoEnriquecidoFinal);
      }
      
      toast.success('Plano de aula salvo com sucesso!');

    } catch (error) {
      console.error("Erro ao enriquecer e atualizar plano:", error);
      toast.error("Erro ao atualizar os detalhes do plano de aula.");
      // Mesmo com erro no enriquecimento, tentamos atualizar com o que temos do DB
      setPlanosAula(prevPlanos =>
        prevPlanos.map(p => (p.id === planoDbAtualizado.id ? planoDbAtualizado : p))
      );
      if (planoFullView && planoFullView.id === planoDbAtualizado.id) {
        setPlanoFullView(planoDbAtualizado);
      }
    }
  }, [planoFullView]); // supabase é estável e não precisa ser dependência aqui

  // Função otimizada de carregamento - similar à tela de avaliações
  const carregarPlanosOtimizado = useCallback(async () => {
    if (!user || !escolaAtiva || !professor) return;
    
    try {
      setLoadingPlanos(true);
      setError(null);

      console.log('[PlanosAula] Carregando planos otimizado para professor:', professor.id);

      // Consulta única com todos os relacionamentos (JOIN)
      const { data: planosData, error: planosError } = await supabase
        .from('planos_aula')
        .select(`
          *,
          disciplinas(nome),
          turmas(nome, ano, modalidades(nome))
        `)
        .eq('professor_id', professor.id)
        .eq('escola_id', escolaAtiva.id)
        .order('created_at', { ascending: false });

      if (planosError) {
        console.error('[PlanosAula] Erro ao carregar planos:', planosError);
        throw planosError;
      }

      // Processamento mínimo - dados já vêm enriquecidos do JOIN
      const planosEnriquecidos = planosData?.map(plano => ({
        ...plano,
        disciplinaNome: plano.disciplinas?.nome,
        turmaAno: plano.turmas?.ano,
        turmaNome: plano.turmas?.nome,
        modalidadeNome: plano.turmas?.modalidades?.nome,
      })) || [];

      console.log('[PlanosAula] Planos carregados:', planosEnriquecidos.length);
      setPlanosAula(planosEnriquecidos);
      setDadosCarregados(true);
      
    } catch (error: any) {
      console.error('[PlanosAula] Erro ao carregar planos:', error);
      setError('Erro ao carregar planos de aula. Tente novamente.');
      toast.error('Erro ao carregar planos de aula');
      setPlanosAula([]);
      setDadosCarregados(true);
    } finally {
      setLoadingPlanos(false);
    }
  }, [user, escolaAtiva, professor]);

  // Carregar dados do professor primeiro
  const carregarDadosProfessor = useCallback(async () => {
    if (!user?.email || !escolaAtiva || loadingEscolas) return;
    
    try {
      setLoadingProfessor(true);
      setError(null);

      const dadosProfessor = await getProfessorComModalidades(user.email);
      
      if (!dadosProfessor || !dadosProfessor.id) {
        setError('Não foi possível carregar os dados do professor.');
        return;
      }

      setProfessor(dadosProfessor);
      
    } catch (error: any) {
      console.error('[PlanosAula] Erro ao carregar professor:', error);
      setError(`Erro ao carregar dados do professor: ${error.message}`);
    } finally {
      setLoadingProfessor(false);
    }
  }, [user?.email, escolaAtiva, loadingEscolas]);

  // Carregar dados do professor quando necessário
  useEffect(() => {
    carregarDadosProfessor();
  }, [carregarDadosProfessor]);

  // Carregar planos quando professor estiver disponível
  useEffect(() => {
    if (professor) {
      carregarPlanosOtimizado();
    }
  }, [professor, carregarPlanosOtimizado]);

  // Função para deletar plano de aula (agora com modal de confirmação)
  const handleDeletarPlano = (planoId: string) => {
    setPlanoToDeleteId(planoId);
    setShowConfirmModal(true);
  };

  // Função real de exclusão, chamada após a confirmação do modal
  const confirmDeletePlano = async () => {
    if (!planoToDeleteId) return;

    setShowConfirmModal(false); // Fechar o modal
    
    try {
      const { error } = await supabase
        .from('planos_aula')
        .delete()
        .eq('id', planoToDeleteId)
        .eq('professor_id', professor?.id);

      if (error) {
        throw error;
      }

      setPlanosAula(prevPlanos => prevPlanos.filter(plano => plano.id !== planoToDeleteId));
      setPlanoFullView(null); // Fechar a visualização completa se o plano for deletado
      toast.success('Plano de aula excluído com sucesso!');
    } catch (error: any) {
      console.error('❌ Erro ao deletar plano de aula:', error);
      toast.error(`Erro ao excluir plano de aula: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setPlanoToDeleteId(null); // Limpar ID para deletar
    }
  };

  // Função para fechar o modal de confirmação
  const handleCancelDelete = () => {
    setShowConfirmModal(false);
    setPlanoToDeleteId(null);
  };

  // Filtragem dos planos com base no termo de pesquisa - usando debounced term
  const planosFiltrados = useMemo(() => {
    if (!debouncedSearchTerm.trim()) return planosAula;
    
    const termLower = debouncedSearchTerm.toLowerCase();
    return planosAula.filter(plano => 
      plano.titulo?.toLowerCase().includes(termLower) ||
      (plano.disciplinaNome?.toLowerCase().includes(termLower)) ||
      (plano.turmaAno?.toLowerCase().includes(termLower)) ||
      (plano.modalidadeNome?.toLowerCase().includes(termLower)) ||
      plano.descricao?.toLowerCase().includes(termLower)
    );
  }, [planosAula, debouncedSearchTerm]);

  // Função para limpar a pesquisa - memoizada
  const clearSearch = useCallback(() => {
    handleSearchChange('');
  }, [handleSearchChange]);

  const handleAbrirPlanoFullView = useCallback((plano: PlanoAulaSupabase) => {
    console.log('🎯 [PlanosAula] handleAbrirPlanoFullView chamado com plano:', {
      id: plano.id, 
      titulo: plano.titulo,
      disciplina: plano.disciplinaNome,
      turma: plano.turmaAno,
      planoFullViewAtual: planoFullView?.id || 'nenhum'
    });
    
    // Toast de feedback visual
    toast.loading('Abrindo plano em tela cheia...', {
      duration: 1000,
      position: 'bottom-center'
    });
    
    console.log('📝 [PlanosAula] Definindo planoFullView para:', plano.titulo);
    setPlanoFullView(plano);
  }, [planoFullView]);

  // Função de debug para testar diferentes planos
  const debugAbrirPlano = useCallback((index: number) => {
    if (planosAula[index]) {
      console.log(`[DEBUG] Abrindo plano ${index}:`, planosAula[index].titulo);
      handleAbrirPlanoFullView(planosAula[index]);
    } else {
      console.log(`[DEBUG] Plano ${index} não encontrado. Total: ${planosAula.length}`);
    }
  }, [planosAula, handleAbrirPlanoFullView]);

  // Expor função de debug globalmente para testes
  useEffect(() => {
    if (typeof window !== 'undefined' && planosAula.length > 0) {
      (window as any).debugAbrirPlano = debugAbrirPlano;
      (window as any).planosDisponiveis = planosAula.map((p, i) => ({ 
        index: i, 
        id: p.id, 
        titulo: p.titulo,
        disciplina: p.disciplinaNome,
        turma: p.turmaAno 
      }));
      
      // Função para listar planos de forma mais amigável
      (window as any).listarPlanos = () => {
        console.table(planosAula.map((p, i) => ({ 
          index: i, 
          titulo: p.titulo,
          disciplina: p.disciplinaNome || 'N/A',
          turma: p.turmaAno || 'N/A',
          data: new Date(p.created_at).toLocaleDateString('pt-BR')
        })));
        console.log('Use debugAbrirPlano(index) para abrir um plano específico');
      };
      
      // Log inicial apenas uma vez quando os planos são carregados
      if (planosAula.length > 0) {
        console.log(`✅ ${planosAula.length} planos carregados. Use listarPlanos() para ver todos ou debugAbrirPlano(index) para abrir um específico.`);
      }
    }
  }, [debugAbrirPlano, planosAula]);

  // Log para debug (apenas quando há mudanças significativas)
  const [ultimoLogEstado, setUltimoLogEstado] = useState<string>('');
  
  useEffect(() => {
    const estadoAtual = `${error ? 'ERROR' : ''}${loadingPlanos ? 'LOADING' : ''}${planosAula.length}`;
    
    if (estadoAtual !== ultimoLogEstado && (error || loadingPlanos || planosAula.length === 0)) {
      console.log('[PlanosAula] Estado atual:', {
        loadingProfessor,
        loadingPlanos,
        loadingEscolas,
        user: !!user,
        escolaAtiva: !!escolaAtiva,
        planosCount: planosAula.length,
        error
      });
      setUltimoLogEstado(estadoAtual);
    }
  }, [error, loadingPlanos, planosAula.length, ultimoLogEstado]);

  if (loadingEscolas && !escolaAtiva) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/50">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-200"></div>
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-transparent border-t-indigo-600 absolute top-0 left-0"></div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Carregando Planos de Aula</h3>
              <p className="text-sm text-slate-600">
                {loadingEscolas ? 'Carregando escolas...' : 'Organizando seus conteúdos...'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 relative overflow-hidden">
      {/* Elementos decorativos de fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-pink-400/10 to-indigo-400/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-radial from-white/20 to-transparent rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">


        {/* Cabeçalho com contador, filtros e botão de criar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            {/* Filtros rápidos horizontais - só mostrar se há mais de uma disciplina */}
            {!loadingPlanos && !error && planosAula.length > 0 && [...new Set(planosAula.map(p => p.disciplinaNome).filter(Boolean))].length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <div className="flex items-center space-x-2 text-sm text-slate-500 whitespace-nowrap">
                  <Filter className="h-4 w-4" />
                  <span>Filtros:</span>
                </div>
                
                <button
                  onClick={() => handleSearchChange('')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    !currentSearchTerm 
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md' 
                      : 'bg-white/60 text-slate-600 hover:bg-white/80 border border-white/50'
                  }`}
                >
                  Todos ({planosAula.length})
                </button>
                
                {[...new Set(planosAula.map(p => p.disciplinaNome).filter(Boolean))].slice(0, 3).map(disciplina => (
                  <button
                    key={disciplina}
                    onClick={() => handleSearchChange(disciplina || '')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      currentSearchTerm === disciplina 
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md' 
                        : 'bg-white/60 text-slate-600 hover:bg-white/80 border border-white/50'
                    }`}
                  >
                    {disciplina} ({planosAula.filter(p => p.disciplinaNome === disciplina).length})
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {loadingPlanos ? 'Carregando...' : `${planosAula.length} ${planosAula.length === 1 ? 'plano de aula encontrado' : 'planos de aula encontrados'}`}
            </span>
            <button
              onClick={() => navigate('/planos-aula/criar')}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <PlusCircle className="h-5 w-5" />
              Novo Plano de Aula
            </button>
          </div>
        </div>
        
        {/* Estado de erro modernizado */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-2xl p-6 shadow-lg">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-orange-500"></div>
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-red-100 rounded-xl">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-800 mb-1">Erro ao carregar dados</h3>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Estado de loading removido conforme solicitado */}

        {/* Estado vazio modernizado */}
        {!loadingPlanos && !loadingProfessor && !error && planosAula.length === 0 && professor && dadosCarregados && (
          <div className="flex items-center justify-center min-h-[80vh]">
            <div className="max-w-3xl mx-auto w-full">
              <div className="relative bg-white/60 backdrop-blur-sm rounded-3xl p-12 shadow-lg border border-white/50 text-center overflow-hidden">
                {/* Gradiente decorativo */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                
                <div className="relative z-10">
                  {/* Ícone principal maior */}
                  <div className="mx-auto w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-8 shadow-xl">
                    <FileText className="h-12 w-12 text-white" strokeWidth={1.5} />
                  </div>

                  {/* Título e descrição maiores */}
                  <div className="space-y-4 mb-8">
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-800 via-indigo-700 to-purple-700 bg-clip-text text-transparent">
                      Nenhum plano de aula criado ainda
                    </h2>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                      Organize suas aulas de forma eficiente e estruturada. Crie seu primeiro plano e transforme sua metodologia pedagógica.
                    </p>
                  </div>

                  {/* Botão principal maior */}
                  <button
                    onClick={() => navigate('/planos-aula/criar')}
                    className="group relative inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-semibold rounded-2xl shadow-xl hover:shadow-indigo-500/25 focus:outline-none focus:ring-4 focus:ring-indigo-300/50 transition-all duration-300 transform hover:scale-105 text-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <PlusCircle className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300" />
                      <span>Criar meu primeiro plano</span>
                    </div>
                  </button>
                  
                  <p className="text-sm text-slate-500 mt-6 flex items-center justify-center space-x-2">
                    <Sparkle className="w-4 h-4" />
                    <span>Leva menos de 5 minutos para começar</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lista de planos modernizada */}
        {!loadingPlanos && planosFiltrados.length > 0 && (
          <div>
            {/* Grid de cards modernos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {planosFiltrados.map((plano) => (
                <PlanoAulaCardModerno
                  key={plano.id}
                  plano={plano}
                  onDelete={handleDeletarPlano}
                  onFullViewClick={handleAbrirPlanoFullView}
                />
              ))}
            </div>
          </div>
        )}

        {/* Estado "nenhum resultado" modernizado */}
        {!loadingPlanos && currentSearchTerm.trim() !== '' && planosFiltrados.length === 0 && (
          <div className="max-w-xl mx-auto">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50 text-center">
              <div className="p-4 bg-slate-100 rounded-2xl mb-6 w-fit mx-auto">
                <Search className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-3">Nenhum resultado encontrado</h3>
              <p className="text-slate-600 mb-6">
                Não encontramos planos de aula que correspondam a <span className="font-semibold">"{currentSearchTerm}"</span>. 
                Tente ajustar sua busca ou explorar outros termos.
              </p>
              <button
                onClick={clearSearch}
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 font-medium"
              >
                Limpar busca
              </button>
            </div>
          </div>
        )}

      </div>
      
      {/* Modal de visualização completa - FORA do container principal para tela cheia */}
      {planoFullView && (
        <PlanoAulaFullView
          plano={planoFullView}
          onClose={() => setPlanoFullView(null)}
          onPlanoAtualizado={handlePlanoAtualizado}
          onDelete={handleDeletarPlano}
        />
      )}

      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={handleCancelDelete}
        onConfirm={confirmDeletePlano}
        title="Confirmar Exclusão"
        message="Tem certeza que deseja excluir este plano de aula? Esta ação não poderá ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
      />
    </div>
  );
};

export default PlanosAula;

// Wrapper component memoizado que gerencia o estado da search e conecta com o Layout
export const PlanosAulaWithSearch: React.FC = memo(() => {
  const [searchValue, setSearchValue] = useState('');

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  return (
    <Layout
      headerTitle="Planos de Aula"
      headerSubtitle="Organize e gerencie seus conteúdos pedagógicos"
      headerIcon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
      showSearch={true}
      searchValue={searchValue}
      onSearchChange={handleSearchChange}
      searchPlaceholder="Buscar por título, disciplina, turma..."
    >
      <PlanosAula 
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
      />
    </Layout>
  );
});

PlanosAulaWithSearch.displayName = 'PlanosAulaWithSearch'; 