import React from 'react';

interface AvaliacaoFormProps {
  dadosEdicao: {
    titulo: string;
    tempo_limite: number;
    nota_maxima: number;
    data_inicio: string;
    data_fim: string;
    tipo: string;
    status: string;
    disciplina: string;
    turma: string;
    descricao: string;
  };
  setDadosEdicao: React.Dispatch<React.SetStateAction<any>>;
  modoEdicao: boolean;
  getStatusLabel: (status: string) => string;
  getStatusBadgeClass: (status: string) => string;
  getTipoLabel: (tipo: string) => string;
}

const AvaliacaoForm: React.FC<AvaliacaoFormProps> = ({
  dadosEdicao,
  setDadosEdicao,
  modoEdicao,
  getStatusLabel,
  getStatusBadgeClass,
  getTipoLabel
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Informações Gerais */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
          Informações Gerais
        </h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Título
          </label>
          {modoEdicao ? (
            <input
              type="text"
              value={dadosEdicao.titulo}
              onChange={(e) => setDadosEdicao(prev => ({ ...prev, titulo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          ) : (
            <p className="text-gray-900 font-medium">{dadosEdicao.titulo}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Disciplina
          </label>
          {modoEdicao ? (
            <input
              type="text"
              value={dadosEdicao.disciplina}
              onChange={(e) => setDadosEdicao(prev => ({ ...prev, disciplina: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          ) : (
            <p className="text-gray-700">{dadosEdicao.disciplina}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Turma
          </label>
          {modoEdicao ? (
            <input
              type="text"
              value={dadosEdicao.turma}
              onChange={(e) => setDadosEdicao(prev => ({ ...prev, turma: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          ) : (
            <p className="text-gray-700">{dadosEdicao.turma}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descrição
          </label>
          {modoEdicao ? (
            <textarea
              value={dadosEdicao.descricao}
              onChange={(e) => setDadosEdicao(prev => ({ ...prev, descricao: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          ) : (
            <p className="text-gray-700">{dadosEdicao.descricao}</p>
          )}
        </div>
      </div>

      {/* Configurações */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
          Configurações
        </h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tempo Limite (minutos)
          </label>
          {modoEdicao ? (
            <input
              type="number"
              value={dadosEdicao.tempo_limite}
              onChange={(e) => setDadosEdicao(prev => ({ ...prev, tempo_limite: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          ) : (
            <p className="text-gray-700">{dadosEdicao.tempo_limite} minutos</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nota Máxima
          </label>
          {modoEdicao ? (
            <input
              type="number"
              step="0.1"
              value={dadosEdicao.nota_maxima}
              onChange={(e) => setDadosEdicao(prev => ({ ...prev, nota_maxima: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          ) : (
            <p className="text-gray-700">{dadosEdicao.nota_maxima}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo
          </label>
          {modoEdicao ? (
            <select
              value={dadosEdicao.tipo}
              onChange={(e) => setDadosEdicao(prev => ({ ...prev, tipo: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="prova">Prova</option>
              <option value="trabalho">Trabalho</option>
              <option value="exercicio">Exercício</option>
              <option value="simulado">Simulado</option>
            </select>
          ) : (
            <p className="text-gray-700">{getTipoLabel(dadosEdicao.tipo)}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          {modoEdicao ? (
            <select
              value={dadosEdicao.status}
              onChange={(e) => setDadosEdicao(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="rascunho">Rascunho</option>
              <option value="publicada">Publicada</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="finalizada">Finalizada</option>
            </select>
          ) : (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(dadosEdicao.status)}`}>
              {getStatusLabel(dadosEdicao.status)}
            </span>
          )}
        </div>
      </div>

      {/* Datas */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
          Datas
        </h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data de Início
          </label>
          {modoEdicao ? (
            <input
              type="datetime-local"
              value={dadosEdicao.data_inicio}
              onChange={(e) => setDadosEdicao(prev => ({ ...prev, data_inicio: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          ) : (
            <p className="text-gray-700">
              {dadosEdicao.data_inicio ? new Date(dadosEdicao.data_inicio).toLocaleString('pt-BR') : 'Não definida'}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data de Fim
          </label>
          {modoEdicao ? (
            <input
              type="datetime-local"
              value={dadosEdicao.data_fim}
              onChange={(e) => setDadosEdicao(prev => ({ ...prev, data_fim: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          ) : (
            <p className="text-gray-700">
              {dadosEdicao.data_fim ? new Date(dadosEdicao.data_fim).toLocaleString('pt-BR') : 'Não definida'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AvaliacaoForm;