import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle, Clock, AlertCircle, Calendar, Book, Users, ChevronDown, Search, Filter } from 'lucide-react';
import DetalheTarefaModal from './DetalheTarefaModal';

interface Tarefa {
  id: string;
  titulo: string;
  descricao: string;
  data_entrega: string;
  status: 'pendente' | 'concluida' | 'atrasada';
  plano_aula_id: string;
  turma_id: number;
  turma_nome?: string;
  disciplina_nome?: string;
}

interface FiltrosTarefa {
  status: string;
  turma: string;
  disciplina: string;
  periodo: string;
}

const TarefasPlanoAula: React.FC = () => {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [tarefasFiltradas, setTarefasFiltradas] = useState<Tarefa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtros, setFiltros] = useState<FiltrosTarefa>({
    status: 'todos',
    turma: 'todas',
    disciplina: 'todas',
    periodo: 'todos'
  });
  const [showFiltros, setShowFiltros] = useState(false);
  const [tarefaSelecionada, setTarefaSelecionada] = useState<Tarefa | null>(null);

  useEffect(() => {
    carregarTarefas();
  }, []);

  useEffect(() => {
    aplicarFiltros();
  }, [tarefas, filtros, searchTerm]);

  const carregarTarefas = async () => {
    try {
      const { data: tarefasData, error } = await supabase
        .from('tarefas_plano_aula')
        .select(`
          *,
          turmas (nome),
          planos_aula (
            disciplina_id,
            disciplinas (nome)
          )
        `);

      if (error) throw error;

      const tarefasFormatadas = tarefasData.map((tarefa: any) => ({
        ...tarefa,
        turma_nome: tarefa.turmas?.nome,
        disciplina_nome: tarefa.planos_aula?.disciplinas?.nome,
        status: determinarStatus(tarefa.data_entrega, tarefa.concluida)
      }));

      setTarefas(tarefasFormatadas);
      setIsLoading(false);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
      setIsLoading(false);
    }
  };

  const determinarStatus = (dataEntrega: string, concluida: boolean): 'pendente' | 'concluida' | 'atrasada' => {
    if (concluida) return 'concluida';
    const hoje = new Date();
    const dataLimite = new Date(dataEntrega);
    return hoje > dataLimite ? 'atrasada' : 'pendente';
  };

  const aplicarFiltros = () => {
    let tarefasFiltradas = [...tarefas];

    // Filtro por status
    if (filtros.status !== 'todos') {
      tarefasFiltradas = tarefasFiltradas.filter(t => t.status === filtros.status);
    }

    // Filtro por turma
    if (filtros.turma !== 'todas') {
      tarefasFiltradas = tarefasFiltradas.filter(t => t.turma_nome === filtros.turma);
    }

    // Filtro por disciplina
    if (filtros.disciplina !== 'todas') {
      tarefasFiltradas = tarefasFiltradas.filter(t => t.disciplina_nome === filtros.disciplina);
    }

    // Filtro por período
    if (filtros.periodo !== 'todos') {
      const hoje = new Date();
      switch (filtros.periodo) {
        case 'hoje':
          tarefasFiltradas = tarefasFiltradas.filter(t => 
            format(new Date(t.data_entrega), 'yyyy-MM-dd') === format(hoje, 'yyyy-MM-dd')
          );
          break;
        case 'semana':
          const umaSemana = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000);
          tarefasFiltradas = tarefasFiltradas.filter(t => 
            new Date(t.data_entrega) <= umaSemana && new Date(t.data_entrega) >= hoje
          );
          break;
        case 'mes':
          const umMes = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000);
          tarefasFiltradas = tarefasFiltradas.filter(t => 
            new Date(t.data_entrega) <= umMes && new Date(t.data_entrega) >= hoje
          );
          break;
      }
    }

    // Filtro por termo de busca
    if (searchTerm) {
      const termoBusca = searchTerm.toLowerCase();
      tarefasFiltradas = tarefasFiltradas.filter(t =>
        t.titulo.toLowerCase().includes(termoBusca) ||
        t.descricao.toLowerCase().includes(termoBusca) ||
        t.turma_nome?.toLowerCase().includes(termoBusca) ||
        t.disciplina_nome?.toLowerCase().includes(termoBusca)
      );
    }

    setTarefasFiltradas(tarefasFiltradas);
  };

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

  const handleVerDetalhes = (tarefa: Tarefa) => {
    setTarefaSelecionada(tarefa);
  };

  const handleTarefaAtualizada = () => {
    carregarTarefas();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Cabeçalho */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tarefas dos Planos de Aula</h1>
          <p className="text-gray-600">Gerencie e acompanhe as tarefas baseadas nos seus planos de aula</p>
        </div>

        {/* Barra de Pesquisa e Filtros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Campo de Busca */}
            <div className="w-[600px] relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar tarefas..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Botão de Filtros */}
            <div className="relative">
              <button
                onClick={() => setShowFiltros(!showFiltros)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Filter className="h-5 w-5 mr-2 text-gray-400" />
                Filtros
                <ChevronDown className="ml-2 h-5 w-5 text-gray-400" />
              </button>

              {/* Painel de Filtros */}
              {showFiltros && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                  <div className="p-4">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={filtros.status}
                        onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      >
                        <option value="todos">Todos</option>
                        <option value="pendente">Pendentes</option>
                        <option value="concluida">Concluídas</option>
                        <option value="atrasada">Atrasadas</option>
                      </select>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
                      <select
                        value={filtros.periodo}
                        onChange={(e) => setFiltros({ ...filtros, periodo: e.target.value })}
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      >
                        <option value="todos">Todos</option>
                        <option value="hoje">Hoje</option>
                        <option value="semana">Esta Semana</option>
                        <option value="mes">Este Mês</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lista de Tarefas */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tarefasFiltradas.map((tarefa) => (
              <div
                key={tarefa.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
              >
                <div className="p-6">
                  {/* Cabeçalho do Card */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
                        {tarefa.titulo}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeClass(tarefa.status)}`}>
                        {getStatusIcon(tarefa.status)}
                        <span className="ml-1 capitalize">{tarefa.status}</span>
                      </span>
                    </div>
                  </div>

                  {/* Descrição */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {tarefa.descricao}
                  </p>

                  {/* Metadados */}
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-2" />
                      {format(new Date(tarefa.data_entrega), "dd 'de' MMMM", { locale: ptBR })}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Book className="h-4 w-4 mr-2" />
                      {tarefa.disciplina_nome || 'Disciplina não especificada'}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="h-4 w-4 mr-2" />
                      {tarefa.turma_nome || 'Turma não especificada'}
                    </div>
                  </div>
                </div>

                {/* Ações do Card */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-lg">
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => handleVerDetalhes(tarefa)}
                      className="px-3 py-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      Ver Detalhes
                    </button>
                    {tarefa.status !== 'concluida' && (
                      <button
                        onClick={() => handleVerDetalhes(tarefa)}
                        className="px-3 py-1 text-sm font-medium text-green-600 hover:text-green-700"
                      >
                        Marcar como Concluída
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mensagem quando não há tarefas */}
        {!isLoading && tarefasFiltradas.length === 0 && (
          <div className="text-center py-12">
            <div className="mb-4">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma tarefa encontrada</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm
                ? 'Tente ajustar seus filtros ou termos de busca'
                : 'Comece criando uma nova tarefa a partir de um plano de aula'}
            </p>
          </div>
        )}

        {/* Modal de Detalhes */}
        {tarefaSelecionada && (
          <DetalheTarefaModal
            isOpen={!!tarefaSelecionada}
            onClose={() => setTarefaSelecionada(null)}
            tarefa={tarefaSelecionada}
            onTarefaAtualizada={handleTarefaAtualizada}
          />
        )}
      </div>
    </div>
  );
};

export default TarefasPlanoAula;