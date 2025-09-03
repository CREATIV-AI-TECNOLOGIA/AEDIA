import React from 'react';
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { motion } from 'framer-motion';

interface DataPoint {
  name: string;
  [key: string]: number | string;
}

interface AreaChartProps {
  data: DataPoint[];
  lines: {
    key: string;
    name: string;
    color: string;
  }[];
  title?: string;
  className?: string;
  yAxisDomain?: [number, number];
  height?: number;
}

const AreaChart: React.FC<AreaChartProps> = ({
  data,
  lines,
  title,
  className = '',
  yAxisDomain = [0, 'auto'],
  height = 300
}) => {
  return (
    <motion.div
      className={`bg-white rounded-xl shadow-sm p-4 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {title && <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>}
      
      <div style={{ width: '100%', height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsAreaChart
            data={data}
            margin={{
              top: 10,
              right: 30,
              left: 0,
              bottom: 0,
            }}
          >
            <defs>
              {lines.map((line) => (
                <linearGradient key={`gradient-${line.key}`} id={`color-${line.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={line.color} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={line.color} stopOpacity={0.1} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickLine={{ stroke: '#cbd5e1' }}
              axisLine={{ stroke: '#cbd5e1' }}
            />
            <YAxis 
              domain={yAxisDomain} 
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickLine={{ stroke: '#cbd5e1' }}
              axisLine={{ stroke: '#cbd5e1' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '0.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                border: 'none'
              }}
            />
            <Legend 
              verticalAlign="top" 
              height={36} 
              iconType="circle"
              wrapperStyle={{ paddingBottom: '10px' }}
            />
            
            {lines.map((line, index) => (
              <Area
                key={line.key}
                type="monotone"
                dataKey={line.key}
                name={line.name}
                stroke={line.color}
                fillOpacity={1}
                fill={`url(#color-${line.key})`}
                strokeWidth={2}
                activeDot={{ r: 6, stroke: 'white', strokeWidth: 2 }}
                animationDuration={1500 + (index * 300)}
                animationEasing="ease-out"
              />
            ))}
          </RechartsAreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default AreaChart; 