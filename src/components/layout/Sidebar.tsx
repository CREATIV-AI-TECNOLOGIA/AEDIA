import React, { useState, useEffect, useMemo } from 'react';
import { Button } from "../ui";
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getTurmasDoProfessorDetalhado, TurmaDetalhadaProfessor } from '../../services/ProfessorService';
import { 
  Home,
  BookOpen,
  FileText,
  Users,
  BarChart3,
  Calendar,
  Settings,
  LogOut,
  Bell,
  HelpCircle,
  PanelLeftClose,
  PanelLeft,
  ChevronDown
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import clsx from 'clsx';

interface SidebarProps {
  className?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const allMenuItems = [
  { id: 'home', label: 'Home', path: '/', icon: Home, roles: ['professor', 'diretora'] },
  { id: 'gestao', label: 'Gestão', path: '/gestao', icon: BarChart3, roles: ['diretora'] },
  { id: 'planos-aula', label: 'Planos de Aula', path: '/planos-aula', icon: BookOpen, roles: ['professor'] },
  { id: 'calendario', label: 'Calendário', path: '/calendario-escolar', icon: Calendar, roles: ['professor'] },
  { id: 'turmas', label: 'Turmas', path: '/turmas', icon: Users, roles: ['professor', 'diretora'] },
  { id: 'avaliacoes', label: 'Avaliações', path: '/avaliacoes', icon: FileText, roles: ['professor'] },
  { id: 'notificacoes', label: 'Notificações', path: '/chat-interno', icon: Bell, roles: ['professor', 'diretora'] },
  { id: 'configuracoes', label: 'Configurações', path: '/configuracoes', icon: Settings, roles: ['professor', 'diretora'] },
  { id: 'suporte', label: 'Suporte', path: '/chat', icon: HelpCircle, roles: ['professor', 'diretora'] }
];

const Sidebar: React.FC<SidebarProps> = ({ className = '', isCollapsed: initialIsCollapsed = false, onToggleCollapse }) => {
  const [collapsed, setCollapsed] = useState(initialIsCollapsed);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [turmas, setTurmas] = useState<TurmaDetalhadaProfessor[]>([]);
  const [isTurmasOpen, setTurmasOpen] = useState(false);
  const [turmasLoading, setTurmasLoading] = useState(false);
  const [turmasError, setTurmasError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, professor } = useAuth();

  useEffect(() => {
    const fetchTurmas = async () => {
      if (user?.user_metadata?.role === 'professor' && professor?.id) {
        setTurmasLoading(true);
        setTurmasError(null);
        try {
          const turmasData = await getTurmasDoProfessorDetalhado(professor.id);
          setTurmas(turmasData);
        } catch (error) {
          console.error("Erro ao buscar turmas:", error);
          setTurmasError("Não foi possível carregar as turmas.");
        }
        setTurmasLoading(false);
      }
    };
    fetchTurmas();
  }, [user, professor]);

  const handleToggleSidebar = () => {
    setCollapsed(!collapsed);
    onToggleCollapse?.();
  };

  const [isNavigating, setIsNavigating] = useState(false);

  const handleItemClick = async (path: string) => {
    if (isNavigating || location.pathname === path) {
      return;
    }
    
    setIsNavigating(true);
    try {
      navigate(path);
      // Pequeno delay para evitar cliques duplos
      await new Promise(resolve => setTimeout(resolve, 300));
    } finally {
      setIsNavigating(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    setShowLogoutModal(false);
  };

  const menuItems = useMemo(() => {
    const userRole = user?.user_metadata?.role;
    if (!userRole) return [];
    return allMenuItems.filter(item => item.roles.includes(userRole));
  }, [user]);

  const getActiveItem = () => {
    const currentPath = location.pathname;
    if (currentPath === '/') return 'home';

    if (currentPath.startsWith('/turmas/')) return 'turmas';

    const foundItem = menuItems.find(item => 
      item.path !== '/' && currentPath.startsWith(item.path)
    );
    
    return foundItem?.id || 'home';
  };

  const activeItem = getActiveItem();

  // Define o path de Turmas baseado no papel do usuário e turmas carregadas
  const turmasPath = useMemo(() => {
    if (user?.user_metadata?.role === 'professor' && turmas.length > 0) {
      return `/turmas/${turmas[0].id}`;
    }
    return '/turmas';
  }, [turmas, user]);

  useEffect(() => {
    setCollapsed(initialIsCollapsed);
  }, [initialIsCollapsed]);

  useEffect(() => {
    if (activeItem === 'turmas') {
      setTurmasOpen(true);
    } else if (!location.pathname.startsWith('/turmas')) {
      setTurmasOpen(false);
    }
  }, [activeItem, location.pathname]);

  return (
    <>
      <aside 
        className={clsx(
          'relative bg-white h-full shadow-md transition-all duration-300 flex flex-col',
          collapsed ? 'w-14' : 'w-56',
          className
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 h-24 relative z-30">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full"></div>
              <span className="text-lg font-bold">ABC Solutions</span>
            </div>
          )}
          <div className={clsx(
            'absolute top-1/2 transform -translate-y-1/2',
            collapsed ? 'left-1/2 -translate-x-1/2' : 'right-2'
          )}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost"
                    size="icon"
                    onClick={handleToggleSidebar}
                    className="rounded-full text-gray-500 hover:bg-gray-200/80 hover:text-gray-700"
                  >
                    {collapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{collapsed ? 'Abrir menu' : 'Recolher menu'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      
        <nav className={clsx(
          "flex-1 space-y-2 py-2 overflow-y-auto",
          collapsed ? "px-2" : "px-6"
        )}>
          {menuItems.map((item) => {
            const isActive = activeItem === item.id;
            if (item.id === 'turmas') {
              const href = user?.user_metadata?.role === 'professor' ? turmasPath : item.path;
              return (
                <div key={item.id} className="relative">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <a
                          href={href}
                          className={clsx(
                            'flex items-center p-2 rounded-md transition-colors duration-200',
                            {
                              'bg-blue-100 text-blue-600': isActive,
                              'text-gray-600 hover:bg-gray-100': !isActive
                            },
                            collapsed ? 'justify-center' : ''
                          )}
                          onClick={(e) => {
                            e.preventDefault();
                            handleItemClick(href);
                          }}
                        >
                          <item.icon className="h-5 w-5" />
                          {!collapsed && <span className="ml-3">{item.label}</span>}
                        </a>
                      </TooltipTrigger>
                      {collapsed && (
                        <TooltipContent side="right">
                          <p>{item.label}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </div>
              );
            }

            return (
              <div key={item.id} className="relative">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a
                        href={item.path}
                        className={clsx(
                          'flex items-center p-2 rounded-md transition-colors duration-200',
                          {
                            'bg-blue-100 text-blue-600': isActive,
                            'text-gray-600 hover:bg-gray-100': !isActive
                          },
                          collapsed ? 'justify-center' : ''
                        )}
                        onClick={(e) => {
                          e.preventDefault();
                          handleItemClick(item.path);
                        }}
                      >
                        <item.icon className="h-5 w-5" />
                        {!collapsed && <span className="ml-3">{item.label}</span>}
                      </a>
                    </TooltipTrigger>
                    {collapsed && (
                      <TooltipContent side="right">
                        <p>{item.label}</p>
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              </div>
            );
          })}
        </nav>
      
        <div className={clsx(
          "mt-auto py-2 border-t border-gray-200",
          collapsed ? "px-2" : "px-6"
        )}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setShowLogoutModal(true)}
                  className={clsx(
                    'group relative flex items-center w-full transition-all duration-200 ease-out transform rounded-xl ring-1 ring-transparent',
                    'px-3 py-2.5 h-10',
                    'text-gray-600 hover:bg-red-50 hover:text-red-600 hover:ring-red-200 hover:shadow-sm',
                    collapsed ? 'justify-center' : ''
                  )}
                >
                  <LogOut className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span className="font-medium text-sm ml-3">Sair</span>}
                </button>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right">
                  <p>Sair</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </aside>

      {showLogoutModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black/50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Confirmar Saída
            </h3>
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja sair do sistema?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-200"
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