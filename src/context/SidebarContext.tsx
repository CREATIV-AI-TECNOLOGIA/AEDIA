import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = (): SidebarContextType => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

interface SidebarProviderProps {
  children: ReactNode;
}

export const SidebarProvider: React.FC<SidebarProviderProps> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    return savedState ? JSON.parse(savedState) : false;
  });

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const toggleSidebar = useCallback(() => {
    setIsCollapsed(prev => !prev);
  }, []);

  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    setIsCollapsed(collapsed);
  }, []);

  const value = {
    isCollapsed,
    toggleSidebar,
    setSidebarCollapsed,
  };

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
};

export default SidebarContext;