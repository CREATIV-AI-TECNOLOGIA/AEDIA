import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  headerTitle?: string;
  headerSubtitle?: string;
  headerIcon?: React.ReactNode;
  mostrarEscola?: boolean;
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  isPublic?: boolean;
  showBackButton?: boolean;
  backTo?: string;
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
}

const routeTitles: { [key: string]: string } = {
    '/': 'Início',
    '/planos-aula': 'Planos de Aula',
    '/avaliacoes': 'Avaliações',
    '/turmas': 'Turmas',
    '/assistente': 'Assistente',
    '/diagnostico': 'Diagnóstico',
    '/calendario-escolar': 'Calendário Escolar',
    '/chat-interno': 'Comunicação Interna',
    '/configuracoes': 'Configurações',
    // Adicione outras rotas e títulos aqui
};

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  headerTitle, 
  headerSubtitle, 
  headerIcon,
  mostrarEscola,
  showSearch,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  isPublic = false,
  showBackButton = false,
  backTo,
  title,
  subtitle,
  showHeader: forceShowHeader
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Determina o título da página com base na rota atual
  const getPageTitle = () => {
    const path = location.pathname;
    // Correspondência exata
    if (routeTitles[path]) return routeTitles[path];
    // Correspondência por prefixo (ex: /turmas/123)
    const mainRoute = Object.keys(routeTitles).find(route => path.startsWith(route) && route !== '/');
    return mainRoute ? routeTitles[mainRoute] : 'Araruama IA';
  };

  const pageTitle = title || getPageTitle();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Sidebar para desktop */}
      <div className={`hidden md:block relative`}>
        <Sidebar 
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
        />
      </div>

      {/* Sidebar para mobile (sobreposta) com animação */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-30 md:hidden">
          <div 
            className="absolute inset-0 bg-gray-800 bg-opacity-75 transition-opacity duration-200" 
            onClick={toggleMobileMenu}
            style={{ 
              opacity: mounted ? 1 : 0 
            }}
          ></div>
          <div 
            className="relative flex h-full transition-transform duration-200" 
            style={{ 
              transform: mounted ? 'translateX(0)' : 'translateX(-100%)' 
            }}
          >
            <Sidebar />
            <button 
              className="absolute top-4 right-4 text-white p-2 rounded-full bg-blue-600 hover:bg-blue-700"
              onClick={toggleMobileMenu}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col flex-1 transition-all duration-300 ease-in-out">
        <Header 
          onMenuToggle={toggleMobileMenu} 
          className="bg-white border-b border-gray-200"
          titulo={pageTitle}
          subtitulo={headerSubtitle}
          icone={headerIcon}
          mostrarEscola={mostrarEscola}
          showSearch={showSearch}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          searchPlaceholder={searchPlaceholder}
        />
        <main className="flex-1 overflow-auto scrollbar-hide">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;