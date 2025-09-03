import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList
} from 'recharts';
import { motion } from 'framer-motion';

interface DataPoint {
  name: string;
  [key: string]: number | string;
}

interface BarChartProps {
  data: DataPoint[];
  bars: {
    key: string;
    name: string;
    color: string;
  }[];
  title?: string;
  className?: string;
  layout?: 'vertical' | 'horizontal';
  yAxisDomain?: [number, number];
  height?: number;
  showValues?: boolean;
}

const BarChart: React.FC<BarChartProps> = ({
  data,
  bars,
  title,
  className = '',
  layout = 'horizontal',
  yAxisDomain = [0, 'auto'],
  height = 300,
  showValues = false
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
          <RechartsBarChart
            data={data}
            layout={layout}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 10,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            
            {layout === 'horizontal' ? (
              <>
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
              </>
            ) : (
              <>
                <XAxis 
                  type="number" 
                  domain={yAxisDomain}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickLine={{ stroke: '#cbd5e1' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis 
                  dataKey="name" 
                  type="category"
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickLine={{ stroke: '#cbd5e1' }}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
              </>
            )}
            
            <Tooltip
              cursor={{ fill: 'rgba(224, 231, 255, 0.2)' }}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderRadius: '0.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                border: 'none'
              }}
            />
            
            <Legend 
              verticalAlign="top" 
              height={36} 
              iconType="circle"
            />
            
            {bars.map((bar, index) => (
              <Bar
                key={bar.key}
                dataKey={bar.key}
                name={bar.name}
                fill={bar.color}
                radius={[4, 4, 0, 0]}
                animationDuration={1200 + (index * 300)}
                animationEasing="ease-out"
              >
                {showValues && (
                  <LabelList 
                    dataKey={bar.key} 
                    position={layout === 'horizontal' ? 'top' : 'right'} 
                    style={{ fontSize: 10, fill: '#475569' }}
                    formatter={(value: number) => `${value}`}
                  />
                )}
              </Bar>
            ))}
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default BarChart; 