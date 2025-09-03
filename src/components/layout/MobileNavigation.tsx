import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Camera, 
  Home, 
  FileText, 
  Users, 
  Settings
} from 'lucide-react';

const MobileNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const navItems = [
    {
      path: '/',
      icon: Home,
      label: 'Início',
      color: 'text-blue-600'
    },
    {
      path: '/turmas',
      icon: Users,
      label: 'Turmas',
      color: 'text-green-600'
    },
    {
      path: '/correcao-mobile',
      icon: Camera,
      label: 'Correção',
      color: 'text-purple-600'
    },
    {
      path: '/avaliacoes',
      icon: FileText,
      label: 'Avaliações',
      color: 'text-orange-600'
    },
    {
      path: '/configuracoes',
      icon: Settings,
      label: 'Config',
      color: 'text-gray-600'
    }
  ];

  // Só mostrar em dispositivos móveis
  const isMobile = window.innerWidth <= 768;
  
  if (!isMobile) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                active 
                  ? `${item.color} bg-gray-50` 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileNavigation; 