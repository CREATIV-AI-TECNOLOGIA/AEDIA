import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para detectar visibilidade da página e evitar re-renderizações desnecessárias
 * quando o usuário sai e volta para a aba
 */
export const usePageVisibility = () => {
  const [isVisible, setIsVisible] = useState(!document.hidden);
  const [wasHidden, setWasHidden] = useState(false);

  const handleVisibilityChange = useCallback(() => {
    const isCurrentlyVisible = !document.hidden;
    
    if (!isCurrentlyVisible) {
      // Página ficou oculta
      setWasHidden(true);
    } else if (wasHidden) {
      // Página voltou a ficar visível após estar oculta
      setWasHidden(false);
    }
    
    setIsVisible(isCurrentlyVisible);
  }, [wasHidden]);

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

  return {
    isVisible,
    wasHidden,
    isReturningFromHidden: isVisible && wasHidden
  };
};

/**
 * Hook para prevenir re-renderizações quando a página volta a ficar visível
 */
export const useStableRender = () => {
  const { isVisible, isReturningFromHidden } = usePageVisibility();
  const [shouldPreventRender, setShouldPreventRender] = useState(false);

  useEffect(() => {
    if (isReturningFromHidden) {
      // Previne re-renderizações por um breve momento quando volta da aba
      setShouldPreventRender(true);
      
      const timer = setTimeout(() => {
        setShouldPreventRender(false);
      }, 100); // 100ms é suficiente para evitar o "piscar"
      
      return () => clearTimeout(timer);
    }
  }, [isReturningFromHidden]);

  return {
    isVisible,
    shouldPreventRender,
    isStable: isVisible && !shouldPreventRender
  };
}; 