import React, { useState, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, School, BookOpenText, GraduationCap, Calendar, 
  Clock, TrendingUp, AlertCircle, CheckCircle, FileText,
  ArrowUpRight, ArrowDownRight, Activity, BellRing, 
  ChevronRight, ChevronLeft, ChevronsRight
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

// Componente para cards de estatísticas
const StatCard: React.FC<{ 
  title: string; 
  value: string | number; 
  icon: React.ElementType; 
  color: string;
  change?: number;
  timeframe?: string;
}> = ({ title, value, icon: Icon, color, change, timeframe }) => (
  <div className="bg-card shadow-sm rounded-xl p-6 transition-all hover:shadow-md">
    <div className="flex justify-between items-start">
      <div className={`p-3 rounded-lg ${color.replace('text-', 'bg-').replace('-500', '-100')}`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      {change !== undefined && (
        <span className={`px-2 py-1 rounded-full text-xs flex items-center font-medium
          ${change >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
          {change >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
          {Math.abs(change)}%
        </span>
      )}
    </div>
    <div className="mt-4">
      <p className="text-3xl font-bold text-foreground">{value}</p>
    <p className="text-sm text-muted-foreground mt-1 flex items-center">
        {title}
        {timeframe && <span className="text-xs text-muted-foreground/60 ml-1">· {timeframe}</span>}
      </p>
    </div>
  </div>
);

// Mini card para próximas atividades
const ActivityItem: React.FC<{
  title: string;
  date: string;
  icon?: React.ElementType;
  color?: string;
  link?: string;
}> = ({ title, date, icon: Icon = FileText, color = "text-blue-500", link = "#" }) => (
  <a href={link} className="block">
    <div className="flex items-center p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className={`p-2 rounded-lg mr-3 ${color.replace('text-', 'bg-').replace('-500', '-100')}`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-medium text-foreground">{title}</h4>
      <p className="text-xs text-muted-foreground">{date}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
    </div>
  </a>
);

// Card de pessoa (professor ou aluno)
const PersonCard: React.FC<{
  name: string;
  role: string;
  avatar: string;
  stats?: { label: string; value: string | number }[];
}> = ({ name, role, avatar, stats }) => (
  <div className="flex items-center p-4 rounded-lg hover:bg-muted/50 transition-colors border border-border/50">
    <img 
      src={avatar} 
      alt={name} 
      className="w-10 h-10 rounded-full object-cover mr-3" 
    />
    <div className="flex-1">
      <h4 className="text-sm font-medium text-foreground">{name}</h4>
      <p className="text-xs text-muted-foreground">{role}</p>
    </div>
    {stats && (
      <div className="flex space-x-4">
        {stats.map((stat, index) => (
          <div key={index} className="text-center">
            <p className="text-sm font-semibold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>
    )}
  </div>
);

// Componente do gráfico de barras simples
const SimpleBarChart: React.FC<{
  data: { label: string; value: number; color: string }[];
  title: string;
}> = ({ data, title }) => {
  const maxValue = Math.max(...data.map(item => item.value));
  
  return (
    <div className="p-4">
      <h3 className="text-sm font-medium text-foreground/90 mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index}>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{item.label}</span>
              <span>{item.value}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full ${item.color}`} 
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Lista de itens com status (para diagnósticos)
const StatusList: React.FC<{
  items: { title: string; status: string; date: string }[];
}> = ({ items }) => (
  <div className="divide-y divide-border">
    {items.map((item, index) => (
      <div key={index} className="py-3 flex items-center justify-between">
        <div className="flex items-center">
          {item.status === 'concluído' ? (
            <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
          ) : item.status === 'pendente' ? (
            <Clock className="w-5 h-5 text-amber-500 mr-3" />
          ) : (
            <Activity className="w-5 h-5 text-blue-500 mr-3" />
          )}
          <div>
            <p className="text-sm font-medium text-foreground">{item.title}</p>
            <p className="text-xs text-muted-foreground">{item.date}</p>
          </div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium
          ${item.status === 'concluído' ? 'bg-green-100 text-green-700' : 
            item.status === 'pendente' ? 'bg-amber-100 text-amber-700' : 
            'bg-blue-100 text-blue-700'}`}>
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </span>
      </div>
    ))}
  </div>
);

// Componente principal do Dashboard
const DashboardGestaoPage: React.FC = () => {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  
  // Dados fictícios para a dashboard
  const dashboardData = {
    stats: {
      professores: { total: 15, variacao: 7, periodo: 'último mês' },
      turmas: { total: 10, variacao: 0, periodo: 'último mês' },
      alunos: { total: 250, variacao: 12, periodo: 'último mês' },
      diagnosticos: { total: 78, variacao: -3, periodo: 'último mês' }
    },
    professores: [
      { nome: 'Ana Luiza Santos', disciplina: 'Matemática', avatar: 'https://avatar.iran.liara.run/public/girl?w=100', stats: [{ label: 'Turmas', value: 4 }, { label: 'Alunos', value: 97 }] },
      { nome: 'Carlos Eduardo Lima', disciplina: 'Português', avatar: 'https://avatar.iran.liara.run/public/boy?w=100', stats: [{ label: 'Turmas', value: 3 }, { label: 'Alunos', value: 82 }] },
      { nome: 'Fernanda Costa', disciplina: 'História', avatar: 'https://avatar.iran.liara.run/public/girl?w=100', stats: [{ label: 'Turmas', value: 2 }, { label: 'Alunos', value: 54 }] },
      { nome: 'Ricardo Oliveira', disciplina: 'Ciências', avatar: 'https://avatar.iran.liara.run/public/boy?w=100', stats: [{ label: 'Turmas', value: 3 }, { label: 'Alunos', value: 71 }] }
    ],
    turmas: [
      { nome: '5º Ano A', modalidade: 'Fundamental I', alunos: 25, professor: 'Ana Luiza' },
      { nome: '5º Ano B', modalidade: 'Fundamental I', alunos: 27, professor: 'Carlos Eduardo' },
      { nome: '6º Ano A', modalidade: 'Fundamental II', alunos: 30, professor: 'Fernanda Costa' },
      { nome: '6º Ano B', modalidade: 'Fundamental II', alunos: 28, professor: 'Ricardo Oliveira' }
    ],
    graficoModalidades: [
      { label: 'Infantil', value: 35, color: 'bg-purple-500' },
      { label: 'Fundamental I', value: 120, color: 'bg-blue-500' },
      { label: 'Fundamental II', value: 95, color: 'bg-green-500' }
    ],
    proximasAtividades: [
      { titulo: 'Reunião pedagógica', data: '10 de Agosto - 14:00', icon: Users, color: 'text-blue-500' },
      { titulo: 'Entrega de avaliações', data: '15 de Agosto', icon: FileText, color: 'text-green-500' },
      { titulo: 'Conselho de classe', data: '20 de Agosto - 09:00', icon: School, color: 'text-amber-500' },
      { titulo: 'Feira de ciências', data: '25 de Agosto - Dia todo', icon: BookOpenText, color: 'text-purple-500' }
    ],
    diagnosticosRecentes: [
      { title: 'Diagnóstico Português 5º Ano A', status: 'concluído', date: '02/08/2023' },
      { title: 'Diagnóstico Matemática 6º Ano B', status: 'em andamento', date: '05/08/2023' },
      { title: 'Diagnóstico Ciências 5º Ano B', status: 'pendente', date: '10/08/2023' },
      { title: 'Diagnóstico História 6º Ano A', status: 'concluído', date: '01/08/2023' }
    ]
  };

  return (
    <Layout 
      headerTitle="Início"
      headerSubtitle="Visão geral das suas atividades"
    >
      <div className="page-center px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        <div className="standard-page-card space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
              Dashboard de Gestão
            </h1>
            <p className="text-muted-foreground">
              Bem-vinda, {user?.user_metadata?.name || 'Diretora Gisele'}! Confira os principais indicadores da sua escola.
            </p>
          </div>

          {/* Seletor de mês/ano */}
          <div className="mt-4 md:mt-0 bg-card shadow-sm rounded-lg p-2 flex items-center">
            <button 
              onClick={() => {
                if (currentMonth === 0) {
                  setCurrentMonth(11);
                  setCurrentYear(prev => prev - 1);
                } else {
                  setCurrentMonth(prev => prev - 1);
                }
              }}
              className="p-1 rounded-md hover:bg-muted"
            >
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <span className="px-2 text-sm font-medium">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <button 
              onClick={() => {
                if (currentMonth === 11) {
                  setCurrentMonth(0);
                  setCurrentYear(prev => prev + 1);
                } else {
                  setCurrentMonth(prev => prev + 1);
                }
              }}
              className="p-1 rounded-md hover:bg-muted"
            >
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Professores" 
            value={dashboardData.stats.professores.total} 
            icon={Users} 
            color="text-blue-500" 
            change={dashboardData.stats.professores.variacao}
            timeframe={dashboardData.stats.professores.periodo}
          />
          <StatCard 
            title="Turmas" 
            value={dashboardData.stats.turmas.total} 
            icon={School} 
            color="text-green-500" 
            change={dashboardData.stats.turmas.variacao}
            timeframe={dashboardData.stats.turmas.periodo}
          />
          <StatCard 
            title="Alunos" 
            value={dashboardData.stats.alunos.total} 
            icon={GraduationCap} 
            color="text-purple-500" 
            change={dashboardData.stats.alunos.variacao}
            timeframe={dashboardData.stats.alunos.periodo}
          />
          <StatCard 
            title="Diagnósticos" 
            value={dashboardData.stats.diagnosticos.total} 
            icon={BookOpenText} 
            color="text-amber-500" 
            change={dashboardData.stats.diagnosticos.variacao}
            timeframe={dashboardData.stats.diagnosticos.periodo}
          />
        </div>

        {/* Grid principal com 3 colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Primeira coluna - Atividades e gráficos */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-card shadow-sm rounded-xl p-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-foreground">Próximas Atividades</h2>
                <BellRing className="w-5 h-5 text-muted-foreground/60" />
              </div>
              <div className="space-y-1">
                {dashboardData.proximasAtividades.map((atividade, index) => (
                  <ActivityItem 
                    key={index}
                    title={atividade.titulo}
                    date={atividade.data}
                    icon={atividade.icon}
                    color={atividade.color}
                  />
                ))}
              </div>
              <button className="w-full mt-4 py-2 text-sm text-blue-600 hover:text-blue-700 flex items-center justify-center">
                Ver todas as atividades
                <ChevronsRight className="w-4 h-4 ml-1" />
              </button>
            </div>

            <div className="bg-card shadow-sm rounded-xl overflow-hidden">
              <div className="p-5 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">Distribuição de Alunos</h2>
                <p className="text-xs text-muted-foreground">por modalidade de ensino</p>
              </div>
              <SimpleBarChart 
                data={dashboardData.graficoModalidades} 
                title=""
              />
              <div className="px-5 pb-4">
                <button className="text-sm text-blue-600 hover:text-blue-700">Ver detalhes</button>
              </div>
            </div>
          </div>

          {/* Segunda coluna - Professores */}
          <div className="bg-card shadow-sm rounded-xl overflow-hidden">
            <div className="p-5 border-b border-border/50">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Principais Professores</h2>
                  <p className="text-xs text-muted-foreground">por número de alunos</p>
                </div>
                <button className="text-sm text-blue-600 hover:text-blue-700">Ver todos</button>
              </div>
            </div>
            <div className="p-4 divide-y divide-border/50">
              {dashboardData.professores.map((professor, index) => (
                <PersonCard 
                  key={index}
                  name={professor.nome}
                  role={professor.disciplina}
                  avatar={professor.avatar}
                  stats={professor.stats}
                />
              ))}
            </div>
          </div>

          {/* Terceira coluna - Turmas e Diagnósticos */}
          <div className="space-y-6">
            <div className="bg-card shadow-sm rounded-xl overflow-hidden">
              <div className="p-5 border-b border-border/50">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-foreground">Turmas Ativas</h2>
                  <button className="text-sm text-blue-600 hover:text-blue-700">Ver todas</button>
                </div>
              </div>
              <div className="p-4">
                <table className="min-w-full divide-y divide-border">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Turma</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Alunos</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Professor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {dashboardData.turmas.map((turma, index) => (
                      <tr key={index} className="hover:bg-muted/50">
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-white font-medium text-sm mr-2">
                              {turma.nome.substring(0, 2)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{turma.nome}</p>
                              <p className="text-xs text-muted-foreground">{turma.modalidade}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className="text-sm text-foreground">{turma.alunos}</span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className="text-sm text-foreground">{turma.professor}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-card shadow-sm rounded-xl overflow-hidden">
              <div className="p-5 border-b border-border/50">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-foreground">Diagnósticos Recentes</h2>
                  <button className="text-sm text-blue-600 hover:text-blue-700">Ver todos</button>
                </div>
              </div>
              <div className="p-4">
                <StatusList items={dashboardData.diagnosticosRecentes} />
              </div>
            </div>
          </div>

        </div>
        </div>
      </div>
    </Layout>
  );
};

export default DashboardGestaoPage;