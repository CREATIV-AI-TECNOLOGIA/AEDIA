import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  className?: string;
  showClearButton?: boolean;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  options,
  value,
  onChange,
  label,
  placeholder = 'Selecionar...',
  className = '',
  showClearButton = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Encontrar a opção selecionada pelo valor
  const selectedOption = options.find(option => option.value === value);
  
  // Lidar com cliques fora do dropdown para fechá-lo
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
  
  // Limpar a seleção
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };
  
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="text-sm font-medium text-gray-700 mb-1">{label}</div>
      
      <div 
        className={`
          relative flex items-center justify-between
          px-3 py-2 border rounded-lg cursor-pointer
          ${isOpen ? 'border-indigo-500 ring-1 ring-indigo-200' : 'border-gray-300 hover:border-gray-400'}
          ${value ? 'bg-white' : 'bg-gray-50 text-gray-500'}
          transition-all duration-150
        `}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        
        <div className="flex items-center">
          {showClearButton && value && (
            <button
              onClick={handleClear}
              className="mr-1 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-0 focus:border-transparent"
            >
              <X size={16} />
            </button>
          )}
          <ChevronDown 
            size={18} 
            className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} 
          />
        </div>
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg"
          >
            <ul className="py-1 max-h-60 overflow-auto">
              {options.map((option) => (
                <li
                  key={option.value}
                  className={`
                    px-3 py-2 cursor-pointer text-sm
                    ${option.value === value ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}
                  `}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                >
                  {option.label}
                </li>
              ))}
              {options.length === 0 && (
                <li className="px-3 py-2 text-sm text-gray-500 italic">
                  Nenhuma opção disponível
                </li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FilterDropdown;