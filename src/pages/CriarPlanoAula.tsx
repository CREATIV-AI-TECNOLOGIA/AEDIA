import React, { useEffect, useState, useMemo, useCallback, memo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getGreeting, getTimeBasedClasses } from '../utils/dateUtils';
import { getProfessorComModalidades, ProfessorComModalidades, Modalidade } from '../services/ProfessorService'; // Descomentado
import { Link } from 'react-router-dom';
import ModalidadesPill from '../components/ModalidadesPill/ModalidadesPill';
import SeletorHabilidades, { Habilidade } from '../components/PlanoAula/SeletorHabilidades';
import { getAnoDisciplinaParaModalidade, ProfessorContexto } from '../services/ProfessorContextoService'; // Descomentado
import { getTrimestreAtualNome } from '../services/PeriodoLetivoService'; // Descomentado
import { getHabilidadesFormatadas } from '../services/MatrizCurricularService'; // Descomentado
import { supabase } from '../lib/supabase';
import { ProfessorPreferenciasService } from '../services/ProfessorPreferenciasService';
// import type { ProfessorComModalidades, Modalidade } from '../services/ProfessorService'; // Removido pois está descomentado acima


const CriarPlanoAula: React.FC = memo(() => {
  const { user } = useAuth();
  console.log('CriarPlanoAula montado. Usuário:', user);

  const [professor, setProfessor] = useState<ProfessorComModalidades | null>(null);
  const [loadingInicial, setLoadingInicial] = useState(true); 
  const [modalidadeSelecionada, setModalidadeSelecionada] = useState<Modalidade | null>(null);
  const [cardsVisible, setCardsVisible] = useState<boolean>(true); // Valor inicial, será carregado das preferências
  
  const [professorContexto, setProfessorContexto] = useState<ProfessorContexto | null>(null);
  const [trimestreAtualNome, setTrimestreAtualNome] = useState<string | null>(null);
  const [habilidadesDinamicas, setHabilidadesDinamicas] = useState<Habilidade[]>([]);
  const [loadingHabilidades, setLoadingHabilidades] = useState(false);
  const [statusCarregamento, setStatusCarregamento] = useState<string>('');

  const [habilidadesSelecionadasManualmente, setHabilidadesSelecionadasManualmente] = useState<Habilidade[]>([]);
  
  // Novos estados para quantidade de alunos
  const [quantidadeAlunosTurmaAtual, setQuantidadeAlunosTurmaAtual] = useState<number | null>(null);
  const [loadingAlunosTurmaAtual, setLoadingAlunosTurmaAtual] = useState<boolean>(false);

  const timeClasses = useMemo(() => getTimeBasedClasses(), []);
  const saudacao = useMemo(() => getGreeting(), []);
  
  // Determina se os pré-requisitos para mostrar o seletor de habilidades estão atendidos
  const podeMostrarSeletorHabilidades = modalidadeSelecionada && professorContexto && trimestreAtualNome;

  // Função para carregar preferências do banco de dados
  const carregarPreferencias = async (professorId: number) => {
    try {
      const preferencias = await ProfessorPreferenciasService.getPreferencias(professorId);
      setCardsVisible(preferencias.plano_aula_cards_visible);
    } catch (error) {
      console.error('Erro ao carregar preferências:', error);
      // Manter valor padrão em caso de erro
    }
  };

  // Função para toggle da visibilidade dos cards - memoizada
  const toggleCardsVisibility = useCallback(async () => {
    const newVisibility = !cardsVisible;
    setCardsVisible(newVisibility);
    
    // Salvar preferência no banco de dados
    if (professor && professor.id) {
      try {
        const profId = typeof professor.id === 'number' ? professor.id : parseInt(professor.id, 10);
        await ProfessorPreferenciasService.atualizarPreferencia(
          profId, 
          'plano_aula_cards_visible', 
          newVisibility
        );
      } catch (error) {
        console.error('Erro ao salvar preferência:', error);
      }
    }
  }, [cardsVisible, professor]);

  useEffect(() => {
    console.log('useEffect [user] disparado em CriarPlanoAula. User:', user);
    const carregarDadosProfessor = async () => {
      if (!user) {
        setLoadingInicial(false);
        console.log('useEffect [user] - Sem usuário, setLoadingInicial(false)');
        return;
      }
      setLoadingInicial(true);
      setStatusCarregamento('Carregando dados do professor...'); // Ajustado
      console.log('useEffect [user] - Iniciando carregamento de dados do professor...'); // Ajustado
      try {
        const userIdParaProfessor = user.email; 
        if (!userIdParaProfessor) {
          console.error('useEffect [user] - Usuário não possui email para buscar dados do professor.');
          setStatusCarregamento('Informação de email do usuário ausente.');
          setLoadingInicial(false);
          return;
        }
        const dadosProfessor = await getProfessorComModalidades(userIdParaProfessor); // Descomentado
        
        if (dadosProfessor) { // Descomentado
          setProfessor(dadosProfessor); // Descomentado
          console.log('useEffect [user] - Professor carregado:', dadosProfessor);
          
          // Carregar preferências do professor
          const profId = typeof dadosProfessor.id === 'number' ? dadosProfessor.id : parseInt(dadosProfessor.id, 10);
          await carregarPreferencias(profId);
          
          if (dadosProfessor.modalidades && dadosProfessor.modalidades.length > 0) { // Descomentado e verificação de nulidade/array vazio
            setModalidadeSelecionada(dadosProfessor.modalidades[0]); // Descomentado
            console.log('useEffect [user] - Modalidade padrão selecionada:', dadosProfessor.modalidades[0]);
          } else {
            console.log('useEffect [user] - Professor não possui modalidades ou array de modalidades vazio.');
          }
        } else { // Descomentado
          console.warn('useEffect [user] - Dados do professor não encontrados para o ID:', userIdParaProfessor);
          setStatusCarregamento('Dados do professor não encontrados.');
        } 
        // console.log('useEffect [user] - Chamada a getProfessorComModalidades comentada.'); // Removido
      } catch (error) {
        console.error('Erro ao buscar dados do professor:', error); // Ajustado
        setStatusCarregamento('Erro ao carregar dados do professor.'); // Ajustado
      } finally {
        setLoadingInicial(false); 
        console.log('useEffect [user] - Fim do carregamento de dados do professor.'); // Ajustado
        if (!statusCarregamento.startsWith('Erro') && !statusCarregamento.includes('não encontrados')) setStatusCarregamento(''); // Limpar status se não houve erro
      }
    };
    carregarDadosProfessor();
  }, [user]);

  useEffect(() => {
    console.log('useEffect [professor, modalidadeSelecionada] disparado. Professor:', professor, 'Modalidade:', modalidadeSelecionada); 
    if (professor && professor.id && modalidadeSelecionada && modalidadeSelecionada.id) {
      const fetchContexto = async () => {
        setStatusCarregamento('Determinando contexto da disciplina...');
        
        const profIdStr = typeof professor.id === 'number' ? String(professor.id) : professor.id;
        const modIdStr = typeof modalidadeSelecionada.id === 'string' ? modalidadeSelecionada.id : String(modalidadeSelecionada.id);

        const profId = parseInt(profIdStr, 10);
        const modId = parseInt(modIdStr, 10);

        // ADICIONANDO LOGS DETALHADOS
        console.log(`useEffect [ctx] - Tentando buscar contexto. professor.id: ${professor.id}, modalidadeSelecionada.id: ${modalidadeSelecionada.id}`);
        console.log(`useEffect [ctx] - Valores convertidos - profId: ${profId} (tipo: ${typeof profId}), modId: ${modId} (tipo: ${typeof modId})`);

        // Verificação de NaN ANTES da chamada da API
        if (isNaN(profId) || isNaN(modId)) {
          console.error('useEffect [ctx] - IDs do professor ou modalidade SÃO NaN ANTES da chamada da API:', { profId, modId, profIdStr, modIdStr });
          setStatusCarregamento('Erro: IDs de contexto inválidos (NaN).');
          setProfessorContexto(null);
          return; // Interrompe se NaN
        }
        // FIM DOS LOGS DETALHADOS E VERIFICAÇÃO

        console.log(`useEffect [ctx] - Buscando contexto para profId: ${profId} (original str: ${profIdStr}), modId: ${modId} (original str: ${modIdStr})`);

        if (isNaN(profId) || isNaN(modId)) { // Esta verificação agora é redundante devido à acima, mas mantida por segurança
          console.error('useEffect [ctx] - IDs do professor ou modalidade inválidos após parseInt:', { profIdStr, modIdStr });
          setStatusCarregamento('Erro: IDs de contexto inválidos após parseInt.');
          setProfessorContexto(null);
          return;
        }

        const contexto = await getAnoDisciplinaParaModalidade(profId, modId); // DESCOMENTADO e com parseInt
        setProfessorContexto(contexto); // DESCOMENTADO
        
        if (!contexto) { // DESCOMENTADO
          console.warn(`useEffect [ctx] - Contexto da disciplina não encontrado para profId: ${profId}, modId: ${modId}`);
          setStatusCarregamento('Contexto da disciplina não encontrado.'); // AJUSTADO
        } else { // DESCOMENTADO
          console.log('useEffect [ctx] - Contexto carregado:', contexto);
          setStatusCarregamento(''); // Limpa se sucesso
        }
      };
      fetchContexto();
    } else {
      setProfessorContexto(null); 
      console.log('useEffect [professor, modalidadeSelecionada] - Professor ou modalidade (ou seus IDs) não definidos/prontos para buscar contexto.');
    }
  }, [professor, modalidadeSelecionada]);

  useEffect(() => {
    console.log('useEffect [professor] para trimestre disparado. Professor:', professor); // LOG MELHORADO
    if (professor && professor.id) {
      const fetchTrimestre = async () => {
        setStatusCarregamento('Identificando trimestre atual...'); // AJUSTADO
        
        const profIdStr = typeof professor.id === 'number' ? String(professor.id) : professor.id;
        const profId = parseInt(profIdStr, 10);
        console.log(`useEffect [trimestre] - Buscando trimestre para profId: ${profId} (original str: ${profIdStr})`);

        if (isNaN(profId)) {
          console.error('useEffect [trimestre] - ID do professor inválido após parseInt:', profIdStr);
          setStatusCarregamento('Erro: ID do professor inválido para buscar trimestre.');
          setTrimestreAtualNome(null);
          return;
        }
        const nomeTrimestre = await getTrimestreAtualNome(profId); // DESCOMENTADO
        setTrimestreAtualNome(nomeTrimestre); // DESCOMENTADO
        
        if (!nomeTrimestre) { // DESCOMENTADO
          console.warn(`useEffect [trimestre] - Trimestre atual não identificado para profId: ${profId}`);
          setStatusCarregamento('Trimestre atual não identificado.'); // AJUSTADO
        } else { // DESCOMENTADO
          console.log('useEffect [trimestre] - Trimestre atual carregado:', nomeTrimestre);
          setStatusCarregamento(''); // Limpa se sucesso
        }
      };
      fetchTrimestre();
    } else {
      setTrimestreAtualNome(null);
      console.log('useEffect [professor] para trimestre - Professor (ou seu ID) não definido.');
    }
  }, [professor]);

  useEffect(() => {
    console.log(
      'useEffect [habilidades] disparado. Contexto:', professorContexto, 
      'Trimestre:', trimestreAtualNome, 
      'Modalidade:', modalidadeSelecionada 
    ); // LOG MELHORADO
    if (professorContexto && trimestreAtualNome && modalidadeSelecionada) { // Adicionado modalidadeSelecionada para garantir que só busca se tudo estiver pronto
      const fetchHabilidades = async () => {
        setLoadingHabilidades(true);
        setStatusCarregamento('Buscando habilidades...'); // AJUSTADO
        console.log(
          `useEffect [habilidades] - Buscando habilidades para Disciplina ID: ${professorContexto.disciplinaId}, Ano: ${professorContexto.ano}, Trimestre: ${trimestreAtualNome}`
        );

        const habilidades = await getHabilidadesFormatadas( 
          professorContexto.disciplinaId,
          professorContexto.ano,
          trimestreAtualNome
        ); // DESCOMENTADO
        setHabilidadesDinamicas(habilidades); // DESCOMENTADO
        
        if (habilidades.length === 0) { // DESCOMENTADO
          console.warn('useEffect [habilidades] - Nenhuma habilidade encontrada para os critérios.');
          setStatusCarregamento('Nenhuma habilidade encontrada para os critérios atuais.'); // AJUSTADO
        } else { // DESCOMENTADO
          console.log('useEffect [habilidades] - Habilidades carregadas:', habilidades);
          setStatusCarregamento(''); // Limpa se sucesso
        }
        setLoadingHabilidades(false);
      };
      fetchHabilidades();
    } else {
      // Não limpar habilidadesDinamicas aqui, para manter as anteriores visíveis se estiver apenas mudando modalidade
      // setHabilidadesDinamicas([]); 
      console.log('useEffect [habilidades] - Contexto, trimestre ou modalidade não prontos para buscar habilidades.');
      if (modalidadeSelecionada && (!professorContexto || !trimestreAtualNome)) {
        setStatusCarregamento('Aguardando informações de contexto e trimestre para carregar habilidades...');
      } else if (!modalidadeSelecionada) {
        setStatusCarregamento('Selecione uma modalidade para iniciar.');
      }
    }
  }, [professorContexto, trimestreAtualNome, modalidadeSelecionada]); // modalidadeSelecionada adicionada como dependência

  // Novo useEffect para buscar quantidade de alunos quando o contexto da turma (professorContexto) mudar
  useEffect(() => {
    const fetchAlunos = async () => {
      if (professorContexto && typeof professorContexto.turmaId === 'number') {
        setLoadingAlunosTurmaAtual(true);
        setQuantidadeAlunosTurmaAtual(null); // Limpa antes de buscar
        try {
          const { count, error } = await supabase
            .from('alunos')
            .select('*', { count: 'exact', head: true })
            .eq('turma_id', professorContexto.turmaId);

          if (error) {
            throw error;
          }
          setQuantidadeAlunosTurmaAtual(count ?? 0);
        } catch (error) {
          console.error('Erro ao buscar quantidade de alunos para o contexto:', error);
          setQuantidadeAlunosTurmaAtual(null); 
        } finally {
          setLoadingAlunosTurmaAtual(false);
        }
      } else {
        setQuantidadeAlunosTurmaAtual(null); // Reseta se não há turmaId
      }
    };
    fetchAlunos();
  }, [professorContexto]);

  const handleModalidadeChange = useCallback((modalidade: Modalidade) => {
    console.log('Modalidade alterada para:', modalidade);
    setModalidadeSelecionada(modalidade);
    setHabilidadesSelecionadasManualmente([]);
    // setHabilidadesDinamicas([]); // Comentado para manter habilidades antigas visíveis durante o carregamento de novas
  }, []);
  
  const confirmarSelecaoHabilidadesManualmente = useCallback((habilidades: Habilidade[]) => {
    setHabilidadesSelecionadasManualmente(habilidades);
  }, []);

  // Lógica de loading inicial precisa ser mantida ou ajustada
  if (loadingInicial) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mr-3"></div>
          <span>{statusCarregamento || 'Carregando CriarPlanoAula...'}</span>
        </div>
      </div>
    );
  }

  const nomeProfessor = professor?.nome || 'Professor';
  const nomeExibicao = nomeProfessor.split(' ')[0];
  
  return (
    <div className="page-container bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-50 min-h-screen">
      <div className="max-w-7xl mx-auto p-6 md:p-8">
          {/* Header com título à esquerda e botões à direita */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
          <Link 
            to="/planos-aula" 
                className="flex items-center px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold rounded-lg transition-colors border border-indigo-200 shadow-sm"
          >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
                <span>Voltar</span>
          </Link>
            </div>
            
            {/* Saudação centralizada */}
            <div className="flex items-center space-x-3">
              <div className={`${timeClasses.background} ${timeClasses.icon} p-3 rounded-full`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <p className={`${timeClasses.text} text-2xl font-bold`}>
                  {saudacao} professor {nomeExibicao}!
                </p>
                <p className="text-gray-600 text-sm">Vamos criar um novo plano de aula?</p>
              </div>
            </div>
            
            {/* Botão de Configurações da IA */}
            <Link 
              to="/planos-aula/configuracoes-ia" 
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 text-purple-700 py-2 px-4 rounded-lg transition-all duration-200 shadow-sm border border-purple-200/50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium">Configurar IA</span>
            </Link>
        </div>
        
          {/* Layout em grid responsivo com cards menores */}
          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 transition-all duration-500 ease-in-out overflow-hidden ${cardsVisible ? 'mb-4 max-h-80 opacity-100' : 'mb-0 max-h-0 opacity-0'}`}>
            {/* Card de configuração da modalidade */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className="bg-indigo-100 p-2 rounded-lg mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-800">
            {!professor || !professor.modalidades || professor.modalidades.length === 0
                        ? "Configuração da Modalidade"
              : professor.modalidades.length === 1
                        ? "Modalidade de Ensino"
                        : "Selecione a Modalidade"}
          </h2>
                    <p className="text-xs text-gray-600">
                      {!professor || !professor.modalidades || professor.modalidades.length === 0
                        ? "Nenhuma modalidade configurada"
                        : professor.modalidades.length === 1
                        ? "Modalidade já definida"
                        : "Escolha a modalidade para este plano"}
                    </p>
                  </div>
                </div>
                
                {/* Ícone toggle com pulse e tooltip */}
                <div className="relative group">
                  <button
                    onClick={toggleCardsVisibility}
                    className={`p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-all duration-200 ${cardsVisible ? 'animate-pulse' : ''}`}
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className={`h-4 w-4 text-gray-600 transition-transform duration-300 ${cardsVisible ? 'rotate-180' : 'rotate-0'}`} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  
                  {/* Tooltip */}
                  <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                    {cardsVisible ? "Ocultar configurações" : "Mostrar configurações"}
                    {/* Seta do tooltip */}
                    <div className="absolute bottom-full right-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-gray-800"></div>
                  </div>
                </div>
              </div>
              
              {professor && professor.modalidades && professor.modalidades.length > 0 && (
                <div>
            <ModalidadesPill 
                    modalidades={professor.modalidades}
              onChange={handleModalidadeChange}
                    selectedModalidade={modalidadeSelecionada}
                  />
                  {modalidadeSelecionada && (
                    <div className="mt-2 p-2 bg-indigo-50 rounded-md">
                      <p className="text-xs text-indigo-700">
                        <span className="font-medium">Selecionada:</span> {modalidadeSelecionada.nome}
                      </p>
                    </div>
                  )}
                </div>
          )}
        </div>
        
            {/* Card de informações do contexto */}
            <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 flex-1 min-w-[300px]">
              <div className="flex items-center text-green-600 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-base font-semibold">Informações do Contexto</h3>
              </div>
              {/* Layout de duas colunas para informações do contexto e carga horária */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 text-sm text-gray-700">
                {/* Coluna 1: Informações da Turma/Disciplina */}
                <div className="space-y-2">
                  <p><strong>Disciplina:</strong> {professorContexto?.disciplinaNome || 'N/A'}</p>
                  <p><strong>Ano:</strong> {professorContexto?.ano || 'N/A'}</p>
                  <p><strong>Turma:</strong> {professorContexto?.turmaNome || 'N/A'}</p>
                </div>
                {/* Coluna 2: Informações do Professor e Turma */}
                <div className="space-y-2 pt-2 md:pt-0 md:border-l md:pl-4 border-gray-200">
                  {professor && professor.carga_horaria_semanal_total && (
                    <p><strong>Carga Horária Semanal:</strong> {professor.carga_horaria_semanal_total}</p>
                  )}
                  <p><strong>Trimestre:</strong> {trimestreAtualNome || 'N/A'}</p>
                  {professorContexto?.turmaId && (
                    <p>
                      <strong>Alunos na turma:</strong> 
                      {loadingAlunosTurmaAtual ? ' Carregando...' : ` ${quantidadeAlunosTurmaAtual !== null ? quantidadeAlunosTurmaAtual : 'N/A'}`}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Botão para mostrar cards quando estão ocultos */}
          {!cardsVisible && (
            <div className="flex justify-center mb-4">
              <button
                onClick={toggleCardsVisibility}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-all duration-200 shadow-sm animate-pulse"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <span className="text-sm font-medium">Mostrar Configurações</span>
              </button>
            </div>
          )}

          {/* Card do seletor de habilidades - largura total e compacto */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200">
            {/* Header do card */}
            <div className="border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-2 rounded-lg mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-800">Seleção de Habilidades</h3>
                    <p className="text-xs text-gray-600">
                      {podeMostrarSeletorHabilidades 
                        ? `${professorContexto?.disciplinaNome || ''} - ${professorContexto?.ano || ''} - ${trimestreAtualNome || ''}`
                        : 'Configure a modalidade para visualizar as habilidades'}
                    </p>
                  </div>
                </div>
                {loadingHabilidades && (
                  <div className="flex items-center space-x-2 text-indigo-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                    <span className="text-xs">Carregando...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Conteúdo do card */}
            <div className="p-4">
          {podeMostrarSeletorHabilidades ? (
            <>
              <SeletorHabilidades
                    habilidades={habilidadesDinamicas}
                habilidadesSelecionadas={habilidadesSelecionadasManualmente}
                onConfirmOriginal={confirmarSelecaoHabilidadesManualmente}
                disciplinaNome={professorContexto?.disciplinaNome || 'Disciplina não definida'}
                anoEnsino={professorContexto?.ano || 'Ano não definido'}
                disciplinaId={professorContexto?.disciplinaId}
                trimestre={trimestreAtualNome || undefined}
                modalidade={modalidadeSelecionada?.nome || 'Modalidade não definida'}
                professorId={professor ? (typeof professor.id === 'number' ? professor.id : parseInt(professor.id, 10)) : null}
                modalidadeId={modalidadeSelecionada ? (typeof modalidadeSelecionada.id === 'number' ? modalidadeSelecionada.id : parseInt(modalidadeSelecionada.id, 10)) : null}
                // Passando os dados da turma para o SeletorHabilidades
                turmaSelecionadaAnteriormente={
                  professorContexto && typeof professorContexto.turmaId === 'number' && professorContexto.turmaNome ? 
                  {
                    id: professorContexto.turmaId,
                    nome: professorContexto.turmaNome,
                    ano: professorContexto.ano, // Ano da turma (ex: 1º Ano)
                    modalidade_nome: modalidadeSelecionada?.nome // Modalidade geral (ex: Fundamental I)
                                                              // Se professorContexto tivesse modalidade específica da turma, usaríamos essa.
                  } : undefined
                }
              />
              {!loadingHabilidades && habilidadesDinamicas.length === 0 && (
                    <div className="text-center text-gray-500 py-6">
                      <div className="mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-base font-medium text-gray-700 mb-1">Nenhuma habilidade encontrada</p>
                      <p className="text-xs text-gray-500">
                        {statusCarregamento || 'Não foram encontradas habilidades para os critérios selecionados.'}
                      </p>
                </div>
              )}
            </>
          ) : (
                <div className="text-center text-gray-500 py-8">
                  <div className="mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h4 className="text-base font-medium text-gray-700 mb-2">
                    {!modalidadeSelecionada ? 'Selecione uma modalidade' : 'Carregando informações'}
                  </h4>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
              {statusCarregamento || 
               (!modalidadeSelecionada 
                      ? 'Para começar, selecione uma modalidade de ensino na seção acima.' 
                      : 'Aguardando informações de contexto e trimestre para carregar as habilidades.')}
                  </p>
            </div>
          )}
                         </div>
        </div>
      </div>
    </div>
  );
});

CriarPlanoAula.displayName = 'CriarPlanoAula';

export default CriarPlanoAula;