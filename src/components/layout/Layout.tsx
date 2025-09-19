import React, { useState, useEffect } from 'react';
import { PanelLeft } from 'lucide-react';
import NewSidebar from '@/components/NewSidebar';
import Header from './Header';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';
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
  '/chat': 'Assistente',
  '/diagnostico': 'Diagnóstico',
  '/calendario-escolar': 'Calendário Escolar',
  '/chat-interno': 'Comunicação Interna',
  '/notificacoes': 'Chat Interno',
  '/configuracoes': 'Configurações',
}

// Componente para o botão mobile da sidebar
const MobileSidebarTrigger: React.FC<{ pageTitle: string }> = ({ pageTitle }) => {
  const { toggleSidebar } = useSidebar();

  return (
    <>
      <button
        onClick={toggleSidebar}
        className="h-7 w-7 flex items-center justify-center text-school-blue hover:bg-gray-100 rounded-md transition-colors"
      >
        <PanelLeft className="h-4 w-4" />
        <span className="sr-only">Toggle Sidebar</span>
      </button>
      <h1 className="ml-3 font-semibold">{pageTitle}</h1>
    </>
  );
};

const LayoutContent: React.FC<LayoutProps> = ({ 
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
  const { isCollapsed } = useSidebar();
  const location = useLocation();

  // Lógica para persistir o estado da sidebar
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    // Garante que o valor seja booleano
    return savedState ? JSON.parse(savedState) : false;
  });

  const [sidebarStyle, setSidebarStyle] = useState<'classic' | 'alt'>('alt');

  // Salva o estado no localStorage sempre que ele mudar
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prevState => !prevState);
  };

  // Determina o título da página com base na rota atual
  const getPageTitle = () => {
    const path = location.pathname;
    // Correspondência exata
    if (routeTitles[path]) return routeTitles[path];
    // Correspondência por prefixo (ex: /turmas/123)
    const mainRoute = Object.keys(routeTitles).find(route => path.startsWith(route) && route !== '/');
    return mainRoute ? routeTitles[mainRoute] : 'Escola Digital';
  };

  const pageTitle = title || getPageTitle();

  return (
      <div className="h-screen flex w-full bg-slate-50 overflow-hidden">
        <NewSidebar />
        
        <div className={`flex-1 flex flex-col transition-all duration-200 h-screen overflow-hidden ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
          {/* Mobile Header */}
          <header className="h-14 flex items-center border-b bg-white lg:hidden px-4">
            <MobileSidebarTrigger pageTitle={pageTitle} />
          </header>

          {/* Desktop Header */}
          {forceShowHeader !== false && (
            <div className="hidden lg:block">
              <Header 
                titulo={headerTitle || pageTitle}
                subtitulo={headerSubtitle}
                icone={headerIcon}
                mostrarEscola={mostrarEscola}
                showSearch={showSearch}
                searchValue={searchValue}
                onSearchChange={onSearchChange}
                searchPlaceholder={searchPlaceholder}
              />
            </div>
          )}

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-50">
            <div className="app-content">
              {children}
            </div>
          </main>
        </div>
      </div>
  );
};

const Layout: React.FC<LayoutProps> = (props) => {
  return (
    <SidebarProvider>
      <LayoutContent {...props} />
    </SidebarProvider>
  );
};

export default Layout;

