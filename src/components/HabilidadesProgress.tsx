import React from 'react';
import { motion } from 'framer-motion';
import { ProgressChart } from './charts';

interface Habilidade {
  codigo: string;
  descricao: string;
  progresso: number;  // valor de 0 a 100
  corte?: number;     // valor mínimo para considerar "atingido"
}

interface HabilidadesProgressProps {
  habilidades: Habilidade[];
  className?: string;
  title?: string;
  showDescricao?: boolean;
}

const HabilidadesProgress: React.FC<HabilidadesProgressProps> = ({
  habilidades,
  className = '',
  title = 'Progresso nas Habilidades BNCC',
  showDescricao = false
}) => {
  // Ordenar por progresso (menor para o maior)
  const habilidadesOrdenadas = [...habilidades].sort((a, b) => a.progresso - b.progresso);
  
  // Determinar a cor com base no progresso
  const getProgressColor = (valor: number, corte?: number): string => {
    const limiteCorte = corte || 70;
    if (valor < limiteCorte * 0.5) return 'danger';
    if (valor < limiteCorte) return 'warning';
    return 'success';
  };
  
  return (
    <motion.div 
      className={`bg-white rounded-xl shadow-sm p-5 ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      
      <div className="space-y-5">
        {habilidadesOrdenadas.map((habilidade) => (
          <div key={habilidade.codigo} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium flex items-center">
                <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md mr-2 whitespace-nowrap">
                  {habilidade.codigo}
                </span>
                {showDescricao && habilidade.descricao && (
                  <span 
                    className="text-gray-700 text-sm truncate max-w-[280px] sm:max-w-[320px] md:max-w-[420px] lg:max-w-[320px] xl:max-w-[400px]" 
                    title={habilidade.descricao}
                  >
                    {habilidade.descricao}
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
                {habilidade.corte && (
                  <div className="text-xs text-gray-500 whitespace-nowrap">
                    Meta: {habilidade.corte}%
                  </div>
                )}
                
                <span className={`text-xs font-medium rounded-full px-2 py-0.5 whitespace-nowrap
                  ${habilidade.progresso < (habilidade.corte || 70) ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}
                `}>
                  {habilidade.progresso}%
                </span>
              </div>
            </div>
            
            <ProgressChart
              title=""
              value={habilidade.progresso}
              maxValue={100}
              color={getProgressColor(habilidade.progresso, habilidade.corte)}
              className="h-6"
            />
          </div>
        ))}
        
        {habilidades.length === 0 && (
          <div className="text-gray-500 text-center py-6 italic">
            Nenhuma habilidade registrada para este aluno/turma.
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default HabilidadesProgress; 