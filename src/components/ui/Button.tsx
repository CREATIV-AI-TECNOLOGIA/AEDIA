import { ReactNode, forwardRef } from 'react';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  icon?: ReactNode;
  className?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'primary', size = 'md', fullWidth = false, onClick, type = 'button', disabled = false, icon, className = '' }, ref) => {
    const baseStyles = 'font-medium rounded-md transition-colors focus:outline-none';
    
    const variantStyles = {
      primary: 'bg-blue-500 hover:bg-blue-600 text-white',
      secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
      outline: 'bg-transparent border border-blue-500 text-blue-500 hover:bg-blue-50',
      danger: 'bg-red-500 hover:bg-red-600 text-white',
    };
    
    const sizeStyles = {
      sm: 'text-xs py-2 px-3',
      md: 'text-sm py-3 px-4',
      lg: 'text-base py-3 px-6',
    };
    
    const disabledStyles = disabled 
      ? 'opacity-50 cursor-not-allowed' 
      : 'cursor-pointer';
    
    const widthStyles = fullWidth ? 'w-full' : '';
    
    return (
      <button
        ref={ref}
        type={type}
        className={`
          ${baseStyles}
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${disabledStyles}
          ${widthStyles}
          ${className}
        `}
        onClick={onClick}
        disabled={disabled}
      >
        <div className="flex items-center justify-center">
          {icon && <span className="mr-2">{icon}</span>}
          {children}
        </div>
      </button>
    );
  }
);

export default Button;