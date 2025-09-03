import { useState, useEffect } from 'react';
import { tokenService, type ExchangeRateConfig } from '../services/tokenService';

export const useExchangeRate = () => {
  const [exchangeRate, setExchangeRate] = useState<ExchangeRateConfig | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadExchangeRate();
  }, [refreshKey]);

  const loadExchangeRate = () => {
    const rate = tokenService.getExchangeRate();
    setExchangeRate(rate);
  };

  const updateExchangeRate = (newRate: number, source: string = 'manual') => {
    tokenService.setExchangeRate(newRate, source);
    setRefreshKey(prev => prev + 1);
  };

  const resetExchangeRate = () => {
    tokenService.resetExchangeRate();
    setRefreshKey(prev => prev + 1);
  };

  const forceRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return {
    exchangeRate,
    updateExchangeRate,
    resetExchangeRate,
    forceRefresh,
    isLoaded: exchangeRate !== null
  };
}; 