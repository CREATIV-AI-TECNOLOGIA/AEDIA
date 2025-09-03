import React, { memo } from 'react';
import { useStableRender } from '../../hooks/usePageVisibility';

interface StableComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Componente que evita re-renderizações desnecessárias quando o usuário
 * sai e volta para a aba do navegador
 */
const StableComponent: React.FC<StableComponentProps> = ({ 
  children, 
  fallback = null 
}) => {
  const { isStable, shouldPreventRender } = useStableRender();

  // Se deve prevenir renderização, mostra fallback ou nada
  if (shouldPreventRender) {
    return <>{fallback}</>;
  }

  // Se está estável, renderiza normalmente
  if (isStable) {
    return <>{children}</>;
  }

  // Fallback para quando não está visível
  return <>{fallback}</>;
};

export default memo(StableComponent); 