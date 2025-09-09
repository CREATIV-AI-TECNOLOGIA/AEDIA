import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { supabase } from '../lib/supabase';
import { useEscola } from '../context/EscolaContext';
import { useAuth } from '../context/AuthContext';

interface Turma {
  id: number;
  nome: string;
  ano: string;
  escola_id: number;
  created_at: string;
  periodo: string;
  modalidade: string;
  disciplina: string;
  turma_id?: number;
  turma_nome?: string;
  turma_ano?: string;
  turma_periodo?: string;
  modalidade_nome?: string;
  disciplina_nome?: string;
}

interface Aluno {
  id: number;
  matricula: string;
  nome: string;
  idade: number | null;
  email: string | null;
  telefone: string | null;
  turma_id: number;
  created_at: string;
}



interface DetalheTurmaProps {
  onTurmaChange?: (novaTurma: Turma) => void;
}

const DetalheTurma: React.FC<DetalheTurmaProps> = ({ onTurmaChange }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { escolaAtiva, loadingEscolas } = useEscola();
  const [activeTab, setActiveTab] = useState<'alunos' | 'avisos'>('alunos');
  const [turma, setTurma] = useState<Turma | null>(null);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAlunos, setLoadingAlunos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [novoAviso, setNovoAviso] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [turmasDisponiveis, setTurmasDisponiveis] = useState<Turma[]>([]);
  const [seletorTurmaAberto, setSeletorTurmaAberto] = useState(false);
  const [dadosCarregados, setDadosCarregados] = useState(false);
  
  // Função para buscar primeira turma da escola ativa
  const buscarPrimeiraTurmaEscola = async () => {
    if (!user || !escolaAtiva) return null;

    try {
      const { data, error } = await supabase
        .from('turmas')
        .select(`
          id,
          nome,
          professores_turmas_disciplinas!inner(
            professor_id,
            professores!inner(email)
          )
        `)
        .eq('escola_id', escolaAtiva.id)
        .eq('professores_turmas_disciplinas.professores.email', user.email)
        .order('nome')
        .limit(1);

      if (error) {
        console.error('Erro ao buscar primeira turma:', error);
        return null;
      }

      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Erro ao buscar primeira turma:', error);
      return null;
    }
  };

  useEffect(() => {
    if (id && !loadingEscolas) {
      setLoading(true);
      fetchTurmaData();
      fetchTurmasDisponiveis();
    }
  }, [id, loadingEscolas, escolaAtiva]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (seletorTurmaAberto && !target.closest('.relative')) {
        setSeletorTurmaAberto(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [seletorTurmaAberto]);

  const fetchTurmasDisponiveis = async () => {
    if (!user || !escolaAtiva) return;

    try {
      const { data, error } = await supabase
        .from('turmas')
        .select(`
          id,
          nome,
          ano,
          periodo,
          modalidade_id,
          modalidades!modalidade_id(nome),
          professores_turmas_disciplinas!inner(
            professor_id,
            professores!inner(email),
            disciplinas!inner(nome)
          )
        `)
        .eq('escola_id', escolaAtiva.id)
        .eq('professores_turmas_disciplinas.professores.email', user.email)
        .order('nome');

      if (error) {
        console.error('Erro ao buscar turmas disponíveis:', error);
        return;
      }

      const turmasFormatadas = data?.map(turma => ({
        id: turma.id,
        nome: turma.nome,
        ano: turma.ano,
        periodo: turma.periodo || '',
        modalidade: (turma as any).modalidades?.nome || 'Não definida',
        disciplina: (turma as any).professores_turmas_disciplinas?.[0]?.disciplinas?.nome || 'Não definida',
        escola_id: escolaAtiva.id,
        created_at: ''
      })) || [];

      setTurmasDisponiveis(turmasFormatadas);
    } catch (error) {
      console.error('Erro ao buscar turmas disponíveis:', error);
    }
  };

  const fetchAlunosDaTurma = async (turmaId: number, silencioso = false) => {
    try {
      if (!silencioso) {
        setLoadingAlunos(true);
      }
      
      const { data: alunosData, error: alunosError } = await supabase
        .from('alunos')
        .select('*')
        .eq('turma_id', turmaId)
        .order('nome');

      if (alunosError) {
        console.error('[DetalheTurma] Erro ao buscar alunos:', alunosError);
        throw alunosError;
      }

      setAlunos(alunosData || []);
      setError(null);
    } catch (err: any) {
      console.error('[DetalheTurma] Erro ao buscar alunos:', err);
      setError(err.message || 'Erro ao carregar alunos da turma');
    } finally {
      if (!silencioso) {
        setLoadingAlunos(false);
      }
      setLoading(false);
    }
  };

  const fetchTurmaData = async () => {
    console.log('[DetalheTurma] ID da turma sendo buscado:', id);
    console.log('[DetalheTurma] Escola ativa atual:', escolaAtiva?.nome, 'ID:', escolaAtiva?.id);
    
    try {
      // Buscar dados da turma com joins para obter dados completos
      const { data: turmaData, error: turmaError } = await supabase
        .from('turmas')
        .select(`
          id,
          nome,
          ano,
          periodo,
          escola_id,
          created_at,
          modalidade_id,
          modalidades!modalidade_id(nome),
          professores_turmas_disciplinas(
            disciplinas!inner(nome)
          )
        `)
        .eq('id', Number(id))
        .single();

      if (turmaError) {
        console.error('[DetalheTurma] Erro na consulta Supabase:', turmaError);
        throw turmaError;
      }

      console.log('[DetalheTurma] Dados retornados pela consulta:', turmaData);

      if (!turmaData) {
        setError('Turma não encontrada.');
        setTurma(null);
        setLoading(false);
        return;
      }

      // Verificar se a turma pertence à escola ativa
      if (escolaAtiva && turmaData.escola_id !== escolaAtiva.id) {
        console.log('[DetalheTurma] Turma pertence à escola ID:', turmaData.escola_id, 'mas escola ativa é ID:', escolaAtiva.id);
        console.log('[DetalheTurma] Redirecionando para primeira turma da escola ativa...');
        
        // Buscar primeira turma da escola ativa e redirecionar
        const primeiraTurma = await buscarPrimeiraTurmaEscola();
        
        if (primeiraTurma) {
          console.log('[DetalheTurma] Redirecionando para turma:', primeiraTurma.nome, 'ID:', primeiraTurma.id);
          navigate(`/turmas/${primeiraTurma.id}`, { replace: true });
          return;
        } else {
          // Se não há turmas na escola ativa, redirecionar para lista de turmas
          console.log('[DetalheTurma] Nenhuma turma encontrada na escola ativa. Redirecionando para lista de turmas.');
          navigate('/turmas', { replace: true });
          return;
        }
      }

      // Pegar a primeira disciplina (pode haver múltiplas)
      const primeiraDisciplina = (turmaData as any).professores_turmas_disciplinas?.[0]?.disciplinas?.nome || 'Não definida';
      
      // Extrair nome da modalidade corretamente
      const modalidadeNome = (turmaData as any).modalidades?.nome || 'Não definida';

      // Formatando os dados da turma
      const turmaFormatada = {
        id: turmaData.id,
        nome: turmaData.nome,
        ano: turmaData.ano,
        periodo: turmaData.periodo || '',
        modalidade: modalidadeNome,
        disciplina: primeiraDisciplina,
        escola_id: turmaData.escola_id,
        created_at: turmaData.created_at
      };
      
      setTurma(turmaFormatada);

      // Buscar alunos da turma
      await fetchAlunosDaTurma(turmaData.id);
      setDadosCarregados(true);

    } catch (err: any) {
      console.error('[DetalheTurma] Erro geral ao carregar dados da turma:', err);
      setError(err.message || 'Erro ao carregar dados da turma');
      setLoading(false);
    }
  };

  const handleVerAluno = (aluno: Aluno) => {
    setAlunoSelecionado(aluno);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setAlunoSelecionado(null);
  };



  const processCSV = async (file: File) => {
    setIsProcessing(true);
    try {
      const text = await file.text();
      const rows = text.split('\n');
      const headers = rows[0].split(',').map(h => h.trim());
      
      // Verifica se tem as colunas necessárias
      const requiredColumns = ['nome', 'email', 'telefone', 'idade'];
      const hasRequiredColumns = requiredColumns.every(col => 
        headers.map(h => h.toLowerCase()).includes(col)
      );

      if (!hasRequiredColumns) {
        alert('A planilha deve conter as colunas: Nome, Email, Telefone, Idade');
        return;
      }

      // Processa as linhas
const alunos = rows.slice(1).map(row => {
         const values = row.split(',').map(v => v.trim());
         const aluno: any = {};
         
         headers.forEach((header, index) => {
          const value = values[index] || null;
          // Sanitize string values to prevent XSS
          aluno[header.toLowerCase()] = typeof value === 'string' 
            ? value.replace(/[<>]/g, '') 
            : value;
         });

         aluno.turma_id = id;
         aluno.idade = parseInt(aluno.idade) || null;
        
        // Validate email format if provided
        if (aluno.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(aluno.email)) {
          aluno.email = null;
        }
         
         return aluno;
       }).filter(aluno => aluno.nome); // Remove linhas vazias

      // Insere no Supabase
      const { error } = await supabase
        .from('alunos')
        .insert(alunos)
        .select();

      if (error) throw error;

      // Atualiza a lista
      fetchTurmaData();
      alert(`${alunos.length} alunos importados com sucesso!`);
    } catch (err) {
      console.error('Erro ao processar CSV:', err);
      alert('Erro ao processar o arquivo. Verifique o formato e tente novamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      processCSV(file);
    } else {
      alert('Por favor, arraste apenas arquivos .csv');
    }
  }, [id]);

  if (loading && !dadosCarregados) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-6 rounded-md shadow-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-lg font-medium text-red-800 mb-2">Erro</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!turma) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-slate-500">Carregando detalhes da turma ou turma não encontrada...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm m-6">
          {/* Cabeçalho da turma */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.1)] border border-gray-100 p-6 mb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div className="flex items-center">
              <div className="h-16 w-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg mr-4">
                {turma.nome.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-4">
                  <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
                    <span>{turma.nome}</span>
                    <span className="text-gray-500">-</span>
                    <span className="text-gray-500">{turma.periodo}</span>
                  </h1>
                  <div className="flex items-center gap-6 text-slate-600">
                    <span className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                      </svg>
                      {turma.disciplina}
                    </span>
                    <span className="flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                      {turma.ano}
                    </span>
                  </div>
                </div>

              </div>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-3">
              {/* Seletor de Turmas */}
              {turmasDisponiveis.length > 1 && (
                <div className="relative z-50">
                  <button
                    onClick={() => setSeletorTurmaAberto(!seletorTurmaAberto)}
                    className="flex items-center px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-md shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    Selecionar Turma
                    <svg className={`w-4 h-4 ml-2 transition-transform ${seletorTurmaAberto ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </button>

                  {/* Dropdown de Turmas */}
                  {seletorTurmaAberto && (
                    <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                      <div className="p-3 border-b border-gray-100">
                        <h3 className="text-sm font-medium text-gray-900">Suas Turmas</h3>
                        <p className="text-xs text-gray-500 mt-1">Selecione uma turma para visualizar</p>
                      </div>
                      <div className="py-2">
                        {turmasDisponiveis.map((turmaItem) => (
                          <button
                            key={turmaItem.id}
                            onClick={() => {
                              // Troca fluida sem navegação - SEM loading
                              setTurma(turmaItem);
                              // Atualiza a URL sem recarregar a página
                              window.history.replaceState(null, '', `/turmas/${turmaItem.id}`);
                              // Busca os alunos da nova turma com loading visual sutil
                              fetchAlunosDaTurma(turmaItem.id, false);
                              // Notifica o wrapper sobre a mudança
                              onTurmaChange?.(turmaItem);
                              setSeletorTurmaAberto(false);
                            }}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                              turmaItem.id === turma?.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                            }`}
                          >
                            <div className="flex items-center">
                              <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                                turmaItem.id === turma?.id ? 'bg-blue-500' : 'bg-gray-500'
                              }`}>
                                {turmaItem.nome.charAt(0)}
                              </div>
                              <div className="ml-3 flex-1">
                                <div className="text-sm font-medium text-gray-900">{turmaItem.nome}</div>
                                <div className="text-xs text-gray-500">
                                  {turmaItem.periodo} • {turmaItem.ano} • {turmaItem.disciplina}
                                </div>
                              </div>
                              {turmaItem.id === turma?.id && (
                                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          </button>
                        ))}
                        {turmasDisponiveis.length === 0 && (
                          <div className="px-4 py-6 text-center text-gray-500">
                            <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                            </svg>
                            <p className="text-sm">Nenhuma turma encontrada</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.1)] border border-gray-100 p-6 mb-4">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('alunos')}
              className={`py-4 px-6 font-medium text-sm border-b-2 focus:outline-none ${
                activeTab === 'alunos' 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Alunos
            </button>
            <button
              onClick={() => setActiveTab('avisos')}
              className={`py-4 px-6 font-medium text-sm border-b-2 focus:outline-none ${
                activeTab === 'avisos' 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Avisos e Comunicados
            </button>
          </nav>
        </div>
        
        {/* Conteúdo */}
        {activeTab === 'alunos' && (
          <div 
            className={`bg-white rounded-xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.1)] border border-gray-100 p-6 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] transition-shadow duration-300 ${
              isDragging ? 'border-blue-500 bg-blue-50' : ''
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <h2 className="text-lg font-medium text-slate-800">Lista de Alunos</h2>
                {loadingAlunos && (
                  <div className="ml-3 flex items-center text-sm text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                    Atualizando...
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Buscar aluno..." 
                    className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <span className="absolute left-3 top-2.5 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                  </span>
                </div>

              </div>
            </div>
            
            {/* Área de Drop */}
            {isProcessing ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Processando planilha...</p>
              </div>
            ) : loadingAlunos ? (
              <div className="space-y-3">
                {/* Skeleton loading para alunos */}
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex items-center p-4 border border-gray-200 rounded-lg">
                    <div className="h-10 w-10 bg-gray-300 rounded-full"></div>
                    <div className="ml-4 flex-1">
                      <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                    </div>
                    <div className="h-8 w-16 bg-gray-300 rounded"></div>
                  </div>
                ))}
              </div>
            ) : alunos.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <svg 
                  className="mx-auto h-12 w-12 text-gray-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="1.5" 
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum aluno cadastrado</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Arraste uma planilha CSV aqui ou clique em "Adicionar Aluno"
                </p>
                <p className="mt-2 text-xs text-gray-400">
                  A planilha deve conter as colunas: Nome, Email, Telefone, Idade
                </p>
              </div>
            ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Aluno</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Média Geral</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {alunos.map((aluno) => (
                    <tr key={aluno.id} className="hover:bg-slate-50 transition-colors duration-150">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                            <div className={`flex-shrink-0 h-10 w-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-full flex items-center justify-center text-white font-medium shadow-md`}>
                              {aluno.nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-slate-900">{aluno.nome}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-slate-600">{aluno.email}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium`}>
                            {aluno.matricula}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium`}>
                            {aluno.idade ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm space-x-2">
                          <button 
                            onClick={() => handleVerAluno(aluno)}
                            className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md font-medium transition-colors duration-150 border border-indigo-100"
                          >
                            Ver
                          </button>
                        <button className="px-3 py-1.5 bg-gray-50 text-gray-700 hover:bg-gray-100 rounded-md font-medium transition-colors duration-150 border border-gray-200">Editar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </div>
        )}
          </div>
        )}
        
        {activeTab === 'avisos' && (
          <div className="bg-white rounded-xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.1)] border border-gray-100 p-6 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] transition-shadow duration-300">
            <div className="mb-6">
              <h2 className="text-lg font-medium text-slate-800 mb-4">Novo Aviso</h2>
              <div className="flex space-x-3">
                <div className="flex-grow">
                  <Input
                    value={novoAviso}
                    onChange={(e) => setNovoAviso(e.target.value)}
                    placeholder="Digite o aviso ou comunicado..."
                    className="w-full"
                  />
                </div>
                <Button onClick={() => {}} disabled={!novoAviso.trim()} variant="primary" className="shadow-sm">
                  Publicar
                </Button>
              </div>
            </div>
            
            <h2 className="text-lg font-medium text-slate-800 mb-4">Avisos e Comunicados</h2>
            <div className="space-y-4">
              {/* Avisos serão carregados dinamicamente */}
            </div>
          </div>
        )}

        {/* Modal de Visualização do Aluno */}
        <Modal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          title="Detalhes do Aluno"
        >
          {alunoSelecionado && (
            <div>
              {/* Cabeçalho com Avatar e Nome */}
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-medium shadow-md">
                  {alunoSelecionado.nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </div>
                <div className="ml-3">
                  <h4 className="text-base font-semibold text-gray-900">{alunoSelecionado.nome}</h4>
                  <p className="text-sm text-gray-500">Matrícula: {alunoSelecionado.matricula}</p>
                </div>
              </div>

              {/* Informações do Aluno */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm">
                  <span className="w-20 text-gray-500">Email:</span>
                  <span className="text-gray-900">{alunoSelecionado.email || 'Não informado'}</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="w-20 text-gray-500">Telefone:</span>
                  <span className="text-gray-900">{alunoSelecionado.telefone || 'Não informado'}</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="w-20 text-gray-500">Idade:</span>
                  <span className="text-gray-900">{alunoSelecionado.idade || 'Não informada'}</span>
                </div>
                <div className="flex items-center text-sm">
                  <span className="w-20 text-gray-500">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    alunoSelecionado.idade 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {alunoSelecionado.idade ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>

              {/* Botões */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleCloseModal}
                  className="text-sm px-3 py-1"
                >
                  Fechar
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    // Implementar edição
                    handleCloseModal();
                  }}
                  className="text-sm px-3 py-1"
                >
                  Editar
                </Button>
              </div>
            </div>
          )}
        </Modal>
        </div>
      </div>
    </div>
  );
};

export default DetalheTurma;