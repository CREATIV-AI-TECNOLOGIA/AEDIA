import React from 'react';
import { 
  Radar, 
  RadarChart as RechartsRadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  Tooltip,
  Legend 
} from 'recharts';
import { motion } from 'framer-motion';

interface RadarChartProps {
  data: {
    subject: string;
    value: number;
    fullMark: number;
  }[];
  title?: string;
  className?: string;
  colors?: string[];
}

const RadarChart: React.FC<RadarChartProps> = ({ 
  data, 
  title, 
  className = '',
  colors = ['#8884d8', '#82ca9d'] 
}) => {
  
  // Preparar os dados para o gráfico
  const chartData = data.map(item => ({
    subject: item.subject,
    A: item.value,
    fullMark: item.fullMark,
  }));

  return (
    <motion.div 
      className={`bg-white rounded-xl shadow-sm p-4 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {title && <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>}
      
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsRadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fill: '#475569', fontSize: 12 }}
            />
            <PolarRadiusAxis 
              angle={30} 
              domain={[0, 100]} 
              tick={{ fill: '#475569', fontSize: 10 }}
            />
            <Radar
              name="Desempenho"
              dataKey="A"
              stroke={colors[0]}
              fill={colors[0]}
              fillOpacity={0.6}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '0.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                border: 'none'
              }} 
              formatter={(value) => [`${value}%`, 'Desempenho']}
            />
            <Legend />
          </RechartsRadarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default RadarChart; 