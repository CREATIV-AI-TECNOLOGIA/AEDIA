import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const ROUTE_STATE_KEY = '@app-professor:current-route';
const ROUTE_DATA_KEY = '@app-professor:route-data';

/**
 * Hook para persistir e restaurar o estado da rota atual
 * Evita que o usuário perca a página atual ao recarregar
 */
export const useRouteState = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Salva a rota atual sempre que ela mudar
  useEffect(() => {
    const routeState = {
      pathname: location.pathname,
      search: location.search,
      hash: location.hash,
      timestamp: Date.now()
    };

    localStorage.setItem(ROUTE_STATE_KEY, JSON.stringify(routeState));
    
    // Salva também o state da rota se existir
    if (location.state) {
      localStorage.setItem(ROUTE_DATA_KEY, JSON.stringify(location.state));
    }
  }, [location]);

  // Função para restaurar a última rota salva
  const restoreLastRoute = () => {
    try {
      // Evita sobrepor navegação iniciada pelo usuário:
      // só tenta restaurar quando estamos na raiz '/' (ex.: após login ou carga inicial)
      if (location.pathname !== '/') {
        return false;
      }

      const savedRoute = localStorage.getItem(ROUTE_STATE_KEY);
      const savedData = localStorage.getItem(ROUTE_DATA_KEY);
      
      if (savedRoute) {
        const routeState = JSON.parse(savedRoute);
        const routeData = savedData ? JSON.parse(savedData) : null;
        
        const fullSavedPath = `${routeState.pathname}${routeState.search}${routeState.hash}`;
        const currentFullPath = `${location.pathname}${location.search}${location.hash}`;

        // Já estamos exatamente na rota salva
        if (fullSavedPath === currentFullPath) {
          return false;
        }
        
        // Só restaura se foi salvo recentemente (últimas 24 horas)
        const isRecent = Date.now() - routeState.timestamp < 24 * 60 * 60 * 1000;
        
        if (isRecent && routeState.pathname !== '/auth') {
          navigate(fullSavedPath, { 
            replace: true, 
            state: routeData 
          });
          return true;
        }
      }
    } catch (error) {
      console.error('Erro ao restaurar rota:', error);
    }
    
    return false;
  };

  // Função para limpar o estado salvo
  const clearSavedRoute = () => {
    localStorage.removeItem(ROUTE_STATE_KEY);
    localStorage.removeItem(ROUTE_DATA_KEY);
  };

  return {
    restoreLastRoute,
    clearSavedRoute
  };
};

/**
 * Hook para detectar se a página foi recarregada
 */
export const usePageReload = () => {
  const isReload = (performance as any).navigation?.type === 'reload' || 
                   (performance.getEntriesByType('navigation')[0] as any)?.type === 'reload';
  
  return isReload;
};