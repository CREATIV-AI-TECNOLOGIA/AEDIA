import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { 
  Calendar, 
  CheckCircle, 
  Filter, 
  ChevronDown, 
  PlusCircle, 
  BookOpen, 
  Users, 
  X,
  Award,
  FileText,
  Star,
  Eye,
  Edit,
  MoreVertical,
  Trash2,
  Camera,
  ClipboardCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEscola } from '../context/EscolaContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import Card from '../components/layout/Card';
import Layout from '../components/layout/Layout';
import { PlusIcon } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import StatusSelect from '../components/ui/StatusSelect';

interface Avaliacao {
  id: string;
  titulo: string;
  descricao: string;
  data_aplicacao: string;
  status: 'pendente' | 'aplicada' | 'corrigida' | 'publicada';
  tipo: 'prova' | 'trabalho' | 'projeto' | 'atividade' | 'apresentacao';
  disciplina: string;
  turma: string;
  nota_maxima: number;
  peso: number;
  codigo_identificacao?: string; // Código único para identificação automática
  plano_aula?: string;
  conteudo_html?: string;
  disciplinas?: { nome: string };
  turmas?: { nome: string; ano: string };
  created_at?: string;
}

interface AvaliacoesProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

// Função para detectar se é dispositivo móvel
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         (window.innerWidth <= 768);
};

// Componente memoizado para o card de avaliação
const AvaliacaoCard = memo(({ 
  avaliacao, 
  onVisualizar, 
  onExcluir,
  getTipoIcon,
  getTipoLabel,
  getStatusLabel,
  getStatusBadgeClass
}: {
  avaliacao: Avaliacao;
  onVisualizar: (id: string) => void;
  onExcluir: (id: string) => void;
  getTipoIcon: (tipo: string) => JSX.Element;
  getTipoLabel: (tipo: string) => string;
  getStatusLabel: (status: string) => string;
  getStatusBadgeClass: (status: string) => string;
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const handleVisualizar = useCallback(() => onVisualizar(avaliacao.id), [onVisualizar, avaliacao.id]);
  const handleExcluir = useCallback(() => {
    onExcluir(avaliacao.id);
    setShowMenu(false);
  }, [onExcluir, avaliacao.id]);

  return (
    <Card className="flex flex-col justify-between hover:shadow-xl transition-shadow duration-300">
      <div>
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-2">
            {getTipoIcon(avaliacao.tipo)}
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {getTipoLabel(avaliacao.tipo)}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span 
              title={`Status: ${getStatusLabel(avaliacao.status)}`}
              className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusBadgeClass(avaliacao.status)}`}
            >
              {getStatusLabel(avaliacao.status)}
            </span>
            
            {/* Menu de Ações */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                  <div className="py-1">
                    <button
                      onClick={handleVisualizar}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalhes
                    </button>

                    <button
                      onClick={handleExcluir}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors duration-200 mb-2">
          {avaliacao.titulo}
        </h3>
        
        <p className="text-sm text-gray-600 mb-4 line-clamp-3">{avaliacao.descricao}</p>
        
        <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
          <div className="flex items-center">
            <BookOpen className="w-4 h-4 mr-2 text-gray-400" />
            <span>{avaliacao.disciplinas?.nome || 'Disciplina não informada'}</span>
          </div>
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-2 text-gray-400" />
            <span>{avaliacao.turmas?.nome ? `${avaliacao.turmas.nome} - ${avaliacao.turmas.ano || ''}` : 'Turma não informada'}</span>
          </div>
          <div className="flex items-center">
            <Star className="w-4 h-4 mr-2 text-gray-400" />
            <span>Nota: {avaliacao.nota_maxima}</span>
          </div>
          <div className="flex items-center">
            <Award className="w-4 h-4 mr-2 text-gray-400" />
            <span>Peso: {avaliacao.peso}</span>
          </div>
        </div>
        
        {/* Código de Identificação */}
        {avaliacao.codigo_identificacao && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-xs text-gray-500">
                <ClipboardCheck className="w-3 h-3 mr-1" />
                <span>Código ID:</span>
              </div>
              <span className="text-xs font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                {avaliacao.codigo_identificacao}
              </span>
            </div>
          </div>
        )}
      </div>
      
      <div className="border-t border-gray-100 mt-4 pt-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="w-4 h-4 mr-1" />
            <span>{format(new Date(avaliacao.data_aplicacao), 'dd/MM/yyyy', { locale: ptBR })}</span>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={handleVisualizar}
              className="px-3 py-1 text-xs font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100 transition-colors duration-200 flex items-center space-x-1"
            >
              <Eye className="w-3 h-3" />
              <span>Ver Detalhes</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Overlay para fechar o menu quando clicar fora */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowMenu(false)}
          aria-hidden="true"
        />
      )}
    </Card>
  );
});

AvaliacaoCard.displayName = 'AvaliacaoCard';

const Avaliacoes: React.FC<AvaliacoesProps> = ({ 
  searchValue: externalSearchValue
}) => {
  const navigate = useNavigate();
  const { user, professorData } = useAuth();
  const { escolaAtiva } = useEscola();
  
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm] = useState('');
  const [showFiltros, setShowFiltros] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroPeriodo, setFiltroPeriodo] = useState('todos');
  const [isMobile, setIsMobile] = useState(isMobileDevice());

  // Gerenciar search value (externo ou interno)
  const currentSearchTerm = externalSearchValue !== undefined ? externalSearchValue : searchTerm;
  
  // Debounce da busca para melhor performance
  const debouncedSearchTerm = useDebounce(currentSearchTerm, 300);
  
  // Memoizar as funções de carregamento para evitar re-renders desnecessários
  const carregarAvaliacoes = useCallback(async () => {
    if (!user || !escolaAtiva || !professorData) return;
    
    try {
      setLoading(true);

      // Buscar avaliações do professor atual
      const { data, error } = await supabase
        .from('avaliacoes')
        .select(`
          *,
          disciplinas(nome),
          turmas(nome, ano)
        `)
        .eq('professor_id', professorData?.id)
        .eq('escola_id', escolaAtiva?.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar avaliações:', error);
        throw error;
      }

      console.log('Avaliações carregadas:', data);
      setAvaliacoes(data || []);
      
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
      toast.error('Erro ao carregar avaliações');
    } finally {
      setLoading(false);
    }
  }, [user, escolaAtiva, professorData]);

  // Carregar avaliações apenas quando necessário
  useEffect(() => {
    carregarAvaliacoes();
  }, [carregarAvaliacoes]);

  // Monitorar mudanças no tamanho da tela para detectar mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(isMobileDevice());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);



  // Memoizar a função de filtro para melhor performance
  const getAvaliacoesFiltradas = useMemo(() => {
    let avaliacoesFiltradas = [...avaliacoes];
    
    if (filtroStatus !== 'todos') {
      avaliacoesFiltradas = avaliacoesFiltradas.filter(avaliacao => avaliacao.status === filtroStatus);
    }
    
    if (filtroTipo !== 'todos') {
      avaliacoesFiltradas = avaliacoesFiltradas.filter(avaliacao => avaliacao.tipo === filtroTipo);
    }
    
    if (filtroPeriodo !== 'todos') {
      const hoje = new Date();
      const dataHoje = format(hoje, 'yyyy-MM-dd');
      switch (filtroPeriodo) {
        case 'hoje':
          avaliacoesFiltradas = avaliacoesFiltradas.filter(avaliacao => avaliacao.data_aplicacao === dataHoje);
          break;
        case 'semana':
          const umaSemana = new Date(hoje);
          umaSemana.setDate(hoje.getDate() + 7);
          avaliacoesFiltradas = avaliacoesFiltradas.filter(avaliacao => new Date(avaliacao.data_aplicacao) >= hoje && new Date(avaliacao.data_aplicacao) <= umaSemana);
          break;
        case 'mes':
          const umMes = new Date(hoje);
          umMes.setMonth(hoje.getMonth() + 1);
          avaliacoesFiltradas = avaliacoesFiltradas.filter(avaliacao => new Date(avaliacao.data_aplicacao) >= hoje && new Date(avaliacao.data_aplicacao) <= umMes);
          break;
      }
    }
    
    if (debouncedSearchTerm) {
      const termoBusca = debouncedSearchTerm.toLowerCase();
      avaliacoesFiltradas = avaliacoesFiltradas.filter(avaliacao =>
        (avaliacao.titulo?.toLowerCase() || '').includes(termoBusca) ||
        (avaliacao.descricao?.toLowerCase() || '').includes(termoBusca) ||
        (avaliacao.disciplinas?.nome?.toLowerCase() || '').includes(termoBusca) ||
        (avaliacao.turmas?.nome?.toLowerCase() || '').includes(termoBusca) ||
        (avaliacao.turmas?.ano?.toLowerCase() || '').includes(termoBusca) ||
        (avaliacao.tipo?.toLowerCase() || '').includes(termoBusca)
      );
    }
    
    return avaliacoesFiltradas;
  }, [avaliacoes, filtroStatus, filtroTipo, filtroPeriodo, debouncedSearchTerm]);

  // Memoizar funções auxiliares
  const getStatusLabel = useCallback((status: string) => {
    const labels = {
      pendente: 'Pendente',
      aplicada: 'Aplicada',
      corrigida: 'Corrigida',
      publicada: 'Publicada'
    };
    return labels[status as keyof typeof labels] || status;
  }, []);

  const getStatusBadgeClass = useCallback((status: string) => {
    const classes = {
      pendente: 'border-yellow-300 bg-yellow-50 text-yellow-700',
      aplicada: 'border-blue-300 bg-blue-50 text-blue-700',
      corrigida: 'border-purple-300 bg-purple-50 text-purple-700',
      publicada: 'border-green-300 bg-green-50 text-green-700'
    };
    return classes[status as keyof typeof classes] || 'border-gray-300 bg-gray-50 text-gray-700';
  }, []);

  const getTipoLabel = useCallback((tipo: string) => {
    const labels = {
      prova: 'Prova',
      trabalho: 'Trabalho',
      projeto: 'Projeto',
      atividade: 'Atividade',
      apresentacao: 'Apresentação'
    };
    return labels[tipo as keyof typeof labels] || tipo;
  }, []);

  const getTipoIcon = useCallback((tipo: string) => {
    const icons = {
      prova: <FileText className="w-4 h-4 text-red-500" />,
      trabalho: <BookOpen className="w-4 h-4 text-blue-500" />,
      projeto: <Star className="w-4 h-4 text-purple-500" />,
      atividade: <CheckCircle className="w-4 h-4 text-green-500" />,
      apresentacao: <Users className="w-4 h-4 text-orange-500" />
    };
    return icons[tipo as keyof typeof icons] || <FileText className="w-4 h-4 text-gray-500" />;
  }, []);

  const visualizarAvaliacao = useCallback((avaliacaoId: string) => {
    navigate(`/avaliacoes/${avaliacaoId}`);
  }, [navigate]);



  const excluirAvaliacao = useCallback(async (avaliacaoId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta avaliação? Esta ação não poderá ser desfeita.')) {
      return;
    }
    
    const toastId = toast.loading('Excluindo avaliação...');
    try {
      const { error: deleteError } = await supabase
        .from('avaliacoes')
        .delete()
        .eq('id', avaliacaoId);

      if (deleteError) {
        throw deleteError;
      }
      
      toast.success('Avaliação excluída com sucesso!', { id: toastId });
      setAvaliacoes(prevAvaliacoes => prevAvaliacoes.filter(a => a.id !== avaliacaoId));
    } catch (error) {
      console.error('Erro ao excluir avaliação:', error);
      toast.error('Erro ao excluir avaliação.', { id: toastId });
    }
  }, []);

  // Memoizar handlers de filtro
  const handleFiltroStatusChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFiltroStatus(e.target.value);
  }, []);

  const handleFiltroTipoChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFiltroTipo(e.target.value);
  }, []);

  const handleFiltroPeriodoChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFiltroPeriodo(e.target.value);
  }, []);

  const limparFiltros = useCallback(() => {
    setFiltroStatus('todos');
    setFiltroTipo('todos');
    setFiltroPeriodo('todos');
  }, []);

  const toggleFiltros = useCallback(() => {
    setShowFiltros(prev => !prev);
  }, []);

  const navegarParaNovaAvaliacao = useCallback(() => {
    navigate('/planos-aula');
  }, [navigate]);

  // Memoizar o estado dos filtros ativos
  const filtrosAtivos = useMemo(() => {
    return filtroStatus !== 'todos' || filtroTipo !== 'todos' || filtroPeriodo !== 'todos';
  }, [filtroStatus, filtroTipo, filtroPeriodo]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleFiltros}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
            <ChevronDown className={`ml-2 h-4 w-4 transition-transform ${showFiltros ? 'rotate-180' : ''}`} />
          </button>
          
          {showFiltros && (
            <div className="flex items-center gap-3">
              <StatusSelect
                value={filtroStatus}
                onChange={handleFiltroStatusChange}
                options={
                  [
                    { value: 'todos', label: 'Todos os status' },
                    { value: 'pendente', label: 'Pendente' },
                    { value: 'aplicada', label: 'Aplicada' },
                    { value: 'corrigida', label: 'Corrigida' },
                    { value: 'publicada', label: 'Publicada' },
                    { value: 'pendente_correcao', label: 'Aguardando Correção' }
                  ]
                }
              />

              <StatusSelect
                value={filtroTipo}
                onChange={handleFiltroTipoChange}
                options={
                  [
                    { value: 'todos', label: 'Todos os tipos' },
                    { value: 'prova', label: 'Prova' },
                    { value: 'trabalho', label: 'Trabalho' },
                    { value: 'projeto', label: 'Projeto' },
                    { value: 'atividade', label: 'Atividade' },
                    { value: 'apresentacao', label: 'Apresentação' }
                  ]
                }
              />

              <StatusSelect
                value={filtroPeriodo}
                onChange={handleFiltroPeriodoChange}
                options={
                  [
                    { value: 'todos', label: 'Todos os períodos' },
                    { value: 'hoje', label: 'Hoje' },
                    { value: 'semana', label: 'Próximos 7 dias' },
                    { value: 'mes', label: 'Próximos 30 dias' }
                  ]
                }
              />

              {filtrosAtivos && (
                <button 
                  onClick={limparFiltros}
                  className="text-sm px-3 py-1.5 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            {loading ? 'Carregando...' : `${getAvaliacoesFiltradas.length} ${getAvaliacoesFiltradas.length === 1 ? 'avaliação encontrada' : 'avaliações encontradas'}`}
          </span>
          <div className="flex gap-2">
            {isMobile && (
              <button
                onClick={() => navigate('/correcao-mobile/escanear')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Camera className="h-5 w-5" />
                Scanner
              </button>
            )}
            <button
              onClick={() => navigate('/correcoes-avaliacoes')}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <ClipboardCheck className="h-5 w-5" />
              Correções
            </button>
            <button
              onClick={navegarParaNovaAvaliacao}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              Nova Avaliação
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="mx-auto w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Carregando avaliações...</p>
        </div>
      ) : getAvaliacoesFiltradas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {getAvaliacoesFiltradas.map(avaliacao => (
            <AvaliacaoCard
              key={avaliacao.id}
              avaliacao={avaliacao}
              onVisualizar={visualizarAvaliacao}
              onExcluir={excluirAvaliacao}
              getTipoIcon={getTipoIcon}
              getTipoLabel={getTipoLabel}
              getStatusLabel={getStatusLabel}
              getStatusBadgeClass={getStatusBadgeClass}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <Award className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma avaliação encontrada</h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            {currentSearchTerm || filtrosAtivos
              ? 'Tente ajustar seus filtros ou termos de busca para encontrar avaliações'
              : 'Comece criando sua primeira avaliação para acompanhar o desempenho dos alunos'}
          </p>
          
          {!isMobile && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 max-w-md mx-auto">
              <div className="flex items-center gap-2 text-blue-700 mb-2">
                <Camera className="w-5 h-5" />
                <span className="font-medium">Scanner de Provas</span>
              </div>
              <p className="text-blue-600 text-sm">
                Para escanear provas, acesse este sistema pelo seu celular ou tablet
              </p>
            </div>
          )}
          
          <Link
            to="/planos-aula"
            className="inline-flex items-center px-6 py-3 border border-transparent shadow-md text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-150 ease-in-out"
          >
            <PlusCircle className="-ml-1 mr-2 h-5 w-5" />
            Criar Primeira Avaliação
          </Link>
        </div>
      )}
    </div>
  );
};

// Wrapper component otimizado que gerencia o estado da search e conecta com o Layout
export const AvaliacoesWithSearch: React.FC = memo(() => {
  const [searchValue, setSearchValue] = useState('');

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  return (
    <Layout
      headerTitle="Avaliações"
      headerSubtitle="Gerencie provas, trabalhos e atividades avaliativas"
      headerIcon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>}
      mostrarEscola={true}
      showSearch={true}
      searchValue={searchValue}
      onSearchChange={handleSearchChange}
      searchPlaceholder="Buscar por título, disciplina, turma, tipo..."
    >
      <Avaliacoes 
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
      />
    </Layout>
  );
});

AvaliacoesWithSearch.displayName = 'AvaliacoesWithSearch';

export default Avaliacoes;