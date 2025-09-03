import React, { useState, useEffect } from 'react';
import { DollarSign, Save, RotateCcw, Calendar, TrendingUp } from 'lucide-react';
import { tokenService, type ExchangeRateConfig } from '../services/tokenService';

interface ExchangeRateConfigProps {
  onRateChange?: (newRate: number) => void;
}

const ExchangeRateConfig: React.FC<ExchangeRateConfigProps> = ({ onRateChange }) => {
  const [currentRate, setCurrentRate] = useState<ExchangeRateConfig | null>(null);
  const [newRate, setNewRate] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadCurrentRate();
  }, []);

  const loadCurrentRate = () => {
    const rate = tokenService.getExchangeRate();
    setCurrentRate(rate);
    setNewRate(rate.usd_to_brl.toFixed(2));
  };

  const handleSave = async () => {
    const rateValue = parseFloat(newRate);
    
    if (isNaN(rateValue) || rateValue <= 0) {
      alert('Por favor, insira uma taxa de câmbio válida (maior que zero)');
      return;
    }

    setIsSaving(true);
    
    try {
      tokenService.setExchangeRate(rateValue, 'manual');
      loadCurrentRate();
      setIsEditing(false);
      onRateChange?.(rateValue);
      
      // Feedback visual
      setTimeout(() => setIsSaving(false), 500);
    } catch (error) {
      console.error('Erro ao salvar taxa de câmbio:', error);
      alert('Erro ao salvar taxa de câmbio');
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Tem certeza que deseja resetar para a taxa padrão (5.50)?')) {
      tokenService.resetExchangeRate();
      loadCurrentRate();
      setIsEditing(false);
      onRateChange?.(5.50);
    }
  };

  const handleCancel = () => {
    if (currentRate) {
      setNewRate(currentRate.usd_to_brl.toFixed(2));
    }
    setIsEditing(false);
  };

  const formatLastUpdated = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`;
    } else if (diffHours > 0) {
      return `${diffHours} hora${diffHours > 1 ? 's' : ''} atrás`;
    } else {
      return 'Agora mesmo';
    }
  };

  if (!currentRate) {
    return (
      <div className="animate-pulse">
        <div className="h-20 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-xl border border-green-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-green-100 rounded-lg">
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-800">Taxa de Câmbio USD/BRL</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calendar className="w-3 h-3" />
              <span>Atualizado {formatLastUpdated(currentRate.last_updated)}</span>
            </div>
          </div>
        </div>
        
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors"
          >
            Editar
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">1 USD =</span>
            <input
              type="number"
              value={newRate}
              onChange={(e) => setNewRate(e.target.value)}
              step="0.01"
              min="0.01"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: 5.50"
            />
            <span className="text-sm font-medium text-gray-700">BRL</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center space-x-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Salvando...' : 'Salvar'}</span>
            </button>
            
            <button
              onClick={handleCancel}
              className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cancelar
            </button>
            
            <button
              onClick={handleReset}
              className="flex items-center space-x-1 px-3 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
              title="Resetar para padrão (5.50)"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl font-bold text-green-700">
              {currentRate.usd_to_brl.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">
              <div>1 USD = {currentRate.usd_to_brl.toFixed(2)} BRL</div>
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-3 h-3" />
                <span>Fonte: {currentRate.source === 'manual' ? 'Manual' : 'Padrão'}</span>
              </div>
            </div>
          </div>
          
          <div className="text-right text-sm text-gray-500">
            <div>Exemplo:</div>
            <div>$0.01 = {tokenService.formatCostBRL(0.01)}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExchangeRateConfig; 