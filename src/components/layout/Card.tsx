import { ReactNode, FC } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  withHover?: boolean;
  withAnimation?: boolean;
  withGradient?: boolean;
  noPadding?: boolean;
  variant?: 'default' | 'outlined' | 'elevated';
}

const Card: FC<CardProps> = ({ 
  children, 
  className = '',
  withHover = false,
  withAnimation = false,
  withGradient = false,
  noPadding = false,
  variant = 'default'
}) => {
  // Definir estilos base de acordo com a variante
  const variantClasses = {
    default: 'bg-white border border-gray-100 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.1)]',
    outlined: 'bg-white border border-gray-200 shadow-sm',
    elevated: 'bg-white border border-gray-50 shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)]'
  }[variant];

  // Adicionar animação se solicitado
  const animationClass = withAnimation 
    ? 'transform transition-all duration-300 hover:scale-[1.01]' 
    : '';

  // Adicionar hover se solicitado
  const hoverClass = withHover 
    ? 'hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] transition-shadow duration-300 hover:border-blue-100' 
    : '';
    
  // Adicionar gradiente de fundo se solicitado
  const gradientClass = withGradient
    ? 'bg-gradient-to-br from-white to-blue-50/30'
    : '';
    
  // Aplicar padding padrão a menos que noPadding seja verdadeiro
  const paddingClass = noPadding ? '' : 'p-6';

  return (
    <div 
      className={`
        ${variantClasses}
        ${animationClass}
        ${hoverClass}
        ${gradientClass}
        ${paddingClass}
        rounded-xl 
        mb-6
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Card;
