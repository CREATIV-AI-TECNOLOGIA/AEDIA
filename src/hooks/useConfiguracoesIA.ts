import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEscola } from '../context/EscolaContext';
import { getProfessorComModalidades } from '../services/ProfessorService';
import { ProfessorIAConfigService } from '../services/ProfessorIAConfigService';
import { ProfessorIAConfiguracoes } from '../types/ProfessorIAConfig';
import toast from 'react-hot-toast';

interface UseConfiguracoesIAReturn {
  configuracoes: ProfessorIAConfiguracoes | null;
  loading: boolean;
  saving: boolean;
  professorId: number | null;
  updateConfig: (field: keyof ProfessorIAConfiguracoes, value: any) => void;
  salvarConfiguracoes: () => Promise<void>;
  recarregarConfiguracoes: () => Promise<void>;
}

export const useConfiguracoesIA = (): UseConfiguracoesIAReturn => {
  const { user } = useAuth();
  const { escolaAtiva } = useEscola();

  const [configuracoes, setConfiguracoes] = useState<ProfessorIAConfiguracoes | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [professorId, setProfessorId] = useState<number | null>(null);
  const [dadosCarregados, setDadosCarregados] = useState(false);

  // Memoizar os IDs para evitar re-renderizações desnecessárias
  const userId = useMemo(() => user?.email, [user?.email]);
  const escolaId = useMemo(() => escolaAtiva?.id, [escolaAtiva?.id]);

  const carregarDados = useCallback(async () => {
    if (!userId || !escolaId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Buscar dados do professor
      const professor = await getProfessorComModalidades(userId);
      if (!professor || !professor.id) {
        toast.error('Dados do professor não encontrados');
        return;
      }

      const profId = typeof professor.id === 'number' ? professor.id : parseInt(professor.id, 10);
      setProfessorId(profId);

      // Buscar configurações existentes ou usar padrão
      const config = await ProfessorIAConfigService.getConfiguracaoesOuPadrao(profId, escolaId);
      setConfiguracoes(config);
      setDadosCarregados(true);

    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  }, [userId, escolaId]);

  const recarregarConfiguracoes = useCallback(async () => {
    setDadosCarregados(false);
    await carregarDados();
  }, [carregarDados]);

  useEffect(() => {
    if (!dadosCarregados) {
      carregarDados();
    }
  }, [carregarDados, dadosCarregados]);

  // Reset dos dados carregados quando usuário ou escola mudam
  useEffect(() => {
    setDadosCarregados(false);
    setConfiguracoes(null);
    setProfessorId(null);
  }, [userId, escolaId]);

  const updateConfig = useCallback((field: keyof ProfessorIAConfiguracoes, value: any) => {
    setConfiguracoes(prev => prev ? {
      ...prev,
      [field]: value
    } : null);
  }, []);

  const salvarConfiguracoes = useCallback(async () => {
    if (!configuracoes || !professorId || !escolaAtiva) {
      toast.error('Dados incompletos para salvar');
      return;
    }

    try {
      setSaving(true);
      await ProfessorIAConfigService.salvarConfiguracoes(configuracoes);
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
      throw error;
    } finally {
      setSaving(false);
    }
  }, [configuracoes, professorId, escolaAtiva]);

  return {
    configuracoes,
    loading,
    saving,
    professorId,
    updateConfig,
    salvarConfiguracoes,
    recarregarConfiguracoes
  };
}; 