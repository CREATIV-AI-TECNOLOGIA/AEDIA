import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Search, 
  FileText, 
  Users, 
  Calendar,
  Plus,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { correcaoMobileService } from '../../services/correcaoMobileService';

interface Avaliacao {
  id: string;
  titulo: string;
  descricao?: string;
  turma_nome: string;
  disciplina_nome: string;
  total_questoes: number;
  created_at: string;
}

const NovaSessaoPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAvaliacao, setSelectedAvaliacao] = useState<Avaliacao | null>(null);
  
  // Dados do formulário
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [totalProvasEsperadas, setTotalProvasEsperadas] = useState<number>(30);

  useEffect(() => {
    carregarAvaliacoes();
  }, []);

  const carregarAvaliacoes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Implementar endpoint para listar avaliações do professor
      // Por enquanto, vamos simular dados
      const mockAvaliacoes: Avaliacao[] = [
        {
          id: '1',
          titulo: 'Prova de Matemática - 1º Bimestre',
          descricao: 'Avaliação sobre álgebra e geometria',
          turma_nome: '9º A',
          disciplina_nome: 'Matemática',
          total_questoes: 10,
          created_at: '2024-01-15T10:00:00Z'
        },
        {
          id: '2',
          titulo: 'Teste de História - Revolução Industrial',
          descricao: 'Avaliação sobre a Revolução Industrial',
          turma_nome: '8º B',
          disciplina_nome: 'História',
          total_questoes: 8,
          created_at: '2024-01-10T14:30:00Z'
        },
        {
          id: '3',
          titulo: 'Prova de Português - Literatura',
          descricao: 'Avaliação sobre literatura brasileira',
          turma_nome: '1º A',
          disciplina_nome: 'Português',
          total_questoes: 12,
          created_at: '2024-01-08T09:15:00Z'
        }
      ];
      
      setAvaliacoes(mockAvaliacoes);
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
      setError('Erro ao carregar avaliações disponíveis');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAvaliacao = (avaliacao: Avaliacao) => {
    setSelectedAvaliacao(avaliacao);
    setTitulo(`Correção - ${avaliacao.titulo}`);
    setDescricao(`Sessão de correção automática para: ${avaliacao.titulo}`);
  };

  const handleCreateSessao = async () => {
    if (!selectedAvaliacao || !titulo.trim()) {
      setError('Selecione uma avaliação e preencha o título');
      return;
    }

    if (totalProvasEsperadas < 1 || totalProvasEsperadas > 200) {
      setError('O número de provas deve estar entre 1 e 200');
      return;
    }

    try {
      setCreating(true);
      setError(null);

      const response = await correcaoMobileService.criarSessao({
        avaliacaoOriginalId: selectedAvaliacao.id,
        titulo: titulo.trim(),
        descricao: descricao.trim() || undefined,
        totalProvasEsperadas
      });

      // Navegar para a sessão criada
      navigate(`/correcao-mobile/sessao/${response.sessaoId}/escanear`);
    } catch (error) {
      console.error('Erro ao criar sessão:', error);
      setError('Erro ao criar sessão. Tente novamente.');
    } finally {
      setCreating(false);
    }
  };

  const filteredAvaliacoes = avaliacoes.filter(avaliacao =>
    avaliacao.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    avaliacao.turma_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    avaliacao.disciplina_nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando avaliações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Nova Sessão de Correção
              </h1>
              <p className="text-sm text-gray-600">
                Selecione uma avaliação para começar
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Busca */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar avaliações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Lista de Avaliações */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Avaliações Disponíveis ({filteredAvaliacoes.length})
          </h2>
          
          {filteredAvaliacoes.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">
                {searchTerm ? 'Nenhuma avaliação encontrada' : 'Nenhuma avaliação disponível'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAvaliacoes.map((avaliacao) => (
                <div
                  key={avaliacao.id}
                  onClick={() => handleSelectAvaliacao(avaliacao)}
                  className={`bg-white rounded-lg border p-4 cursor-pointer transition-all ${
                    selectedAvaliacao?.id === avaliacao.id
                      ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1">
                        {avaliacao.titulo}
                      </h3>
                      {avaliacao.descricao && (
                        <p className="text-sm text-gray-600 mb-2">
                          {avaliacao.descricao}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{avaliacao.turma_nome}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          <span>{avaliacao.disciplina_nome}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>{avaliacao.total_questoes} questões</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(avaliacao.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>
                    
                    {selectedAvaliacao?.id === avaliacao.id && (
                      <div className="ml-3">
                        <CheckCircle className="w-6 h-6 text-blue-600" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Formulário de Configuração */}
        {selectedAvaliacao && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Configurações da Sessão
            </h3>
            
            <div className="space-y-4">
              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título da Sessão *
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Correção - Prova de Matemática"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição (opcional)
                </label>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descrição adicional sobre esta sessão..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Total de Provas Esperadas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Provas Esperadas *
                </label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={totalProvasEsperadas}
                  onChange={(e) => setTotalProvasEsperadas(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Quantas provas você espera escanear nesta sessão?
                </p>
              </div>
            </div>

            {/* Resumo da Avaliação Selecionada */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">
                Avaliação Selecionada
              </h4>
              <div className="text-sm text-blue-800">
                <p><strong>Título:</strong> {selectedAvaliacao.titulo}</p>
                <p><strong>Turma:</strong> {selectedAvaliacao.turma_nome}</p>
                <p><strong>Disciplina:</strong> {selectedAvaliacao.disciplina_nome}</p>
                <p><strong>Questões:</strong> {selectedAvaliacao.total_questoes}</p>
              </div>
            </div>
          </div>
        )}

        {/* Erro */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">Erro</span>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          
          <button
            onClick={handleCreateSessao}
            disabled={!selectedAvaliacao || !titulo.trim() || creating}
            className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Criando...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Criar Sessão
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NovaSessaoPage; 