import React from 'react';
import { motion } from 'framer-motion';
import { Users, BookOpen, ChevronRight, TrendingUp, TrendingDown, BarChart2 } from 'lucide-react';
import { Link } from 'react-router-dom';

import { ProgressRadial } from './charts';

interface DiagnosticoTurma {
  id: number;
  nome: string;
  ano: string;
  disciplina: string;
  modalidade: string;
  totalAlunos: number;
  frequenciaMedia: number;
  desempenhoMedio: number;
  habilidadesConcluidas: number;
  totalHabilidades: number;
  tendencia: 'subindo' | 'descendo' | 'estavel';
  alertas: number;
}

interface DiagnosticoTurmaCardProps {
  turma: DiagnosticoTurma;
  className?: string;
}

const DiagnosticoTurmaCard: React.FC<DiagnosticoTurmaCardProps> = ({
  turma,
  className = ''
}) => {
  // Determine a cor do card com base no desempenho da turma
  const getCardStyle = () => {
    if (turma.desempenhoMedio >= 80) return 'border-l-4 border-l-green-500';
    if (turma.desempenhoMedio >= 60) return 'border-l-4 border-l-blue-500';
    return 'border-l-4 border-l-amber-500';
  };

  // Tendência do desempenho
  const getTendenciaIcon = () => {
    if (turma.tendencia === 'subindo') {
      return <TrendingUp size={16} className="text-green-500" />;
    }
    if (turma.tendencia === 'descendo') {
      return <TrendingDown size={16} className="text-red-500" />;
    }
    return <span className="text-blue-500 text-lg">→</span>;
  };

  // Calcular progresso em habilidades
  const progressoHabilidades = Math.round((turma.habilidadesConcluidas / turma.totalHabilidades) * 100) || 0;

  return (
    <motion.div
      className={`bg-white rounded-xl shadow-sm overflow-hidden ${getCardStyle()} ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <div className="p-5">
        <div className="flex justify-between items-start mb-5">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{turma.nome}</h3>
            <div className="text-sm text-gray-500">
              {turma.ano} • {turma.disciplina} • {turma.modalidade}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center text-gray-500">
              <Users size={16} className="mr-1" />
              <span className="text-sm">{turma.totalAlunos}</span>
            </div>
            
            {turma.alertas > 0 && (
              <div className="bg-red-100 text-red-800 rounded-full px-2 py-0.5 text-xs font-medium">
                {turma.alertas} alertas
              </div>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-5">
          <ProgressRadial
            value={turma.desempenhoMedio}
            label="Desempenho"
            size={90}
            icon={<BarChart2 size={14} />}
          />
          
          <ProgressRadial
            value={turma.frequenciaMedia}
            label="Frequência"
            size={90}
            icon={<Users size={14} />}
          />
          
          <ProgressRadial
            value={progressoHabilidades}
            label="Habilidades"
            size={90}
            subtitle={`${turma.habilidadesConcluidas}/${turma.totalHabilidades}`}
            icon={<BookOpen size={14} />}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-600">
            <span className="mr-1">Tendência:</span>
            {getTendenciaIcon()}
            <span className="ml-1">
              {turma.tendencia === 'subindo' ? 'Melhorando' : 
               turma.tendencia === 'descendo' ? 'Declínio' : 'Estável'}
            </span>
          </div>
          
          <Link to={`/diagnostico/turma/${turma.id}`} className="flex items-center text-indigo-600 text-sm font-medium hover:text-indigo-800">
            Ver detalhes
            <ChevronRight size={16} className="ml-1" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default DiagnosticoTurmaCard; 