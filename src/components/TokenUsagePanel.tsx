import React, { useState } from 'react';
import { X, DollarSign, Zap, TrendingUp, Clock, BarChart3, HelpCircle } from 'lucide-react';
import { tokenService, TokenUsage } from '../services/tokenService';
import ExchangeRateConfig from './ExchangeRateConfig';
import TokenBreakdownPanel from './TokenBreakdownPanel';
import LiveTokenBreakdown from './LiveTokenBreakdown';
import OptimizationSettings from './OptimizationSettings';

interface TokenUsagePanelProps {
  isOpen: boolean;
  onClose: () => void;
  professorId: number;
  sessionUsage: TokenUsage[];
}

const TokenUsagePanel: React.FC<TokenUsagePanelProps> = ({
  isOpen,
  onClose,
  professorId,
  sessionUsage
}) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [showBreakdown, setShowBreakdown] = useState(false);

  if (!isOpen) return null;

  // Carregar dados históricos
  const historicalUsage = tokenService.getUsageData(professorId);
  const allUsage = [...historicalUsage, ...sessionUsage];
  
  // Gerar relatório
  const report = tokenService.generateUsageReport(allUsage);
  const sessionReport = tokenService.generateUsageReport(sessionUsage);

  // Callback para atualizar valores quando a taxa de câmbio mudar
  const handleExchangeRateChange = (newRate: number) => {
    setRefreshKey(prev => prev + 1);
  };

  // Dados dos últimos 7 dias
  const last7Days = Object.entries(report.dailyUsage)
    .slice(-7)
    .map(([date, data]) => ({
      date: new Date(date).toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit' 
      }),
      ...data
    }));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Monitoramento de Tokens
              </h2>
              <p className="text-sm text-gray-500">
                Acompanhe seus gastos com a OpenAI em tempo real
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowBreakdown(!showBreakdown)}
              className={`p-2 rounded-lg transition-colors ${
                showBreakdown 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
              title="Explicação sobre tokens"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Explicação sobre Tokens */}
          <TokenBreakdownPanel isVisible={showBreakdown} />

          {/* Breakdown da Última Chamada */}
          {sessionUsage.length > 0 && (
            <LiveTokenBreakdown 
              lastUsage={sessionUsage[sessionUsage.length - 1]} 
              isVisible={showBreakdown} 
            />
          )}

          {/* Resumo da Sessão Atual */}
          {/* <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-600" />
              Sessão Atual
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Tokens de Entrada</p>
                    <p className="text-2xl font-bold text-blue-800">
                      {sessionReport.totalInputTokens.toLocaleString()}
                    </p>
                  </div>
                  <Zap className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Tokens de Saída</p>
                    <p className="text-2xl font-bold text-green-800">
                      {sessionReport.totalOutputTokens.toLocaleString()}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">Total de Tokens</p>
                    <p className="text-2xl font-bold text-purple-800">
                      {sessionReport.totalTokens.toLocaleString()}
                    </p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-purple-600" />
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600 font-medium">Custo da Sessão</p>
                    <p className="text-lg font-bold text-orange-800">
                      {tokenService.formatCostUSD(sessionReport.totalCost)}
                    </p>
                    <p className="text-sm text-orange-600">
                      {tokenService.formatCostBRL(sessionReport.totalCost)}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-orange-600" />
                </div>
              </div>
            </div>
          </div> */}

          {/* Resumo Histórico */}
          {/* <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
              Resumo Histórico (Total)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-sm text-gray-600 font-medium">Total de Chamadas</p>
                <p className="text-2xl font-bold text-gray-800">
                  {allUsage.length.toLocaleString()}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-sm text-gray-600 font-medium">Total de Tokens</p>
                <p className="text-2xl font-bold text-gray-800">
                  {report.totalTokens.toLocaleString()}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-sm text-gray-600 font-medium">Custo Total</p>
                <p className="text-lg font-bold text-gray-800">
                  {tokenService.formatCostUSD(report.totalCost)}
                </p>
                <p className="text-sm text-gray-600">
                  {tokenService.formatCostBRL(report.totalCost)}
                </p>
              </div>
            </div>
          </div> */}

          {/* Gráfico dos Últimos 7 Dias */}
          {/* {last7Days.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                Uso dos Últimos 7 Dias
              </h3>
              <div className="bg-gray-50 p-4 rounded-xl">
                <div className="grid grid-cols-7 gap-2">
                  {last7Days.map((day, index) => {
                    const maxCost = Math.max(...last7Days.map(d => d.cost));
                    const height = maxCost > 0 ? (day.cost / maxCost) * 100 : 0;
                    
                    return (
                      <div key={index} className="text-center">
                        <div className="h-20 flex items-end justify-center mb-2">
                          <div
                            className="w-8 bg-blue-500 rounded-t"
                            style={{ height: `${Math.max(height, 5)}%` }}
                            title={`${day.date}: ${tokenService.formatCostUSD(day.cost)}`}
                          />
                        </div>
                        <p className="text-xs text-gray-600">{day.date}</p>
                        <p className="text-xs text-gray-500">{day.calls} calls</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )} */}

          {/* Detalhes da Sessão Atual */}
          {/* {sessionUsage.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">
                Detalhes da Sessão Atual
              </h3>
              <div className="bg-gray-50 rounded-xl overflow-hidden">
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="text-left p-3 font-medium text-gray-700">Horário</th>
                        <th className="text-left p-3 font-medium text-gray-700">Entrada</th>
                        <th className="text-left p-3 font-medium text-gray-700">Saída</th>
                        <th className="text-left p-3 font-medium text-gray-700">Total</th>
                        <th className="text-left p-3 font-medium text-gray-700">Custo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessionUsage.map((usage, index) => (
                        <tr key={index} className="border-t border-gray-200">
                          <td className="p-3 text-gray-600">
                            {usage.timestamp.toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="p-3 text-blue-600 font-medium">
                            {usage.prompt_tokens.toLocaleString()}
                          </td>
                          <td className="p-3 text-green-600 font-medium">
                            {usage.completion_tokens.toLocaleString()}
                          </td>
                          <td className="p-3 text-purple-600 font-medium">
                            {usage.total_tokens.toLocaleString()}
                          </td>
                          <td className="p-3 text-orange-600 font-medium">
                            {tokenService.formatCostUSD(usage.estimated_cost)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )} */}

          {/* Configurações de Otimização */}
          {/* <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              Configurações de Economia
            </h3>
            <OptimizationSettings />
          </div> */}

          {/* Configuração de Taxa de Câmbio */}
          {/* <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              Configuração de Taxa de Câmbio
            </h3>
            <ExchangeRateConfig onRateChange={handleExchangeRateChange} />
          </div> */}

          {/* Informações sobre Preços */}
          {/* <div className="bg-blue-50 p-4 rounded-xl">
            <h4 className="font-medium text-blue-800 mb-2">
              💡 Informações sobre Preços (GPT-4o-mini)
            </h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• <strong>Entrada:</strong> $0.15 por 1M tokens</p>
              <p>• <strong>Saída:</strong> $0.60 por 1M tokens</p>
              <p>• <strong>Cache (75% desconto):</strong> $0.0375 por 1M tokens</p>
              <p>• <strong>Câmbio atual:</strong> 1 USD = {tokenService.getExchangeRate().usd_to_brl.toFixed(2)} BRL</p>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default TokenUsagePanel; 