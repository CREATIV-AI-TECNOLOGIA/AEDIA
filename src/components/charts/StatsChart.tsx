import { ReactNode, FC } from 'react';

interface StatsProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  icon?: ReactNode;
  className?: string;
}

const StatsChart: FC<StatsProps> = ({
  title,
  value,
  change,
  icon,
  className = '',
}) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 ${className}`}>
      <div className="flex justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold mt-2">{value}</p>
          
          {change && (
            <div className="flex items-center mt-2">
              <span 
                className={`text-sm font-medium ${
                  change.type === 'increase' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {change.type === 'increase' ? '+' : '-'}{Math.abs(change.value)}%
              </span>
              <span className="text-xs text-gray-500 ml-1">do mês anterior</span>
            </div>
          )}
        </div>
        
        {icon && (
          <div className="h-12 w-12 bg-primary-50 rounded-lg flex items-center justify-center text-primary-500">
            {icon}
          </div>
        )}
      </div>
      
      {/* Gráfico Simplificado */}
      <div className="mt-4 h-16">
        <div className="flex h-full items-end space-x-1">
          {[35, 45, 35, 50, 40, 60, 55, 65, 70, 80, 75, 68].map((height, i) => (
            <div 
              key={i} 
              className="w-full bg-primary-100 rounded-t"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatsChart;