import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useEscola } from '../../context/EscolaContext';
import { supabase } from '../../lib/supabase';

const DashboardBackup: React.FC = () => {
  const { user } = useAuth();
  const { escolaAtiva, loadingEscolas } = useEscola();

  const [, setTurmasCount] = useState<number>(0);
  const [alunosCount, setAlunosCount] = useState<number>(0);
  const [listaTurmasDaEscola, setListaTurmasDaEscola] = useState<{ id: number; nome: string }[]>([]);
  const [loadingDashboardData, setLoadingDashboardData] = useState(true);
  const [atividadesRecentesEscola, setAtividadesRecentesEscola] = useState<any[]>([]);
  const [tarefasPendentesCount, setTarefasPendentesCount] = useState<number>(0);
  const [planosAulaCount, setPlanosAulaCount] = useState<number>(0);
  const [tendenciaAlunos, setTendenciaAlunos] = useState<number>(0);

  // COPIADO de DiagnosticoAlunos.tsx - Mock de dados para áreas de conhecimento (Desempenho Médio)
  const areasMock = [
    { subject: 'Leitura', value: 80, fullMark: 100 },
    { subject: 'Escrita', value: 65, fullMark: 100 },
    { subject: 'Oralidade', value: 90, fullMark: 100 },
    { subject: 'Raciocínio Lógico', value: 75, fullMark: 100 }, // Ajustado para nome mais comum
    { subject: 'Participação Geral', value: 85, fullMark: 100 }, // Ajustado
  ];

  // Componentes de ícones simulados

  const StudentsIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
    </svg>
  );

  const TasksIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
    </svg>
  );

  const ClassIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1M19 20a2 2 0 002-2V8a2 2 0 00-2-2h-5a2 2 0 00-2 2v12a2 2 0 002 2h5zm-9-2h2"></path>
    </svg>
  );

  // Status de atividade com cores
  const statusColors = {
    'Pendente': 'bg-amber-100 text-amber-800 border border-amber-200',
    'Entregue': 'bg-blue-100 text-blue-800 border border-blue-200',
    'Corrigido': 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  };

  // Estado para dados de progresso das turmas vindos do banco de dados
  const [progressoTurmas, setProgressoTurmas] = useState<{ id: number; nome: string; progresso: number; alunos: number }[]>([]);

  // ADICIONADO: useEffect para buscar dados do dashboard
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user || !escolaAtiva) {
        setLoadingDashboardData(false);
        setTurmasCount(0);
        setAlunosCount(0);
        setListaTurmasDaEscola([]);
        setAtividadesRecentesEscola([]);
        return;
      }
      console.log('[Dashboard] Escola ativa mudou:', escolaAtiva);
      setLoadingDashboardData(true);

      try {
        // 1. Contar Turmas e obter nomes da escola ativa para o professor
        const { data: turmasData, error: turmasError, count: turmas } = await supabase
          .from('view_turmas_professor_completa')
          .select('turma_id, turma_nome', { count: 'exact' })
          .eq('professor_email', user.email)
          .eq('escola_id', escolaAtiva.id)
          .order('turma_nome');
        
        if (turmasError) throw turmasError;
        setTurmasCount(turmas || 0);
        
        // Formatar para o estado listaTurmasDaEscola
        const turmasFormatadas = turmasData?.map(t => ({ id: t.turma_id, nome: t.turma_nome })) || [];
        setListaTurmasDaEscola(turmasFormatadas);

        // Buscar dados de progresso real para cada turma
        const turmasComProgresso = await Promise.all(
          turmasFormatadas.map(async (turma) => {
            try {
              // Buscar número de alunos na turma
              const { count: numAlunos, error: alunosError } = await supabase
                .from('alunos')
                .select('id', { count: 'exact', head: true })
                .eq('turma_id', turma.id);

              if (alunosError) throw alunosError;

              // Primeiro buscar o ID do professor pela email
              const { data: professorData, error: professorError } = await supabase
                .from('professores')
                .select('id')
                .eq('email', user.email)
                .eq('escola_id', escolaAtiva.id)
                .single();

              if (professorError) throw professorError;

              // Buscar avaliações aplicadas para esta turma
              const { count: avaliacoesAplicadas, error: avaliacoesError } = await supabase
                .from('avaliacoes')
                .select('id', { count: 'exact', head: true })
                .eq('professor_id', professorData.id)
                .eq('status', 'aplicada');

              if (avaliacoesError) throw avaliacoesError;

              // Buscar planos de aula relacionados a esta turma
              const { count: planosCompletos, error: planosError } = await supabase
                .from('planos_aula')
                .select('id', { count: 'exact', head: true })
                .eq('professor_id', professorData.id)
                .eq('status', 'completed');

              if (planosError) throw planosError;

              // Calcular progresso baseado em métricas reais:
              // - 40% baseado no número de alunos (mais alunos = turma mais ativa)
              // - 30% baseado em avaliações aplicadas
              // - 30% baseado em planos de aula completos
              const progressoAlunos = Math.min(100, ((numAlunos || 0) / 25) * 100); // Assumindo 25 como turma ideal
              const progressoAvaliacoes = Math.min(100, ((avaliacoesAplicadas || 0) / 5) * 100); // Assumindo 5 avaliações como meta
              const progressoPlanos = Math.min(100, ((planosCompletos || 0) / 10) * 100); // Assumindo 10 planos como meta

              const progressoTotal = Math.round(
                (progressoAlunos * 0.4) + 
                (progressoAvaliacoes * 0.3) + 
                (progressoPlanos * 0.3)
              );

              return {
                id: turma.id,
                nome: turma.nome,
                progresso: Math.min(100, Math.max(10, progressoTotal)), // Entre 10% e 100%
                alunos: numAlunos || 0
              };
            } catch (error) {
              console.warn(`Erro ao calcular progresso da turma ${turma.nome}:`, error);
              // Retornar valores padrão em caso de erro
              return {
                id: turma.id,
                nome: turma.nome,
                progresso: 50, // Valor padrão
                alunos: 0
              };
            }
          })
        );

        setProgressoTurmas(turmasComProgresso);

        // 2. Contar Alunos da escola ativa para o professor
        if (turmasData && turmasData.length > 0) {
          const turmaIds = turmasData.map(t => t.turma_id);
          const { count: alunos, error: alunosError } = await supabase
            .from('alunos')
            .select('id', { count: 'exact', head: true })
            .in('turma_id', turmaIds);

          if (alunosError) throw alunosError;
          setAlunosCount(alunos || 0);

          // ADICIONADO: Gerar atividades recentes mockadas baseadas nos alunos reais da escola
          const { data: alunosDaEscola, error: alunosDaEscolaError } = await supabase
            .from('alunos')
            .select('id, nome')
            .in('turma_id', turmaIds)
            .limit(5); // Limitar para não sobrecarregar, ajustar conforme necessário
          
          if (alunosDaEscolaError) throw alunosDaEscolaError;

          if (alunosDaEscola) {
            const statusPossiveis = ['Pendente', 'Entregue', 'Corrigido'];
            const descricoesPossiveis = ['Tarefa de Matemática', 'Projeto de Ciências', 'Redação Semanal', 'Leitura Complementar', 'Exercício de Gramática'];
            const mockAtividades = alunosDaEscola.map((aluno, index) => ({
              id: `#A00${index + 1}`,
              aluno: aluno.nome,
              atividade: descricoesPossiveis[index % descricoesPossiveis.length],
              data: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'), // Últimos 10 dias
              status: statusPossiveis[index % statusPossiveis.length],
            }));
            setAtividadesRecentesEscola(mockAtividades);
          } else {
            setAtividadesRecentesEscola([]);
          }

        } else {
          setAlunosCount(0);
          setAtividadesRecentesEscola([]); // ADICIONADO: Resetar atividades se não há turmas/alunos
        }

        // 3. Buscar dados de professor para métricas adicionais
        const { data: professorData } = await supabase
          .from('professores')
          .select('id')
          .eq('email', user.email)
          .eq('escola_id', escolaAtiva.id)
          .single();

        if (professorData) {
          // Buscar tarefas pendentes (avaliações criadas mas não aplicadas)
          const { count: tarefasPendentes, error: tarefasError } = await supabase
            .from('avaliacoes')
            .select('id', { count: 'exact', head: true })
            .eq('professor_id', professorData.id)
            .eq('status', 'criada');

          if (!tarefasError) {
            setTarefasPendentesCount(tarefasPendentes || 0);
          }

          // Buscar planos de aula do professor
          const { count: planosCount, error: planosError } = await supabase
            .from('planos_aula')
            .select('id', { count: 'exact', head: true })
            .eq('professor_id', professorData.id);

          if (!planosError) {
            setPlanosAulaCount(planosCount || 0);
          }

          // Calcular tendência baseada nas métricas (exemplo simples)
          const tendencia = Math.round(((planosCount || 0) - (tarefasPendentes || 0)) / Math.max(1, (planosCount || 0) + (tarefasPendentes || 0)) * 100);
          setTendenciaAlunos(Math.min(15, Math.max(-15, tendencia))); // Limitar entre -15% e +15%
        }

      } catch (error) {
        console.error('[Dashboard] Erro ao buscar dados:', error);
        // Definir estados de erro se necessário
      } finally {
        setLoadingDashboardData(false);
      }
    };

    if (!loadingEscolas) {
      fetchDashboardData();
    }
  }, [user, escolaAtiva, loadingEscolas]);
  // FIM DA ADIÇÃO

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 via-gray-50 to-blue-100">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Visão Geral
            {escolaAtiva && <span className='text-xl text-gray-600'> - {escolaAtiva.nome}</span>}
          </h1>
          <div className="bg-white px-4 py-2 rounded-lg text-sm font-medium text-slate-700 shadow-sm border border-gray-100">
            Junho 2024
          </div>
        </div>
        
      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card de Alunos Ativos */}
          <div className="bg-white rounded-xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.1)] border border-gray-100 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] transition-shadow duration-300 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 opacity-10 rounded-bl-full -translate-y-8 translate-x-8"></div>
            <div className="p-7">
              <div className="flex justify-between items-start">
              <div>
                  <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">Alunos Ativos</h3>
                  <p className="text-3xl font-bold mt-1 text-slate-800">
                    {loadingDashboardData ? '...' : alunosCount}
                  </p>
                  <div className="flex items-center mt-2">
                    <span className={`flex items-center text-xs font-medium ${
                      tendenciaAlunos >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={
                        tendenciaAlunos >= 0 
                          ? "M5 10l7-7m0 0l7 7m-7-7v18" 
                          : "M19 14l-7 7m0 0l-7-7m7 7V3"
                      }></path>
                    </svg>
                    {tendenciaAlunos >= 0 ? '+' : ''}{tendenciaAlunos}%
                  </span>
                    <span className="text-xs text-slate-500 ml-1">
                      {tendenciaAlunos >= 0 ? 'Tendência positiva' : 'Necessita atenção'}
                    </span>
                  </div>
                </div>
                <div className="h-14 w-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white shadow-lg">
                  <StudentsIcon />
                </div>
              </div>
            </div>
          </div>
        
        {/* Card de Tarefas */}
          <div className="bg-white rounded-xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.1)] border border-gray-100 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] transition-shadow duration-300 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500 opacity-10 rounded-bl-full -translate-y-8 translate-x-8"></div>
            <div className="p-7">
              <div className="flex justify-between items-start">
              <div>
                  <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">Tarefas Pendentes</h3>
                  <p className="text-3xl font-bold mt-1 text-slate-800">
                    {loadingDashboardData ? '...' : tarefasPendentesCount}
                  </p>
                  <div className="flex items-center mt-2">
                    <span className="flex items-center text-indigo-600 text-xs font-medium">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Avaliações criadas
                  </span>
                    <span className="text-xs text-slate-500 ml-1">Aguardando aplicação</span>
                  </div>
                </div>
                <div className="h-14 w-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center text-white shadow-lg">
                  <TasksIcon />
                </div>
              </div>
            </div>
          </div>
        
        {/* Card de Planos de Aula */}
          <div className="bg-white rounded-xl shadow-[0_4px_20px_-2px_rgba(0,0,0,0.1)] border border-gray-100 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] transition-shadow duration-300 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 opacity-10 rounded-bl-full -translate-y-8 translate-x-8"></div>
            <div className="p-7">
              <div className="flex justify-between items-start">
              <div>
                  <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">Planos de Aula</h3>
                  <p className="text-3xl font-bold mt-1 text-slate-800">
                    {loadingDashboardData ? '...' : planosAulaCount}
                  </p>
                  <div className="flex items-center mt-2">
                    <span className="flex items-center text-emerald-600 text-xs font-medium">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                    </svg>
                    Total criados
                  </span>
                    <span className="text-xs text-slate-500 ml-1">Por você</span>
                  </div>
                </div>
                <div className="h-14 w-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg">
                  <ClassIcon />
                </div>
              </div>
            </div>
          </div>
      </div>
      
      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gráfico de Progresso das Turmas */}
          <div className="bg-white rounded-xl p-7 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.1)] border border-gray-100 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] transition-shadow duration-300">
            <div className="flex justify-between items-center mb-7">
              <h3 className="font-semibold text-slate-800 text-lg">Progresso das Turmas</h3>
              <div className="bg-indigo-100 text-indigo-700 text-xs px-3 py-1.5 rounded-full font-medium border border-indigo-200">
                {escolaAtiva ? escolaAtiva.nome : 'Junho'}
              </div>
            </div>
            
            <div className="space-y-5">
              {loadingDashboardData && <p className="text-sm text-slate-500">Carregando turmas...</p>}
              {!loadingDashboardData && progressoTurmas.length > 0 && (
                progressoTurmas.map((turma) => (
                  <div key={turma.id}>
                    <div className="flex justify-between items-center mb-2">
                      <div>
                        <span className="text-sm font-medium text-slate-700">{turma.nome}</span>
                        <p className="text-xs text-slate-500">{turma.alunos} alunos</p>
                      </div>
                      <span className="text-sm font-bold text-indigo-700">{turma.progresso}%</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className={`h-3 rounded-full transition-all duration-1000 ${
                          turma.progresso > 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' :
                          turma.progresso > 50 ? 'bg-gradient-to-r from-indigo-400 to-indigo-600' :
                          'bg-gradient-to-r from-amber-400 to-amber-600'
                        }`}
                        style={{ width: `${turma.progresso}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              )}
              {!loadingDashboardData && progressoTurmas.length === 0 && (
                <p className="text-sm text-slate-500">Nenhuma turma encontrada para esta escola.</p>
              )}
            </div>
          </div>
          
          {/* Gráfico de Desempenho Médio por Área */}
          <div className="bg-white rounded-xl p-7 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.1)] border border-gray-100 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] transition-shadow duration-300">
            <div className="flex justify-between items-center mb-7">
              <h3 className="font-semibold text-slate-800 text-lg">Desempenho Médio por Área</h3>
              <div className="px-3 py-1.5 bg-gray-100 rounded-full text-xs text-slate-700 font-medium border border-gray-200">
                {escolaAtiva ? escolaAtiva.nome : 'Geral'}
              </div>
            </div>
            <div className="space-y-5">
              {loadingDashboardData && (
                <p className="text-sm text-slate-500">Carregando dados de desempenho...</p>
              )}
              {!loadingDashboardData && areasMock.length > 0 && (
                <>
                  {areasMock.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-slate-700">{item.subject}</span>
                        <span className="text-sm font-bold text-slate-800">{item.value}/{item.fullMark}</span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                        <div
                          className="h-3 bg-gradient-to-r from-violet-500 to-indigo-600 rounded-full"
                          style={{ width: `${item.value}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </>
              )}
              {!loadingDashboardData && areasMock.length === 0 && (
                <p className="text-sm text-slate-500">Não há dados de desempenho para exibir.</p>
              )}
            </div>
          </div>
      </div>
      
      {/* Tabela de Atividades Recentes - Card Principal */}
      <div className="bg-white rounded-xl p-7 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.1)] border border-gray-100 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] transition-shadow duration-300">
        {/* Cabeçalho da Tabela (Título e Filtro) */}
        <div className="flex justify-between items-center mb-7">
          <h3 className="font-semibold text-slate-800 text-lg">Atividades Recentes</h3>
          <div className="flex items-center space-x-3">
            <span className="text-xs font-medium text-slate-600">Filtrar por:</span>
            <select 
              className="text-xs border border-gray-200 rounded-md px-3 py-1.5 bg-white text-slate-700 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={loadingDashboardData || listaTurmasDaEscola.length === 0}
            >
              <option value="all">Todas as turmas</option>
              {listaTurmasDaEscola.map(turma => (
                <option key={turma.id} value={turma.id}>{turma.nome}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Div para a tabela com overflow */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">ID</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Aluno</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Atividade</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Data</th>
                <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loadingDashboardData && (
                <tr>
                  <td colSpan={6} className="p-5 text-center text-sm text-slate-500">Carregando atividades...</td>
                </tr>
              )}
              {!loadingDashboardData && atividadesRecentesEscola.length > 0 && (
                <>
                  {atividadesRecentesEscola.map((atividade, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition-colors duration-150">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900 font-semibold">{atividade.id}</div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-full flex items-center justify-center text-white font-medium shadow-md">
                            {atividade.aluno?.split(' ').map((n: string) => n[0]).join('').substring(0,2) || 'A'}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-slate-900">{atividade.aluno}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-700">{atividade.atividade}</div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-700">{atividade.data}</div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium shadow-sm ${statusColors[atividade.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
                          {atividade.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right text-sm">
                        <button className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md font-medium transition-colors duration-150 border border-indigo-100">Ver</button>
                      </td>
                    </tr>
                  ))}
                </>
              )}
              {!loadingDashboardData && atividadesRecentesEscola.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-5 text-center text-sm text-slate-500">Nenhuma atividade recente para esta escola.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm font-medium text-slate-600">Mostrando 3 de 25 atividades</div>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1.5 rounded-md text-sm font-medium text-slate-700 hover:bg-gray-100 border border-gray-200 shadow-sm">&lt;</button>
            <button className="px-3 py-1.5 rounded-md text-sm font-medium bg-indigo-600 text-white shadow-sm">1</button>
            <button className="px-3 py-1.5 rounded-md text-sm font-medium text-slate-700 hover:bg-gray-100 border border-gray-200 shadow-sm">2</button>
            <button className="px-3 py-1.5 rounded-md text-sm font-medium text-slate-700 hover:bg-gray-100 border border-gray-200 shadow-sm">3</button>
            <button className="px-3 py-1.5 rounded-md text-sm font-medium text-slate-700 hover:bg-gray-100 border border-gray-200 shadow-sm">&gt;</button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default DashboardBackup;