import React, { useState, useRef, useEffect } from 'react';

interface DropdownItem {
  id: string;
  label: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
  isDivider?: boolean;
  isDisabled?: boolean;
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  width?: number | string;
  className?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  align = 'left',
  width = 'auto',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Alternar visibilidade do dropdown
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };
  
  // Lidar com clique em item
  const handleItemClick = (item: DropdownItem) => {
    if (item.isDisabled) return;
    if (item.onClick) item.onClick();
    setIsOpen(false);
  };
  
  // Estilos para alinhamento
  const alignStyles = {
    left: 'left-0',
    right: 'right-0',
  };
  
  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Elemento acionador */}
      <div onClick={toggleDropdown} className="cursor-pointer">
        {trigger}
      </div>
      
      {/* Menu suspenso */}
      {isOpen && (
        <div 
          className={`absolute mt-2 ${alignStyles[align]} z-10 bg-white shadow-lg rounded-md border border-gray-200 py-1`}
          style={{ width }}
        >
          {items.map((item, index) => (
            <React.Fragment key={item.id || index}>
              {item.isDivider ? (
                <div className="border-t border-gray-200 my-1"></div>
              ) : (
                <button
                  onClick={() => handleItemClick(item)}
                  disabled={item.isDisabled}
                  className={`
                    w-full text-left px-4 py-2 text-sm flex items-center
                    ${item.isDisabled 
                      ? 'opacity-50 cursor-not-allowed text-gray-500' 
                      : 'hover:bg-gray-100 text-gray-700 hover:text-gray-900'}
                  `}
                >
                  {item.icon && <span className="mr-2 w-5 h-5">{item.icon}</span>}
                  <span>{item.label}</span>
                </button>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown; 