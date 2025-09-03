import React from 'react';
import { Zap, TrendingDown, DollarSign, CheckCircle } from 'lucide-react';

interface OptimizationIndicatorProps {
  optimization?: {
    enabled: boolean;
    originalTokens: number;
    optimizedTokens: number;
    savedTokens: number;
    savedPercentage: number;
    strategy: string;
  };
  isVisible?: boolean;
}

const OptimizationIndicator: React.FC<OptimizationIndicatorProps> = ({ 
  optimization, 
  isVisible = true 
}) => {
  if (!isVisible || !optimization?.enabled || optimization.savedTokens <= 0) {
    return null;
  }

  const savedCostUSD = (optimization.savedTokens / 1000) * 0.00015; // GPT-4o-mini input cost
  const savedCostBRL = savedCostUSD * 5.50; // Taxa aproximada

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-4">
      <div className="flex items-start space-x-3">
        <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
          <CheckCircle className="w-5 h-5 text-green-600" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h4 className="font-medium text-green-800">
              🎉 Otimização Aplicada com Sucesso!
            </h4>
            <div className="flex items-center space-x-1 bg-green-100 px-2 py-1 rounded-full">
              <TrendingDown className="w-3 h-3 text-green-600" />
              <span className="text-xs font-medium text-green-700">
                -{optimization.savedPercentage.toFixed(1)}%
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div className="bg-white rounded-lg p-3 border border-green-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tokens Originais</span>
                <span className="font-medium text-gray-800">
                  {optimization.originalTokens.toLocaleString()}
                </span>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-3 border border-green-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tokens Otimizados</span>
                <span className="font-medium text-green-700">
                  {optimization.optimizedTokens.toLocaleString()}
                </span>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-3 border border-green-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tokens Economizados</span>
                <span className="font-medium text-green-600">
                  {optimization.savedTokens.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-green-100 rounded-lg p-3 mb-3">
            <div className="flex items-center space-x-2 mb-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="font-medium text-green-800">Economia Financeira:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-green-700">USD: </span>
                <span className="font-medium text-green-800">
                  ${savedCostUSD.toFixed(6)}
                </span>
              </div>
              <div>
                <span className="text-green-700">BRL: </span>
                <span className="font-medium text-green-800">
                  R$ {savedCostBRL.toFixed(4)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-3 border border-green-200">
            <div className="flex items-center space-x-2 mb-1">
              <Zap className="w-4 h-4 text-green-600" />
              <span className="font-medium text-green-800">Estratégia Aplicada:</span>
            </div>
            <p className="text-sm text-green-700">{optimization.strategy}</p>
          </div>
          
          {/* Barra visual de economia */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>Economia de Tokens</span>
              <span>{optimization.savedPercentage.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${Math.min(optimization.savedPercentage, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptimizationIndicator; 