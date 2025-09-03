import React from 'react';
import { motion } from 'framer-motion';

interface ProgressRadialProps {
  value: number;
  maxValue?: number;
  size?: number;
  thickness?: number;
  color?: string;
  backgroundColor?: string;
  label?: string;
  valueLabel?: string;
  className?: string;
  showPercentage?: boolean;
  subtitle?: string;
  icon?: React.ReactNode;
}

const ProgressRadial: React.FC<ProgressRadialProps> = ({
  value,
  maxValue = 100,
  size = 120,
  thickness = 8,
  color = '#4f46e5',
  backgroundColor = '#e2e8f0',
  label,
  valueLabel,
  className = '',
  showPercentage = true,
  subtitle,
  icon
}) => {
  // Calcular a porcentagem
  const percentage = Math.min(Math.round((value / maxValue) * 100), 100);
  
  // Calcular propriedades do círculo SVG
  const radius = (size - thickness) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  // Cores de progresso dinâmicas baseadas no valor
  let dynamicColor = color;
  if (!color.startsWith('#')) {
    // Se não for um hex color, vamos assumir que é uma cor fixa
    if (percentage < 40) dynamicColor = '#ef4444'; // vermelho
    else if (percentage < 70) dynamicColor = '#f59e0b'; // amarelo
    else dynamicColor = '#10b981'; // verde
  }

  return (
    <motion.div 
      className={`flex flex-col items-center justify-center ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      {label && <div className="text-sm font-medium text-gray-700 mb-2">{label}</div>}
      
      <div className="relative flex items-center justify-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Círculo de fundo */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={backgroundColor}
            strokeWidth={thickness}
          />
          
          {/* Círculo de progresso com animação */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={dynamicColor}
            strokeWidth={thickness}
            strokeDasharray={circumference}
            strokeDashoffset={circumference}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        
        {/* Conteúdo central */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {icon && (
            <div className="mb-1 text-gray-600">
              {icon}
            </div>
          )}
          
          <div className="flex items-baseline">
            <span className="text-2xl font-bold" style={{ color: dynamicColor }}>
              {valueLabel || value}
            </span>
            {showPercentage && (
              <span className="ml-1 text-sm text-gray-600">
                {valueLabel ? '' : '%'}
              </span>
            )}
          </div>
          
          {subtitle && (
            <span className="text-xs text-gray-500 mt-1 text-center">
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProgressRadial; 