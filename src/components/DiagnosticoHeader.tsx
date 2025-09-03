import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Users, BarChart, ClipboardCheck, Calendar } from 'lucide-react';

interface DiagnosticoHeaderProps {
  titulo?: string;
  subtitulo?: string;
  estatisticas?: {
    turmas: number;
    alunos: number;
    planosAula: number;
    avaliacoes: number;
  };
  periodoLetivo?: string;
  className?: string;
}

const DiagnosticoHeader: React.FC<DiagnosticoHeaderProps> = ({
  titulo = 'Diagnóstico de Aprendizagem',
  subtitulo = 'Acompanhamento e análise de desempenho de alunos e turmas',
  estatisticas = { turmas: 0, alunos: 0, planosAula: 0, avaliacoes: 0 },
  periodoLetivo = 'Período Letivo Atual',
  className = ''
}) => {
  // Efeito de entrada sequencial para os cartões
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className={`mb-8 ${className}`}>
      {/* Título e Subtítulo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-6"
      >

                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{subtitulo}</h1>
        <div className="mt-2 text-sm text-indigo-600 font-medium flex items-center">
          <Calendar size={16} className="mr-1" />
          {periodoLetivo}
        </div>
      </motion.div>
      
      {/* Cartões de Estatísticas */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          variants={itemVariants}
          className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl shadow-sm p-3 text-white"
        >
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-lg bg-white/20 flex items-center justify-center">
              <Users size={24} className="text-white" />
            </div>
            <div className="ml-4">
              <div className="text-3xl font-bold">{estatisticas.alunos}</div>
              <div className="text-sm text-indigo-100">Alunos</div>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          variants={itemVariants}
          className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl shadow-sm p-3 text-white"
        >
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-lg bg-white/20 flex items-center justify-center">
              <BookOpen size={24} className="text-white" />
            </div>
            <div className="ml-4">
              <div className="text-3xl font-bold">{estatisticas.turmas}</div>
              <div className="text-sm text-amber-100">Turmas</div>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          variants={itemVariants}
          className="bg-gradient-to-br from-green-500 to-green-700 rounded-xl shadow-sm p-3 text-white"
        >
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-lg bg-white/20 flex items-center justify-center">
              <ClipboardCheck size={24} className="text-white" />
            </div>
            <div className="ml-4">
              <div className="text-3xl font-bold">{estatisticas.planosAula}</div>
              <div className="text-sm text-green-100">Planos de Aula</div>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          variants={itemVariants}
          className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-sm p-3 text-white"
        >
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-lg bg-white/20 flex items-center justify-center">
              <BarChart size={24} className="text-white" />
            </div>
            <div className="ml-4">
              <div className="text-3xl font-bold">{estatisticas.avaliacoes}</div>
              <div className="text-sm text-blue-100">Avaliações</div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default DiagnosticoHeader; 