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
          bg-white border-r border-gray-200 h-screen fixed transition-all duration-200 z-50 top-0 left-0
          ${isCollapsed ? 'sidebar-mobile' : 'sidebar-mobile-open'} md:sidebar-mobile-open
        `}
      >
        <div className="p-4 h-full flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className={`flex items-center gap-3 ${isCollapsed ? 'hidden' : ''}`}>
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Book className="h-5 w-5 text-white" />
              </div>
              <div>
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
                    {isCollapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            to={item.href}
                            className={`
                              flex items-center gap-3 h-12 rounded-xl transition-all duration-200
                              justify-center
                              ${active 
                                ? 'bg-black text-white' 
                                : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                              }
                            `}
                          >
                            <Icon className="h-5 w-5 flex-shrink-0" />
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>{item.label}</p>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Link
                        to={item.href}
                        className={`
                          flex items-center gap-3 h-12 rounded-xl transition-all duration-200
                          px-4
                          ${active 
                            ? 'bg-black text-white' 
                            : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                          }
                        `}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Bottom Section */}
          <div className="pt-4">
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setShowLogoutModal(true)}
                    className="flex items-center gap-3 h-12 rounded-xl transition-all duration-200 text-red-500 hover:bg-red-50 hover:text-red-600 w-full justify-center focus:outline-none focus:ring-0 focus:border-transparent"
                  >
                    <LogOut className="h-5 w-5 flex-shrink-0" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Sair</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <button
                onClick={() => setShowLogoutModal(true)}
                className="flex items-center gap-3 h-12 rounded-xl transition-all duration-200 text-red-500 hover:bg-red-50 hover:text-red-600 w-full px-4 focus:outline-none focus:ring-0 focus:border-transparent"
              >
                <LogOut className="h-5 w-5 flex-shrink-0" />
                <span className="font-medium">Sair</span>
              </button>
            )}
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