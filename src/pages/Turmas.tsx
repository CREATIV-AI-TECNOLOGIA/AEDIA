import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEscola } from '../context/EscolaContext';
import PageContainer from '../components/layout/PageContainer';
import { AlertTriangle, ArrowRight, BookOpen, Calendar, ChevronDown, Filter, GraduationCap, Layers, Loader2, PlusCircle, School, Search, Users, X } from 'lucide-react';

// Interfaces
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
  professor_id?: string;
  professor_nome?: string;
  alunos_count?: number;
}

interface Professor {
  id: string;
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

const TurmasPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, userProfile, authLoading, professorData } = useAuth();
  const { escolaAtiva, loadingEscolas } = useEscola();

  // Estados
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [modalidades, setModalidades] = useState<Modalidade[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModalidade, setSelectedModalidade] = useState<string | null>(null);
  const [selectedProfessor, setSelectedProfessor] = useState<string | null>(null);
  const [selectedPeriodo, setSelectedPeriodo] = useState<string | null>(null);

  // Fade-in suave para evitar piscada na abertura da página
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Verifica se o usuário é gestor ou professor
  const isGestor = useMemo(() => userProfile === 'diretora', [userProfile]);
  const isProfessor = useMemo(() => userProfile === 'professor', [userProfile]);
  const hasAccess = useMemo(() => isGestor || isProfessor, [isGestor, isProfessor]);

  // Monitorar mudanças de escola para debug se necessário
  useEffect(() => {
    // Logs removidos para limpar console
  }, [hasAccess, escolaAtiva, isGestor, isProfessor]);

  // Efeito para DADOS FICTÍCIOS e simular carregamento
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
          nome: 'Turma 102',
          ano: '1º Ano',
          escola_id: 1,
          created_at: '2024-01-15',
          disciplina: 'Língua Portuguesa',
          modalidade: 'Ensino Fundamental I',
          modalidade_id: 2,
          periodo: 'Tarde',
          professor_id: 'prof1',
          professor_nome: 'Prof. Carlos Silva',
          alunos_count: 25
        },
        {
          id: 2,
          nome: 'Turma 203',
          ano: '2º Ano',
          escola_id: 1,
          created_at: '2024-01-15',
          disciplina: 'Matemática',
          modalidade: 'Ensino Fundamental I',
          modalidade_id: 2,
          periodo: 'Manhã',
          professor_id: 'prof2',
          professor_nome: 'Prof. Ana Pereira',
          alunos_count: 28
        },
        {
          id: 3,
          nome: 'Turma 304',
          ano: '3º Ano',
          escola_id: 1,
          created_at: '2024-01-15',
          disciplina: 'Ciências',
          modalidade: 'Ensino Fundamental I',
          modalidade_id: 2,
          periodo: 'Tarde',
          professor_id: 'prof3',
          professor_nome: 'Prof. Joana Santos',
          alunos_count: 22
        },
        {
          id: 4,
          nome: 'Turma 405',
          ano: '4º Ano',
          escola_id: 1,
          created_at: '2024-01-15',
          disciplina: 'História',
          modalidade: 'Ensino Fundamental II',
          modalidade_id: 3,
          periodo: 'Manhã',
          professor_id: 'prof4',
          professor_nome: 'Prof. Miguel Costa',
          alunos_count: 30
        }
      ];
      setTurmas(mockTurmas);
      setLoadingData(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, [hasAccess, escolaAtiva]);

  // Filtrar turmas baseado nos critérios selecionados
  const turmasFiltradas = useMemo(() => {
    return turmas.filter(turma => {
      const matchesSearch = !searchTerm || 
        turma.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        turma.professor_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        turma.disciplina.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesModalidade = !selectedModalidade || String(turma.modalidade_id) === selectedModalidade;
      const matchesProfessor = !selectedProfessor || turma.professor_id === selectedProfessor;
      const matchesPeriodo = !selectedPeriodo || turma.periodo.toUpperCase() === selectedPeriodo;
      
      return matchesSearch && matchesModalidade && matchesProfessor && matchesPeriodo;
    });
  }, [turmas, searchTerm, selectedModalidade, selectedProfessor, selectedPeriodo]);

  // Função para limpar todos os filtros
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedModalidade(null);
    setSelectedProfessor(null);
    setSelectedPeriodo(null);
  };

  // Componente de dropdown para filtros
  const FilterDropdownComponent: React.FC<{
    title: string;
    options: { id: string | number; nome: string }[];
    selectedValue: string | null;
    onSelect: (value: string | null) => void;
    icon: React.ReactNode;
  }> = ({ title, options, selectedValue, onSelect, icon }) => {
    const [isOpen, setIsOpen] = useState(false);

    const selectedOption = options.find(option => String(option.id) === selectedValue);

    return (
      <div className="relative">
        <button
          type="button"
          className="w-full flex items-center justify-between px-3 py-2.5 text-left bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center space-x-2">
            {icon}
            <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
              {selectedOption ? selectedOption.nome : `Selecionar ${title}`}
            </span>
          </div>
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
              <div className="py-1">
                <button
                  onClick={() => {
                    onSelect(null);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                    !selectedValue
                      ? 'bg-blue-100 text-blue-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Todos
                </button>
                {options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      onSelect(String(option.id));
                      setIsOpen(false);
                    }}
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

  // Loading states
  if (authLoading || loadingEscolas) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex items-center space-x-4">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-slate-600 text-lg">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md mx-auto text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">
            Você não tem permissão para acessar esta página. 
            Entre em contato com o administrador se acredita que isso é um erro.
          </p>
        </div>
      </div>
    );
  }

  if (!escolaAtiva) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="max-w-md mx-auto text-center">
          <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
            <School className="h-8 w-8 text-yellow-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Nenhuma Escola Selecionada</h2>
          <p className="text-gray-600">
            Selecione uma escola para visualizar as turmas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className={`relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
        {/* Header */}
        <header className="mb-8 py-4">
          <div className="w-full px-0">
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
                  to="/turmas/criar"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-5 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center group disabled:opacity-50"
                >
                  <PlusCircle className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                  Nova Turma
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Filtros */}
        <div className="mb-8 bg-white/85 backdrop-blur-sm px-10 py-6 rounded-2xl shadow-xl border border-slate-200/60 ring-1 ring-white/60">
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

        {/* Lista de Turmas */}
        {!loadingData && turmasFiltradas.length > 0 && (
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-slate-200/70 ring-1 ring-white/50 hover:shadow-xl transition-all duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {turmasFiltradas.map((turma) => (
                <div
                  key={turma.id}
                  className="group relative bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-slate-200/60 ring-1 ring-white/60 hover:ring-blue-200/60 hover:border-blue-300/60 cursor-pointer"
                  onClick={() => navigate(`/turmas/${turma.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">
                          {turma.nome}
                        </h3>
                        <p className="text-sm text-slate-500">{turma.ano}</p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-slate-600">
                      <Layers className="h-4 w-4 mr-2 text-slate-400" />
                      <span>{turma.modalidade}</span>
                    </div>
                    <div className="flex items-center text-sm text-slate-600">
                      <Calendar className="h-4 w-4 mr-2 text-slate-400" />
                      <span>{turma.periodo}</span>
                    </div>
                    {turma.professor_nome && (
                      <div className="flex items-center text-sm text-slate-600">
                        <GraduationCap className="h-4 w-4 mr-2 text-slate-400" />
                        <span>{turma.professor_nome}</span>
                      </div>
                    )}
                    {turma.alunos_count !== undefined && (
                      <div className="flex items-center text-sm text-slate-600">
                        <Users className="h-4 w-4 mr-2 text-slate-400" />
                        <span>{turma.alunos_count} alunos</span>
                      </div>
                    )}
                  </div>

                  {turma.disciplina && (
                    <div className="mt-4 pt-3 border-t border-slate-200/60">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <BookOpen className="h-3 w-3 mr-1" />
                        {turma.disciplina}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Estado Vazio */}
        {!loadingData && !error && turmasFiltradas.length === 0 && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="max-w-2xl mx-auto w-full">
              <div className="relative bg-white/85 backdrop-blur-sm rounded-3xl p-12 shadow-xl border border-slate-200/60 text-center overflow-hidden ring-1 ring-white/60">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
                
                <div className="relative z-10">
                  <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                    <Users className="h-10 w-10 text-white" strokeWidth={1.5} />
                  </div>

                  <div className="space-y-3 mb-6">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 via-blue-700 to-indigo-700 bg-clip-text text-transparent">
                      {searchTerm || selectedModalidade || selectedProfessor || selectedPeriodo 
                        ? 'Nenhuma turma encontrada' 
                        : 'Nenhuma turma cadastrada ainda'
                      }
                    </h2>
                    <p className="text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
                      {searchTerm || selectedModalidade || selectedProfessor || selectedPeriodo
                        ? 'Tente ajustar os filtros para encontrar as turmas desejadas.'
                        : isGestor 
                          ? 'Comece criando sua primeira turma para organizar os alunos e disciplinas.'
                          : 'Aguarde enquanto o gestor configura as turmas da escola.'
                      }
                    </p>
                  </div>

                  {isGestor && !(searchTerm || selectedModalidade || selectedProfessor || selectedPeriodo) && (
                    <Link
                      to="/turmas/criar"
                      className="group relative inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-blue-500/25 focus:outline-none focus:ring-4 focus:ring-blue-300/50 transition-all duration-300 transform hover:scale-105"
                    >
                      <div className="flex items-center space-x-2">
                        <PlusCircle className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                        <span>Criar primeira turma</span>
                      </div>
                    </Link>
                  )}
                  
                  {(searchTerm || selectedModalidade || selectedProfessor || selectedPeriodo) && (
                    <button
                      onClick={clearFilters}
                      className="px-6 py-3 bg-gradient-to-r from-slate-500 to-slate-600 text-white rounded-xl hover:from-slate-600 hover:to-slate-700 transition-all duration-300 font-medium"
                    >
                      Limpar filtros
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loadingData && (
          <div className="flex justify-center items-center h-64">
            <div className="flex items-center space-x-4">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-slate-600 text-lg">Carregando turmas...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative bg-red-50/90 backdrop-blur-sm border border-red-200/70 rounded-2xl p-6 shadow-lg ring-1 ring-red-100/50">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-orange-500"></div>
              <div className="flex items-start space-x-4">
                <div className="p-2 bg-red-100 rounded-xl">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-800 mb-1">Erro ao carregar turmas</h3>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TurmasPage;