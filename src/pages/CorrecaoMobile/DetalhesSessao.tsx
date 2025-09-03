import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Camera, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Eye,
  Download,
  RefreshCw,
  BarChart3,
  Users,
  FileText,
  Zap,
  TrendingUp,
  Award
} from 'lucide-react';
import { correcaoMobileService, SessaoCorrecao, AvaliacaoEscaneada, EstatisticasSessao } from '../../services/correcaoMobileService';

const DetalhesSessaoPage: React.FC = () => {
  const { sessaoId } = useParams<{ sessaoId: string }>();
  const navigate = useNavigate();
  
  const [sessao, setSessao] = useState<SessaoCorrecao | null>(null);
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoEscaneada[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasSessao | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (sessaoId) {
      carregarDados();
    }
  }, [sessaoId]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!sessaoId) return;

      const response = await correcaoMobileService.obterDetalhesSessao(sessaoId);
      setSessao(response.sessao);
      setAvaliacoes(response.avaliacoesEscaneadas);
      setEstatisticas(response.estatisticas);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setError('Erro ao carregar dados da sessão');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await carregarDados();
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processando':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'corrigida':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'erro':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'revisao_necessaria':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Clock className="w-4 h-4" />;
      case 'processando':
        return <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      case 'corrigida':
        return <CheckCircle className="w-4 h-4" />;
      case 'erro':
        return <AlertCircle className="w-4 h-4" />;
      case 'revisao_necessaria':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getNotaColor = (nota: number) => {
    if (nota >= 8) return 'text-green-600';
    if (nota >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando detalhes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Erro ao carregar dados
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => navigate(-1)}
              className="bg-gray-600 text-white py-2 px-4 rounded-lg font-medium"
            >
              Voltar
            </button>
            <button
              onClick={carregarDados}
              className="bg-blue-600 text-white py-2 px-4 rounded-lg font-medium"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {sessao?.titulo}
                </h1>
                <p className="text-sm text-gray-600">
                  {sessao?.avaliacao_titulo}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => navigate(`/correcao-mobile/sessao/${sessaoId}/escanear`)}
                className="bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-blue-700 transition-colors"
              >
                <Camera className="w-4 h-4" />
                Escanear
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Estatísticas Gerais */}
        {estatisticas && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Escaneadas</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {estatisticas.total_escaneadas}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Corrigidas</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {estatisticas.total_corrigidas}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pendentes</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {estatisticas.total_pendentes}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Award className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Média</p>
                  <p className={`text-xl font-semibold ${estatisticas.media_notas ? getNotaColor(estatisticas.media_notas) : 'text-gray-900'}`}>
                    {estatisticas.media_notas ? estatisticas.media_notas.toFixed(1) : '--'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Barra de Progresso */}
        {estatisticas && (
          <div className="bg-white rounded-lg p-4 border border-gray-200 mb-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-gray-900">Progresso da Correção</h3>
              <span className="text-sm text-gray-600">
                {Math.round(estatisticas.percentual_conclusao)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${estatisticas.percentual_conclusao}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>
        )}

        {/* Lista de Avaliações */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-medium text-gray-900">
              Provas Escaneadas ({avaliacoes.length})
            </h3>
          </div>

          {avaliacoes.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">
                Nenhuma prova escaneada ainda
              </p>
              <button
                onClick={() => navigate(`/correcao-mobile/sessao/${sessaoId}/escanear`)}
                className="bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Começar a Escanear
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {avaliacoes.map((avaliacao, index) => (
                <div key={avaliacao.id} className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Thumbnail da imagem */}
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={avaliacao.imagem_url}
                        alt={`Prova ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Informações */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            Prova #{index + 1}
                          </h4>
                          {avaliacao.nome_aluno_detectado && (
                            <p className="text-sm text-gray-600">
                              {avaliacao.nome_aluno_detectado}
                            </p>
                          )}
                          {avaliacao.matricula_detectada && (
                            <p className="text-xs text-gray-500">
                              Matrícula: {avaliacao.matricula_detectada}
                            </p>
                          )}
                        </div>
                        
                        <div className={`px-2 py-1 rounded-full border text-xs font-medium flex items-center gap-1 ${getStatusColor(avaliacao.status)}`}>
                          {getStatusIcon(avaliacao.status)}
                          {avaliacao.status === 'pendente' && 'Pendente'}
                          {avaliacao.status === 'processando' && 'Processando'}
                          {avaliacao.status === 'corrigida' && 'Corrigida'}
                          {avaliacao.status === 'erro' && 'Erro'}
                          {avaliacao.status === 'revisao_necessaria' && 'Revisão'}
                        </div>
                      </div>

                      {/* Nota e Percentual */}
                      {avaliacao.status === 'corrigida' && (
                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Nota:</span>
                            <span className={`font-semibold ${avaliacao.nota_final ? getNotaColor(avaliacao.nota_final) : 'text-gray-900'}`}>
                              {avaliacao.nota_final?.toFixed(1) || '--'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Acerto:</span>
                            <span className="font-semibold text-blue-600">
                              {avaliacao.percentual_acerto?.toFixed(0) || '--'}%
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Feedback da IA */}
                      {avaliacao.feedback_ia && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                          <p className="text-sm text-blue-800">
                            <strong>Feedback IA:</strong> {avaliacao.feedback_ia}
                          </p>
                        </div>
                      )}

                      {/* Timestamp */}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>
                          Escaneada: {new Date(avaliacao.created_at).toLocaleString('pt-BR')}
                        </span>
                        {avaliacao.processada_em && (
                          <span>
                            Processada: {new Date(avaliacao.processada_em).toLocaleString('pt-BR')}
                          </span>
                        )}
                      </div>

                      {/* Indicador de revisão necessária */}
                      {avaliacao.necessita_revisao && (
                        <div className="mt-2 flex items-center gap-2 text-orange-600">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            Revisão manual recomendada
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => window.open(avaliacao.imagem_url, '_blank')}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Ver imagem"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ações da Sessão */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => navigate(`/correcao-mobile/sessao/${sessaoId}/escanear`)}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <Camera className="w-5 h-5" />
            Continuar Escaneando
          </button>
          
                     {sessao?.status !== 'corrigida' && estatisticas && estatisticas.total_escaneadas > 0 && (
            <button
              onClick={() => {
                // TODO: Implementar finalização da sessão
                console.log('Finalizar sessão');
              }}
              className="bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              Finalizar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetalhesSessaoPage; 