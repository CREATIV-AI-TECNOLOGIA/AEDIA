import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Calendar, BookOpen, Users, Layers, MoreVertical, Trash2, Eye, Edit } from 'lucide-react';
import { PlanoAulaSupabase } from '../../pages/PlanosAula';

interface PlanoAulaCardModernoProps {
  plano: PlanoAulaSupabase;
  onDelete: (id: string) => void;
  onFullViewClick?: (plano: PlanoAulaSupabase) => void;
  onEdit?: (plano: PlanoAulaSupabase) => void;
}

const PlanoAulaCardModerno: React.FC<PlanoAulaCardModernoProps> = ({ 
  plano, 
  onDelete, 
  onFullViewClick,
  onEdit 
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  const dataFormatada = plano.data 
    ? new Date(plano.data).toLocaleDateString('pt-BR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        timeZone: 'UTC' 
      }) 
    : 'Data não definida';

  const handleVerDetalhes = () => {
    if (onFullViewClick) {
      onFullViewClick(plano);
    }
  };

  const handleEditar = () => {
    if (onEdit) {
      onEdit(plano);
    }
    setShowMenu(false);
  };

  const handleExcluir = async () => {
    if (window.confirm('Tem certeza que deseja excluir este plano de aula?')) {
      await onDelete(plano.id);
    }
    setShowMenu(false);
  };

  const handleCriarAvaliacao = () => {
    navigate(`/planos-aula/${plano.id}/criar-avaliacao`);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -8 }}
      className="group relative bg-white backdrop-blur-sm rounded-xl shadow-lg border-2 border-slate-200/60 hover:border-indigo-300/70 hover:shadow-xl ring-1 ring-slate-200/40 hover:ring-indigo-200/50 transition-all duration-300 overflow-hidden"
    >
      {/* Header do Card */}
      <div className="p-6 pb-4">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 transition-colors duration-300 group-hover:text-blue-600">
              {plano.titulo}
            </h3>
            
            {/* Status/Badge - sempre "Ativo" para planos */}
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
              Ativo
            </span>
          </div>
          
          {/* Menu de Ações */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-foreground/60 hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                <div className="py-1">
                  <button
                    onClick={handleVerDetalhes}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalhes
                  </button>
                  {onEdit && (
                    <button
                      onClick={handleEditar}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </button>
                  )}
                  <button
                    onClick={handleExcluir}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Metadados */}
        <div className="space-y-2">
          {/* Data de Entrega */}
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="h-4 w-4 mr-2 text-indigo-500" />
            <span className="text-gray-600">Data de Entrega: {dataFormatada}</span>
          </div>
          
          {/* Disciplina */}
          {plano.disciplinaNome && (
            <div className="flex items-center text-sm text-gray-500">
              <BookOpen className="h-4 w-4 mr-2 text-blue-500" />
              <span className="text-gray-600">Disciplina: {plano.disciplinaNome}</span>
            </div>
          )}
          
          {/* Turma */}
          {plano.turmaAno && (
            <div className="flex items-center text-sm text-gray-500">
              <Users className="h-4 w-4 mr-2 text-green-500" />
              <span className="text-gray-600">Turma: {plano.turmaAno}</span>
            </div>
          )}
          
          {/* Modalidade */}
          {plano.modalidadeNome && (
            <div className="flex items-center text-sm text-gray-500">
              <Layers className="h-4 w-4 mr-2 text-purple-500" />
              <span className="text-gray-600">Plano de Aula: {plano.modalidadeNome}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer do Card */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleVerDetalhes}
            className="px-3 py-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            Ver Detalhes
          </button>
          <button
            onClick={handleCriarAvaliacao}
            className="px-3 py-1 text-sm font-medium text-green-600 hover:text-green-700 transition-colors"
          >
            Criar avaliação
          </button>
        </div>
      </div>
      
      {/* Overlay para fechar o menu quando clicar fora */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowMenu(false)}
          aria-hidden="true"
        />
      )}
    </motion.div>
  );
};

export default PlanoAulaCardModerno;
