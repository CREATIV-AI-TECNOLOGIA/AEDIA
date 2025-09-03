import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  withGradient?: boolean;
}

const PageContainer: React.FC<PageContainerProps> = ({ 
  children, 
  className = '',
  withGradient = false 
}) => {
  return (
    <div className={`h-full ${withGradient ? 'bg-gradient-to-br from-slate-50 via-gray-50 to-blue-100' : 'bg-gray-50'} ${className}`}>
      <div className="max-w-7xl mx-auto px-6">
        {children}
      </div>
    </div>
  );
};

export default PageContainer; 