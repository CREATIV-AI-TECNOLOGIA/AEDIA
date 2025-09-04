import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { X, Calendar, Book, Users, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface DetalheTarefaModalProps {
  isOpen: boolean;
  onClose: () => void;
  tarefa: {
    id: string;
    titulo: string;
    descricao: string;
    data_entrega: string;
    status: 'pendente' | 'concluida' | 'atrasada';
    plano_aula_id: string;
    turma_id: number;
    turma_nome?: string;
    disciplina_nome?: string;
  };
  onTarefaAtualizada: () => void;
}

const DetalheTarefaModal: React.FC<DetalheTarefaModalProps> = ({
  isOpen,
  onClose,
  tarefa,
  onTarefaAtualizada
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'concluida':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pendente':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'atrasada':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'concluida':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'atrasada':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleConcluirTarefa = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('tarefas_plano_aula')
        .update({ concluida: true })
        .eq('id', tarefa.id);

      if (error) throw error;

      toast.success('Tarefa marcada como concluída!');
      onTarefaAtualizada();
      onClose();
    } catch (error) {
      console.error('Erro ao concluir tarefa:', error);
      toast.error('Erro ao concluir tarefa. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Detalhes da Tarefa</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Título e Status */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{tarefa.titulo}</h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeClass(tarefa.status)}`}>
              {getStatusIcon(tarefa.status)}
              <span className="ml-1 capitalize">{tarefa.status}</span>
            </span>
          </div>

          {/* Descrição */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Descrição</h4>
            <p className="text-gray-600 whitespace-pre-wrap">{tarefa.descricao}</p>
          </div>

          {/* Metadados */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="h-4 w-4 mr-2" />
              Data de Entrega: {format(new Date(tarefa.data_entrega), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <Book className="h-4 w-4 mr-2" />
              Disciplina: {tarefa.disciplina_nome || 'Não especificada'}
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <Users className="h-4 w-4 mr-2" />
              Turma: {tarefa.turma_nome || 'Não especificada'}
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-lg">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Fechar
            </button>
            {tarefa.status !== 'concluida' && (
              <button
                onClick={handleConcluirTarefa}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Concluindo...' : 'Marcar como Concluída'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalheTarefaModal;