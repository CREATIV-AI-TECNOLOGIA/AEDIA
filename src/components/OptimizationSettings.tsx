import React, { useState, useEffect } from 'react';
import { Settings, Zap, DollarSign, Brain, Save, RotateCcw } from 'lucide-react';

interface OptimizationMode {
  id: 'economy' | 'balanced' | 'quality';
  name: string;
  description: string;
  maxMessages: number;
  maxTokensPerMessage: number;
  estimatedSavings: string;
  color: string;
  icon: React.ReactNode;
}

interface OptimizationSettingsProps {
  onModeChange?: (mode: 'economy' | 'balanced' | 'quality') => void;
  onToggleOptimization?: (enabled: boolean) => void;
}

const OptimizationSettings: React.FC<OptimizationSettingsProps> = ({
  onModeChange,
  onToggleOptimization
}) => {
  const [currentMode, setCurrentMode] = useState<'economy' | 'balanced' | 'quality'>('balanced');
  const [optimizationEnabled, setOptimizationEnabled] = useState(true);

  const modes: OptimizationMode[] = [
    {
      id: 'economy',
      name: 'Economia Máxima',
      description: 'Reduz drasticamente o contexto para minimizar custos. Ideal para conversas simples.',
      maxMessages: 4,
      maxTokensPerMessage: 300,
      estimatedSavings: '60-80%',
      color: 'green',
      icon: <DollarSign className="w-5 h-5" />
    },
    {
      id: 'balanced',
      name: 'Equilibrado',
      description: 'Balanceia economia e qualidade. Mantém contexto essencial com boa economia.',
      maxMessages: 6,
      maxTokensPerMessage: 500,
      estimatedSavings: '40-60%',
      color: 'blue',
      icon: <Zap className="w-5 h-5" />
    },
    {
      id: 'quality',
      name: 'Qualidade Máxima',
      description: 'Prioriza a qualidade das respostas. Economia moderada com contexto completo.',
      maxMessages: 10,
      maxTokensPerMessage: 800,
      estimatedSavings: '20-40%',
      color: 'purple',
      icon: <Brain className="w-5 h-5" />
    }
  ];

  useEffect(() => {
    // Carregar configurações salvas
    const savedMode = localStorage.getItem('optimization_mode') as 'economy' | 'balanced' | 'quality';
    const savedEnabled = localStorage.getItem('optimization_enabled') !== 'false';
    
    if (savedMode && modes.find(m => m.id === savedMode)) {
      setCurrentMode(savedMode);
    }
    setOptimizationEnabled(savedEnabled);
  }, []);

  const handleModeChange = (mode: 'economy' | 'balanced' | 'quality') => {
    setCurrentMode(mode);
    localStorage.setItem('optimization_mode', mode);
    onModeChange?.(mode);
  };

  const handleToggleOptimization = (enabled: boolean) => {
    setOptimizationEnabled(enabled);
    localStorage.setItem('optimization_enabled', enabled.toString());
    onToggleOptimization?.(enabled);
  };

  const resetToDefault = () => {
    setCurrentMode('balanced');
    setOptimizationEnabled(true);
    localStorage.setItem('optimization_mode', 'balanced');
    localStorage.setItem('optimization_enabled', 'true');
    onModeChange?.('balanced');
    onToggleOptimization?.(true);
  };

  const getColorClasses = (color: string, isSelected: boolean) => {
    const baseClasses = isSelected ? 'ring-2' : 'hover:shadow-md';
    
    switch (color) {
      case 'green':
        return `${baseClasses} ${isSelected ? 'ring-green-500 bg-green-50' : 'bg-white hover:bg-green-50'} border-green-200`;
      case 'blue':
        return `${baseClasses} ${isSelected ? 'ring-blue-500 bg-blue-50' : 'bg-white hover:bg-blue-50'} border-blue-200`;
      case 'purple':
        return `${baseClasses} ${isSelected ? 'ring-purple-500 bg-purple-50' : 'bg-white hover:bg-purple-50'} border-purple-200`;
      default:
        return `${baseClasses} bg-white border-gray-200`;
    }
  };

  const getIconColor = (color: string) => {
    switch (color) {
      case 'green': return 'text-green-600';
      case 'blue': return 'text-blue-600';
      case 'purple': return 'text-purple-600';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-xl border border-orange-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-orange-100 rounded-lg">
            <Settings className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="font-medium text-foreground">Otimização de Contexto</h3>
            <p className="text-sm text-gray-600">Configure para reduzir custos automaticamente</p>
          </div>
        </div>
        
        <button
          onClick={resetToDefault}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Resetar para padrão"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Toggle de Otimização */}
      <div className="mb-4 p-3 bg-white rounded-lg border border-orange-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-800">Ativar Otimização</h4>
            <p className="text-sm text-gray-600">Reduz automaticamente tokens desnecessários</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={optimizationEnabled}
              onChange={(e) => handleToggleOptimization(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
          </label>
        </div>
      </div>

      {/* Modos de Otimização */}
      {optimizationEnabled && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-800">Modo de Otimização</h4>
          
          <div className="grid grid-cols-1 gap-3">
            {modes.map((mode) => (
              <div
                key={mode.id}
                onClick={() => handleModeChange(mode.id)}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${getColorClasses(mode.color, currentMode === mode.id)}`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${mode.color === 'green' ? 'bg-green-100' : mode.color === 'blue' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                    <div className={getIconColor(mode.color)}>
                      {mode.icon}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h5 className="font-medium text-gray-800">{mode.name}</h5>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        mode.color === 'green' ? 'bg-green-100 text-green-700' :
                        mode.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        Economia: {mode.estimatedSavings}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{mode.description}</p>
                    
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                      <span>Máx. {mode.maxMessages} mensagens</span>
                      <span>Máx. {mode.maxTokensPerMessage} tokens/msg</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Informações sobre economia */}
      <div className="mt-4 p-3 bg-orange-100 rounded-lg">
        <h5 className="font-medium text-orange-800 mb-2">💡 Como funciona a otimização:</h5>
        <ul className="text-sm text-orange-700 space-y-1">
          <li>• <strong>Limita mensagens antigas:</strong> Mantém apenas as mais recentes</li>
          <li>• <strong>Resume conversas longas:</strong> Cria resumos das mensagens antigas</li>
          <li>• <strong>Trunca mensagens longas:</strong> Corta textos muito extensos</li>
          <li>• <strong>Prioriza contexto recente:</strong> Foca nas últimas interações</li>
        </ul>
      </div>

      {!optimizationEnabled && (
        <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">
            ⚠️ <strong>Atenção:</strong> Com a otimização desabilitada, os custos podem crescer 
            exponencialmente em conversas longas (como a sua atual com 17.889 tokens de entrada).
          </p>
        </div>
      )}
    </div>
  );
};

export default OptimizationSettings;