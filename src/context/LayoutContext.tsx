import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';

interface LayoutState {
  sidebarVisible: boolean;
  bodyOverflowHidden: boolean;
}

interface LayoutContextType {
  layoutState: LayoutState;
  setSidebarVisible: (visible: boolean) => void;
  setBodyOverflowHidden: (hidden: boolean) => void;
  enterFullscreenMode: () => void;
  exitFullscreenMode: () => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

interface LayoutProviderProps {
  children: ReactNode;
}

export const LayoutProvider = ({ children }: LayoutProviderProps) => {
  const [layoutState, setLayoutState] = useState<LayoutState>({
    sidebarVisible: true,
    bodyOverflowHidden: false,
  });

  // Efeito para aplicar mudanças no body overflow
  useEffect(() => {
    if (layoutState.bodyOverflowHidden) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    // Cleanup quando o componente for desmontado
    return () => {
      document.body.style.overflow = '';
    };
  }, [layoutState.bodyOverflowHidden]);

  // Efeito para aplicar mudanças na sidebar
  useEffect(() => {
    const sidebar = document.querySelector('aside') || 
                   document.querySelector('.sidebar') || 
                   document.querySelector('nav[role="navigation"]');
    
    if (sidebar) {
      if (layoutState.sidebarVisible) {
        (sidebar as HTMLElement).style.display = '';
      } else {
        (sidebar as HTMLElement).style.display = 'none';
      }
    }

    // Cleanup quando o componente for desmontado
    return () => {
      if (sidebar) {
        (sidebar as HTMLElement).style.display = '';
      }
    };
  }, [layoutState.sidebarVisible]);

  const setSidebarVisible = useCallback((visible: boolean) => {
    setLayoutState(prev => ({ ...prev, sidebarVisible: visible }));
  }, []);

  const setBodyOverflowHidden = useCallback((hidden: boolean) => {
    setLayoutState(prev => ({ ...prev, bodyOverflowHidden: hidden }));
  }, []);

  const enterFullscreenMode = useCallback(() => {
    setLayoutState({
      sidebarVisible: false,
      bodyOverflowHidden: true,
    });
  }, []);

  const exitFullscreenMode = useCallback(() => {
    setLayoutState({
      sidebarVisible: true,
      bodyOverflowHidden: false,
    });
  }, []);

  const contextValue: LayoutContextType = useMemo(() => ({
    layoutState,
    setSidebarVisible,
    setBodyOverflowHidden,
    enterFullscreenMode,
    exitFullscreenMode,
  }), [layoutState, setSidebarVisible, setBodyOverflowHidden, enterFullscreenMode, exitFullscreenMode]);

  return (
    <LayoutContext.Provider value={contextValue}>
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = (): LayoutContextType => {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout deve ser usado dentro de um LayoutProvider');
  }
  return context;
};

export default LayoutContext; 