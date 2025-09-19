import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useEscola } from '../context/EscolaContext';
import { ArrowLeft, Calendar, BookOpen, Users, FileText, Target, Sparkles, Search, Save } from 'lucide-react';
import { CalendarCard } from '../components/CalendarCard';
import { HabilidadeBNCC } from '../services/HabilidadesService';
import { useHabilidades, usePraticas } from '../hooks/useHabilidades';
import { getProfessorComModalidades } from '../services/ProfessorService';
import { getAnoDisciplinaParaModalidade } from '../services/ProfessorContextoService';
import { toast } from 'sonner';

const CriarPlanoAulaV2: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { escolaAtiva } = useEscola();
  const [etapaAtual, setEtapaAtual] = useState('selecao_periodo');
  const [periodoSelecionado, setPeriodoSelecionado] = useState('');
  const [dataInicio, setDataInicio] = useState(null);
  const [dataFim, setDataFim] = useState(null);
  const [dataInicioTemp, setDataInicioTemp] = useState(null);
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [mostrarSelecaoTurma, setMostrarSelecaoTurma] = useState(false);
  const [turmaSelecionada, setTurmaSelecionada] = useState(null);
  const [turmasUnicas, setTurmasUnicas] = useState([]);
  const [turmasDisponiveis, setTurmasDisponiveis] = useState([]);
  const [professor, setProfessor] = useState(null);
  const [modalidadeSelecionada, setModalidadeSelecionada] = useState(null);
  const [professorContexto, setProfessorContexto] = useState(null);
  const [trimestreAtualNome, setTrimestreAtualNome] = useState('');
  const [habilidadesSelecionadas, setHabilidadesSelecionadas] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [loadingInicial, setLoadingInicial] = useState(true);
  const [statusCarregamento, setStatusCarregamento] = useState('');
  
  // Estados para seleção de conteúdo
  const [generosSelecionados, setGenerosSelecionados] = useState([]);
  const [generoAtivo, setGeneroAtivo] = useState('');
  const [habilidadesPorGenero, setHabilidadesPorGenero] = useState({});
  
  // Hook para gerenciar habilidades
  const professorId = professor?.id;
  const { 
    habilidades, 
    loading: loadingHabilidades, 
    error: errorHabilidades, 
    contexto,
    carregarHabilidades,
    limparErro 
  } = useHabilidades(professorId);
  
  // Hook para práticas com filtros baseados no contexto do professor
  const filtrosPraticas = useMemo(() => {
    const disciplina = professorContexto?.disciplinaNome || '';
    const anoSerie = turmaSelecionada?.ano?.replace(/\D/g, '') || professorContexto?.ano?.replace(/\D/g, '') || '1';
    
    const filtros = {
      disciplina,
      anoSerie
    };
    
    // Adicionar filtro de período se selecionado
    if (periodoSelecionado === 'trimestre') {
      filtros.periodo = '1º Trimestre';
    } else if (periodoSelecionado === 'bimestre') {
      filtros.periodo = '1º Bimestre';
    }
    
    return filtros;
  }, [turmaSelecionada, periodoSelecionado, professorContexto]);
  
  const { 
    praticas: praticasLinguagem, 
    loading: loadingPraticas, 
    error: errorPraticas 
  } = usePraticas(filtrosPraticas);
  
  // Definir gênero ativo automaticamente quando práticas carregarem
  useEffect(() => {
    if (praticasLinguagem.length > 0 && !generoAtivo) {
      setGeneroAtivo(praticasLinguagem[0]);
    }
  }, [praticasLinguagem, generoAtivo]);
  
  // Carregar habilidades quando contexto estiver disponível na tela de seleção de conteúdo
  useEffect(() => {
    if (contexto && etapaAtual === 'selecao_conteudo' && professorContexto?.disciplinaNome) {
      // Determinar ano série baseado na turma selecionada ou contexto do professor
      let anoSerie = 1; // Padrão
      if (turmaSelecionada?.ano) {
        anoSerie = parseInt(turmaSelecionada.ano.replace(/\D/g, '')) || 1;
      } else if (professorContexto?.ano) {
        anoSerie = parseInt(professorContexto.ano.replace(/\D/g, '')) || 1;
      }
      
      // Usar SEMPRE a disciplina do contexto do professor - NUNCA hardcoded
      const disciplina = professorContexto.disciplinaNome;
      

      
      carregarHabilidades({
        disciplina: disciplina,
        anoSerie: anoSerie.toString(),
        periodo: periodoSelecionado === 'trimestre' ? '1º Trimestre' : '1º Bimestre'
      });
    }
  }, [contexto, etapaAtual, periodoSelecionado, carregarHabilidades, turmaSelecionada, professorContexto]);
  const [formData, setFormData] = useState({
    titulo: '',
    data_aula: '',
    duracao_minutos: 50,
    nivel_dificuldade: 'medio',
    objetivo_geral: '',
    objetivos_especificos: [],
    conteudo_programatico: '',
    metodologia: '',
    recursos_necessarios: [],
    avaliacao: ''
  });


  // Funções auxiliares
  const handlePeriodoSelection = (periodo) => {
    setPeriodoSelecionado(periodo);
  };

  const handleContinuarSelecaoPeriodo = () => {
    if (!periodoSelecionado) {
      toast.error('Por favor, selecione um período antes de continuar.');
      return;
    }
    setEtapaAtual('selecao_datas');
  };

  const handleTurmaSelection = (turma) => {
    setTurmaSelecionada(turma);
  };

  const handleContinuarSelecaoTurma = () => {
    if (!turmaSelecionada) {
      toast.error('Por favor, selecione uma turma antes de continuar.');
      return;
    }
    
    // Validar se há habilidades selecionadas
    const totalHabilidades = getTotalHabilidadesSelecionadas();
    if (totalHabilidades === 0) {
      toast.error('Por favor, selecione pelo menos uma habilidade antes de continuar.');
      return;
    }
    
    setMostrarSelecaoTurma(false);
    setEtapaAtual('resumo');
  };

  const handleContinuarSelecaoTurmaSimples = () => {
    if (!turmaSelecionada) {
      toast.error('Por favor, selecione uma turma antes de continuar.');
      return;
    }
    
    // Navegar para seleção de período após selecionar turma
    setEtapaAtual('selecao_periodo');
  };

  const handleModalidadeChange = (modalidade) => {
    setModalidadeSelecionada(modalidade);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayInputChange = (field, value) => {
    const array = value.split('\n').filter(item => item.trim() !== '');
    setFormData(prev => ({ ...prev, [field]: array }));
  };

  const handleHabilidadeToggle = (habilidade) => {
    setHabilidadesSelecionadas(prev => {
      const exists = prev.find(h => h.id === habilidade.id);
      if (exists) {
        return prev.filter(h => h.id !== habilidade.id);
      } else {
        return [...prev, habilidade];
      }
    });
  };
  
  // Funções para seleção de conteúdo
  const handleGeneroClick = (pratica) => {
    setGeneroAtivo(pratica);
  };
  
  const handleHabilidadeConteudoToggle = (habilidade, pratica) => {
    setHabilidadesPorGenero(prev => {
      const praticaHabilidades = prev[pratica] || [];
      const exists = praticaHabilidades.find(h => h.code === habilidade.code);
      
      if (exists) {
        return {
          ...prev,
          [pratica]: praticaHabilidades.filter(h => h.code !== habilidade.code)
        };
      } else {
        return {
          ...prev,
          [pratica]: [...praticaHabilidades, habilidade]
        };
      }
    });
  };
  
  const handleContinuarSelecaoConteudo = () => {
    const totalHabilidades = getTotalHabilidadesSelecionadas();
    const totalGeneros = getTotalGenerosSelecionados();
    
    if (totalGeneros === 0) {
      toast.error('Por favor, selecione pelo menos uma prática de linguagem.');
      return;
    }
    
    if (totalHabilidades === 0) {
      toast.error('Por favor, selecione pelo menos uma habilidade.');
      return;
    }
    
    console.log('[DEBUG] Continuando para seleção de turma. Turmas disponíveis:', turmasDisponiveis.length);
    
    // Verificar se há turmas disponíveis antes de prosseguir
    if (turmasDisponiveis.length === 0) {
      toast.error('Nenhuma turma disponível. Carregando turmas...');
      if (professor?.id) {
        carregarTurmasDoProfessor(professor.id);
      }
      return;
    }
    
    setMostrarSelecaoTurma(true);
    setEtapaAtual('selecao_turma');
  };
  
  const getTotalHabilidadesSelecionadas = () => {
    return Object.values(habilidadesPorGenero).reduce((total, habilidades) => total + habilidades.length, 0);
  };
  
  const getTotalGenerosSelecionados = () => {
    return Object.keys(habilidadesPorGenero).filter(pratica => habilidadesPorGenero[pratica].length > 0).length;
  };

  const obterRangeDataFormatado = () => {
    if (!dataInicio || !dataFim) return 'Selecione as datas';
    const inicio = dataInicio.toLocaleDateString('pt-BR');
    const fim = dataFim.toLocaleDateString('pt-BR');
    return `${inicio} - ${fim}`;
  };

  const formatAnoCurto = (ano) => {
    return ano ? ano.toString().slice(-2) : '';
  };

  const salvarPlano = async () => {
    setSalvando(true);
    try {
      // Lógica de salvamento aqui
      toast.success('Plano salvo com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar plano');
    } finally {
      setSalvando(false);
    }
  };

  // useEffect para carregar dados iniciais do professor
  useEffect(() => {
    const carregarDadosProfessor = async () => {
      if (!user?.email || !escolaAtiva) {
        setLoadingInicial(false);

        return;
      }
      setLoadingInicial(true);
      setStatusCarregamento('Carregando dados do professor...');

      try {
        const dadosProfessor = await getProfessorComModalidades(user.email);
        
        if (dadosProfessor) {
          setProfessor(dadosProfessor);

          
          if (dadosProfessor.modalidades && dadosProfessor.modalidades.length > 0) {
            setModalidadeSelecionada(dadosProfessor.modalidades[0]);

          } else {

          }
          
          // Carregar turmas do professor
          await carregarTurmasDoProfessor(dadosProfessor.id);
        } else {

          setStatusCarregamento('Dados do professor não encontrados.');
        }
      } catch (error) {
        console.error('Erro ao buscar dados do professor:', error);
        setStatusCarregamento('Erro ao carregar dados do professor.');
      } finally {
        setLoadingInicial(false);

        if (!statusCarregamento.startsWith('Erro') && !statusCarregamento.includes('não encontrados')) setStatusCarregamento('');
      }
    };
    carregarDadosProfessor();
  }, [user?.email, escolaAtiva]);

  // useEffect para carregar contexto do professor quando modalidade for selecionada
  useEffect(() => {
    const carregarContextoProfessor = async () => {
      if (professor?.id && modalidadeSelecionada?.id) {
        try {
          setStatusCarregamento('Carregando contexto do professor...');
          
          // Converter IDs para number (getAnoDisciplinaParaModalidade espera number)
          const professorIdNum = typeof professor.id === 'string' ? parseInt(professor.id, 10) : professor.id;
          const modalidadeIdNum = typeof modalidadeSelecionada.id === 'string' ? parseInt(modalidadeSelecionada.id, 10) : modalidadeSelecionada.id;
          
          if (isNaN(professorIdNum) || isNaN(modalidadeIdNum)) {
            console.error('IDs inválidos para carregar contexto:', { professorId: professor.id, modalidadeId: modalidadeSelecionada.id });
            setStatusCarregamento('');
            toast.error('Erro: IDs inválidos para carregar contexto do professor');
            return;
          }
          
          const contexto = await getAnoDisciplinaParaModalidade(professorIdNum, modalidadeIdNum);
          setProfessorContexto(contexto);
          setStatusCarregamento('');
        } catch (error) {
          console.error('Erro ao carregar contexto do professor:', error);
          setStatusCarregamento('');
          toast.error('Erro ao carregar contexto do professor');
        }
      }
    };
    
    carregarContextoProfessor();
  }, [professor?.id, modalidadeSelecionada?.id]);

  // useEffect para definir datas automaticamente ao entrar na tela de seleção de datas
  useEffect(() => {
    // Log para debug se necessário
    if (etapaAtual === 'selecao_datas' && periodoSelecionado && !dataInicio) {
      const hoje = new Date();
      setDataInicio(hoje);
      const meses = periodoSelecionado === 'bimestre' ? 2 : 3;
      const fim = new Date(hoje);
      fim.setMonth(fim.getMonth() + meses);
      fim.setDate(fim.getDate() - 1);
      setDataFim(fim);
    }
  }, [etapaAtual, periodoSelecionado, dataInicio]);

  // Função para carregar turmas do professor
  const carregarTurmasDoProfessor = async (professorId: string) => {
    if (!escolaAtiva) {
      console.warn('Escola ativa não definida para carregar turmas');
      return;
    }

    try {
      setStatusCarregamento('Carregando turmas do professor...');
      
      const { data: turmasData, error: turmasError } = await supabase
        .from('professores_turmas_disciplinas')
        .select(`
          turma_id,
          turmas!inner(
            id,
            nome,
            ano,
            periodo,
            escola_id
          ),
          disciplinas!inner(nome)
        `)
        .eq('professor_id', professorId)
        .eq('turmas.escola_id', escolaAtiva.id);

      if (turmasError) {
        console.error('Erro ao carregar turmas:', turmasError);
        toast.error('Erro ao carregar turmas do professor');
        return;
      }

      // Processar turmas únicas (um professor pode ter múltiplas disciplinas na mesma turma)
      const turmasUnicas = new Map();
      turmasData?.forEach((item: any) => {
        const turma = item.turmas;
        if (!turmasUnicas.has(turma.id)) {
          turmasUnicas.set(turma.id, {
            id: turma.id,
            nome: turma.nome,
            ano: turma.ano,
            periodo: turma.periodo,
            disciplinas: []
          });
        }
        turmasUnicas.get(turma.id).disciplinas.push(item.disciplinas.nome);
      });

      const turmasArray = Array.from(turmasUnicas.values());
      setTurmasDisponiveis(turmasArray);
      
      // CRÍTICO: Definir etapa inicial baseada no número de turmas
      if (turmasArray.length > 1) {
        // Se há múltiplas turmas, começar pela seleção de turma
        setEtapaAtual('selecao_turma');
        setMostrarSelecaoTurma(false); // Não usar como overlay
      } else if (turmasArray.length === 1) {
        // Se há apenas uma turma, selecioná-la automaticamente e ir para período
        setTurmaSelecionada(turmasArray[0]);
        setEtapaAtual('selecao_periodo');
        setMostrarSelecaoTurma(false);
      } else {
        setMostrarSelecaoTurma(false);
      }
      
      setStatusCarregamento('');
    } catch (error) {
      console.error('Erro ao carregar turmas do professor:', error);
      toast.error('Erro ao carregar turmas do professor');
      setStatusCarregamento('');
    }
  };

  const nomeProfessor = professor?.nome || 'Professor';
  const nomeExibicao = nomeProfessor.split(' ')[0];

  return (
    <div>
      {/* Tela de seleção de turma */}
      {etapaAtual === 'selecao_turma' && (
        <div className="flex justify-center py-6 sm:py-8">
          <div className="flex w-full max-w-3xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col w-full">
              {/* Breadcrumb */}
              <div className="mb-4 w-full">
                <ol className="flex items-center justify-center space-x-2 sm:space-x-4 text-sm font-medium text-center text-gray-500">
                  <li className="flex items-center text-blue-600 font-semibold">
                    Seleção de Turma
                    <svg className="ml-2 sm:ml-4 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                  </li>
                  <li className="flex items-center">
                    Tipo de Período
                    <svg className="ml-2 sm:ml-4 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                  </li>
                  <li className="flex items-center">
                    Datas
                    <svg className="ml-2 sm:ml-4 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                  </li>
                  <li className="flex items-center">
                    Conteúdo
                    <svg className="ml-2 sm:ml-4 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                  </li>
                  <li className="flex items-center">
                    Resumo/Confirmação
                  </li>
                </ol>
              </div>
              
              {/* Título */}
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl text-center mb-2">
                Para qual turma deseja criar o plano de aula?
              </h1>
              
              {/* Mensagem de boas-vindas */}
              <p className="text-center text-blue-600 font-medium mb-6">
                Bem-vindo, Professor {professorData?.nome || 'William'}!
              </p>
              
              {/* Lista de turmas */}
              <div className="mt-6 space-y-3 w-full max-w-2xl mx-auto">
                {turmasDisponiveis.map((turma) => (
                  <label
                    key={turma.id}
                    className={`block cursor-pointer rounded-lg border-2 p-4 transition-all duration-200 ease-in-out ${
                      turmaSelecionada?.id === turma.id
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-border bg-background hover:border-blue-300'
                    }`}
                  >
                    <input
                      className="sr-only"
                      name="turma"
                      type="radio"
                      value={turma.id}
                      checked={turmaSelecionada?.id === turma.id}
                      onChange={() => handleTurmaSelection(turma)}
                    />
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`text-lg font-semibold ${
                          turmaSelecionada?.id === turma.id ? 'text-blue-700' : 'text-foreground'
                        }`}>
                          {turma.ano}º Ano {turma.turma} - {turma.turno}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Disciplina: {turma.disciplina}
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              
              {/* Buttons */}
              <div className="mt-6 w-full flex justify-center gap-4">
                <button
                  onClick={() => {
                    if (turmasDisponiveis.length > 1) {
                      setEtapaAtual('selecao_turma');
                    } else {
                      navigate('/planos-aula');
                    }
                  }}
                  className="flex min-w-[84px] w-full sm:w-80 cursor-pointer items-center justify-center overflow-hidden rounded-md h-11 px-6 bg-black hover:bg-gray-800 text-white text-base font-bold leading-normal tracking-wide shadow-lg shadow-black/30 transition-all hover:shadow-xl hover:shadow-black/40 focus:outline-none focus:ring-4 focus:ring-black/50"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="truncate">Voltar</span>
                </button>
                <button
                  onClick={handleContinuarSelecaoTurmaSimples}
                  disabled={!turmaSelecionada}
                  className={`flex min-w-[84px] w-full sm:w-80 items-center justify-center overflow-hidden rounded-md h-11 px-6 text-base font-bold leading-normal tracking-wide shadow-lg transition-all focus:outline-none focus:ring-4 ${
                    turmaSelecionada
                      ? 'cursor-pointer bg-blue-600 text-white shadow-blue-600/30 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/40 focus:ring-blue-600/50'
                      : 'cursor-not-allowed bg-gray-300 text-gray-500 shadow-gray-300/30 opacity-60'
                  }`}
                >
                  <span className="truncate">Continuar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tela de seleção de período */}
      {etapaAtual === 'selecao_periodo' && (
        <div className="flex justify-center py-6 sm:py-8">
          <div className="flex w-full max-w-3xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col w-full">
              {/* Breadcrumb */}
              <div className="mb-4 w-full">
                <ol className="flex items-center justify-center space-x-2 sm:space-x-4 text-sm font-medium text-center text-gray-500">
                  <li className="flex items-center text-blue-600">
                    Seleção de Turma
                    <svg className="ml-2 sm:ml-4 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                  </li>
                  <li className="flex items-center text-blue-600 font-semibold">
                    Tipo de Período
                    <svg className="ml-2 sm:ml-4 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                  </li>
                  <li className="flex items-center">
                    Datas
                    <svg className="ml-2 sm:ml-4 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                  </li>
                  <li className="flex items-center">
                    Conteúdo
                    <svg className="ml-2 sm:ml-4 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                  </li>
                  <li className="flex items-center">
                    Resumo/Confirmação
                  </li>
                </ol>
              </div>
              
              {/* Título */}
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl text-center">
                Para qual período deseja criar o plano?
              </h1>
              
              {/* Seleção de Período */}
              <div className="mt-6 flex justify-center gap-4 w-full">
                <label className={`radio-label flex-1 cursor-pointer rounded-lg border-2 p-3 text-center transition-all duration-200 ease-in-out max-w-xs ${
                  periodoSelecionado === 'trimestre' 
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                    : 'border-border bg-background hover:border-blue-300'
                }`}>
                  <input 
                    className="sr-only" 
                    name="period" 
                    type="radio" 
                    value="trimestre"
                    checked={periodoSelecionado === 'trimestre'}
                    onChange={() => handlePeriodoSelection('trimestre')}
                  />
                  <span className={`text-lg font-semibold ${periodoSelecionado === 'trimestre' ? 'text-blue-700' : 'text-foreground'}`}>Trimestre</span>
                </label>
                <label className={`radio-label flex-1 cursor-pointer rounded-lg border-2 p-3 text-center transition-all duration-200 ease-in-out max-w-xs ${
                  periodoSelecionado === 'bimestre' 
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                    : 'border-border bg-background hover:border-blue-300'
                }`}>
                  <input 
                    className="sr-only" 
                    name="period" 
                    type="radio" 
                    value="bimestre"
                    checked={periodoSelecionado === 'bimestre'}
                    onChange={() => handlePeriodoSelection('bimestre')}
                  />
                  <span className={`text-lg font-semibold ${periodoSelecionado === 'bimestre' ? 'text-blue-700' : 'text-foreground'}`}>Bimestre</span>
                </label>
              </div>
              
              {/* Buttons */}
              <div className="mt-6 w-full flex justify-center gap-4">
                <button
                  onClick={() => navigate('/planos-aula')}
                  className="flex min-w-[84px] w-full sm:w-80 cursor-pointer items-center justify-center overflow-hidden rounded-md h-11 px-6 bg-black hover:bg-gray-800 text-white text-base font-bold leading-normal tracking-wide shadow-lg shadow-black/30 transition-all hover:shadow-xl hover:shadow-black/40 focus:outline-none focus:ring-4 focus:ring-black/50"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="truncate">Voltar</span>
                </button>
                <button 
                  onClick={handleContinuarSelecaoPeriodo}
                  disabled={!periodoSelecionado}
                  className={`flex min-w-[84px] w-full sm:w-80 items-center justify-center overflow-hidden rounded-md h-11 px-6 text-base font-bold leading-normal tracking-wide shadow-lg transition-all focus:outline-none focus:ring-4 ${
                    periodoSelecionado 
                      ? 'cursor-pointer bg-blue-600 text-white shadow-blue-600/30 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/40 focus:ring-blue-600/50' 
                      : 'cursor-not-allowed bg-gray-300 text-gray-500 shadow-gray-300/30 opacity-60'
                  }`}
                >
                  <span className="truncate">Continuar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tela de seleção de datas */}
      {etapaAtual === 'selecao_datas' && (
        <div className="flex justify-center py-6 sm:py-8">
          <div className="flex w-full max-w-3xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col w-full">
              {/* Breadcrumb - mesma largura e altura da tela anterior */}
              <div className="mb-4 w-full">
                <ol className="flex items-center justify-center space-x-2 sm:space-x-4 text-sm font-medium text-center text-gray-500">
                  <li className="flex items-center text-blue-600">
                    Tipo de Período
                    <svg className="ml-2 sm:ml-4 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                  </li>
                  <li className="flex items-center text-blue-600 font-semibold">
                    Datas
                    <svg className="ml-2 sm:ml-4 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                  </li>
                  <li className="flex items-center">
                    Conteúdo
                    <svg className="ml-2 sm:ml-4 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                  </li>
                  <li className="flex items-center">
                    Resumo/Confirmação
                  </li>
                </ol>
              </div>
              
              {/* Título - removido texto descritivo */}
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl text-center">
                Qual o início e fim do período?
              </h1>
              
              {/* Campos de entrada - ajustado posicionamento */}
              <div className="mt-6 flex items-center gap-4 w-full sm:max-w-[656px] mx-auto">
  <div className="relative flex-1">
    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
      <Calendar className="h-5 w-5 text-gray-400" />
    </div>
    <input
      className="block w-full rounded-lg border border-border bg-background pl-12 pr-4 py-3 text-base text-foreground placeholder:text-muted-foreground focus:border-blue-500 focus:ring-2 focus:ring-blue-500 pointer-events-none cursor-not-allowed"
      readOnly
      type="text"
      value={obterRangeDataFormatado()}
    />
  </div>
  <button
    onClick={() => {
      setMostrarCalendario(true);
    }}
    className="flex-1 rounded-lg bg-black hover:bg-gray-800 px-4 py-3 text-base font-semibold text-white transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 whitespace-nowrap"
  >
    Editar período
  </button>
</div>
              
              {/* Botões - alinhado com tela anterior */}
              <div className="mt-6 w-full flex justify-center gap-4">
                <button
                  onClick={() => setEtapaAtual('selecao_periodo')}
                  className="flex min-w-[84px] w-full sm:w-80 cursor-pointer items-center justify-center overflow-hidden rounded-md h-11 px-6 bg-black hover:bg-gray-800 text-white text-base font-bold leading-normal tracking-wide shadow-lg shadow-black/30 transition-all hover:shadow-xl hover:shadow-black/40 focus:outline-none focus:ring-4 focus:ring-black/50"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="truncate">Voltar</span>
                </button>
                <button
                  onClick={() => {
                    if (!dataInicio || !dataFim) {
                      toast.error('Por favor, selecione as datas de início e fim do período.');
                      return;
                    }
                    setEtapaAtual('selecao_conteudo');
                  }}
                  disabled={!dataInicio || !dataFim}
                  className={`flex min-w-[84px] w-full sm:w-80 items-center justify-center overflow-hidden rounded-md h-11 px-6 text-base font-bold leading-normal tracking-wide shadow-lg transition-all focus:outline-none focus:ring-4 ${
                    dataInicio && dataFim
                      ? 'cursor-pointer bg-blue-600 text-white shadow-blue-600/30 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/40 focus:ring-blue-600/50'
                      : 'cursor-not-allowed bg-gray-300 text-gray-500 shadow-gray-300/30 opacity-60'
                  }`}
                >
                  <span className="truncate">Continuar</span>
                </button>
              </div>


            </div>
          </div>
        </div>
      )}

      {/* Tela de seleção de conteúdo */}
      {etapaAtual === 'selecao_conteudo' && (
        <div className="flex justify-center py-6 sm:py-8">
          <div className="flex w-full max-w-5xl mx-auto px-4 sm:px-6 min-h-[650px]">
            <div className="flex flex-col w-full">
              {/* Breadcrumb */}
              <div className="mb-4 w-full">
                <ol className="flex items-center justify-center space-x-2 sm:space-x-4 text-sm font-medium text-center text-gray-500">
                  <li className="flex items-center text-blue-600">
                    Tipo de Período
                    <svg className="ml-2 sm:ml-4 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                  </li>
                  <li className="flex items-center text-blue-600">
                    Datas
                    <svg className="ml-2 sm:ml-4 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                  </li>
                  <li className="flex items-center text-blue-600 font-semibold">
                    Conteúdo
                    <svg className="ml-2 sm:ml-4 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                  </li>
                  <li className="flex items-center">
                    Resumo/Confirmação
                  </li>
                </ol>
              </div>
              
              <main className="flex-grow pb-28">
                <div className="mx-auto max-w-4xl px-0 sm:px-0 lg:px-0">
                  <div className="space-y-10">
                    {/* Título */}
                    <div className="text-center">
                      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                        Seleção de Conteúdo
                      </h1>
                      <p className="mt-4 text-lg text-gray-600">
                        Selecione os gêneros textuais e as habilidades para o seu plano de aula. As sugestões são baseadas no {periodoSelecionado === 'trimestre' ? '1º trimestre' : '1º bimestre'}.
                      </p>
                    </div>
                    
                    <div className="space-y-8">
                      {/* Card */}
                      <div className="rounded-xl border border-border bg-card shadow-sm">
                        <div className="border-b border-border">
                          <div className="flex items-center justify-between px-6 py-4">
                            <h2 className="text-lg font-bold text-foreground">Gêneros e Habilidades</h2>
                            <button className="flex items-center gap-1.5 rounded-md border border-dashed border-border px-3 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:border-blue-600 hover:bg-blue-600 hover:bg-opacity-5 hover:text-blue-600">
                              <span className="text-base">+</span>
                              <span>Adicionar Gênero</span>
                            </button>
                          </div>
                          
                          {/* Tabs das práticas de linguagem */}
                          <div className="relative">
                            {loadingPraticas || loadingHabilidades ? (
                              <div className="flex items-center justify-center py-8">
                                <div className="flex items-center gap-3">
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                  <span className="text-muted-foreground">Carregando práticas de linguagem...</span>
                                </div>
                              </div>
                            ) : errorPraticas ? (
                              <div className="flex items-center justify-center py-8">
                                <div className="text-center">
                                  <div className="text-red-400 text-4xl mb-2">⚠️</div>
                                  <div className="text-red-600 text-sm font-medium">{errorPraticas}</div>
                                </div>
                              </div>
                            ) : (
                              <div className="tabs-container flex overflow-x-auto border-b border-border">
                                {praticasLinguagem.map((pratica) => (
                                  <button
                                    key={pratica}
                                    onClick={() => handleGeneroClick(pratica)}
                                    className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold ${
                                      generoAtivo === pratica
                                        ? "border-blue-600 text-blue-600"
                                        : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                                    }`}
                                  >
                                    <span>{pratica}</span>
                                    <span
                                      className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                                        generoAtivo === pratica ? "bg-blue-100 text-blue-600" : "bg-muted"
                                      }`}
                                    >
                                      {habilidadesPorGenero[pratica]?.length || 0}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Grid */}
                        <div className="grid grid-cols-1 gap-8 p-6 md:grid-cols-12">
                          {/* Bloco central: conteúdo e habilidades */}
                          <div className="md:col-span-8">
                            <h3 className="text-xl font-bold text-foreground">{generoAtivo}</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                              Passe o mouse sobre o código da habilidade para ver a descrição completa.
                            </p>
                            <div className="mt-4 flex flex-wrap gap-3">
                              {loadingHabilidades ? (
                                <div className="flex items-center justify-center w-full py-8">
                                  <div className="flex items-center gap-3">
                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                    <span className="text-muted-foreground">Carregando habilidades...</span>
                                  </div>
                                </div>
                              ) : errorHabilidades ? (
                                <div className="flex items-center justify-center w-full py-8">
                                  <div className="text-center">
                                    <div className="text-red-400 text-4xl mb-2">⚠️</div>
                                    <div className="text-red-600 text-sm font-medium mb-2">{errorHabilidades}</div>
                                    <button 
                                      onClick={() => {
                                        limparErro();
                                        if (contexto && turmaSelecionada) {
                                          const anoSerie = parseInt(turmaSelecionada.ano?.replace(/\D/g, '')) || 1;
                                          carregarHabilidades({
                                             disciplina: disciplina || 'Matemática',
                                             anoSerie: anoSerie.toString(),
                                             periodo: periodoSelecionado === 'trimestre' ? '1º Trimestre' : '1º Bimestre'
                                           });
                                        }
                                      }}
                                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                                    >
                                      Tentar novamente
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  {habilidades
                                    .filter(habilidade => habilidade.pratica_linguagem === generoAtivo)
                                    .map((habilidade) => {
                                      const isSelected = habilidadesPorGenero[generoAtivo]?.some(h => h.code === habilidade.codigo);
                                      return (
                                        <div
                                          key={habilidade.codigo}
                                          className={`tooltip relative flex items-center gap-1.5 rounded-full py-1 pl-2 pr-3 text-sm font-semibold cursor-pointer transition-colors ${
                                            isSelected 
                                              ? 'bg-blue-100 text-blue-800' 
                                              : 'bg-muted text-muted-foreground hover:bg-blue-50'
                                          }`}
                                          onClick={() => handleHabilidadeConteudoToggle({
                                            code: habilidade.codigo,
                                            desc: habilidade.descricao
                                          }, generoAtivo)}
                                          title={habilidade.descricao}
                                        >
                                          <span className="text-base">✨</span>
                                          <span>({habilidade.codigo})</span>
                                          {isSelected && (
                                            <button className="ml-1 text-blue-600 hover:text-blue-800" tabIndex={-1}>
                                              <span className="text-base">×</span>
                                            </button>
                                          )}
                                        </div>
                                      );
                                    })}
                                  {habilidades.filter(h => h.pratica_linguagem === generoAtivo).length === 0 && (
                                    <div className="flex items-center justify-center w-full py-8">
                                      <div className="text-center">
                                        <div className="text-gray-400 text-4xl mb-2">📚</div>
                                        <div className="text-muted-foreground text-sm">Nenhuma habilidade encontrada para esta prática de linguagem.</div>
                                        <div className="text-muted-foreground/70 text-xs mt-1">Tente selecionar outra prática ou verifique os filtros.</div>
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                          
                          {/* Bloco direito: resumo */}
                          <div className="md:col-span-4 md:border-l md:pl-8">
                            <h4 className="font-semibold text-foreground">Itens Selecionados</h4>
                            <p className="mt-1 text-sm text-muted-foreground">Resumo do que foi adicionado ao plano.</p>
                            <div className="mt-4 space-y-3">
                              {Object.entries(habilidadesPorGenero).map(([pratica, habilidades]) => {
                                if (habilidades.length === 0) return null;
                                return (
                                  <div key={pratica} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-foreground">{pratica}</span>
                                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                        {habilidades.length} Habilidade{habilidades.length > 1 ? "s" : ""}
                                      </span>
                                    </div>
                                    <button 
                                      onClick={() => setHabilidadesPorGenero(prev => ({ ...prev, [pratica]: [] }))}
                                      className="text-xs font-semibold text-red-600 hover:text-red-800"
                                    >
                                      Remover
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </main>
              
              {/* Footer Fixo */}
              <footer className="fixed bottom-0 left-0 right-0 z-10 border-t border-border bg-background/90 py-4 backdrop-blur-sm">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-bold text-foreground">{getTotalGenerosSelecionados()}</span> Práticas de Linguagem e{" "}
                        <span className="font-bold text-foreground">{getTotalHabilidadesSelecionadas()}</span> Habilidades selecionadas.
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => setEtapaAtual('selecao_datas')}
                        className="text-sm font-semibold text-foreground hover:text-muted-foreground"
                      >
                        Voltar para o passo anterior
                      </button>
                      <button 
                        onClick={handleContinuarSelecaoConteudo}
                        className="flex min-w-[120px] items-center justify-center rounded-md bg-blue-600 px-6 py-3 text-base font-bold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                      >
                        Próximo
                      </button>
                    </div>
                  </div>
                </div>
              </footer>
            </div>
          </div>
        </div>
      )}

      {/* Tela de Resumo */}
      {etapaAtual === 'resumo' && (
        <div className="min-h-screen bg-sky-50 overflow-y-visible">
          <div className="mx-auto max-w-4xl py-4 sm:py-6">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h2 className="text-blue-700 text-2xl font-bold mb-4 text-center">
                Resumo do Plano de Aula
              </h2>
              
              <div className="space-y-6">
                {/* Informações do Professor */}
                <div className="border-b border-slate-200 pb-4">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Professor</h3>
                  <p className="text-slate-700">{nomeExibicao}</p>
                </div>
                
                {/* Turma Selecionada */}
                {turmaSelecionada && (
                  <div className="border-b border-slate-200 pb-4">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Turma</h3>
                    <p className="text-slate-700">
                      {turmaSelecionada.nome} - {turmaSelecionada.ano} {turmaSelecionada.periodo}
                    </p>
                    {turmaSelecionada.disciplinas && turmaSelecionada.disciplinas.length > 0 && (
                      <p className="text-slate-600 text-sm mt-1">
                        Disciplinas: {turmaSelecionada.disciplinas.join(', ')}
                      </p>
                    )}
                  </div>
                )}
                
                {/* Período */}
                {periodoSelecionado && (
                  <div className="border-b border-slate-200 pb-4">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Período</h3>
                    <p className="text-slate-700">{periodoSelecionado}</p>
                  </div>
                )}
                
                {/* Datas */}
                {dataInicio && dataFim && (
                  <div className="border-b border-slate-200 pb-4">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Período de Aulas</h3>
                    <p className="text-slate-700">
                      De {new Date(dataInicio).toLocaleDateString('pt-BR')} até {new Date(dataFim).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
                
                {/* Habilidades Selecionadas */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Habilidades Selecionadas</h3>
                  {Object.entries(habilidadesPorGenero).map(([pratica, habilidades]) => {
                    if (habilidades.length === 0) return null;
                    return (
                      <div key={pratica} className="mb-3">
                        <h4 className="font-medium text-slate-800 mb-1">{pratica}</h4>
                        <div className="flex flex-wrap gap-2">
                          {habilidades.map((habilidade) => (
                            <span 
                              key={habilidade.code}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {habilidade.code}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <span className="font-semibold">{getTotalGenerosSelecionados()}</span> Práticas de Linguagem e{" "}
                      <span className="font-semibold">{getTotalHabilidadesSelecionadas()}</span> Habilidades selecionadas.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Botões de Ação */}
              <div className="mt-8 flex items-center justify-between">
                <button 
                  onClick={() => setEtapaAtual('selecao_conteudo')}
                  className="text-sm font-semibold text-slate-600 hover:text-slate-800"
                >
                  Voltar para Seleção de Conteúdo
                </button>
                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      // Resetar para o início
                      setEtapaAtual('selecao_periodo');
                      setTurmaSelecionada(null);
                      setPeriodoSelecionado('');
                      setDataInicio('');
                      setDataFim('');
                      setHabilidadesPorGenero({});
                      setMostrarSelecaoTurma(false);
                    }}
                    className="px-6 py-3 border border-slate-300 rounded-md text-base font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                  >
                    Criar Novo Plano
                  </button>
                  <button 
                    onClick={() => {
                      toast.success('Plano de aula criado com sucesso!');
                      // Aqui seria implementada a lógica de salvamento
                    }}
                    className="px-6 py-3 bg-blue-600 text-white rounded-md text-base font-bold hover:bg-blue-700 transition-colors"
                  >
                    Finalizar Plano
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay/modal de seleção de turma removido - agora é uma etapa principal */}

      {/* Modal do Calendário - Renderizado fora das estruturas condicionais */}
      {mostrarCalendario && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-[9999]">
          <CalendarCard 
            onConfirm={(startDate, endDate) => {
              if (startDate && endDate) {
                setDataInicio(startDate);
                setDataFim(endDate);
                setMostrarCalendario(false);
              }
            }}
            onCancel={() => setMostrarCalendario(false)}
            initialDate={dataInicio}
            periodType={periodoSelecionado}
          />
        </div>
      )}
    </div>
  );
};

export default CriarPlanoAulaV2;