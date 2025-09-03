import React, { useState, useEffect } from 'react';
import SidebarAluno from './SidebarAluno';

interface LayoutAlunoProps {
  children: React.ReactNode;
}

const LayoutAluno: React.FC<LayoutAlunoProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Efeito para verificar o tamanho da tela no carregamento e em resize
  useEffect(() => {
    console.log('[LayoutAluno.tsx] useEffect de montagem (setMounted).');
    setMounted(true);
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const handleToggleSidebar = () => {
    if (isMobile) {
      setShowMobileSidebar(!showMobileSidebar);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  // Apenas renderize quando o componente estiver montado para evitar erros de hidratação
  if (!mounted) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar para Desktop */}
      {!isMobile && (
        <SidebarAluno 
          isCollapsed={sidebarCollapsed} 
          onToggleCollapse={handleToggleSidebar}
        />
      )}

      {/* Sidebar para Mobile (com overlay) */}
      {isMobile && showMobileSidebar && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20"
            onClick={() => setShowMobileSidebar(false)}
          />
          <div className="fixed inset-y-0 left-0 z-30">
            <SidebarAluno 
              isCollapsed={false} 
              onToggleCollapse={() => setShowMobileSidebar(false)}
            />
          </div>
        </>
      )}

      {/* Conteúdo principal */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Barra superior para mobile */}
        {isMobile && (
          <header className="bg-white border-b border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <button 
                onClick={handleToggleSidebar}
                className="p-1 rounded-md text-gray-500 hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="text-center">
                <h1 className="text-lg font-bold text-blue-600">Edu App</h1>
                <p className="text-xs text-gray-500">Portal do Aluno</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-100 overflow-hidden">
                <img 
                  src="https://avatar.iran.liara.run/public/boy?w=100" 
                  alt="Avatar do usuário"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </header>
        )}

        {/* Conteúdo da página */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default LayoutAluno; 