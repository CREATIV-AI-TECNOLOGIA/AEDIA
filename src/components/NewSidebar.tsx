import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext';
import {
  Home,
  BookOpen,
  Calendar,
  ClipboardList,
  Bell,
  Users,
  Settings,
  MessageCircle,
  LogOut,
  Book
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ConfirmationModal from './ConfirmationModal';
import SidebarToggle from './ui/SidebarToggle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface SidebarItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const sidebarItems: SidebarItem[] = [
  {
    href: '/',
    icon: Home,
    label: 'Home'
  },
  {
    href: '/planos-aula',
    icon: BookOpen,
    label: 'Planos de Aula'
  },
  {
    href: '/calendario-escolar',
    icon: Calendar,
    label: 'Calendário'
  },
  {
    href: '/avaliacoes',
    icon: ClipboardList,
    label: 'Avaliações'
  },
  { href: '/chat-interno', icon: Bell, label: 'Chat' },
  {
    href: '/turmas',
    icon: Users,
    label: 'Turmas'
  },
  {
    href: '/configuracoes',
    icon: Settings,
    label: 'Configurações'
  },
  {
    href: '/chat',
    icon: MessageCircle,
    label: 'Assistente'
  }
];

export default function NewSidebar() {
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { signOut } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const navId = 'sidebar-nav';



  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/' || location.pathname === '/dashboard-professor';
    }
    return location.pathname === href;
  };

  return (
    <TooltipProvider>
      {/* Mobile Header */}
      <header className="h-14 flex items-center border-b bg-white lg:hidden px-4">
        <SidebarToggle onToggle={toggleSidebar} isCollapsed={isCollapsed} controlsId={navId} />
        <h1 className="ml-3 font-semibold">Escola Digital</h1>
      </header>

      {/* Sidebar */}
      <aside 
        data-state={isCollapsed ? 'collapsed' : 'expanded'}
        className={`sidebar bg-white border-r border-gray-200 h-screen fixed z-50 top-0 left-0 flex flex-col
          ${isCollapsed ? 'sidebar-mobile' : 'sidebar-mobile-open'} md:sidebar-mobile-open
        `}
      >
        <div className="sidebar__inner p-4 h-full flex flex-col overflow-hidden">
          {/* Header */}
          <div className="sidebar__header flex items-center justify-between mb-8">
            <div className="sidebar__brand" aria-hidden={isCollapsed}>
              <div className="sidebar__brand-icon">
                <Book className="h-4 w-4 text-white" />
              </div>
              <span className="sidebar__brand-label">AEDIA</span>
            </div>
            <div className="sidebar__toggle hidden lg:flex">
              <SidebarToggle onToggle={toggleSidebar} isCollapsed={isCollapsed} controlsId={navId} />
            </div>
          </div>

          {/* Navigation */}
          <nav id={navId} aria-label="Menu principal" className="sidebar__nav flex-1 overflow-hidden">
            <ul className="sidebar__list space-y-2 h-full overflow-y-auto overflow-x-hidden pr-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                const linkContent = (
                  <Link
                    to={item.href}
                    className={`sidebar-link transition-colors duration-200 ${
                      active
                        ? 'bg-black text-white'
                        : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                    }`}
                  >
                    <span className="sidebar__icon" aria-hidden="true">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="sidebar__label">{item.label}</span>
                  </Link>
                );

                return (
                  <li key={item.href} className="sidebar__item">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {linkContent}
                      </TooltipTrigger>
                      {isCollapsed && (
                        <TooltipContent side="right">
                          <p>{item.label}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Bottom Section */}
          <div className="pt-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setShowLogoutModal(true)}
                  className="sidebar-link text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors duration-200 focus:outline-none focus:ring-0 focus:border-transparent"
                >
                  <span className="sidebar__icon" aria-hidden="true">
                    <LogOut className="h-5 w-5" />
                  </span>
                  <span className="sidebar__label">Sair</span>
                </button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right">
                  <p>Sair</p>
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      {/* Modal de Confirmação de Logout */}
      <ConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={async () => {
          try {
            await signOut()
            navigate('/auth')
          } catch (error) {
            console.error('Erro ao fazer logout:', error)
          }
        }}
        title="Confirmar Saída"
        message="Tem certeza de que deseja sair do sistema?"
        confirmText="Sair"
        cancelText="Cancelar"
        type="warning"
      />
    </TooltipProvider>
  );
}

// CSS adicional para mobile
const additionalStyles = `
.sidebar-mobile {
  transform: translateX(-100%);
}

.sidebar-mobile-open {
  transform: translateX(0);
}

@media (max-width: 768px) {
  .sidebar-mobile {
    transform: translateX(-100%);
  }
  .sidebar-mobile-open {
    transform: translateX(0);
  }
}
`;

// Exportar os estilos se necessário
export { additionalStyles };
