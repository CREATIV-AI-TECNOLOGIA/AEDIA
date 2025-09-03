import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useEscola } from '../context/EscolaContext';
import { ProfessorUsageService } from '../services/ProfessorUsageService';
import { 
  ProfessorUsageConfig, 
  ProfessorUsageStats, 
  CENARIOS_USO,
  CURRENT_EXCHANGE_RATE 
} from '../types/ProfessorUsageConfig';
import { getProfessorComModalidades } from '../services/ProfessorService';
import { toast } from 'react-hot-toast';
import { 
  DollarSign, 
  MessageSquare, 
  Calendar, 
  AlertTriangle, 
  Save, 
  RefreshCw,
  TrendingUp,
  Shield,
  Bell,
  Calculator
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const ConfiguracaoLimites: React.FC = () => {
  const { user } = useAuth();
  const { escolaAtiva } = useEscola();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [professorId, setProfessorId] = useState<number | null>(null);
  const [config, setConfig] = useState<ProfessorUsageConfig | null>(null);
  const [stats, setStats] = useState<ProfessorUsageStats | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<'limites' | 'cenarios' | 'estatisticas'>('limites');

  useEffect(() => {
    carregarDados();
  }, [user, escolaAtiva]);

  const carregarDados = async () => {
    if (!user?.email || !escolaAtiva?.id) return;

    try {
      setLoading(true);
      
      // Buscar dados do professor
      const professor = await getProfessorComModalidades(user.email);
      if (!professor?.id) {
        toast.error('Dados do professor não encontrados');
        return;
      }

      const profId = typeof professor.id === 'number' ? professor.id : parseInt(professor.id, 10);
      setProfessorId(profId);

      // Buscar configurações
      const configData = await ProfessorUsageService.getUsageConfigOuPadrao(profId, escolaAtiva.id);
      setConfig(configData);

      // Buscar estatísticas
      const statsData = await ProfessorUsageService.calcularUsageStats(profId);
      setStats(statsData);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const salvarConfiguracoes = async () => {
    if (!config || !professorId) return;

    try {
      setSaving(true);
      
      // Recalcular BRL baseado no USD
      const configAtualizada = {
        ...config,
        limite_mensal_brl: config.limite_mensal_usd * CURRENT_EXCHANGE_RATE.usd_to_brl
      };

      await ProfessorUsageService.salvarUsageConfig(configAtualizada);
      setConfig(configAtualizada);
      
      toast.success('Configurações salvas com sucesso!');
      
      // Recarregar estatísticas
      const statsData = await ProfessorUsageService.calcularUsageStats(professorId);
      setStats(statsData);

    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const aplicarCenario = (cenario: typeof CENARIOS_USO[0]) => {
    if (!config) return;

    setConfig({
      ...config,
      limite_mensal_usd: cenario.recomendacao_limite.usd,
      limite_mensal_brl: cenario.recomendacao_limite.brl,
      limite_tokens_entrada: cenario.uso_diario.tokens_entrada_media * 30 * cenario.uso_diario.conversas,
      limite_tokens_saida: cenario.uso_diario.tokens_saida_media * 30 * cenario.uso_diario.conversas,
      limite_conversas_mes: cenario.uso_diario.conversas * 30,
      limite_mensagens_dia: cenario.uso_diario.conversas * cenario.uso_diario.mensagens_por_conversa
    });

    toast.success(`Cenário "${cenario.nome}" aplicado!`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Carregando configurações...</span>
        </div>
      </div>
    );
  }

  if (!config || !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro ao carregar dados</h2>
          <button 
            onClick={carregarDados}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Configuração de Limites</h1>
        <p className="text-gray-600 mt-2">
          Gerencie seus limites de uso da IA e monitore gastos
        </p>
      </div>
    </div>
  );
};

export default ConfiguracaoLimites; 