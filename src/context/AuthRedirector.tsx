import { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

// Hook personalizado para debounce
const useDebounce = (callback: () => void, delay: number, deps: any[]) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const debouncedCallback = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(callback, delay);
  }, deps);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

// Função utilitária para verificar se uma rota deve evitar redirecionamento
const shouldBypassRedirectForRoute = (currentPath: string, targetPath: string, userRole: string): boolean => {
  console.log(`[AuthRedirector] shouldBypassRedirectForRoute - currentPath: ${currentPath}, targetPath: ${targetPath}, userRole: ${userRole}`);
  
  // Definir sub-rotas que devem evitar redirecionamento para a raiz
  const protectedSubRoutes = [
    '/turmas',
    '/planos-aula',
    '/dashboard',
    '/avaliacoes',
    '/configuracoes',
    '/chat',
    '/calendario-escolar',
    '/gestao',
    '/aluno'
  ];
  
  // Rotas específicas que devem manter sua posição
  const bypassRoutes = [
    '/auth/login',
    '/auth/register',
    '/auth/reset-password',
    '/auth/update-password'
  ];
  
  // Se estiver em rota de auth, não redirecionar
  if (bypassRoutes.includes(currentPath)) {
    return true;
  }
  
  // Se estiver em uma sub-rota protegida e o target é a raiz, evitar redirecionamento
  if (protectedSubRoutes.includes(currentPath) && targetPath === '/') {
    return true;
  }
  
  return false;
};

export default function AuthRedirector() {
  const { user, loading, userProfile, authEvent } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Estados para controle de execução
  const lastProcessedState = useRef<string>('');
  const executionCount = useRef(0);
  const hasRedirected = useRef(false);
  const isProcessing = useRef(false);
  
  // Função principal de redirecionamento com debounce
  const handleRedirection = useCallback(() => {
    if (isProcessing.current) {
      console.log('[AuthRedirector] Já está processando, ignorando chamada');
      return;
    }

    // Criar identificador único do estado atual
    const currentStateKey = `${loading}-${!!user}-${!!userProfile}-${authEvent}-${location.pathname}`;
    
    // Verificar se o estado mudou significativamente
    if (lastProcessedState.current === currentStateKey) {
      console.log('[AuthRedirector] Estado inalterado, ignorando execução');
      return;
    }

    // Limitar número de execuções
    executionCount.current++;
    if (executionCount.current > 10) {
      console.warn('[AuthRedirector] Muitas execuções, pausando por segurança');
      return;
    }

    isProcessing.current = true;
    lastProcessedState.current = currentStateKey;

         console.log(`[AuthRedirector] useEffect executado - loading: ${loading}, user: ${!!user}, userProfile: ${userProfile || 'null'}, authEvent: ${authEvent}, pathname: ${location.pathname}`);

    try {
      // Se ainda está carregando, não fazer nada
      if (loading) {
        console.log('[AuthRedirector] Ainda carregando, aguardando...');
        return;
      }

      const currentPath = location.pathname;
      const isOnAuthPage = currentPath.startsWith('/auth');

      // Se não há usuário e não está na página de auth, redirecionar para login
      if (!user && !isOnAuthPage) {
        console.log('[AuthRedirector] Sem usuário, redirecionando para login');
        if (!hasRedirected.current) {
          hasRedirected.current = true;
          navigate('/auth/login');
        }
        return;
      }

      // Se há usuário mas não há perfil, aguardar o perfil ser carregado
      if (user && !userProfile) {
        console.log('[AuthRedirector] Usuário existe mas perfil não carregado, aguardando...');
        return;
      }

      // Se há usuário e perfil, e está na página de auth, redirecionar conforme o tipo
      if (user && userProfile && isOnAuthPage) {
        console.log('[AuthRedirector] Usuário logado na página de auth, redirecionando...');
        if (!hasRedirected.current) {
          hasRedirected.current = true;
          navigate('/');
        }
        return;
      }

      // Lógica específica para diferentes eventos de auth
      if (authEvent === 'SIGNED_IN') {
        console.log(`[AuthRedirector] SIGNED_IN - currentPath: ${currentPath}, targetPath: /, isOnAuthPage: ${isOnAuthPage}`);
        
                 if (shouldBypassRedirectForRoute(currentPath, '/', userProfile || '')) {
          console.log(`[AuthRedirector] Não redirecionando - hasRedirected: ${hasRedirected.current}, targetPath === currentPath: ${currentPath === '/'}`);
          return;
        }

        if (!isOnAuthPage && currentPath !== '/' && !hasRedirected.current) {
          console.log('[AuthRedirector] SIGNED_IN - mantendo posição atual');
          hasRedirected.current = true;
          return;
        }
      }

      if (authEvent === 'INITIAL_SESSION') {
        console.log(`[AuthRedirector] ${authEvent} - pathname: ${currentPath}`);
        
        // Para INITIAL_SESSION, verificar se é primeira carga
        if (!hasRedirected.current) {
          console.log('[AuthRedirector] Primeira carga da página - pathname:', currentPath);
          hasRedirected.current = true;
          
          if (!isOnAuthPage) {
            console.log('[AuthRedirector] Não está na página de auth, mantendo posição atual');
            return;
          }
        }
      }

    } finally {
      // Reset do controle após um tempo
      setTimeout(() => {
        isProcessing.current = false;
      }, 100);
    }
  }, [loading, user, userProfile, authEvent, location.pathname, navigate]);

  // Aplicar debounce à função de redirecionamento
  const debouncedRedirection = useDebounce(handleRedirection, 50, [
    loading, user, userProfile, authEvent, location.pathname
  ]);

  useEffect(() => {
    debouncedRedirection();
  }, [debouncedRedirection]);

  // Reset do controle a cada 5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      executionCount.current = 0;
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return null;
} 