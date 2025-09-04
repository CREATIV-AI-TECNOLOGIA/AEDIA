import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  Home,
  Users,
  Calendar,
  BookOpen,
  Settings,
  LogOut,
  PanelLeft,
  PanelLeftClose,
  ClipboardList,
  Bell,
  LifeBuoy,
  GraduationCap,
} from 'lucide-react';
import Button from '../ui/Button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/Tooltip';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  className?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ className, isCollapsed = false, onToggleCollapse }) => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const menuItems = [
    { id: 'home', label: 'Home', icon: Home, path: '/' },
    { id: 'planos', label: 'Planos de Aula', icon: BookOpen, path: '/planos-aula' },
    { id: 'calendario', label: 'Calendário', icon: Calendar, path: '/calendario-escolar' },
    { id: 'avaliacoes', label: 'Avaliações', icon: ClipboardList, path: '/avaliacoes' },
    { id: 'notificacoes', label: 'Notificações', icon: Bell, path: '/chat-interno' },
    { id: 'turmas', label: 'Turmas', icon: Users, path: '/turmas' },
    { id: 'configuracoes', label: 'Configurações', icon: Settings, path: '/configuracoes' },
    { id: 'suporte', label: 'Assistente', icon: LifeBuoy, path: '/chat' },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      setShowLogoutModal(false);
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) => {
    return clsx(
      'group block w-full transition-all duration-300 ease-in-out text-sm font-medium rounded-lg mx-2 mb-1',
      'hover:shadow-sm transform relative z-10',
      isActive
        ? '!bg-black text-white shadow-lg'
        : 'text-gray-900 hover:bg-gray-100 hover:text-gray-900 border border-transparent hover:border-gray-300'
    );
  };

  return (
    <>
      <aside
        className={clsx(
          'fixed left-0 top-0 z-30 h-screen bg-white sidebar transition-all duration-300 ease-in-out shadow-lg overflow-hidden',
          isCollapsed ? 'w-20' : 'w-72',
          className
        )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div
            className={clsx(
              'flex items-center px-4 h-[64px] border-b border-gray-200',
              isCollapsed ? 'justify-center' : 'justify-between'
            )}
          >
            {!isCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-lg text-gray-900">Escola Digital</h2>
                  <p className="text-xs text-gray-500 font-medium">Sistema de Gestão</p>
                </div>
              </div>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onToggleCollapse}
                    className="p-2 rounded-xl hover:bg-gray-100 transition-all duration-200 hover:scale-110 transform"
                  >
                    {isCollapsed ? (
                      <PanelLeft className="h-5 w-5 text-black" />
                    ) : (
                      <PanelLeftClose className="h-5 w-5 text-black" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side={isCollapsed ? 'right' : 'bottom'}>
                  <p>{isCollapsed ? 'Expandir menu' : 'Recolher menu'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-2 overflow-y-auto scrollbar-hide">
             <div className="space-y-0">
              {menuItems.map((item) => (
                <TooltipProvider key={item.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <NavLink to={item.path} end={item.path === '/'} className={getNavLinkClass}>
                        {({ isActive }) => (
                          <div className={clsx(
                            'flex items-center gap-3 transition-all duration-200',
                            isCollapsed ? 'justify-center h-9 px-2' : 'pl-3 pr-2 py-1.5'
                          )}>
                            <span className="flex items-center justify-center h-7 w-7 transition-colors duration-200">
                              <item.icon
                                className={clsx(
                                  'h-5 w-5 flex-shrink-0 transition-colors duration-200',
                                  isActive ? 'text-white drop-shadow-sm' : 'text-gray-700 group-hover:text-gray-900'
                                )}
                                stroke="currentColor"
                                fill="none"
                                strokeWidth={isActive ? 2 : 1.5}
                              />
                            </span>
                            {!isCollapsed && (
                              <span
                                className={clsx(
                                  'truncate font-medium transition-colors duration-200',
                                  isActive ? 'text-white font-semibold drop-shadow-sm' : 'text-gray-900'
                                )}
                              >
                                {item.label}
                              </span>
                            )}
                          </div>
                        )}
                      </NavLink>
                    </TooltipTrigger>
                    {isCollapsed && (
                      <TooltipContent side="right" className="bg-black text-white">
                        <p>{item.label}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4">
            {/* User Info (desativado por solicitação) */}
            {false && (
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-sm">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user?.email || 'Usuário'}
                  </p>
                  <p className="text-xs text-gray-500 font-medium">Professor</p>
                </div>
              )}
            </div>
            )}

            {/* Logout Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setShowLogoutModal(true)}
                    className={clsx(
                      'group flex items-center w-full transition-all duration-300 ease-in-out rounded-xl',
                      'hover:scale-105 hover:shadow-md transform mx-2',
                      isCollapsed ? 'justify-center h-10 px-2' : 'px-3 py-2 gap-3',
                      'text-sm font-medium text-black hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-200'
                    )}
                  >
                    <LogOut className={clsx(
                      'h-5 w-5 flex-shrink-0 transition-all duration-200 group-hover:scale-110 transform text-current',
                      isCollapsed && 'mx-auto'
                    )} 
                    stroke="currentColor"
                    fill="none"
                    strokeWidth={2}
                    />
                    {!isCollapsed && <span className="truncate font-medium">Sair</span>}
                  </button>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right" className="bg-black text-white">
                    <p>Sair</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </aside>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 w-96 shadow-2xl transform transition-all duration-300 scale-100">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Confirmar Saída</h3>
              <p className="text-gray-600">Tem certeza que deseja sair do sistema?</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium hover:scale-105 transform"
              >
                Cancelar
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-3 text-white bg-red-500 rounded-xl hover:bg-red-600 transition-all duration-200 font-medium hover:scale-105 transform shadow-lg"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;