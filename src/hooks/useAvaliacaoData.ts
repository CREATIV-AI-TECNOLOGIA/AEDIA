import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';

interface AvaliacaoDetalhada {
  id: number;
  titulo: string;
  descricao: string;
  conteudo_html: string;
  tempo_limite: number;
  nota_maxima: number;
  data_inicio: string;
  data_fim: string;
  tipo: string;
  status: string;
  disciplina: string;
  turma: string;
  created_at: string;
  updated_at: string;
}

interface DadosEdicao {
  titulo: string;
  descricao: string;
  conteudo_html: string;
  tempo_limite: number;
  nota_maxima: number;
  data_inicio: string;
  data_fim: string;
  tipo: string;
  status: string;
  disciplina: string;
  turma: string;
}

// Cache em memória para evitar recarregamentos desnecessários
const avaliacaoCache = new Map<string, AvaliacaoDetalhada>();

export const useAvaliacaoData = () => {
  const { id } = useParams<{ id: string }>();
  const [avaliacao, setAvaliacao] = useState<AvaliacaoDetalhada | null>(null);
  const [dadosEdicao, setDadosEdicao] = useState<DadosEdicao>({
    titulo: '',
    descricao: '',
    conteudo_html: '',
    tempo_limite: 60,
    nota_maxima: 10,
    data_inicio: '',
    data_fim: '',
    tipo: 'prova',
    status: 'rascunho',
    disciplina: '',
    turma: ''
  });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [salvandoAlteracoes, setSalvandoAlteracoes] = useState(false);
  const [menuExportacao, setMenuExportacao] = useState(false);

  const carregarAvaliacao = useCallback(async () => {
    if (!id) {
      setErro('ID da avaliação não fornecido');
      setCarregando(false);
      return;
    }

    // Verificar cache primeiro
    const cacheKey = `avaliacao_${id}`;
    const avaliacaoEmCache = avaliacaoCache.get(cacheKey);
    
    if (avaliacaoEmCache) {
      setAvaliacao(avaliacaoEmCache);
      setDadosEdicao({
        titulo: avaliacaoEmCache.titulo,
        descricao: avaliacaoEmCache.descricao,
        conteudo_html: avaliacaoEmCache.conteudo_html,
        tempo_limite: avaliacaoEmCache.tempo_limite,
        nota_maxima: avaliacaoEmCache.nota_maxima,
        data_inicio: avaliacaoEmCache.data_inicio,
        data_fim: avaliacaoEmCache.data_fim,
        tipo: avaliacaoEmCache.tipo,
        status: avaliacaoEmCache.status,
        disciplina: avaliacaoEmCache.disciplina,
        turma: avaliacaoEmCache.turma
      });
      setCarregando(false);
      return;
    }

    try {
      setCarregando(true);
      setErro(null);
      
      const response = await fetch(`/api/avaliacoes/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Avaliação não encontrada');
        }
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      
      const data: AvaliacaoDetalhada = await response.json();
      
      // Armazenar no cache
      avaliacaoCache.set(cacheKey, data);
      
      setAvaliacao(data);
      setDadosEdicao({
        titulo: data.titulo,
        descricao: data.descricao,
        conteudo_html: data.conteudo_html,
        tempo_limite: data.tempo_limite,
        nota_maxima: data.nota_maxima,
        data_inicio: data.data_inicio,
        data_fim: data.data_fim,
        tipo: data.tipo,
        status: data.status,
        disciplina: data.disciplina,
        turma: data.turma
      });
    } catch (error) {
      console.error('Erro ao carregar avaliação:', error);
      setErro(error instanceof Error ? error.message : 'Erro desconhecido ao carregar avaliação');
    } finally {
      setCarregando(false);
    }
  }, [id]);

  const salvarAlteracoes = useCallback(async () => {
    if (!id || !avaliacao) return;

    try {
      setSalvandoAlteracoes(true);
      
      const response = await fetch(`/api/avaliacoes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosEdicao)
      });
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      
      const avaliacaoAtualizada: AvaliacaoDetalhada = await response.json();
      
      // Atualizar cache
      const cacheKey = `avaliacao_${id}`;
      avaliacaoCache.set(cacheKey, avaliacaoAtualizada);
      
      setAvaliacao(avaliacaoAtualizada);
      setModoEdicao(false);
      
      // Mostrar feedback de sucesso
      console.log('Avaliação salva com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar avaliação:', error);
      alert('Erro ao salvar alterações. Tente novamente.');
    } finally {
      setSalvandoAlteracoes(false);
    }
  }, [id, avaliacao, dadosEdicao]);

  const limparCache = useCallback(() => {
    if (id) {
      const cacheKey = `avaliacao_${id}`;
      avaliacaoCache.delete(cacheKey);
    }
  }, [id]);

  useEffect(() => {
    carregarAvaliacao();
  }, [carregarAvaliacao]);

  return {
    avaliacao,
    dadosEdicao,
    setDadosEdicao,
    carregando,
    erro,
    modoEdicao,
    setModoEdicao,
    salvandoAlteracoes,
    menuExportacao,
    setMenuExportacao,
    salvarAlteracoes,
    carregarAvaliacao,
    limparCache
  };
};