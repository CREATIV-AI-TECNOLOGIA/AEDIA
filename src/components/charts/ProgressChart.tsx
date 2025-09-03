import React from 'react';

interface ProgressChartProps {
  title: string;
  value: number;
  maxValue: number;
  color?: string;
  className?: string;
}

const ProgressChart: React.FC<ProgressChartProps> = ({
  title,
  value,
  maxValue,
  color = 'primary',
  className = '',
}) => {
  const percentage = Math.min(Math.round((value / maxValue) * 100), 100);
  
  // Mapeamento de cores do Tailwind
  const colorClasses = {
    primary: {
      bg: 'bg-primary-100',
      fill: 'bg-primary-600',
      text: 'text-primary-600',
    },
    success: {
      bg: 'bg-green-100',
      fill: 'bg-green-600',
      text: 'text-green-600',
    },
    warning: {
      bg: 'bg-yellow-100',
      fill: 'bg-yellow-500',
      text: 'text-yellow-600',
    },
    danger: {
      bg: 'bg-red-100',
      fill: 'bg-red-600',
      text: 'text-red-600',
    },
  };
  
  const { bg, fill, text } = colorClasses[color as keyof typeof colorClasses] || colorClasses.primary;

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{title}</span>
        <span className={`text-sm font-semibold ${text}`}>{percentage}%</span>
      </div>
      <div className={`h-3 w-full ${bg} rounded-full`}>
        <div
          className={`h-3 rounded-full ${fill}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-xs text-gray-500">0</span>
        <span className="text-xs text-gray-500">{maxValue}</span>
      </div>
    </div>
  );
};

export default ProgressChart; 