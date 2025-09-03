import React from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ 
  title, 
  subtitle, 
  icon, 
  action, 
  children, 
  className = '' 
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow ${className}`}>
      {(title || icon || action) && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            {icon && <div className="mr-3 text-primary-500">{icon}</div>}
            <div>
              {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
              {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
            </div>
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card; 