import { ReactNode, FC } from 'react';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  withGradient?: boolean;
}

const PageContainer: FC<PageContainerProps> = ({ 
  children, 
  className = '',
  withGradient = false 
}) => {
  return (
    <div className={`h-full ${withGradient ? 'bg-gradient-to-br from-slate-50 via-gray-50 to-blue-100' : 'bg-slate-50'} ${className}`}>
      <div className="page-center px-4 sm:px-6 lg:px-8 pt-8 pb-16 space-y-6 w-full">
        {children}
      </div>
    </div>
  );
};

export default PageContainer;
