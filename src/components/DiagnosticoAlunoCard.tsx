import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, BookOpen, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

import { RadarChart, ProgressRadial } from './charts';
import HabilidadesProgress from './HabilidadesProgress';

interface Aluno {
  id: number;
  nome: string;
  matricula: string;
  idade?: number;
  turma?: string;
  frequencia: number;
  participacao: number;
  mediaGeral: number;
  tendencia: 'subindo' | 'descendo' | 'estavel';
  habilidades: {
    codigo: string;
    descricao: string;
    progresso: number;
  }[];
  areas: {
    subject: string;
    value: number;
    fullMark: number;
  }[];
  tarefasConcluidas: number;
  tarefasPendentes: number;
  ultimaAtividade?: string;
}

interface DiagnosticoAlunoCardProps {
  aluno: Aluno;
  expanded?: boolean;
  onToggle?: () => void;
  className?: string;
}

const DiagnosticoAlunoCard: React.FC<DiagnosticoAlunoCardProps> = ({
  aluno,
  expanded = false,
  onToggle,
  className = ''
}) => {
  // Animação do card
  const cardVariants = {
    closed: { 
      opacity: 1, 
      y: 0,
      boxShadow: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)" 
    },
    open: { 
      opacity: 1, 
      y: 0,
      boxShadow: "0 10px 25px rgba(0,0,0,0.15), 0 5px 10px rgba(0,0,0,0.05)" 
    },
    initial: {
      opacity: 0,
      y: 20
    }
  };

  // Animação sequencial para os componentes dentro do card expandido
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        when: "beforeChildren"
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };

  return (
    <motion.div
      className={`bg-white rounded-xl overflow-hidden ${className}`}
      initial="initial"
      animate={expanded ? "open" : "closed"}
      variants={cardVariants}
      layout
      transition={{
        layout: { type: "spring", stiffness: 300, damping: 30 }
      }}
    >
      {/* Cabeçalho do Card - Sempre visível */}
      <motion.div 
        className={`
          p-4 border-b flex items-center justify-between cursor-pointer
          transition-colors duration-300
          ${expanded ? 'bg-indigo-50' : 'hover:bg-gray-50'}
        `}
        onClick={onToggle}
        layout="position"
      >
        <div className="flex items-center space-x-3">
          <motion.div 
            className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold"
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            {aluno.nome.charAt(0)}
          </motion.div>
          <div>
            <h3 className="font-semibold text-gray-800">{aluno.nome}</h3>
            <div className="text-xs text-gray-500 flex items-center space-x-3">
              <span>Matrícula: {aluno.matricula}</span>
              {aluno.idade && <span>• {aluno.idade} anos</span>}
              {aluno.turma && <span>• Turma: {aluno.turma}</span>}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="text-center">
            <div className="text-xs text-gray-500">Média Geral</div>
            <motion.div 
              className={`text-sm font-semibold ${aluno.mediaGeral >= 70 ? 'text-green-600' : 'text-amber-600'}`}
              whileHover={{ scale: 1.05 }}
            >
              {aluno.mediaGeral}%
            </motion.div>
          </div>
          
          <div className="text-center">
            <div className="text-xs text-gray-500">Frequência</div>
            <motion.div 
              className={`text-sm font-semibold ${aluno.frequencia >= 75 ? 'text-green-600' : 'text-amber-600'}`}
              whileHover={{ scale: 1.05 }}
            >
              {aluno.frequencia}%
            </motion.div>
          </div>
          
          <motion.div whileHover={{ scale: 1.2, rotate: 5 }} transition={{ type: "spring", stiffness: 400 }}>
            {aluno.tendencia === 'subindo' && (
              <TrendingUp size={20} className="text-green-500" />
            )}
            {aluno.tendencia === 'descendo' && (
              <TrendingDown size={20} className="text-red-500" />
            )}
            {aluno.tendencia === 'estavel' && (
              <span className="text-blue-500 text-lg">→</span>
            )}
          </motion.div>
        </div>
      </motion.div>
      
      {/* Conteúdo detalhado - Visível apenas quando expandido */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            className="p-4"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={containerVariants}
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Coluna 1: Gráfico Radar e Progresso */}
              <motion.div className="space-y-6" variants={itemVariants}>
                <RadarChart 
                  data={aluno.areas}
                  title="Perfil de Desempenho por Área"
                  colors={['#4f46e5']}
                />
                
                <motion.div 
                  className="bg-white rounded-xl shadow-sm p-4"
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Engajamento</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <ProgressRadial
                      value={aluno.tarefasConcluidas}
                      maxValue={aluno.tarefasConcluidas + aluno.tarefasPendentes}
                      label="Tarefas Concluídas"
                      valueLabel={`${aluno.tarefasConcluidas}/${aluno.tarefasConcluidas + aluno.tarefasPendentes}`}
                      showPercentage={false}
                      color="#10b981"
                      icon={<CheckCircle2 size={16} />}
                    />
                    
                    <ProgressRadial
                      value={aluno.participacao}
                      label="Participação"
                      icon={<BookOpen size={16} />}
                      color="#6366f1"
                    />
                  </div>
                  
                  {aluno.ultimaAtividade && (
                    <div className="mt-4 text-xs text-gray-500 flex items-center">
                      <Clock size={14} className="mr-1" />
                      Última atividade: {aluno.ultimaAtividade}
                    </div>
                  )}
                </motion.div>
              </motion.div>
              
              {/* Coluna 2: Status e Alertas */}
              <motion.div className="space-y-6 lg:col-span-2" variants={itemVariants}>
                <HabilidadesProgress 
                  habilidades={aluno.habilidades}
                  title="Progresso em Habilidades"
                  showDescricao={true}
                />
                
                <motion.div 
                  className="bg-white rounded-xl shadow-sm p-4"
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Observações & Sugestões</h3>
                  
                  <AnimatePresence>
                    {aluno.mediaGeral < 60 && (
                      <motion.div 
                        className="flex items-start p-3 rounded-lg bg-red-50 text-red-800 mb-3"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <AlertCircle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium">Atenção: Rendimento Abaixo do Esperado</p>
                          <p className="mt-1">O aluno está com média geral abaixo de 60%. Considere desenvolver um plano de recuperação específico para as áreas com maior dificuldade.</p>
                        </div>
                      </motion.div>
                    )}
                    
                    {aluno.frequencia < 75 && (
                      <motion.div 
                        className="flex items-start p-3 rounded-lg bg-amber-50 text-amber-800 mb-3"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                      >
                        <AlertCircle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium">Alerta: Frequência Baixa</p>
                          <p className="mt-1">O aluno está com frequência de {aluno.frequencia}%, abaixo do mínimo recomendado de 75%. Verifique os motivos das ausências e entre em contato com os responsáveis.</p>
                        </div>
                      </motion.div>
                    )}
                    
                    {aluno.tendencia === 'descendo' && (
                      <motion.div 
                        className="flex items-start p-3 rounded-lg bg-blue-50 text-blue-800 mb-3"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
                      >
                        <TrendingDown size={18} className="mr-2 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium">Tendência de Queda no Desempenho</p>
                          <p className="mt-1">Foi detectada uma tendência de queda no desempenho geral do aluno nas últimas avaliações. Recomenda-se uma observação mais próxima e identificação de possíveis dificuldades específicas.</p>
                        </div>
                      </motion.div>
                    )}
                    
                    {aluno.mediaGeral >= 60 && aluno.frequencia >= 75 && aluno.tendencia !== 'descendo' && (
                      <motion.div 
                        className="flex items-start p-3 rounded-lg bg-green-50 text-green-800 mb-3"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
                      >
                        <CheckCircle2 size={18} className="mr-2 mt-0.5 flex-shrink-0" />
                        <div className="text-sm">
                          <p className="font-medium">Desempenho Satisfatório</p>
                          <p className="mt-1">O aluno mantém um bom nível de desempenho geral. Considere oferecer desafios adicionais para estimular maior desenvolvimento nas áreas de maior potencial.</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <motion.div 
                    className="text-sm text-gray-500 mt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <p>As recomendações são baseadas no histórico de atividades, avaliações e frequência do aluno, considerando os parâmetros estabelecidos no planejamento pedagógico.</p>
                  </motion.div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DiagnosticoAlunoCard; 