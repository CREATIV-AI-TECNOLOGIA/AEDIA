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
        <SidebarToggle onToggle={toggleSidebar} isCollapsed={isCollapsed} />
        <h1 className="ml-3 font-semibold">Escola Digital</h1>
      </header>

      {/* Sidebar */}
      <aside
        className={`
          ${isCollapsed ? 'w-20' : 'w-64'}
          bg-white border-r border-gray-200 h-screen fixed transition-[width] duration-200 z-50 top-0 left-0
          ${isCollapsed ? 'sidebar-mobile' : 'sidebar-mobile-open'} md:sidebar-mobile-open
        `}
      >
        <div className="p-4 h-full flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 h-14">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Book className="h-5 w-5 text-white" />
              </div>
              <div
                className={`flex flex-col overflow-hidden transition-all duration-200 ease-out origin-left ${
                  isCollapsed ? 'max-w-0 opacity-0 -translate-x-2' : 'max-w-[180px] opacity-100 translate-x-0'
                }`}
              >
                <h2 className="text-lg font-semibold text-gray-900">Escola Digital</h2>
                <p className="text-sm text-gray-500">Sistema de Gestão</p>
              </div>
            </div>
            <div className={`hidden lg:flex ${isCollapsed ? 'w-full justify-center pr-2' : ''}`}>
              <SidebarToggle onToggle={toggleSidebar} isCollapsed={isCollapsed} />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-hidden">
            <ul className="space-y-2 h-full overflow-y-auto overflow-x-hidden pr-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <li key={item.href}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          to={item.href}
                          className={`
                            group flex items-center h-12 rounded-xl transition-colors duration-200 w-full
                            ${isCollapsed ? 'justify-center px-0' : 'px-4'}
                            ${
                              active
                                ? 'bg-black text-white'
                                : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                            }
                          `}
                        >
                          <Icon className="h-5 w-5 flex-shrink-0" />
                          <span
                            className={`
                              font-medium whitespace-nowrap overflow-hidden transition-all duration-200 ease-out
                              ${isCollapsed
                                ? 'max-w-0 opacity-0 -translate-x-2 ml-0'
                                : 'max-w-[160px] opacity-100 translate-x-0 ml-3'}
                            `}
                          >
                            {item.label}
                          </span>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        className={isCollapsed ? 'block' : 'hidden'}
                      >
                        <p>{item.label}</p>
                      </TooltipContent>
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
                  className={`
                    group flex items-center h-12 rounded-xl transition-colors duration-200 text-red-500 hover:bg-red-50 hover:text-red-600 w-full
                    ${isCollapsed ? 'justify-center px-0' : 'px-4'}
                    focus:outline-none focus:ring-0 focus:border-transparent
                  `}
                >
                  <LogOut className="h-5 w-5 flex-shrink-0" />
                  <span
                    className={`
                      font-medium whitespace-nowrap overflow-hidden transition-all duration-200 ease-out
                      ${isCollapsed
                        ? 'max-w-0 opacity-0 -translate-x-2 ml-0'
                        : 'max-w-[160px] opacity-100 translate-x-0 ml-3'}
                    `}
                  >
                    Sair
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                className={isCollapsed ? 'block' : 'hidden'}
              >
                <p>Sair</p>
              </TooltipContent>
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