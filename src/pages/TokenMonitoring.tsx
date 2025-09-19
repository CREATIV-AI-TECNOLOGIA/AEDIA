import React, { useState, useEffect } from 'react';
import { ArrowLeft, BarChart3, DollarSign, Zap, TrendingUp, Clock, Brain, MessageSquare, Calendar, Filter, Download, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { tokenService, TokenUsage } from '../services/tokenService';
import { chatService, ChatConversation } from '../services/chatService';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

interface ConversationTokens {
  conversation_id: string;
  title: string;
  total_input_tokens: number;
  total_output_tokens: number;
  total_cost: number;
  message_count: number;
  created_at: Date;
  updated_at: Date;
  messages: Array<{
    id: string;
    content: string;
    sender: 'user' | 'assistant';
    input_tokens: number;
    output_tokens: number;
    cost: number;
    context_info?: {
      system_prompt_tokens: number;
      conversation_history_tokens: number;
      user_message_tokens: number;
      persona_tokens: number;
      memory_context_tokens: number;
    };
    created_at: Date;
  }>;
}

interface DailyStats {
  date: string;
  conversations: number;
  messages: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost: number;
}

const TokenMonitoring: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [professorId, setProfessorId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'conversations' | 'messages' | 'daily' | 'context'>('overview');
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [conversationTokens, setConversationTokens] = useState<ConversationTokens[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalConversations: 0,
    totalMessages: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCost: 0,
    averageCostPerMessage: 0,
    averageCostPerConversation: 0
  });
  const [showContextDetails, setShowContextDetails] = useState(false);

  useEffect(() => {
    loadProfessorData();
  }, [user]);

  useEffect(() => {
    if (professorId) {
      loadTokenData();
    }
  }, [professorId, selectedPeriod]);

  const loadProfessorData = async () => {
    if (!user?.id) return;
    
    try {
      const { data: professorReal, error } = await supabase
        .from('professores')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (error || !professorReal) {
        console.error('❌ Professor não encontrado:', error);
        return;
      }

      setProfessorId(professorReal.id);
    } catch (error) {
      console.error('❌ Erro ao carregar dados do professor:', error);
    }
  };

  const loadTokenData = async () => {
    if (!professorId) return;
    
    setLoading(true);
    try {
      // Carregar conversas
      const conversations = await chatService.getConversations(professorId);
      
      // Calcular tokens para cada conversa
      const conversationTokensData: ConversationTokens[] = [];
      let totalInputTokens = 0;
      let totalOutputTokens = 0;
      let totalCost = 0;
      let totalMessages = 0;

      for (const conversation of conversations) {
        const fullConversation = await chatService.getConversationWithMessages(conversation.id);
        if (!fullConversation?.messages) continue;

        let convInputTokens = 0;
        let convOutputTokens = 0;
        let convCost = 0;

        const messagesWithTokens = fullConversation.messages.map(msg => {
          const inputTokens = msg.sender === 'user' ? tokenService.estimateTokens(msg.content) : 0;
          const outputTokens = msg.sender === 'assistant' ? tokenService.estimateTokens(msg.content) : 0;
          const cost = tokenService.calculateCost(inputTokens, outputTokens, msg.model || 'gpt-4o-mini');

          // Estimar contexto para mensagens do assistente
          let contextInfo;
          if (msg.sender === 'assistant') {
            const systemPromptTokens = tokenService.estimateTokens('System prompt estimado'); // Estimativa
            const historyTokens = Math.floor(inputTokens * 0.3); // Estimativa do histórico
            const userMsgTokens = Math.floor(inputTokens * 0.4); // Estimativa da mensagem do usuário
            const personaTokens = Math.floor(inputTokens * 0.2); // Estimativa da persona
            const memoryTokens = Math.floor(inputTokens * 0.1); // Estimativa da memória

            contextInfo = {
              system_prompt_tokens: systemPromptTokens,
              conversation_history_tokens: historyTokens,
              user_message_tokens: userMsgTokens,
              persona_tokens: personaTokens,
              memory_context_tokens: memoryTokens
            };
          }

          convInputTokens += inputTokens;
          convOutputTokens += outputTokens;
          convCost += cost;

          return {
            id: msg.id,
            content: msg.content,
            sender: msg.sender,
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            cost,
            context_info: contextInfo,
            created_at: new Date(msg.created_at)
          };
        });

        totalInputTokens += convInputTokens;
        totalOutputTokens += convOutputTokens;
        totalCost += convCost;
        totalMessages += messagesWithTokens.length;

        conversationTokensData.push({
          conversation_id: conversation.id,
          title: conversation.title,
          total_input_tokens: convInputTokens,
          total_output_tokens: convOutputTokens,
          total_cost: convCost,
          message_count: messagesWithTokens.length,
          created_at: new Date(conversation.created_at),
          updated_at: new Date(conversation.updated_at),
          messages: messagesWithTokens
        });
      }

      // Calcular estatísticas diárias
      const dailyStatsMap = new Map<string, DailyStats>();
      
      conversationTokensData.forEach(conv => {
        const date = conv.created_at.toISOString().split('T')[0];
        
        if (!dailyStatsMap.has(date)) {
          dailyStatsMap.set(date, {
            date,
            conversations: 0,
            messages: 0,
            input_tokens: 0,
            output_tokens: 0,
            total_tokens: 0,
            cost: 0
          });
        }

        const dayStats = dailyStatsMap.get(date)!;
        dayStats.conversations += 1;
        dayStats.messages += conv.message_count;
        dayStats.input_tokens += conv.total_input_tokens;
        dayStats.output_tokens += conv.total_output_tokens;
        dayStats.total_tokens += conv.total_input_tokens + conv.total_output_tokens;
        dayStats.cost += conv.total_cost;
      });

      const dailyStatsArray = Array.from(dailyStatsMap.values())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Filtrar por período
      const now = new Date();
      const periodDays = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : selectedPeriod === '90d' ? 90 : 365;
      const cutoffDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
      
      const filteredConversations = conversationTokensData.filter(conv => conv.created_at >= cutoffDate);
      const filteredDailyStats = dailyStatsArray.filter(stat => new Date(stat.date) >= cutoffDate);

      setConversationTokens(filteredConversations);
      setDailyStats(filteredDailyStats);
      setTotalStats({
        totalConversations: filteredConversations.length,
        totalMessages,
        totalInputTokens,
        totalOutputTokens,
        totalCost,
        averageCostPerMessage: totalMessages > 0 ? totalCost / totalMessages : 0,
        averageCostPerConversation: filteredConversations.length > 0 ? totalCost / filteredConversations.length : 0
      });

    } catch (error) {
      console.error('❌ Erro ao carregar dados de tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    const data = {
      period: selectedPeriod,
      totalStats,
      conversations: conversationTokens,
      dailyStats,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `token-monitoring-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-muted-foreground">Carregando dados de monitoramento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="page-center px-4 sm:px-6 lg:px-8">
          <div className="standard-page-card w-full">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/chat')}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-foreground">
                    Monitoramento Detalhado de Tokens
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Análise completa do uso de IA e custos
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Filtro de Período */}
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as any)}
                className="px-3 py-2 border border-border rounded-lg text-sm bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="90d">Últimos 90 dias</option>
                <option value="all">Todos os dados</option>
              </select>

              <button
                onClick={exportData}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Exportar</span>
              </button>

              <button
                onClick={loadTokenData}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Atualizar</span>
              </button>
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-card border-b border-border">
        <div className="page-center px-4 sm:px-6 lg:px-8">
          <div className="standard-page-card w-full">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
              { id: 'conversations', label: 'Por Conversa', icon: MessageSquare },
              { id: 'messages', label: 'Por Mensagem', icon: Brain },
              { id: 'daily', label: 'Por Dia', icon: Calendar },
              { id: 'context', label: 'Análise de Contexto', icon: Eye }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground/80 hover:border-border'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="page-center px-4 sm:px-6 lg:px-8 py-8">
        <div className="standard-page-card w-full">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Resumo Geral */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total de Conversas</p>
                    <p className="text-2xl font-bold text-foreground">
                      {totalStats.totalConversations.toLocaleString()}
                    </p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total de Mensagens</p>
                    <p className="text-2xl font-bold text-foreground">
                      {totalStats.totalMessages.toLocaleString()}
                    </p>
                  </div>
                  <Brain className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total de Tokens</p>
                    <p className="text-2xl font-bold text-foreground">
                      {(totalStats.totalInputTokens + totalStats.totalOutputTokens).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {totalStats.totalInputTokens.toLocaleString()} entrada + {totalStats.totalOutputTokens.toLocaleString()} saída
                    </p>
                  </div>
                  <Zap className="w-8 h-8 text-purple-600" />
                </div>
              </div>

              <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Custo Total</p>
                    <p className="text-2xl font-bold text-foreground">
                      {tokenService.formatCostUSD(totalStats.totalCost)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tokenService.formatCostBRL(totalStats.totalCost)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-orange-600" />
                </div>
              </div>
            </div>

            {/* Métricas Avançadas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                <h3 className="text-lg font-medium text-foreground mb-4">Custo Médio</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Por Mensagem</span>
                    <span className="font-medium">
                      {tokenService.formatCostUSD(totalStats.averageCostPerMessage)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Por Conversa</span>
                    <span className="font-medium">
                      {tokenService.formatCostUSD(totalStats.averageCostPerConversation)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                <h3 className="text-lg font-medium text-foreground mb-4">Distribuição de Tokens</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-blue-600">Tokens de Entrada</span>
                    <span className="font-medium">
                      {totalStats.totalInputTokens.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-green-600">Tokens de Saída</span>
                    <span className="font-medium">
                      {totalStats.totalOutputTokens.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-l-full" 
                      style={{ 
                        width: `${(totalStats.totalInputTokens / (totalStats.totalInputTokens + totalStats.totalOutputTokens)) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Gráfico de Uso Diário */}
            {dailyStats.length > 0 && (
              <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                <h3 className="text-lg font-medium text-foreground mb-6">Uso Diário</h3>
                <div className="grid grid-cols-7 gap-2">
                  {dailyStats.slice(-7).map((day, index) => {
                    const maxCost = Math.max(...dailyStats.map(d => d.cost));
                    const height = maxCost > 0 ? (day.cost / maxCost) * 100 : 0;
                    
                    return (
                      <div key={index} className="text-center">
                        <div className="h-32 flex items-end justify-center mb-2">
                          <div
                            className="w-12 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t"
                            style={{ height: `${Math.max(height, 5)}%` }}
                            title={`${new Date(day.date).toLocaleDateString('pt-BR')}: ${tokenService.formatCostUSD(day.cost)}`}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(day.date).toLocaleDateString('pt-BR', { 
                            day: '2-digit', 
                            month: '2-digit' 
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground">{day.conversations} conv</p>
                        <p className="text-xs text-muted-foreground">{day.messages} msg</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'conversations' && (
          <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-medium text-foreground">Análise por Conversa</h3>
              <p className="text-sm text-muted-foreground">Detalhamento de tokens e custos por conversa</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Conversa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Mensagens
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Tokens Entrada
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Tokens Saída
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Custo Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Data
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {conversationTokens.map((conv) => (
                    <tr key={conv.conversation_id} className="hover:bg-muted/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-foreground max-w-xs truncate">
                          {conv.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {conv.message_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                        {conv.total_input_tokens.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                        {conv.total_output_tokens.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                        {tokenService.formatCostUSD(conv.total_cost)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {conv.created_at.toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="space-y-6">
            {conversationTokens.map((conv) => (
              <div key={conv.conversation_id} className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="p-6 border-b border-border">
                  <h3 className="text-lg font-medium text-foreground">{conv.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {conv.message_count} mensagens • {tokenService.formatCostUSD(conv.total_cost)}
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Conteúdo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Tokens
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Custo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Horário
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {conv.messages.map((msg) => (
                        <tr key={msg.id} className="hover:bg-muted/50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              msg.sender === 'user' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {msg.sender === 'user' ? 'Usuário' : 'Assistente'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-foreground max-w-md truncate">
                              {msg.content}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {msg.sender === 'user' ? (
                              <span className="text-blue-600 font-medium">
                                {msg.input_tokens.toLocaleString()} entrada
                              </span>
                            ) : (
                              <span className="text-green-600 font-medium">
                                {msg.output_tokens.toLocaleString()} saída
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                            {tokenService.formatCostUSD(msg.cost)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                            {msg.created_at.toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'daily' && (
          <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="p-6 border-b border-border">
              <h3 className="text-lg font-medium text-foreground">Estatísticas Diárias</h3>
              <p className="text-sm text-muted-foreground">Resumo de uso por dia</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Conversas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Mensagens
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Tokens Entrada
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Tokens Saída
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Custo Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {dailyStats.map((day) => (
                    <tr key={day.date} className="hover:bg-muted/50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                        {new Date(day.date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {day.conversations}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {day.messages}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                        {day.input_tokens.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                        {day.output_tokens.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-medium">
                        {tokenService.formatCostUSD(day.cost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'context' && (
          <div className="space-y-6">
            <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium text-foreground">Análise de Contexto</h3>
                  <p className="text-sm text-muted-foreground">
                    Detalhamento do que a IA considera além da sua mensagem
                  </p>
                </div>
                <button
                  onClick={() => setShowContextDetails(!showContextDetails)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  {showContextDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span>{showContextDetails ? 'Ocultar' : 'Mostrar'} Detalhes</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">System Prompt</h4>
                  <p className="text-xs text-blue-600">
                    Instruções da persona ativa e configurações do sistema
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-green-800 mb-2">Histórico da Conversa</h4>
                  <p className="text-xs text-green-600">
                    Mensagens anteriores da conversa atual
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-purple-800 mb-2">Sua Mensagem</h4>
                  <p className="text-xs text-purple-600">
                    O texto que você digitou na caixa de prompt
                  </p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-orange-800 mb-2">Contexto de Persona</h4>
                  <p className="text-xs text-orange-600">
                    Personalidade e estilo de ensino configurado
                  </p>
                </div>
                <div className="bg-pink-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-pink-800 mb-2">Memória de Conversas</h4>
                  <p className="text-xs text-pink-600">
                    Contexto relevante de conversas anteriores
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">
                  ⚠️ Importante sobre Tokens de Contexto
                </h4>
                <div className="text-sm text-yellow-700 space-y-2">
                  <p>
                    • <strong>Tokens de Entrada:</strong> Incluem sua mensagem + todo o contexto (persona, histórico, memória)
                  </p>
                  <p>
                    • <strong>Tokens de Saída:</strong> Apenas a resposta gerada pela IA
                  </p>
                  <p>
                    • <strong>Custo Real:</strong> Você paga por TODOS os tokens de entrada, não apenas sua mensagem
                  </p>
                  <p>
                    • <strong>Otimização:</strong> Use o modo "Economia" para reduzir o contexto e economizar tokens
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default TokenMonitoring;
