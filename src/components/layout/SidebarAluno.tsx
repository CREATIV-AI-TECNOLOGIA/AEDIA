import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface SidebarAlunoProps {
  className?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const SidebarAluno: React.FC<SidebarAlunoProps> = ({ 
  className = '', 
  isCollapsed = false, 
  onToggleCollapse 
}) => {
  const [activeItem, setActiveItem] = useState('dashboard');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [collapsed, setCollapsed] = useState(isCollapsed);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleToggleCollapse = () => {
    const newCollapsedState = !collapsed;
    setCollapsed(newCollapsedState);
    if (onToggleCollapse) {
      onToggleCollapse();
    }
  };

  const handleItemClick = async (itemId: string, path?: string) => {
    setActiveItem(itemId);
    
    if (itemId === 'sair') {
      setShowLogoutModal(true);
      return;
    }

    if (path) {
      navigate(path);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
    setShowLogoutModal(false);
  };

  const menuItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      path: '/aluno',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h-2z"></path>
        </svg>
      )
    },
    { 
      id: 'estatisticas', 
      label: 'Estatísticas', 
      path: '/aluno/estatisticas',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
        </svg>
      )
    },
    { 
      id: 'tarefas', 
      label: 'Tarefas', 
      path: '/aluno/tarefas',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
        </svg>
      )
    },
    { 
      id: 'atividades', 
      label: 'Atividades', 
      path: '/aluno/atividades',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
        </svg>
      )
    },
    { 
      id: 'materiais', 
      label: 'Materiais', 
      path: '/aluno/materiais',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path>
        </svg>
      )
    },
    { 
      id: 'mensagens', 
      label: 'Mensagens', 
      path: '/aluno/mensagens',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
        </svg>
      )
    },
    { 
      id: 'calendario', 
      label: 'Calendário', 
      path: '/aluno/calendario',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
      )
    },
    { 
      id: 'configuracoes', 
      label: 'Configurações', 
      path: '/aluno/configuracoes',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
        </svg>
      )
    },
    { 
      id: 'sair', 
      label: 'Sair',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
        </svg>
      )
    }
  ];

  return (
    <div 
      className={`h-screen bg-white border-r border-gray-200 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      } ${className} flex flex-col`}
    >
      {/* Cabeçalho do Sidebar */}
      <div className="p-4 border-b border-gray-100 flex items-center">
        {!collapsed && (
          <div className="flex-1">
            <h2 className="text-xl font-bold text-blue-600">Edu App</h2>
            <p className="text-xs text-gray-500">Portal do Aluno</p>
          </div>
        )}
        <button 
          onClick={handleToggleCollapse}
          className="p-1 rounded-md hover:bg-gray-100 text-gray-400"
        >
          {collapsed ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5l7 7-7 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 19l-7-7 7-7" />
            </svg>
          )}
        </button>
      </div>

      {/* Menu de navegação */}
      <div className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-2 px-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                className={`w-full flex items-center ${
                  collapsed ? 'justify-center' : 'justify-start'
                } p-2 rounded-lg ${
                  activeItem === item.id
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100'
                } transition-colors focus:outline-none`}
                onClick={() => handleItemClick(item.id, item.path)}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {!collapsed && (
                  <span className="ml-3 font-medium">{item.label}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Modal de confirmação de logout */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Sair do sistema</h3>
            <p className="text-gray-600 mb-4">Tem certeza que deseja sair?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg focus:outline-none"
              >
                Cancelar
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg focus:outline-none"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Avatar do usuário no rodapé */}
      <div className="p-4 border-t border-gray-100 flex items-center">
        <div className="w-8 h-8 rounded-full bg-blue-100 flex-shrink-0 overflow-hidden">
          <img 
            src="https://avatar.iran.liara.run/public/boy?w=100" 
            alt="Avatar do usuário"
            className="w-full h-full object-cover"
          />
        </div>
        {!collapsed && (
          <div className="ml-3 overflow-hidden">
            <p className="text-sm font-medium text-gray-800 truncate">
              {user?.user_metadata?.name || user?.email?.split('@')[0] || 'Aluno'}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {user?.email || 'aluno@exemplo.com'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SidebarAluno;