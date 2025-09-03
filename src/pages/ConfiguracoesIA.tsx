import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEscola } from '../context/EscolaContext';
import { getProfessorComModalidades } from '../services/ProfessorService';
import { ProfessorIAConfigService } from '../services/ProfessorIAConfigService';
import { 
  ProfessorIAConfiguracoes, 
  METODOLOGIAS_OPCOES, 
  ESTILOS_ENSINO_OPCOES,
  NIVEL_DETALHAMENTO_OPCOES,
  FORMATO_PREFERIDO_OPCOES,
  LINGUAGEM_NIVEL_OPCOES} from '../types/ProfessorIAConfig';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  Save, 
  Settings, 
  BookOpen, 
  Users, 
  Palette, 
  MessageSquare,
  CheckCircle,
  Info,
  Sparkles
} from 'lucide-react';

const ConfiguracoesIA: React.FC = memo(() => {
  const { user } = useAuth();
  const { escolaAtiva } = useEscola();
  const navigate = useNavigate();
  const location = useLocation();

  const [configuracoes, setConfiguracoes] = useState<ProfessorIAConfiguracoes | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [professorId, setProfessorId] = useState<number | null>(null);
  const [dadosCarregados, setDadosCarregados] = useState(false);

  // Memoizar os IDs para evitar re-renderizações desnecessárias
  const userId = useMemo(() => user?.email, [user?.email]);
  const escolaId = useMemo(() => escolaAtiva?.id, [escolaAtiva?.id]);

  const carregarDados = useCallback(async () => {
    if (!userId || !escolaId || dadosCarregados) return;

    const abortController = new AbortController();

    try {
      setLoading(true);
      
      // Buscar dados do professor
      const professor = await getProfessorComModalidades(userId);
      
      // Verificar se o componente ainda está montado antes de continuar
      if (abortController.signal.aborted) return;
      
      if (!professor || !professor.id) {
        toast.error('Dados do professor não encontrados');
        navigate('/planos-aula/criar');
        return;
      }

      const profId = typeof professor.id === 'number' ? professor.id : parseInt(professor.id, 10);
      
      // Verificar se o componente ainda está montado antes de atualizar o estado
      if (abortController.signal.aborted) return;
      setProfessorId(profId);

      // Buscar configurações existentes ou usar padrão
      const config = await ProfessorIAConfigService.getConfiguracaoesOuPadrao(profId, escolaId);
      
      // Verificar se o componente ainda está montado antes de atualizar o estado
      if (abortController.signal.aborted) return;
      setConfiguracoes(config);
      setDadosCarregados(true);

    } catch (error) {
      // Só mostrar erro se o componente ainda estiver montado
      if (!abortController.signal.aborted) {
        console.error('Erro ao carregar configurações:', error);
        toast.error('Erro ao carregar configurações');
      }
    } finally {
      // Só atualizar loading se o componente ainda estiver montado
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
    }

    // Retornar função de cleanup para abortar operações pendentes
    return () => {
      abortController.abort();
    };
  }, [userId, escolaId, dadosCarregados, navigate]);

  useEffect(() => {
    const cleanup = carregarDados();
    return () => {
      // Se carregarDados retornar uma função de cleanup, executá-la
      if (cleanup && typeof cleanup.then === 'function') {
        cleanup.then(cleanupFn => {
          if (typeof cleanupFn === 'function') {
            cleanupFn();
          }
        });
      }
    };
  }, [carregarDados]);

  // Reset dos dados carregados quando usuário ou escola mudam
  useEffect(() => {
    setDadosCarregados(false);
    setConfiguracoes(null);
    setProfessorId(null);
  }, [userId, escolaId]);

  const handleSalvar = useCallback(async () => {
    if (!configuracoes || !professorId || !escolaAtiva) return;

    const abortController = new AbortController();

    try {
      if (abortController.signal.aborted) return;
      setSaving(true);
      
      await ProfessorIAConfigService.salvarConfiguracoes(configuracoes);
      
      if (abortController.signal.aborted) return;
      toast.success('Configurações salvas com sucesso!');
      
      // Verificar se veio da página de revisão
      const state = location.state as { returnTo?: string; returnState?: any };
      if (state?.returnTo && state?.returnState) {
        navigate(state.returnTo, { state: state.returnState });
      } else {
        navigate('/planos-aula/criar');
      }
    } catch (error) {
      if (!abortController.signal.aborted) {
        console.error('Erro ao salvar configurações:', error);
        toast.error('Erro ao salvar configurações');
      }
    } finally {
      if (!abortController.signal.aborted) {
        setSaving(false);
      }
    }
  }, [configuracoes, professorId, escolaAtiva, location.state, navigate]);

  const handleVoltar = useCallback(() => {
    // Verificar se veio da página de revisão
    const state = location.state as { returnTo?: string; returnState?: any };
    if (state?.returnTo && state?.returnState) {
      navigate(state.returnTo, { state: state.returnState });
    } else {
      navigate('/planos-aula/criar');
    }
  }, [location.state, navigate]);

  const updateConfig = useCallback((field: keyof ProfessorIAConfiguracoes, value: any) => {
    if (!configuracoes) return;
    setConfiguracoes(prev => prev ? {
      ...prev,
      [field]: value
    } : null);
  }, [configuracoes]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/50">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-200"></div>
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-transparent border-t-indigo-600 absolute top-0 left-0"></div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Carregando Configurações</h3>
              <p className="text-sm text-slate-600">Preparando suas preferências...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!configuracoes) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-600 mb-2">Erro ao carregar configurações</h2>
          <button
            onClick={handleVoltar}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
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
              <h1 className="text-xl font-bold text-gray-800">Configurações da IA</h1>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleSalvar}
                disabled={saving}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2"></div>
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
          
          <p className="text-sm text-gray-600">Personalize como a IA criará seus planos de aula</p>
        </div>

        {/* Informação sobre persistência */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-4">
          <div className="flex items-start space-x-3">
            <Info className="h-4 w-4 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-blue-800 mb-1">Configurações Persistentes</h3>
              <p className="text-xs text-blue-700">
                Essas configurações serão aplicadas automaticamente a todos os seus futuros planos de aula. 
                Você pode alterá-las a qualquer momento retornando a esta tela.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Seção: Abordagem Pedagógica */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            <div className="flex items-center space-x-2 mb-3">
              <BookOpen className="h-4 w-4 text-green-600" />
              <div>
                <h2 className="text-base font-semibold text-gray-800">Abordagem Pedagógica</h2>
                <p className="text-xs text-gray-600">Defina sua metodologia e estilo de ensino preferidos</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Metodologia */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Metodologia Preferida
                </label>
                <select
                  value={configuracoes.metodologia_preferida || ''}
                  onChange={(e) => updateConfig('metodologia_preferida', e.target.value || undefined)}
                  className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                >
                  <option value="">Selecione uma metodologia</option>
                  {METODOLOGIAS_OPCOES.map(opcao => (
                    <option key={opcao.value} value={opcao.value}>
                      {opcao.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Estilo de Ensino */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Estilo de Ensino
                </label>
                <select
                  value={configuracoes.estilo_ensino || ''}
                  onChange={(e) => updateConfig('estilo_ensino', e.target.value || undefined)}
                  className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                >
                  <option value="">Selecione um estilo</option>
                  {ESTILOS_ENSINO_OPCOES.map(opcao => (
                    <option key={opcao.value} value={opcao.value}>
                      {opcao.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Seção: Formato e Detalhamento */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            <div className="flex items-center space-x-2 mb-3">
              <Palette className="h-4 w-4 text-purple-600" />
              <div>
                <h2 className="text-base font-semibold text-gray-800">Formato e Detalhamento</h2>
                <p className="text-xs text-gray-600">Configure como os planos devem ser estruturados</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Nível de Detalhamento */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nível de Detalhamento
                </label>
                <div className="space-y-1">
                  {NIVEL_DETALHAMENTO_OPCOES.map(opcao => (
                    <label key={opcao.value} className="flex items-start space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="nivel_detalhamento"
                        value={opcao.value}
                        checked={configuracoes.nivel_detalhamento === opcao.value}
                        onChange={(e) => updateConfig('nivel_detalhamento', e.target.value)}
                        className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-800">{opcao.label}</div>
                        <div className="text-xs text-gray-600">{opcao.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Formato Preferido */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Formato Preferido
                </label>
                <div className="space-y-1">
                  {FORMATO_PREFERIDO_OPCOES.map(opcao => (
                    <label key={opcao.value} className="flex items-start space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="formato_preferido"
                        value={opcao.value}
                        checked={configuracoes.formato_preferido === opcao.value}
                        onChange={(e) => updateConfig('formato_preferido', e.target.value)}
                        className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-800">{opcao.label}</div>
                        <div className="text-xs text-gray-600">{opcao.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Nível de Linguagem */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nível de Linguagem
                </label>
                <div className="space-y-1">
                  {LINGUAGEM_NIVEL_OPCOES.map(opcao => (
                    <label key={opcao.value} className="flex items-start space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="linguagem_nivel"
                        value={opcao.value}
                        checked={configuracoes.linguagem_nivel === opcao.value}
                        onChange={(e) => updateConfig('linguagem_nivel', e.target.value)}
                        className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-800">{opcao.label}</div>
                        <div className="text-xs text-gray-600">{opcao.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Seção: Elementos a Incluir */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            <div className="flex items-center space-x-2 mb-3">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <div>
                <h2 className="text-base font-semibold text-gray-800">Elementos a Incluir</h2>
                <p className="text-xs text-gray-600">Escolha quais componentes devem estar presentes nos planos</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {[
                { key: 'incluir_atividades_praticas', label: 'Atividades Práticas', description: 'Exercícios e dinâmicas práticas' },
                { key: 'incluir_recursos_digitais', label: 'Recursos Digitais', description: 'Ferramentas e materiais digitais' },
                { key: 'incluir_avaliacao', label: 'Métodos de Avaliação', description: 'Formas de avaliar o aprendizado' },
                { key: 'incluir_materiais_necessarios', label: 'Lista de Materiais', description: 'Materiais necessários para a aula' },
                { key: 'incluir_tempo_estimado', label: 'Tempo Estimado', description: 'Duração de cada atividade' }
              ].map(item => (
                <label key={item.key} className="flex items-start space-x-2 p-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={Boolean(configuracoes[item.key as keyof ProfessorIAConfiguracoes])}
                    onChange={(e) => updateConfig(item.key as keyof ProfessorIAConfiguracoes, e.target.checked)}
                    className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-800">{item.label}</div>
                    <div className="text-xs text-gray-600">{item.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Seção: Considerações Especiais */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            <div className="flex items-center space-x-2 mb-3">
              <Users className="h-4 w-4 text-orange-600" />
              <div>
                <h2 className="text-base font-semibold text-gray-800">Considerações Especiais</h2>
                <p className="text-xs text-gray-600">Aspectos importantes para adaptar os planos</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {[
                { key: 'considerar_inclusao', label: 'Práticas Inclusivas', description: 'Adaptações para alunos com necessidades especiais' },
                { key: 'considerar_diversidade', label: 'Diversidade Cultural', description: 'Respeito à diversidade cultural e social' },
                { key: 'adaptar_para_recursos_limitados', label: 'Recursos Limitados', description: 'Adaptações para escolas com poucos recursos' }
              ].map(item => (
                <label key={item.key} className="flex items-start space-x-2 p-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={Boolean(configuracoes[item.key as keyof ProfessorIAConfiguracoes])}
                    onChange={(e) => updateConfig(item.key as keyof ProfessorIAConfiguracoes, e.target.checked)}
                    className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-800">{item.label}</div>
                    <div className="text-xs text-gray-600">{item.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Seção: Configurações Específicas do Trimestre */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            <div className="flex items-center space-x-2 mb-3">
              <Settings className="h-4 w-4 text-indigo-600" />
              <div>
                <h2 className="text-base font-semibold text-gray-800">Configurações Específicas</h2>
                <p className="text-xs text-gray-600">Informações importantes para personalizar os planos</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Preferências de Avaliação
                </label>
                <input
                  type="text"
                  value={configuracoes.preferencias_avaliacao || ''}
                  onChange={(e) => updateConfig('preferencias_avaliacao', e.target.value || undefined)}
                  placeholder="Ex: Portfólio, rubricas, autoavaliação, projetos"
                  className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Recursos Disponíveis
                </label>
                <input
                  type="text"
                  value={configuracoes.recursos_disponiveis || ''}
                  onChange={(e) => updateConfig('recursos_disponiveis', e.target.value || undefined)}
                  placeholder="Ex: Projetor, tablets, laboratório, biblioteca"
                  className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Efemérides do Período
                </label>
                <input
                  type="text"
                  value={configuracoes.efemerides_periodo || ''}
                  onChange={(e) => updateConfig('efemerides_periodo', e.target.value || undefined)}
                  placeholder="Ex: Dia do Livro, Festa Junina, Semana da Pátria"
                  className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Eventos Escolares
                </label>
                <input
                  type="text"
                  value={configuracoes.eventos_escolares || ''}
                  onChange={(e) => updateConfig('eventos_escolares', e.target.value || undefined)}
                  placeholder="Ex: Feira de Ciências, Mostra Cultural, Olimpíadas Escolares"
                  className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
                />
              </div>
            </div>
          </div>

          {/* Seção: Observações Personalizadas */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            <div className="flex items-center space-x-2 mb-3">
              <MessageSquare className="h-4 w-4 text-teal-600" />
              <div>
                <h2 className="text-base font-semibold text-gray-800">Observações Personalizadas</h2>
                <p className="text-xs text-gray-600">Informações específicas sobre seu contexto de ensino</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Contexto da Escola
                </label>
                <textarea
                  value={configuracoes.contexto_escola || ''}
                  onChange={(e) => updateConfig('contexto_escola', e.target.value || undefined)}
                  placeholder="Ex: Escola rural, comunidade carente, escola particular, etc."
                  className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none text-sm"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Observações Especiais
                </label>
                <textarea
                  value={configuracoes.observacoes_especiais || ''}
                  onChange={(e) => updateConfig('observacoes_especiais', e.target.value || undefined)}
                  placeholder="Ex: Turma muito agitada, alunos com dificuldades específicas, recursos disponíveis, etc."
                  className="w-full p-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none text-sm"
                  rows={3}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer com informação e botão salvar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <Sparkles className="h-3 w-3" />
              <span>Suas configurações serão aplicadas automaticamente aos próximos planos</span>
            </div>
            
            <button
              onClick={handleSalvar}
              disabled={saving}
              className="flex items-center px-3 py-1.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-white/30 border-t-white mr-1.5"></div>
              ) : (
                <Save className="h-3 w-3 mr-1.5" />
              )}
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

ConfiguracoesIA.displayName = 'ConfiguracoesIA';

export default ConfiguracoesIA; 