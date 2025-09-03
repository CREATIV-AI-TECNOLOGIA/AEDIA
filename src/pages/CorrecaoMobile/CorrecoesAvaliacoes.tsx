import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft,
  Eye,
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
  Trash2,
  Camera,
  FileText,
  Plus
} from 'lucide-react';
import { provasService } from '../../services/provasService';

interface ProvaEscaneada {
  id: string;
  titulo: string;
  imagem: string;
  status: 'pendente' | 'enviada' | 'corrigida';
  data_escaneamento: string;
  professor_id: string;
  avaliacao_referencia?: string;
  avaliacao_titulo?: string;
  disciplina?: string;
  turma?: string;
  aluno_id?: string;
  aluno_nome?: string;
  aluno_matricula?: string;
  deteccao_automatica?: boolean;
  resultado_correcao?: {
    nota: number;
    feedback: string;
    questoes_corretas: number;
    total_questoes: number;
  };
}

const CorrecoesAvaliacoesPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [provas, setProvas] = useState<ProvaEscaneada[]>([]);
  const [showMessage, setShowMessage] = useState(false);
  const [message, setMessage] = useState('');
  
  // Detectar se é mobile ou web
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;

  // Carregar provas do banco de dados
  useEffect(() => {
    const carregarProvas = async () => {
      try {
        console.log('🔄 Carregando provas do banco de dados...');
        
        // Dados simulados do professor (em produção, vir do contexto de autenticação)
        const professorId = 1;
        
        const provasData = await provasService.buscarProvasPorProfessor(professorId);
        
        console.log('✅ Provas carregadas:', provasData.length);
        
        // Converter para o formato esperado pela interface
        const provasFormatadas = provasData.map((prova: any) => ({
          id: prova.id,
          titulo: `Prova ${new Date(prova.created_at).toLocaleDateString('pt-BR')}`,
          imagem: prova.imagem_url,
          status: prova.status as 'pendente' | 'enviada' | 'corrigida',
          data_escaneamento: prova.created_at,
          professor_id: prova.professor_id.toString(),
          avaliacao_referencia: prova.avaliacao_original_id || undefined,
          avaliacao_titulo: 'Avaliação Detectada',
          disciplina: 'Matemática', // TODO: buscar da base
          turma: `Turma ${prova.turma_id}`,
          aluno_id: prova.aluno_id?.toString(),
          aluno_nome: prova.nome_aluno_detectado || 'Aluno Detectado',
          aluno_matricula: prova.matricula_detectada || undefined,
          deteccao_automatica: !!prova.nome_aluno_detectado,
          resultado_correcao: prova.status === 'corrigida' ? {
            nota: prova.nota_final || 0,
            feedback: prova.feedback_ia || 'Correção automática realizada',
            questoes_corretas: Math.floor((prova.percentual_acerto || 0) / 10),
            total_questoes: 10
          } : undefined
        }));
        
        setProvas(provasFormatadas);
      } catch (error) {
        console.error('❌ Erro ao carregar provas:', error);
        
        // Fallback para localStorage se houver erro
        const provasSalvas = localStorage.getItem('provas-correcao');
        if (provasSalvas) {
          try {
            const provasData = JSON.parse(provasSalvas);
            setProvas(provasData);
          } catch (error) {
            console.error('Erro ao carregar provas do localStorage:', error);
          }
        }
      }
    };
    
    carregarProvas();
  }, []);

  // Verificar se chegou uma nova prova escaneada
  useEffect(() => {
    if (location.state?.message && location.state?.novaProva) {
      const novaProva = location.state.novaProva;
      
      const provasAtualizadas = [novaProva, ...provas];
      setProvas(provasAtualizadas);
      
      // Salvar no localStorage
      localStorage.setItem('provas-correcao', JSON.stringify(provasAtualizadas));
      
      // Mostrar mensagem de sucesso
      setMessage(location.state.message);
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);

      // Limpar o state da navegação
      navigate('/correcoes-avaliacoes', { replace: true });
    }
  }, [location.state, provas, navigate]);

  const handleVisualizarProva = (prova: ProvaEscaneada) => {
    const novaJanela = window.open('', '_blank');
    if (novaJanela) {
      novaJanela.document.write(`
        <html>
          <head>
            <title>Prova Escaneada - ${prova.titulo}</title>
            <style>
              body { margin: 0; padding: 20px; background: #f5f5f5; font-family: Arial, sans-serif; }
              .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              img { max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px; }
              .header { margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid #eee; }
              .info { color: #666; font-size: 14px; margin-bottom: 10px; }
              .resultado { background: #f0f9ff; padding: 15px; border-radius: 8px; margin-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>Prova Escaneada</h2>
                <div class="info">Título: ${prova.titulo}</div>
                <div class="info">Data: ${new Date(prova.data_escaneamento).toLocaleString('pt-BR')}</div>
                <div class="info">Status: ${getStatusText(prova.status)}</div>
                ${prova.aluno_nome ? `<div class="info">👤 Aluno: ${prova.aluno_nome}${prova.aluno_matricula ? ` (${prova.aluno_matricula})` : ''}</div>` : ''}
                ${prova.avaliacao_titulo ? `<div class="info">📋 Avaliação: ${prova.avaliacao_titulo}</div>` : ''}
              </div>
              <img src="${prova.imagem}" alt="Prova escaneada" />
              ${prova.resultado_correcao ? `
                <div class="resultado">
                  <h3>Resultado da Correção</h3>
                  <p><strong>Nota:</strong> ${prova.resultado_correcao.nota}/10</p>
                  <p><strong>Acertos:</strong> ${prova.resultado_correcao.questoes_corretas}/${prova.resultado_correcao.total_questoes}</p>
                  <p><strong>Feedback:</strong> ${prova.resultado_correcao.feedback}</p>
                </div>
              ` : ''}
            </div>
          </body>
        </html>
      `);
    }
  };

  const handleEnviarParaCorrecao = async (provaId: string) => {
    // Simular envio para correção automática
    const provasAtualizadas = provas.map(p => 
      p.id === provaId ? { ...p, status: 'enviada' as const } : p
    );
    setProvas(provasAtualizadas);
    localStorage.setItem('provas-correcao', JSON.stringify(provasAtualizadas));
    
    setMessage('Prova enviada para correção automática!');
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), 3000);

    // Simular processamento da IA (5 segundos)
    setTimeout(() => {
      const provasComCorrecao = provas.map(p => 
        p.id === provaId ? { 
          ...p, 
          status: 'corrigida' as const,
          resultado_correcao: {
            nota: Math.floor(Math.random() * 4) + 7, // Nota entre 7-10
            feedback: 'Boa prova! Demonstrou conhecimento dos conceitos principais.',
            questoes_corretas: Math.floor(Math.random() * 3) + 8, // 8-10 corretas
            total_questoes: 10
          }
        } : p
      );
      setProvas(provasComCorrecao);
      localStorage.setItem('provas-correcao', JSON.stringify(provasComCorrecao));
    }, 5000);
  };

  const handleExcluirProva = (provaId: string) => {
    if (confirm('Tem certeza que deseja excluir esta prova?')) {
      const provasAtualizadas = provas.filter(p => p.id !== provaId);
      setProvas(provasAtualizadas);
      localStorage.setItem('provas-correcao', JSON.stringify(provasAtualizadas));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'enviada':
        return <Send className="w-4 h-4 text-blue-500" />;
      case 'corrigida':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'Pendente';
      case 'enviada':
        return 'Em Correção';
      case 'corrigida':
        return 'Corrigida';
      default:
        return 'Desconhecido';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'enviada':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'corrigida':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

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
                <h1 className="text-xl font-bold text-gray-900">
                  Correções de Avaliações
                </h1>
                <p className="text-sm text-gray-600">
                  {provas.length} prova(s) escaneada(s)
                </p>
              </div>
            </div>
            {isMobile && (
              <button
                onClick={() => navigate('/correcao-mobile/escanear')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Escanear Nova
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mensagem de Feedback */}
      {showMessage && (
        <div className="fixed top-20 left-4 right-4 z-50 bg-green-600 text-white p-4 rounded-lg shadow-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span>{message}</span>
        </div>
      )}

      {/* Conteúdo Principal */}
      <div className="p-4">
        {provas.length > 0 ? (
          <div className="space-y-4">
            {provas.map((prova) => (
              <div key={prova.id} className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-start gap-3">
                  {/* Thumbnail da Imagem */}
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={prova.imagem}
                      alt="Thumbnail da prova"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Informações da Prova */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {prova.titulo}
                      </span>
                    </div>
                    
                    {/* Informações do Aluno */}
                    {prova.aluno_nome && (
                      <div className="bg-green-50 border border-green-200 rounded-md p-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-green-800">
                            👤 {prova.aluno_nome}
                          </span>
                          {prova.deteccao_automatica && (
                            <span className="text-xs bg-green-200 text-green-800 px-1.5 py-0.5 rounded-full">
                              ✅ Auto
                            </span>
                          )}
                        </div>
                        {prova.aluno_matricula && (
                          <div className="text-xs text-green-600 mt-1">
                            Matrícula: {prova.aluno_matricula}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Informações da Avaliação Referenciada */}
                    {prova.avaliacao_titulo && (
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-2 mb-2">
                        <div className="text-xs font-medium text-blue-800 mb-1">
                          📋 Avaliação: {prova.avaliacao_titulo}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-blue-600">
                          <span>{prova.disciplina}</span>
                          {prova.turma && (
                            <>
                              <span>•</span>
                              <span>{prova.turma}</span>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(prova.status)}
                      <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(prova.status)}`}>
                        {getStatusText(prova.status)}
                      </span>
                    </div>

                    {/* Resultado da Correção */}
                    {prova.resultado_correcao && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-green-800">
                            Nota: {prova.resultado_correcao.nota}/10
                          </span>
                          <span className="text-xs text-green-600">
                            {prova.resultado_correcao.questoes_corretas}/{prova.resultado_correcao.total_questoes} corretas
                          </span>
                        </div>
                        <p className="text-xs text-green-700">
                          {prova.resultado_correcao.feedback}
                        </p>
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500">
                      {new Date(prova.data_escaneamento).toLocaleString('pt-BR')}
                    </p>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleVisualizarProva(prova)}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Visualizar prova"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    {prova.status === 'pendente' && (
                      <button
                        onClick={() => handleEnviarParaCorrecao(prova.id)}
                        className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Enviar para correção"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleExcluirProva(prova.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir prova"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Estado Vazio */
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma prova escaneada
            </h3>
            <p className="text-gray-600 text-sm mb-6">
              {isMobile 
                ? 'Comece escaneando sua primeira prova para correção automática'
                : 'Use o aplicativo mobile para escanear provas ou importe arquivos'
              }
            </p>
            {isMobile && (
              <button
                onClick={() => navigate('/correcao-mobile/escanear')}
                className="bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
              >
                <Plus className="w-5 h-5" />
                Escanear Primeira Prova
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CorrecoesAvaliacoesPage; 