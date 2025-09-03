import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEscola } from '../context/EscolaContext';
import { useAuth } from '../context/AuthContext';
import { fetchDetalhesHabilidadeContextual } from '../services/apiPlanoAula';
import { getHabilidadesFormatadas } from '../services/MatrizCurricularService';
import { generateLessonPlanWithOpenAI, LessonPlanParams } from '../services/openaiService';
import { getProfessorByUserId, Professor } from '../services/ProfessorService';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { ArrowLeft, Settings, Sparkles, BookOpen, Users, Calendar, GraduationCap } from 'lucide-react';

interface HabilidadeDetalhada {
  codigo: string;
  descricao: string;
  praticasLinguagem?: string[];
  unidadesTematicas?: string[];
  erro?: boolean;
}

interface DadosRevisao {
  disciplinaNome: string;
  anoEnsino: string;
  disciplinaId: number;
  trimestre: string;
  modalidade: string;
  habilidadesSelecionadas: Array<{ codigo: string; descricao: string }>;
  professorId: number;
  modalidadeId: number;
  turmaId: number;
  turmaNome: string;
  turmaAno?: string;
  turmaModalidadeNome?: string;
}

const RevisaoPlanoAula: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { escolaAtiva } = useEscola();
  const { user } = useAuth();
  
  // Estados dos dados
  const [dados, setDados] = useState<DadosRevisao | null>(null);
  const [professor, setProfessor] = useState<Professor | null>(null);
  const [habilidadesDetalhadas, setHabilidadesDetalhadas] = useState<HabilidadeDetalhada[]>([]);
  const [quantidadeAlunos, setQuantidadeAlunos] = useState<number | null>(null);
  const [generosTextuais, setGenerosTextuais] = useState<string[]>([]);
  
  // Estados do formulário
  const [nomePlano, setNomePlano] = useState('');
  const [sugestaoIA, setSugestaoIA] = useState('');
  
  // Estados de loading
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingAlunos, setLoadingAlunos] = useState(false);
  const [isMelhorandoPrompt, setIsMelhorandoPrompt] = useState(false);
  
  // Estados de configuração IA
  const prevLocationStateRef = useRef<string | null>(null);

  
  // Estados do modal de habilidades
  const [showModalHabilidades, setShowModalHabilidades] = useState(false);
  const [habilidadesDisponiveis, setHabilidadesDisponiveis] = useState<Array<{id: string; codigo: string; descricao: string}>>([]);
  const [habilidadesSelecionadasModal, setHabilidadesSelecionadasModal] = useState<Record<string, boolean>>({});
  const [loadingHabilidades, setLoadingHabilidades] = useState(false);

  const isLinguaPortuguesa = dados?.disciplinaNome?.toLowerCase().includes('língua portuguesa') ?? false;

  // Carregar dados da navegação
  useEffect(() => {
    const dadosNavegacao = location.state as DadosRevisao;
    const currentLocationStateString = JSON.stringify(dadosNavegacao);

    if (currentLocationStateString !== prevLocationStateRef.current) {
      if (!dadosNavegacao) {
        toast.error('Dados de navegação não encontrados. Redirecionando...');
        // Evitar loop de navegação se já estiver na página de destino ou similar
        if (location.pathname !== '/planos-aula/criar') {
          navigate('/planos-aula/criar');
        }
        return;
      }
      
      setDados(dadosNavegacao);
      prevLocationStateRef.current = currentLocationStateString;
    }
  }, [location.state, navigate, location.pathname]);

  // Carregar dados do professor
  useEffect(() => {
    const carregarProfessor = async () => {
      if (!user?.email) return;
      
      try {
        const professorData = await getProfessorByUserId(user.email);
        setProfessor(professorData);
      } catch (error) {
        console.error('Erro ao carregar dados do professor:', error);
      }
    };

    carregarProfessor();
  }, [user?.email]);

  // Buscar quantidade de alunos
  const fetchQuantidadeAlunos = async (turmaId: number) => {
    if (!turmaId) return;
    setLoadingAlunos(true);
    try {
      const { count, error } = await supabase
        .from('alunos')
        .select('*', { count: 'exact', head: true })
        .eq('turma_id', turmaId);

      if (error) throw error;
      setQuantidadeAlunos(count ?? 0);
    } catch (error) {
      console.error('Erro ao buscar quantidade de alunos:', error);
      setQuantidadeAlunos(null);
    } finally {
      setLoadingAlunos(false);
    }
  };

  // Buscar gêneros textuais do trimestre
  const buscarGenerosTextuais = async () => {
    if (!dados) return;
    
    try {
      // Buscar na tabela matriz_curricular que contém os gêneros textuais
      const { data, error } = await supabase
        .from('matriz_curricular')
        .select('generos_textuais')
        .eq('disciplina_id', dados.disciplinaId)
        .eq('trimestre', dados.trimestre)
        .eq('ano', dados.anoEnsino);

      if (error) throw error;
      
      // Processar os gêneros textuais (podem estar separados por vírgula ou quebra de linha)
      const generosSet = new Set<string>();
      
      data?.forEach(item => {
        if (item.generos_textuais) {
          // Dividir por vírgula, quebra de linha ou ponto e vírgula
          const generos = item.generos_textuais
            .split(/[,;\n]/)
            .map((g: string) => g.trim())
            .filter((g: string) => g.length > 0);
          
          generos.forEach((genero: string) => generosSet.add(genero));
        }
      });
      
      const generosArray = Array.from(generosSet);
      
      if (generosArray.length === 0) {
        // Se não encontrou no banco, usar gêneros padrão para Língua Portuguesa
        setGenerosTextuais(['Lista', 'Agenda', 'Cartaz', 'Bilhete']);
      } else {
        setGenerosTextuais(generosArray);
      }
    } catch (error) {
      console.error('Erro ao buscar gêneros textuais:', error);
      // Fallback para gêneros padrão se não conseguir buscar do banco
      setGenerosTextuais(['Lista', 'Agenda', 'Cartaz', 'Bilhete']);
    }
  };

  // Buscar detalhes das habilidades
  useEffect(() => {
    if (!dados) return;

    const buscarDetalhes = async () => {
      setIsLoading(true);
      
      // Buscar quantidade de alunos
      fetchQuantidadeAlunos(dados.turmaId);

      // Buscar gêneros textuais do trimestre (apenas para Língua Portuguesa)
      if (isLinguaPortuguesa) {
        buscarGenerosTextuais();
      }

            // Processar habilidades da navegação
      if (dados.habilidadesSelecionadas && dados.habilidadesSelecionadas.length > 0) {
        const promessas = dados.habilidadesSelecionadas.map(async (hab) => {
          try {
            const detalhes = await fetchDetalhesHabilidadeContextual(
              hab.codigo, 
              dados.anoEnsino, 
              dados.trimestre, 
              dados.disciplinaId
            );
            return {
              codigo: hab.codigo,
              descricao: hab.descricao,
              praticasLinguagem: detalhes.praticasLinguagem,
              unidadesTematicas: detalhes.unidadesTematicas
            };
          } catch (error) {
            console.error(`Erro ao buscar detalhes para ${hab.codigo}:`, error);
            return {
              codigo: hab.codigo,
              descricao: hab.descricao,
              erro: true
            };
          }
        });

        try {
          const resultados = await Promise.all(promessas);
          setHabilidadesDetalhadas(resultados);
        } catch (error) {
          console.error('Erro ao processar habilidades:', error);
          toast.error('Erro ao carregar detalhes das habilidades');
        } finally {
          setIsLoading(false);
        }
        return;
      }

      // Se não há dados da navegação
      setHabilidadesDetalhadas([]);
      setIsLoading(false);
    };

    buscarDetalhes();
  }, [dados]);

  // Não gerar nome automaticamente - deixar vazio para o usuário digitar

  // Buscar habilidades disponíveis para adicionar
  const buscarHabilidadesDisponiveis = async () => {
    if (!dados) return;
    
    setLoadingHabilidades(true);
    try {
      // Usar a mesma função que já funciona no resto da aplicação
      console.log('Buscando habilidades para:', {
        disciplinaId: dados.disciplinaId,
        anoEnsino: dados.anoEnsino,
        trimestre: dados.trimestre
      });
      
      const todasHabilidades = await getHabilidadesFormatadas(
        dados.disciplinaId,
        dados.anoEnsino,
        dados.trimestre
      );

      // Filtrar habilidades que ainda não foram selecionadas
      const codigosJaSelecionados = habilidadesDetalhadas.map(h => h.codigo);
      const habilidadesNaoSelecionadas = todasHabilidades.filter(h => 
        !codigosJaSelecionados.includes(h.codigo)
      );
      
      setHabilidadesDisponiveis(habilidadesNaoSelecionadas);
      
      console.log('Habilidades disponíveis encontradas:', habilidadesNaoSelecionadas.length);
      console.log('Habilidades já selecionadas:', codigosJaSelecionados.length);
    } catch (error) {
      console.error('Erro ao buscar habilidades disponíveis:', error);
      toast.error('Erro ao carregar habilidades disponíveis');
    } finally {
      setLoadingHabilidades(false);
    }
  };

  // Abrir modal de habilidades
  const handleAbrirModalHabilidades = () => {
    setShowModalHabilidades(true);
    buscarHabilidadesDisponiveis();
  };

  // Remover habilidade da lista
  const handleRemoverHabilidade = (codigoHabilidade: string) => {
    const novasHabilidades = habilidadesDetalhadas.filter(h => h.codigo !== codigoHabilidade);
    setHabilidadesDetalhadas(novasHabilidades);
    toast.success('Habilidade removida com sucesso!');
  };

  // Adicionar habilidades selecionadas
  const handleAdicionarHabilidades = async () => {
    const habilidadesSelecionadas = habilidadesDisponiveis.filter(h => habilidadesSelecionadasModal[h.id]);
    
    if (habilidadesSelecionadas.length === 0) {
      toast.error('Nenhuma habilidade selecionada');
      return;
    }

    // Buscar detalhes das novas habilidades (práticas de linguagem e unidades temáticas)
    const promessas = habilidadesSelecionadas.map(async (hab) => {
      try {
        const detalhes = await fetchDetalhesHabilidadeContextual(
          hab.codigo, 
          dados!.anoEnsino, 
          dados!.trimestre, 
          dados!.disciplinaId
        );
        return {
          codigo: hab.codigo,
          descricao: hab.descricao,
          praticasLinguagem: detalhes.praticasLinguagem,
          unidadesTematicas: detalhes.unidadesTematicas
        };
      } catch (error) {
        console.error(`Erro ao buscar detalhes para ${hab.codigo}:`, error);
        return {
          codigo: hab.codigo,
          descricao: hab.descricao,
          praticasLinguagem: [],
          unidadesTematicas: [],
          erro: true
        };
      }
    });

    try {
      const novasHabilidades = await Promise.all(promessas);
      const habilidadesAtualizadas = [...habilidadesDetalhadas, ...novasHabilidades];
      setHabilidadesDetalhadas(habilidadesAtualizadas);
      toast.success(`${novasHabilidades.length} habilidade(s) adicionada(s) com sucesso!`);
    } catch (error) {
      console.error('Erro ao processar novas habilidades:', error);
      toast.error('Erro ao adicionar habilidades');
    }

    setShowModalHabilidades(false);
    setHabilidadesSelecionadasModal({});
  };

  const handleGerarPlano = async () => {
    if (!dados || !nomePlano.trim()) {
      toast.error('Por favor, defina um nome para o plano de aula');
      return;
    }

    if (habilidadesDetalhadas.length === 0) {
      toast.error('Selecione pelo menos uma habilidade para gerar o plano de aula');
      return;
    }

    if (!escolaAtiva?.id) {
      toast.error('Nenhuma escola ativa selecionada');
      return;
    }

    setIsGenerating(true);

    try {
      const params: LessonPlanParams = {
        disciplina: dados.disciplinaNome,
        serie: dados.anoEnsino,
        topico: 'Conteúdo baseado nas habilidades BNCC selecionadas',
        duracao: professor?.carga_horaria_semanal_total || '1 aula (aproximadamente 50 minutos)',
        objetivos: [],
        habilidadesBNCC: habilidadesDetalhadas.map(h => `${h.codigo}: ${h.descricao}`),
        recursos: [],
        metodologia: 'Metodologia baseada nas configurações do professor',
        avaliacao: 'Avaliação adequada aos objetivos propostos',
        observacoes: 'Plano gerado por IA com base nas configurações do professor',
        nomePlano: nomePlano.trim(),
        instrucoesAdicionais: sugestaoIA.trim() || 'Criar um plano de aula prático e engajador',
        abordagemPedagogica: 'Usar configurações da IA do professor',
        // Dados adicionais do sistema que estavam faltando
        nomeTurma: dados.turmaNome,
        modalidadeAula: dados.turmaModalidadeNome || dados.modalidade,
        trimestre: dados.trimestre,
        quantidadeAlunos: quantidadeAlunos || undefined,
        professorId: dados.professorId || undefined,
        escolaId: escolaAtiva.id,
        // Extrair gêneros textuais e objetos de conhecimento das habilidades se for Língua Portuguesa
        generosTextuais: dados.disciplinaNome?.toLowerCase().includes('língua portuguesa') 
          ? habilidadesDetalhadas.flatMap(h => h.praticasLinguagem || []).filter((v, i, a) => a.indexOf(v) === i)
          : undefined,
        objetosConhecimento: habilidadesDetalhadas.flatMap(h => h.unidadesTematicas || []).filter((v, i, a) => a.indexOf(v) === i),
        praticasLinguagem: dados.disciplinaNome?.toLowerCase().includes('língua portuguesa') 
          ? habilidadesDetalhadas.flatMap(h => h.praticasLinguagem || []).filter((v, i, a) => a.indexOf(v) === i)
          : undefined
      };

      const planoGerado = await generateLessonPlanWithOpenAI(params);

      if (!planoGerado?.trim()) {
        toast.error('A IA não conseguiu gerar o plano. Tente novamente.');
        return;
      }

      // Salvar no banco
      const { data: planoSalvo, error } = await supabase
        .from('planos_aula')
        .insert([{
          titulo: nomePlano.trim(),
          descricao: planoGerado,
          data: new Date().toISOString().split('T')[0],
          disciplina_id: dados.disciplinaId,
          turma_id: dados.turmaId,
          professor_id: dados.professorId,
          trimestre: dados.trimestre,
          modalidade_id: dados.modalidadeId,
          habilidades: dados.habilidadesSelecionadas.map(h => h.codigo),
          escola_id: escolaAtiva.id
        }])
        .select()
        .single();

      if (error) {
        console.error('Erro ao salvar plano:', error);
        toast.error('Erro ao salvar o plano de aula');
        return;
      }

      toast.success('Plano de aula gerado e salvo com sucesso!');
      
      // Salvar para abrir em tela cheia
      localStorage.setItem('planoParaAbrirEmTelaCheia', JSON.stringify(planoSalvo));
      
      // Navegar para lista de planos
      navigate('/planos-aula');

    } catch (error) {
      console.error('Erro ao gerar plano:', error);
      toast.error('Erro ao gerar o plano de aula');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVoltar = () => {
    navigate('/planos-aula/criar');
  };

  const handleConfigurarIA = () => {
    navigate('/planos-aula/configuracoes-ia', {
      state: { returnTo: location.pathname, returnState: location.state }
    });
  };

  // Função para melhorar automaticamente as instruções do professor
  const handleMelhorarPrompt = async () => {
    if (!sugestaoIA.trim()) {
      toast.error('Digite suas instruções primeiro para que eu possa melhorá-las!');
      return;
    }

    setIsMelhorandoPrompt(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/openai-prompt-optimizer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          originalPrompt: sugestaoIA.trim(),
          context: {
            disciplinaNome: dados?.disciplinaNome,
            anoEnsino: dados?.anoEnsino,
            modalidade: dados?.turmaModalidadeNome || dados?.modalidade,
            quantidadeAlunos: quantidadeAlunos,
            trimestre: dados?.trimestre
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro ao processar resposta do servidor' }));
        throw new Error(errorData.error || 'Erro na otimização do prompt');
      }

      const data = await response.json();
      const promptMelhorado = data.optimizedPrompt;

      if (promptMelhorado) {
        setSugestaoIA(promptMelhorado);
        toast.success('✨ Instruções melhoradas com sucesso! Revise e ajuste se necessário.');
      } else {
        toast.error('Não foi possível melhorar as instruções. Tente novamente.');
      }

    } catch (error: any) {
      console.error('Erro ao melhorar prompt:', error);
      toast.error(error.message || 'Erro ao melhorar as instruções. Verifique sua conexão.');
    } finally {
      setIsMelhorandoPrompt(false);
    }
  };

  if (!dados) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-500 border-t-transparent mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Gerando seu plano de aula...</h2>
          <p className="text-gray-600">A IA está trabalhando para criar o melhor plano para você! ✨</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Estilos para animações */}
        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
            20%, 40%, 60%, 80% { transform: translateX(2px); }
          }
          
          @keyframes glow {
            0% { box-shadow: 0 0 5px rgba(99, 102, 241, 0.5); }
            100% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.8), 0 0 30px rgba(99, 102, 241, 0.6); }
          }
          
          @keyframes shimmer {
            0% { transform: translateX(-100%) skewX(-12deg); }
            100% { transform: translateX(200%) skewX(-12deg); }
          }
        `}</style>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4 mt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleVoltar}
                className="flex items-center px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold rounded-lg transition-colors border border-indigo-200 shadow-sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </button>
              <div className="h-5 w-px bg-gray-300"></div>
              <h1 className="text-xl font-bold text-gray-800">Revisão e Configuração do Plano</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleConfigurarIA}
                className="flex items-center px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-all duration-300 text-sm relative overflow-hidden group"
                style={{
                  animation: 'shake 2s ease-in-out infinite, glow 2s ease-in-out infinite alternate',
                  boxShadow: '0 0 10px rgba(99, 102, 241, 0.5)'
                }}
              >
                {/* Efeito de brilho */}
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12"
                  style={{
                    animation: 'shimmer 3s ease-in-out infinite'
                  }}
                ></div>
                
                <Settings 
                  className="h-4 w-4 mr-1.5" 
                  style={{
                    animation: 'spin 3s linear infinite'
                  }}
                />
                Configurar IA
                
                {/* Indicador pulsante */}
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full"></div>
                </button>
              <div className="relative group">
                <button
                  onClick={handleGerarPlano}
                  disabled={!nomePlano.trim() || isLoading || habilidadesDetalhadas.length === 0}
                  className="flex items-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Gerar Plano de Aula
                </button>
                
                {/* Tooltip quando botão está desabilitado */}
                {(!nomePlano.trim() || isLoading || habilidadesDetalhadas.length === 0) && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10 pointer-events-none">
                    <div className="relative">
                      {!nomePlano.trim() 
                        ? 'Digite um nome para o plano de aula' 
                        : habilidadesDetalhadas.length === 0
                        ? 'Selecione pelo menos uma habilidade'
                        : 'Carregando...'}
                      {/* Seta do tooltip */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Layout em linha única horizontal */}
          <div className="flex flex-wrap gap-3 items-start">
            {/* 1. Escola */}
            <div className="flex-1 min-w-[200px] max-w-[250px] bg-indigo-50 border border-indigo-200 rounded-lg p-2">
              <div className="flex items-center mb-1">
                <BookOpen className="h-3 w-3 text-indigo-600 mr-1" />
                <label className="text-xs font-semibold text-indigo-700">Escola:</label>
              </div>
              <p className="text-indigo-800 font-medium text-xs leading-tight truncate">{escolaAtiva?.nome || 'Não informada'}</p>
            </div>

            {/* 2. Modalidade */}
            {dados.turmaModalidadeNome && (
              <div className="flex-1 min-w-[140px] max-w-[180px] bg-purple-50 border border-purple-200 rounded-lg p-2">
                <div className="flex items-center mb-1">
                  <BookOpen className="h-3 w-3 text-purple-600 mr-1" />
                  <label className="text-xs font-semibold text-purple-700">Modalidade:</label>
                </div>
                <p className="text-purple-800 text-xs leading-tight truncate">{dados.turmaModalidadeNome}</p>
              </div>
            )}
            
            {/* 3. Trimestre */}
            <div className="flex-shrink-0 w-[110px] bg-orange-50 border border-orange-200 rounded-lg p-2">
              <div className="flex items-center mb-1">
                <Calendar className="h-3 w-3 text-orange-600 mr-1" />
                <label className="text-xs font-semibold text-orange-700">Trimestre:</label>
              </div>
              <p className="text-orange-800 text-xs leading-tight">{dados.trimestre}</p>
            </div>
            
            {/* 4. Turma */}
            <div className="flex-1 min-w-[160px] max-w-[200px] bg-blue-50 border border-blue-200 rounded-lg p-2">
              <div className="flex items-center mb-1">
                <Users className="h-3 w-3 text-blue-600 mr-1" />
                <label className="text-xs font-semibold text-blue-700">Turma:</label>
              </div>
              <p className="text-blue-800 font-medium text-xs leading-tight">
                {dados.turmaNome} - {loadingAlunos ? 'Carregando...' : `${quantidadeAlunos ?? 'N/A'} alunos`}
              </p>
            </div>

            {/* 5. Disciplina */}
            <div className="flex-1 min-w-[140px] max-w-[180px] bg-teal-50 border border-teal-200 rounded-lg p-2">
              <div className="flex items-center mb-1">
                <BookOpen className="h-3 w-3 text-teal-600 mr-1" />
                <label className="text-xs font-semibold text-teal-700">Disciplina:</label>
              </div>
              <p className="text-teal-800 text-xs leading-tight truncate">{dados.disciplinaNome}</p>
            </div>
            
            {/* 6. Ano */}
            <div className="flex-shrink-0 w-[90px] bg-rose-50 border border-rose-200 rounded-lg p-2">
              <div className="flex items-center mb-1">
                <GraduationCap className="h-3 w-3 text-rose-600 mr-1" />
                <label className="text-xs font-semibold text-rose-700">Ano:</label>
              </div>
              <p className="text-rose-800 text-xs leading-tight">{dados.anoEnsino}</p>
            </div>
            
            {/* 7. Carga Horária */}
            <div className="flex-shrink-0 w-[120px] bg-green-50 border border-green-200 rounded-lg p-2">
              <div className="flex items-center mb-1">
                <svg className="h-3 w-3 text-green-600 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <label className="text-xs font-semibold text-green-700">Carga:</label>
              </div>
              <p className="text-green-800 text-xs leading-tight">50min/aula</p>
            </div>
          </div>
        </div>

        {/* Habilidades Selecionadas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-semibold text-gray-800 flex items-center">
              <svg className="h-4 w-4 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Habilidades Selecionadas ({habilidadesDetalhadas.length})
            </h2>
            
            {/* Seção direita com Gêneros e Botão Adicionar */}
            <div className="flex items-center space-x-4">
              {/* Gêneros Textuais do Trimestre - Compacto */}
              {isLinguaPortuguesa && generosTextuais.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-gray-600">Gêneros do {dados?.trimestre}:</span>
                  <div className="flex flex-wrap gap-1 max-w-md">
                    {generosTextuais.slice(0, 4).map((genero, index) => (
                      <span 
                        key={index}
                        className="inline-block bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full border border-amber-200 truncate"
                        title={genero}
                      >
                        {genero}
                      </span>
                    ))}
                    {generosTextuais.length > 4 && (
                      <div className="relative group">
                        <span 
                          className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full border border-gray-200 cursor-help hover:bg-gray-200 transition-colors duration-150"
                        >
                          +{generosTextuais.length - 4}
                        </span>
                        
                        {/* Tooltip customizado com aparição rápida */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-nowrap z-20 pointer-events-none">
                          <div className="relative">
                            Mais {generosTextuais.length - 4} gêneros: {generosTextuais.slice(4).join(', ')}
                            {/* Seta do tooltip */}
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-800"></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Botão Adicionar Habilidades */}
              <button
                onClick={handleAbrirModalHabilidades}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-medium rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5"
                title="Adicionar mais habilidades"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Adicionar Habilidades</span>
              </button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mr-3"></div>
              <span className="text-gray-600 text-sm">Carregando detalhes das habilidades...</span>
            </div>
          ) : habilidadesDetalhadas.length === 0 ? (
            <div className="text-center py-6 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="mb-3">
                <svg className="h-12 w-12 text-yellow-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-yellow-800 mb-2">Nenhuma habilidade selecionada</h3>
              <p className="text-yellow-700 text-sm mb-4">
                Para gerar um plano de aula, você precisa selecionar pelo menos uma habilidade da BNCC.
              </p>
              <button
                onClick={handleAbrirModalHabilidades}
                className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white font-medium rounded-lg hover:bg-yellow-700 transition-colors"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Selecionar Habilidades
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-2">
              {habilidadesDetalhadas.map((hab, index) => (
                <div key={index} className="bg-gray-50 p-1.5 rounded-md border border-gray-200 hover:border-indigo-300 transition-colors relative group">
                  {/* Botão de remover */}
                  <button
                    onClick={() => handleRemoverHabilidade(hab.codigo)}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 z-10"
                    title="Remover habilidade"
                  >
                    ×
                  </button>
                  
                  {/* Código e Descrição em linha */}
                  <div className="flex items-start gap-1.5 mb-1">
                    <span className="inline-block bg-indigo-600 text-white text-xs font-bold px-1.5 py-0.5 rounded flex-shrink-0">
                      {hab.codigo}
                    </span>
                    <p className="text-gray-800 text-xs leading-tight flex-1 line-clamp-2">
                      {hab.descricao}
                    </p>
                  </div>
                  
                  {/* Erro */}
                  {hab.erro && (
                    <div className="mt-0.5">
                      <span className="text-red-500 text-xs">Erro ao buscar detalhes</span>
                    </div>
                  )}
                  
                  {/* Práticas de Linguagem - Compactas */}
                  {isLinguaPortuguesa && hab.praticasLinguagem && hab.praticasLinguagem.length > 0 && (
                    <div className="mt-1 p-1 bg-blue-50 rounded border border-blue-200">
                      <p className="text-xs text-blue-600 leading-tight">
                        <span className="font-medium">Práticas:</span> {hab.praticasLinguagem.join(', ')}
                      </p>
                    </div>
                  )}
                  
                  {/* Unidades Temáticas - Compactas */}
                  {isLinguaPortuguesa && hab.unidadesTematicas && hab.unidadesTematicas.length > 0 && (
                    <div className="mt-1 p-1 bg-purple-50 rounded border border-purple-200">
                      <p className="text-xs text-purple-600 leading-tight">
                        <span className="font-medium">Unidades:</span> {hab.unidadesTematicas.join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Configuração do Plano */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-800 flex items-center">
              <svg className="h-4 w-4 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Configuração do Plano de Aula
            </h2>
            
            {/* Indicador de Status */}
            <div className="flex items-center space-x-2">
              <div className={`h-2 w-2 rounded-full ${
                nomePlano.trim() && habilidadesDetalhadas.length > 0 
                  ? 'bg-green-500' 
                  : 'bg-gray-300'
              }`}></div>
              <span className="text-xs text-gray-600">
                {!nomePlano.trim() 
                  ? 'Nome obrigatório' 
                  : habilidadesDetalhadas.length === 0
                  ? 'Selecione habilidades'
                  : 'Pronto para gerar'}
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            {/* Nome do Plano - Destaque */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-2">
              <label className="block text-sm font-semibold text-indigo-800 mb-1.5 flex items-center">
                <svg className="h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                Nome do Plano de Aula *
              </label>
              <input
                type="text"
                value={nomePlano}
                onChange={(e) => setNomePlano(e.target.value)}
                className="w-full px-3 py-2 border border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white/80 backdrop-blur-sm"
                placeholder="Escreva aqui o nome do seu plano de aula"
                required
                style={{
                  cursor: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'20\' viewBox=\'0 0 16 20\'%3E%3Cpath d=\'M8 0 L8 20 M4 2 L12 2 M4 18 L12 18\' stroke=\'%23000000\' stroke-width=\'2\' fill=\'none\'/%3E%3C/svg%3E") 8 10, text',
                  caretColor: '#000000'
                }}
              />
            </div>
            
            {/* Instruções para IA - Compacto */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
              <label className="block text-sm font-medium text-amber-800 mb-1.5 flex items-center justify-between">
                <div className="flex items-center">
                <svg className="h-3.5 w-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Instruções Especiais para a IA
                <span className="ml-2 text-xs bg-amber-200 text-amber-700 px-1.5 py-0.5 rounded-full">Opcional</span>
                </div>
                
                {/* Botão de Melhoria Automática */}
                <button
                  onClick={handleMelhorarPrompt}
                  disabled={!sugestaoIA.trim() || isMelhorandoPrompt}
                  className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium transition-all duration-200 ${
                    !sugestaoIA.trim() 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : isMelhorandoPrompt
                        ? 'bg-purple-100 text-purple-600 cursor-wait'
                        : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-sm hover:shadow-md transform hover:scale-105'
                  }`}
                  title={!sugestaoIA.trim() ? 'Digite suas instruções primeiro' : 'Melhorar automaticamente suas instruções'}
                >
                  {isMelhorandoPrompt ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border border-purple-600 border-t-transparent"></div>
                      <span>Melhorando...</span>
                    </>
                  ) : (
                    <>
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>✨ Melhorar</span>
                    </>
                  )}
                </button>
              </label>
              
              <div className="relative">
              <textarea
                value={sugestaoIA}
                onChange={(e) => {
                  const texto = e.target.value;
                  if (texto.length <= 500) {
                    setSugestaoIA(texto);
                  } else {
                    // Mostrar aviso quando tentar ultrapassar o limite
                    toast.error('Limite de 500 caracteres atingido!');
                  }
                }}
                  rows={3}
                maxLength={500}
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm resize-none bg-white/80 backdrop-blur-sm"
                placeholder="Ex: Focar em atividades lúdicas, incluir jogos educativos, usar metodologia ativa..."
                style={{
                  cursor: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'20\' viewBox=\'0 0 16 20\'%3E%3Cpath d=\'M8 0 L8 20 M4 2 L12 2 M4 18 L12 18\' stroke=\'%23000000\' stroke-width=\'2\' fill=\'none\'/%3E%3C/svg%3E") 8 10, text',
                  caretColor: '#000000'
                }}
              />
                
                {/* Overlay de loading durante melhoria */}
                {isMelhorandoPrompt && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <div className="flex items-center space-x-2 text-purple-600">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
                      <span className="text-sm font-medium">Aprimorando suas instruções...</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between mt-1.5">
                <div className="flex items-center space-x-2">
                <p className="text-xs text-amber-700">
                  💡 Dica: Seja específico para melhores resultados
                </p>
                  {sugestaoIA.trim() && (
                    <div className="flex items-center space-x-1 text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>Clique em "✨ Melhorar" para otimizar</span>
                    </div>
                  )}
                </div>
                <span className={`text-xs ${
                  sugestaoIA.length >= 450 
                    ? 'text-red-600 font-semibold' 
                    : sugestaoIA.length >= 400 
                      ? 'text-orange-600 font-medium' 
                      : 'text-amber-600'
                }`}>
                  {sugestaoIA.length}/500 caracteres
                  {sugestaoIA.length >= 450 && (
                    <span className="ml-1">⚠️</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Adicionar Habilidades */}
        {showModalHabilidades && (
          <div className="fixed inset-0 backdrop-blur-sm bg-white/10 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
              {/* Header do Modal */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <svg className="h-5 w-5 text-emerald-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Adicionar Habilidades
                </h3>
                <button
                  onClick={() => setShowModalHabilidades(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Conteúdo do Modal */}
              <div className="flex-1 overflow-y-auto p-4">
                {loadingHabilidades ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mr-3"></div>
                    <span className="text-gray-600">Carregando habilidades...</span>
                  </div>
                ) : habilidadesDisponiveis.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-gray-600 text-lg font-medium">Todas as habilidades já foram selecionadas!</p>
                    <p className="text-gray-500 text-sm mt-1">Não há mais habilidades disponíveis para este trimestre.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 mb-4">
                      Selecione as habilidades que deseja adicionar ao plano de aula:
                    </p>
                    
                    {habilidadesDisponiveis.map((habilidade) => (
                      <div
                        key={habilidade.id}
                        className={`border rounded-lg p-3 cursor-pointer transition-all duration-200 ${
                          habilidadesSelecionadasModal[habilidade.id]
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-25'
                        }`}
                        onClick={() => setHabilidadesSelecionadasModal(prev => ({
                          ...prev,
                          [habilidade.id]: !prev[habilidade.id]
                        }))}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                            habilidadesSelecionadasModal[habilidade.id]
                              ? 'border-emerald-500 bg-emerald-500'
                              : 'border-gray-300'
                          }`}>
                            {habilidadesSelecionadasModal[habilidade.id] && (
                              <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="inline-block bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded">
                                {habilidade.codigo}
                              </span>
                            </div>
                            <p className="text-sm text-gray-800 leading-relaxed">
                              {habilidade.descricao}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer do Modal */}
              {!loadingHabilidades && habilidadesDisponiveis.length > 0 && (
                <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
                  <div className="text-sm text-gray-600">
                    {Object.values(habilidadesSelecionadasModal).filter(Boolean).length} habilidade(s) selecionada(s)
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowModalHabilidades(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleAdicionarHabilidades}
                      disabled={Object.values(habilidadesSelecionadasModal).filter(Boolean).length === 0}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Adicionar Selecionadas
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default RevisaoPlanoAula;