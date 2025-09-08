import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEscola } from '../context/EscolaContext';
import PageContainer from '../components/layout/PageContainer';
import { AlertTriangle, ArrowRight, BookOpen, Calendar, ChevronDown, Filter, GraduationCap, Layers, Loader2, PlusCircle, School, Search, Users, X } from 'lucide-react';

// Tipos de dados (manter ou ajustar conforme necessário)
interface Turma {
  id: number;
  nome: string;
  ano: string;
  escola_id: number;
  created_at: string;
  disciplina: string;
  modalidade: string;
  modalidade_id?: number;
  periodo: string;
  professor_id?: string; // Alterado para ID do professor, se aplicável
  professor_nome?: string;
  alunos_count?: number;
}

interface Professor {
  id: string; // Usar o ID do Supabase Auth ou da tabela professores
  nome: string;
}

interface Modalidade {
  id: number;
  nome: string;
}

const PERIODOS = [
  { id: 'MANHA', nome: 'Manhã' },
  { id: 'TARDE', nome: 'Tarde' },
  { id: 'NOITE', nome: 'Noite' },
  { id: 'INTEGRAL', nome: 'Integral' },
];

// Componente principal da página de Turmas (para Gestor e Professor)
const TurmasPage: React.FC = () => {
  const { user, loading: authLoading, professorData, userProfile } = useAuth();
  const { escolaAtiva, loadingEscolas } = useEscola();
  const navigate = useNavigate();

  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [modalidades, setModalidades] = useState<Modalidade[]>([]);

  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModalidade, setSelectedModalidade] = useState<string | null>(null);
  const [selectedProfessor, setSelectedProfessor] = useState<string | null>(null);
  const [selectedPeriodo, setSelectedPeriodo] = useState<string | null>(null);
  const [cardAnimationComplete, setCardAnimationComplete] = useState(false);

  // Verifica se o usuário é gestor ou professor
  const isGestor = useMemo(() => userProfile === 'diretora', [userProfile]);
  const isProfessor = useMemo(() => userProfile === 'professor', [userProfile]);
  const hasAccess = useMemo(() => isGestor || isProfessor, [isGestor, isProfessor]);

  // Monitorar mudanças de escola para debug se necessário
  useEffect(() => {
    // Logs removidos para limpar console
  }, [hasAccess, escolaAtiva, isGestor, isProfessor]);

  // Efeito para DADOS FICTÍCIOS e simular carregamento - SERÁ COMENTADO
  /*
  useEffect(() => {
    if (!hasAccess) return;

    setLoadingData(true);
    setError(null);

    // Simula um delay de API
    const timer = setTimeout(() => {
      const mockProfessores: Professor[] = [
        { id: 'prof1', nome: 'Prof. Carlos Silva' },
        { id: 'prof2', nome: 'Prof. Ana Pereira' },
        { id: 'prof3', nome: 'Prof. Joana Santos' },
        { id: 'prof4', nome: 'Prof. Miguel Costa' },
      ];
      setProfessores(mockProfessores);

      const mockModalidades: Modalidade[] = [
        { id: 1, nome: 'Ensino Infantil' },
        { id: 2, nome: 'Ensino Fundamental I' },
        { id: 3, nome: 'Ensino Fundamental II' },
        { id: 4, nome: 'Ensino Médio' },
      ];
      setModalidades(mockModalidades);

      const mockTurmas: Turma[] = [
        {
          id: 1,
          nome: 'Maternal A - Manhã',
          ano: 'Maternal',
          escola_id: escolaAtiva?.id || 1,
          created_at: new Date().toISOString(),
          disciplina: 'Geral',
          modalidade: 'Ensino Infantil',
          modalidade_id: 1,
          periodo: 'MANHA',
          professor_id: 'prof1',
          professor_nome: 'Prof. Carlos Silva',
          alunos_count: 15,
        },
        {
          id: 2,
          nome: '1º Ano B - Tarde',
          ano: '1º Ano',
          escola_id: escolaAtiva?.id || 1,
          created_at: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 dias atrás
          disciplina: 'Português',
          modalidade: 'Ensino Fundamental I',
          modalidade_id: 2,
          periodo: 'TARDE',
          professor_id: 'prof2',
          professor_nome: 'Prof. Ana Pereira',
          alunos_count: 22,
        },
        {
          id: 3,
          nome: '6º Ano C - Manhã',
          ano: '6º Ano',
          escola_id: escolaAtiva?.id || 1,
          created_at: new Date(Date.now() - 86400000 * 10).toISOString(), // 10 dias atrás
          disciplina: 'Matemática',
          modalidade: 'Ensino Fundamental II',
          modalidade_id: 3,
          periodo: 'MANHA',
          professor_id: 'prof3',
          professor_nome: 'Prof. Joana Santos',
          alunos_count: 28,
        },
        {
          id: 4,
          nome: '2º Ano Médio A - Integral',
          ano: '2º Ano Médio',
          escola_id: escolaAtiva?.id || 1,
          created_at: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 dias atrás
          disciplina: 'Química',
          modalidade: 'Ensino Médio',
          modalidade_id: 4,
          periodo: 'INTEGRAL',
          professor_id: 'prof4',
          professor_nome: 'Prof. Miguel Costa',
          alunos_count: 30,
        },
         {
          id: 5,
          nome: 'Jardim II B - Tarde',
          ano: 'Jardim II',
          escola_id: escolaAtiva?.id || 1,
          created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
          disciplina: 'Geral',
          modalidade: 'Ensino Infantil',
          modalidade_id: 1,
          periodo: 'TARDE',
          professor_id: 'prof1',
          professor_nome: 'Prof. Carlos Silva',
          alunos_count: 18,
        },
        {
          id: 6,
          nome: '3º Ano A - Manhã',
          ano: '3º Ano',
          escola_id: escolaAtiva?.id || 1,
          created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
          disciplina: 'História',
          modalidade: 'Ensino Fundamental I',
          modalidade_id: 2,
          periodo: 'MANHA',
          professor_id: 'prof2',
          professor_nome: 'Prof. Ana Pereira',
          alunos_count: 25,
        },
  ];
      setTurmas(mockTurmas);
      setLoadingData(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, [hasAccess, escolaAtiva]); // Dependência em escolaAtiva para simular recarga se a escola mudar
  */

  // Efeito para buscar dados iniciais (modalidades, professores)
  useEffect(() => {
    if (!hasAccess || !escolaAtiva) return;

    const fetchData = async () => {
      // setLoadingData(true); // O loading principal será controlado pela busca de turmas
      setError(null);
      try {
        // Buscar Modalidades
        const { data: modalidadesData, error: modalidadesError } = await supabase
          .from('modalidades')
          .select('id, nome')
          .order('nome');
        if (modalidadesError) throw modalidadesError;
        setModalidades(modalidadesData || []);

        // Buscar Professores da escola ativa diretamente da tabela professores
        const { data: professoresData, error: professoresError } = await supabase
          .from('professores')
          .select('id, nome')
          .eq('escola_id', escolaAtiva.id)
          .order('nome');
        if (professoresError) throw professoresError;
        setProfessores(professoresData || []);

      } catch (err: any) {
        console.error('Erro ao buscar dados iniciais para filtros:', err);
        setError('Falha ao carregar dados para filtros. Algumas opções podem não estar disponíveis.');
        // Não definir setLoadingData(false) aqui, pois a busca de turmas ainda pode estar ocorrendo
        }
      };
    fetchData();
  }, [hasAccess, escolaAtiva]);
  

  // Efeito para buscar turmas da escola ativa
  useEffect(() => {
    if (!hasAccess || !escolaAtiva) {
      setTurmas([]);
      setLoadingData(false); // Garante que o loading pare se não houver escola ativa ou não tiver acesso
      return;
    }

    setLoadingData(true);
    setError(null);
      
    const fetchTurmas = async () => {
      try {
        let query = supabase
          .from('turmas')
          .select(`
            id,
            nome,
            ano,
            periodo,
            escola_id,
            created_at,
            modalidade_id,
            modalidades!modalidade_id(id, nome),
            professores_turmas_disciplinas(
              professor_id,
              disciplinas!inner(nome),
              professores!inner(nome)
            )
          `)
          .eq('escola_id', escolaAtiva.id);

        // Se for professor, filtrar apenas turmas onde ele leciona
        console.log('[Turmas] Debug - isProfessor:', isProfessor, 'professorData:', professorData, 'userProfile:', userProfile);
        console.log('[Turmas] Debug - user:', user);
        console.log('[Turmas] Debug - user.email:', user?.email);
        if (isProfessor && professorData?.id) {
          console.log('[Turmas] Aplicando filtro para professor ID:', professorData.id);
          console.log('[Turmas] Tipo do professor ID:', typeof professorData.id);
          // Usar uma subconsulta para filtrar turmas do professor
          const { data: turmasDoProf, error: turmasProfError } = await supabase
            .from('professores_turmas_disciplinas')
            .select('turma_id')
            .eq('professor_id', professorData.id);
          
          if (turmasProfError) throw turmasProfError;
          
          const turmaIds = turmasDoProf?.map(t => t.turma_id) || [];
          console.log('[Turmas] IDs das turmas do professor:', turmaIds);
          
          if (turmaIds.length > 0) {
            query = query.in('id', turmaIds);
          } else {
            // Se não há turmas, retornar array vazio
            setTurmas([]);
            return;
          }
        }

        const { data, error: turmasError } = await query.order('nome');

        if (turmasError) throw turmasError;
        
        // Mapear os dados para o formato esperado
        const turmasFormatadas = data?.map((turma: any) => {
          // Pegar o primeiro professor/disciplina (pode haver múltiplos)
          const primeiroProfessorDisciplina = turma.professores_turmas_disciplinas?.[0];
          
          return {
            id: turma.id,
            nome: turma.nome,
            ano: turma.ano,
            escola_id: turma.escola_id,
            created_at: turma.created_at,
            disciplina: primeiroProfessorDisciplina?.disciplinas?.nome || 'Não definida',
            modalidade: turma.modalidades?.nome || 'Não definida',
            modalidade_id: turma.modalidades?.id,
            periodo: turma.periodo || 'Não definido',
            professor_id: primeiroProfessorDisciplina?.professor_id,
            professor_nome: primeiroProfessorDisciplina?.professores?.nome || 'Não definido',
            alunos_count: 0 // Será calculado separadamente se necessário
          };
        }) || [];
        
        setTurmas(turmasFormatadas);
      } catch (err: any) {
        console.error('Erro ao buscar turmas:', err);
        setError('Falha ao carregar a lista de turmas.');
        setTurmas([]); // Limpa turmas em caso de erro
      } finally {
        setLoadingData(false);
      }
    };

      fetchTurmas();
  }, [hasAccess, escolaAtiva, isProfessor, professorData?.id]); // Dependência em escolaAtiva para recarregar se a escola mudar

  // Redirecionamento removido - agora é feito pelo TurmasRedirector

  // Animação dos cards
  useEffect(() => {
    if (!loadingData && turmas.length > 0) {
      const timer = setTimeout(() => setCardAnimationComplete(true), 300);
      return () => clearTimeout(timer);
    }
  }, [loadingData, turmas]);

  // Lógica de filtragem
  const turmasFiltradas = useMemo(() => {
    return turmas.filter(turma => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = searchTerm === '' || 
        turma.nome.toLowerCase().includes(searchLower) ||
        (turma.professor_nome && turma.professor_nome.toLowerCase().includes(searchLower)) ||
        turma.disciplina.toLowerCase().includes(searchLower);

      const matchesModalidade = !selectedModalidade || String(turma.modalidade_id) === selectedModalidade;
      const matchesProfessor = !selectedProfessor || turma.professor_id === selectedProfessor;
      const matchesPeriodo = !selectedPeriodo || turma.periodo === selectedPeriodo;
      
      return matchesSearch && matchesModalidade && matchesProfessor && matchesPeriodo;
    });
  }, [turmas, searchTerm, selectedModalidade, selectedProfessor, selectedPeriodo]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedModalidade(null);
    setSelectedProfessor(null);
    setSelectedPeriodo(null);
  };

  // Componente de Dropdown para Filtros (Reutilizável)
  const FilterDropdownComponent: React.FC<{
    title: string;
    options: { id: string | number; nome: string }[];
    selectedValue: string | null;
    onSelect: (value: string | null) => void;
    icon?: React.ReactElement;
  }> = ({ title, options, selectedValue, onSelect, icon }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedOptionNome = options.find(opt => String(opt.id) === selectedValue)?.nome || title;

    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-between w-full sm:w-auto min-w-[150px] px-4 py-2.5 text-sm font-medium rounded-lg transition-all border
            ${selectedValue 
              ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-sm' 
              : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'}
          `}
        >
          <div className="flex items-center">
            {icon && <span className="mr-2 opacity-70">{icon}</span>}
            <span className={selectedValue ? 'text-blue-700' : 'text-gray-600'}>{selectedOptionNome}</span>
          </div>
          <ChevronDown className={`ml-2 w-4 h-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
            <div className="absolute z-20 mt-1 w-full sm:w-56 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden animate-fadeInUp faster">
              <div className="max-h-60 overflow-y-auto p-2">
                <button
                  onClick={() => { onSelect(null); setIsOpen(false); }}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                >
                  Todos {title.toLowerCase()}
                </button>
                {options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => { onSelect(String(option.id)); setIsOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                      selectedValue === String(option.id)
                        ? 'bg-blue-100 text-blue-700 font-semibold'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {option.nome}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // Se não tiver acesso ou estiver carregando autenticação/escola, mostra mensagens apropriadas
  if (authLoading || loadingEscolas) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center h-[calc(100vh-200px)]">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="ml-4 text-gray-600 text-lg">Carregando dados...</p>
        </div>
      </PageContainer>
    );
  }

  if (!hasAccess) {
    return (
      <PageContainer>
        <div className="flex flex-col justify-center items-center h-[calc(100vh-200px)] text-center px-4">
          <AlertTriangle className="w-16 h-16 text-amber-500 mb-6" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">Acesso Restrito</h2>
          <p className="text-gray-600 max-w-md">
            Esta página é destinada apenas para gestores e professores. Se você acredita que deveria ter acesso, por favor, entre em contato com o suporte.
          </p>
          <button 
            onClick={() => navigate('/')} 
            className="mt-8 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <School className="w-5 h-5 mr-2" /> Voltar ao Dashboard
          </button>
        </div>
      </PageContainer>
    );
  }
  
  if (!escolaAtiva) {
    return (
      <PageContainer>
         <div className="flex flex-col justify-center items-center h-[calc(100vh-200px)] text-center px-4">
          <School className="w-16 h-16 text-gray-400 mb-6" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">Nenhuma Escola Ativa</h2>
          <p className="text-gray-600 max-w-md">
            Por favor, selecione uma escola para visualizar as turmas.
          </p>
          {/* Adicionar um botão para selecionar escola se o modal existir e for fácil de integrar */}
        </div>
      </PageContainer>
    );
  }

  // Renderização principal da página
  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden p-4">
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/60 flex-1 flex flex-col p-6">

      {/* Cabeçalho da Página */}
      <header className="mb-8 py-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                <Users className="w-8 h-8 mr-3 text-blue-600" />
                {isGestor ? 'Gestão de Turmas' : 'Minhas Turmas'}
            </h1>
              <p className="mt-1 text-gray-600">
                {isGestor 
                  ? `Visualize e gerencie todas as turmas da escola ${escolaAtiva.nome}.`
                  : `Visualize suas turmas na escola ${escolaAtiva.nome}.`
                }
            </p>
          </div>
            {isGestor && (
              <Link
                to="/turmas/criar" // Futura rota para criar turma
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-5 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center group disabled:opacity-50"
                // onClick={(e) => e.preventDefault()} // Desabilitar por enquanto
              >
                <PlusCircle className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                Nova Turma
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Barra de Filtros */} 
      <div className="mb-8 bg-white/85 backdrop-blur-sm p-5 rounded-2xl shadow-xl border border-slate-200/60 ring-1 ring-white/60">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-end">
          <div className="lg:col-span-2">
            <label htmlFor="searchTurma" className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                id="searchTurma"
                  type="text"
                placeholder="Nome da turma, professor, disciplina..."
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              {searchTerm && (
                <button 
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
              </div>
          <div>
            <label htmlFor="filterModalidade" className="block text-sm font-medium text-gray-700 mb-1">Modalidade</label>
            <FilterDropdownComponent 
                  title="Modalidade"
                  options={modalidades}
                  selectedValue={selectedModalidade}
                  onSelect={setSelectedModalidade}
              icon={<Layers className="h-4 w-4"/>}
                />
          </div>
          <div>
            <label htmlFor="filterProfessor" className="block text-sm font-medium text-gray-700 mb-1">Professor</label>
            <FilterDropdownComponent 
                  title="Professor"
                  options={professores}
                  selectedValue={selectedProfessor}
                  onSelect={setSelectedProfessor}
              icon={<GraduationCap className="h-4 w-4"/>}
                />
          </div>
          <div>
            <label htmlFor="filterPeriodo" className="block text-sm font-medium text-gray-700 mb-1">Período</label>
            <FilterDropdownComponent 
                  title="Período"
              options={PERIODOS}
                  selectedValue={selectedPeriodo}
                  onSelect={setSelectedPeriodo}
              icon={<Calendar className="h-4 w-4"/>}
                />
          </div>
        </div>
        {(searchTerm || selectedModalidade || selectedProfessor || selectedPeriodo) && (
            <div className="mt-4 flex justify-end">
                  <button 
                    onClick={clearFilters}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center font-medium transition-colors"
                  >
                    <Filter className="w-4 h-4 mr-1.5" />
                    Limpar todos os filtros
                  </button>
          </div>
        )}
      </div>

      {/* Conteúdo Principal: Cards de Turma ou Mensagens de Estado */}
      {loadingData ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="ml-3 text-gray-600">Carregando turmas...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-6 rounded-md shadow-md">
          <div className="flex">
            <div className="py-1"><AlertTriangle className="h-6 w-6 text-red-500 mr-3" /></div>
            <div>
              <p className="font-bold">Erro ao carregar dados</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
          </div>
        ) : turmas.length === 0 ? (
        <div className="text-center py-16 bg-white/85 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/60 ring-1 ring-white/60">
          <School className="w-20 h-20 text-gray-300 mx-auto mb-6" />
          <h3 className="text-2xl font-semibold text-gray-700 mb-3">
            {isGestor ? 'Nenhuma turma cadastrada' : 'Nenhuma turma atribuída'}
          </h3>
          <p className="text-gray-500 mb-8 max-w-md mx-auto">
            {isGestor 
              ? `Ainda não há turmas cadastradas para a escola ${escolaAtiva.nome}. Clique abaixo para adicionar a primeira turma.`
              : `Você ainda não possui turmas atribuídas na escola ${escolaAtiva.nome}.`
            }
          </p>
          {isGestor && (
            <Link
              to="/turmas/criar" // Futura rota para criar turma
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center group mx-auto max-w-xs justify-center"
            >
              <PlusCircle className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
              Criar Nova Turma
            </Link>
          )}
            </div>
        ) : turmasFiltradas.length === 0 ? (
        <div className="text-center py-16 bg-white/85 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/60 ring-1 ring-white/60">
          <Filter className="w-20 h-20 text-gray-300 mx-auto mb-6" />
          <h3 className="text-2xl font-semibold text-gray-700 mb-3">Nenhuma turma encontrada</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Nenhuma turma corresponde aos filtros selecionados. Tente ajustar sua busca ou limpar os filtros.
          </p>
              <button
                onClick={clearFilters}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center group mx-auto max-w-xs justify-center"
              >
            <X className="w-5 h-5 mr-2" />
            Limpar Filtros
              </button>
            </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {turmasFiltradas.map((turma, index) => (
              <Link
              to={`/turmas/${turma.id}`} 
                key={turma.id}
              className={`block bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl hover:border-blue-300 transition-all duration-300 transform hover:-translate-y-1 group
                         ${cardAnimationComplete ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}
              style={{ transitionDelay: cardAnimationComplete ? `${index * 0.07}s` : '0s' }}
            >
              {/* Faixa colorida superior */}
              <div 
                className="h-2.5 rounded-t-xl"
                style={{ 
                  background: turma.modalidade.toLowerCase().includes('infantil') 
                    ? '#7c3aed' // Roxo
                    : turma.modalidade.toLowerCase().includes('fundamental i') 
                      ? '#3b82f6' // Azul
                      : turma.modalidade.toLowerCase().includes('fundamental ii')
                        ? '#10b981' // Verde Esmeralda
                        : '#f97316' // Laranja
                }}
              ></div>
              
              <div className="p-5">
                <div className="flex items-start mb-3">
                    <div 
                    className="w-12 h-12 flex-shrink-0 rounded-lg flex items-center justify-center text-white text-lg font-bold shadow-md mr-4"
                      style={{ 
                      background: turma.modalidade.toLowerCase().includes('infantil') 
                        ? '#7c3aed' 
                        : turma.modalidade.toLowerCase().includes('fundamental i') 
                          ? '#3b82f6' 
                          : turma.modalidade.toLowerCase().includes('fundamental ii')
                            ? '#10b981'
                            : '#f97316'
                      }}
                    >
                    {turma.nome.substring(0, 2).toUpperCase()}
                    </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-semibold text-gray-800 group-hover:text-blue-600 transition-colors" title={turma.nome}>
                        {turma.nome.split(' - ')[0]}
                      </h3>
                      <span className="text-gray-600">-</span>
                      <span className="text-gray-600">{turma.periodo}</span>
                    </div>
                    <div className="text-sm text-gray-500 flex items-center mt-2.5">
                      <BookOpen className="w-4 h-4 mr-2 text-gray-400 opacity-80" />
                      <span className="mr-4">{turma.disciplina}</span>
                      <Calendar className="w-4 h-4 mr-2 text-gray-400 opacity-80" />
                      <span>{turma.ano}</span>
                    </div>
                  </div>
                        </div>
                        
                <div className="space-y-2.5 text-sm mb-4">
                  <div className="flex items-center text-gray-600">
                    <Layers className="w-4 h-4 mr-2 text-blue-500 opacity-80" /> 
                    Modalidade: <span className="font-medium ml-1">{turma.modalidade}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2 text-amber-500 opacity-80" />
                    Período: <span className="font-medium ml-1">{turma.periodo}</span>
                      </div>
                  {turma.professor_nome && (
                    <div className="flex items-center text-gray-600">
                      <GraduationCap className="w-4 h-4 mr-2 text-purple-500 opacity-80" />
                      Professor: <span className="font-medium ml-1">{turma.professor_nome}</span>
                    </div>
                  )}
                  <div className="flex items-center text-gray-600">
                    <Users className="w-4 h-4 mr-2 text-green-500 opacity-80" />
                    Alunos: <span className="font-medium ml-1">{turma.alunos_count || 0}</span>
                    </div>
                  </div>
                  
                <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                  <p className="text-xs text-gray-500">
                    Criada em: {new Date(turma.created_at).toLocaleDateString('pt-BR')}
                  </p>
                  <span className="inline-flex items-center text-sm font-medium text-blue-600 group-hover:text-blue-700">
                    Ver Detalhes
                    <ArrowRight className="w-4 h-4 ml-1.5 transform transition-transform group-hover:translate-x-1 duration-200" />
                      </span>
                    </div>
                  </div>
              </Link>
            ))}
          </div>
        )}
        </div>
      </div>
    </>
  );
};
export default TurmasPage;