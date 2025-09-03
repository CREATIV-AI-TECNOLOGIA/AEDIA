import React from 'react';
import { MessageSquare, Brain, Settings, History, Zap } from 'lucide-react';
import { TokenUsage } from '../services/tokenService';

interface LiveTokenBreakdownProps {
  lastUsage: TokenUsage | null;
  isVisible: boolean;
}

const LiveTokenBreakdown: React.FC<LiveTokenBreakdownProps> = ({ lastUsage, isVisible }) => {
  if (!isVisible || !lastUsage) return null;

  // Estimativa do breakdown baseado em padrões típicos
  const estimateBreakdown = (promptTokens: number) => {
    // Baseado em observações típicas do sistema
    const systemPrompt = Math.floor(promptTokens * 0.7); // ~70% é prompt do sistema
    const history = Math.floor(promptTokens * 0.2);      // ~20% é histórico
    const userMessage = promptTokens - systemPrompt - history; // Resto é mensagem do usuário
    
    return {
      systemPrompt: Math.max(systemPrompt, 0),
      history: Math.max(history, 0),
      userMessage: Math.max(userMessage, 1)
    };
  };

  const breakdown = estimateBreakdown(lastUsage.prompt_tokens);

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4 mb-6">
      <h4 className="font-medium text-purple-800 mb-4 flex items-center">
        <Zap className="w-5 h-5 mr-2" />
        Breakdown da Última Chamada
      </h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tokens de Entrada */}
        <div className="bg-white rounded-lg p-4 border border-purple-200">
          <h5 className="font-medium text-purple-700 mb-3 flex items-center">
            <MessageSquare className="w-4 h-4 mr-2" />
            Tokens de Entrada ({lastUsage.prompt_tokens})
          </h5>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Settings className="w-3 h-3 mr-2 text-gray-500" />
                <span className="text-sm">Prompt Sistema</span>
              </div>
              <span className="text-sm font-medium text-purple-600">
                ~{breakdown.systemPrompt}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <History className="w-3 h-3 mr-2 text-gray-500" />
                <span className="text-sm">Histórico</span>
              </div>
              <span className="text-sm font-medium text-purple-600">
                ~{breakdown.history}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <MessageSquare className="w-3 h-3 mr-2 text-gray-500" />
                <span className="text-sm">Sua Mensagem</span>
              </div>
              <span className="text-sm font-medium text-purple-600">
                ~{breakdown.userMessage}
              </span>
            </div>
          </div>
          
          {/* Barra visual */}
          <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full flex">
              <div 
                className="bg-blue-500" 
                style={{ width: `${(breakdown.systemPrompt / lastUsage.prompt_tokens) * 100}%` }}
              />
              <div 
                className="bg-green-500" 
                style={{ width: `${(breakdown.history / lastUsage.prompt_tokens) * 100}%` }}
              />
              <div 
                className="bg-orange-500" 
                style={{ width: `${(breakdown.userMessage / lastUsage.prompt_tokens) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tokens de Saída */}
        <div className="bg-white rounded-lg p-4 border border-purple-200">
          <h5 className="font-medium text-purple-700 mb-3 flex items-center">
            <Brain className="w-4 h-4 mr-2" />
            Tokens de Saída ({lastUsage.completion_tokens})
          </h5>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Brain className="w-3 h-3 mr-2 text-gray-500" />
                <span className="text-sm">Resposta da IA</span>
              </div>
              <span className="text-sm font-medium text-purple-600">
                {lastUsage.completion_tokens}
              </span>
            </div>
          </div>
          
          {/* Barra visual */}
          <div className="mt-3 h-2 bg-purple-500 rounded-full" />
          
          <div className="mt-3 text-xs text-gray-500">
            Modelo: {lastUsage.model}
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-purple-600 bg-purple-100 rounded-lg p-2">
        💡 <strong>Dica:</strong> O breakdown do prompt é estimado. Os valores reais podem variar 
        dependendo do conteúdo específico e da tokenização do modelo.
      </div>
    </div>
  );
};

export default LiveTokenBreakdown; 