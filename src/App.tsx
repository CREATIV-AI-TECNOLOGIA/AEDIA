import React, { useEffect } from 'react'
import './App.css'
import Layout from './components/layout/Layout'
import LayoutAluno from './components/layout/LayoutAluno'
import Dashboard from './features/dashboard/Dashboard'
import { Routes, Route, useNavigate, BrowserRouter } from 'react-router-dom'
import { useRouteState } from './hooks/useRouteState'
import CriarTurma from './pages/CriarTurma'
import DetalheTurmaWrapper from './pages/DetalheTurmaWrapper'
import TurmasRedirector from './components/TurmasRedirector'
// import LoginCadastro from './components/auth/LoginCadastro' // Comentando esta importação
import DefinirSenha from './components/auth/DefinirSenha'
import AdminConvite from './pages/AdminConvite'
import { AuthProvider } from './context/AuthContext' // Restaurado AuthProvider
import AuthRedirector from './context/AuthRedirector'
import { EscolaProvider } from './context/EscolaContext'
import { LayoutProvider } from './context/LayoutContext'
import { PlanosAulaWithSearch } from './pages/PlanosAula'
import CriarPlanoAula from './pages/CriarPlanoAula'
import CriarAvaliacaoPlanoAula from './pages/CriarAvaliacaoPlanoAula'
import ConfiguracoesIA from './pages/ConfiguracoesIA'
import RevisaoPlanoAula from './pages/RevisaoPlanoAula'
import CalendarioEscolar from './pages/CalendarioEscolar'
import { AvaliacoesWithSearch } from './pages/Tarefas'
import Chat from './pages/Chat'
import DiagnosticoAlunos from './pages/DiagnosticoAlunos'
import Turmas from './pages/Turmas'
import ConfiguracoesPage from './pages/Configuracoes/ConfiguracoesPage'
import DashboardGestaoPage from './pages/Gestao/DashboardGestaoPage'
import AlunoTarefasPage from './pages/Aluno/AlunoTarefasPage'
import AlunoDashboardPage from './pages/Aluno/AlunoDashboardPage'
import { useAuth } from './context/AuthContext'
import LoginRolesPage from './pages/LoginRolesPage'
import VisualizarAvaliacao from './pages/VisualizarAvaliacao'
import CorrecaoMobilePage from './pages/CorrecaoMobile'
import EscanearProvaPage from './pages/CorrecaoMobile/EscanearProva'
import DetalhesSessaoPage from './pages/CorrecaoMobile/DetalhesSessao'
import NovaSessaoPage from './pages/CorrecaoMobile/NovaSessao'
import CorrecoesAvaliacoesPage from './pages/CorrecaoMobile/CorrecoesAvaliacoes'
import TokenMonitoring from './pages/TokenMonitoring'
import ChatInternoPage from './pages/ChatInternoPage'
import NotificacoesPage from './pages/NotificacoesPage'
import { debugEnvironmentVariables } from './debug-env'

// Stagewise removido

/*
// Configuração do Stagewise removida
const stagewiseConfig = {
  plugins: [
    ReactPlugin,
    {
      pluginName: 'ex-professor-plugin',
      displayName: 'Plugin App Gestor',
      iconSvg:
        '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
      description: 'Plugin para o aplicativo Ex-Professor - gerenciamento escolar',
      shortInfoForPrompt: () => {
        return 'Aplicativo de gerenciamento escolar com funcionalidades de planos de aula, turmas, alunos e dashboard analítico'
      },
      mcp: null,
      actions: [
        {
          name: 'Analisar Componente',
          description: 'Analisa o componente selecionado para melhorias de UX/UI',
          execute: () => {
            console.log('Analisando componente selecionado...')
          },
        },
        {
          name: 'Sugerir Melhorias',
          description: 'Sugere melhorias para o elemento selecionado',
          execute: () => {
            console.log('Sugerindo melhorias...')
          },
        },
      ],
    },
  ],
}
*/

// Componente para páginas ainda não implementadas
function EmptyPage() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-600 mb-2">Página em Desenvolvimento</h2>
        <p className="text-gray-500">Esta funcionalidade estará disponível em breve.</p>
      </div>
    </div>
  );
}

// Componente para proteger rotas
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) {
      navigate('/auth', { replace: true });
    }
  }, [loading, session, navigate]);

  // Se estiver carregando, mostra o loader
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg font-medium text-gray-700">Carregando sua sessão...</p>
        </div>
      </div>
    );
  }

  // Se não estiver carregando e houver sessão, renderiza os children
  // (Se não houver sessão, o useEffect acima já terá redirecionado)
  return <>{children}</>;
}

// Componente interno para usar hooks do router
function AppContent() {
  const { restoreLastRoute } = useRouteState();
  
  // Tentar restaurar a última rota ao carregar a aplicação
  useEffect(() => {
    const timer = setTimeout(() => {
      restoreLastRoute();
    }, 100); // Pequeno delay para garantir que a autenticação foi inicializada
    
    return () => clearTimeout(timer);
  }, [restoreLastRoute]);

  return (
    <>
      <AuthRedirector />
      <Routes>
            {/* Rota de autenticação (login/cadastro) - Substituindo o LoginCadastro pelo LoginRolesPage */}
            <Route path="/auth" element={<LoginRolesPage />} />
            
            {/* Nova rota para login com seleção de perfis - Mantida para compatibilidade */}
            <Route path="/login-perfis" element={<LoginRolesPage />} />
            
            {/* Rota para definir senha */}
            <Route path="/definir-senha" element={<DefinirSenha />} />
            
            {/* ROTAS PARA ALUNO */}
            <Route 
              path="/aluno"
              element={ 
                <ProtectedRoute>
                  <LayoutAluno>
                    <AlunoDashboardPage />
                  </LayoutAluno>
                </ProtectedRoute>
              }
            />
            
            <Route 
              path="/aluno/tarefas"
              element={ 
                <ProtectedRoute>
                  <LayoutAluno>
                  <AlunoTarefasPage />
                  </LayoutAluno>
                </ProtectedRoute>
              }
            />
            
            <Route 
              path="/aluno/estatisticas"
              element={ 
                <ProtectedRoute>
                  <LayoutAluno>
                    <EmptyPage />
                  </LayoutAluno>
                </ProtectedRoute>
              }
            />
            
            <Route 
              path="/aluno/atividades"
              element={ 
                <ProtectedRoute>
                  <LayoutAluno>
                    <EmptyPage />
                  </LayoutAluno>
                </ProtectedRoute>
              }
            />
            
            <Route 
              path="/aluno/materiais"
              element={ 
                <ProtectedRoute>
                  <LayoutAluno>
                    <EmptyPage />
                  </LayoutAluno>
                </ProtectedRoute>
              }
            />
            
            <Route 
              path="/aluno/mensagens"
              element={ 
                <ProtectedRoute>
                  <LayoutAluno>
                    <EmptyPage />
                  </LayoutAluno>
                </ProtectedRoute>
              }
            />
            
            <Route 
              path="/aluno/calendario"
              element={ 
                <ProtectedRoute>
                  <LayoutAluno>
                    <EmptyPage />
                  </LayoutAluno>
                </ProtectedRoute>
              }
            />
            
            <Route 
              path="/aluno/configuracoes"
              element={ 
                <ProtectedRoute>
                  <LayoutAluno>
                    <EmptyPage />
                  </LayoutAluno>
                </ProtectedRoute>
              }
            />

            {/* Rota raiz que redireciona com base no papel do usuário */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout
                    headerTitle="Calendário escolar"
                    headerSubtitle="Visão geral das suas atividades"
                    headerIcon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                    mostrarEscola={true}
                  >
                    {/* O conteúdo aqui será determinado pelo AuthContext ou lógica de redirecionamento */}
                    {/* Por agora, deixaremos o Dashboard padrão, o redirecionamento cuidará */}
                    <Dashboard /> 
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* ROTA PARA DIRETORA/GESTAO */}
            <Route
              path="/gestao"
              element={
                <ProtectedRoute>
                  <Layout>
                    <DashboardGestaoPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Rotas protegidas para PROFESSORES */}
            <Route
              path="/dashboard-professor" // Rota explícita para professor se a raiz for genérica
              element={
                <ProtectedRoute>
                  <Layout
                    headerTitle="Calendário escolar"
                    headerSubtitle="Visão geral das suas atividades"
                    headerIcon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                    mostrarEscola={true}
                  >
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Rotas protegidas */}
            <Route
              path="/admin/convite"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AdminConvite />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/turmas/criar"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CriarTurma />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/turmas/:id"
              element={
                <ProtectedRoute>
                  <Layout
                    headerTitle="Gestão de Turmas"
                    headerSubtitle="Detalhes da turma selecionada"
                    headerIcon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                    mostrarEscola={true}
                  >
                    <DetalheTurmaWrapper />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* ADICIONADO: Rota para a lista de Turmas com redirecionamento automático */}
            <Route
              path="/turmas"
              element={
                <ProtectedRoute>
                  <Layout
                    headerTitle="Gestão de Turmas"
                    headerSubtitle="Visualize e gerencie todas as turmas da escola"
                    headerIcon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                    mostrarEscola={true}
                  >
                    <TurmasRedirector />
                  </Layout>
                </ProtectedRoute>
              }
            />
            {/* ADICIONADO: Rota para Planos de Aula */}
            <Route
              path="/planos-aula"
              element={
                <ProtectedRoute>
                  <PlanosAulaWithSearch />
                </ProtectedRoute>
              }
            />
            {/* ADICIONADO: Rota para Criar Plano de Aula */}
            <Route
              path="/planos-aula/criar"
              element={
                <ProtectedRoute>
                  <Layout
                    headerTitle="Criar Plano de Aula"
                    headerSubtitle="Desenvolva conteúdos pedagógicos estruturados"
                    headerIcon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
                  >
                    <CriarPlanoAula />
                  </Layout>
                </ProtectedRoute>
              }
            />
            {/* NOVA ROTA: Criar Avaliação baseada em Plano de Aula */}
            <Route
              path="/planos-aula/:id/criar-avaliacao"
              element={
                <ProtectedRoute>
                  <CriarAvaliacaoPlanoAula />
                </ProtectedRoute>
              }
            />
            {/* ADICIONADO: Rota para Configurações da IA */}
            <Route
              path="/planos-aula/configuracoes-ia"
              element={
                <ProtectedRoute>
                  <ConfiguracoesIA />
                </ProtectedRoute>
              }
            />
            {/* ADICIONADO: Rota para Revisão do Plano de Aula */}
            <Route
              path="/planos-aula/revisao"
              element={
                <ProtectedRoute>
                  <RevisaoPlanoAula />
                </ProtectedRoute>
              }
            />
            {/* ADICIONADO: Rota para Calendário Escolar */}
            <Route
              path="/calendario-escolar"
              element={
                <ProtectedRoute>
                  <Layout
                    headerTitle="Calendário escolar"
                    headerSubtitle="Gerencie períodos letivos, eventos e atividades escolares"
                    headerIcon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                    mostrarEscola={true}
                  >
                    <CalendarioEscolar />
                  </Layout>
                </ProtectedRoute>
              }
            />
            {/* ADICIONADO: Rota para Avaliações */}
            <Route
              path="/avaliacoes"
              element={
                <ProtectedRoute>
                  <AvaliacoesWithSearch />
                </ProtectedRoute>
              }
            />
            {/* ADICIONADO: Rota para Visualizar Avaliação */}
            <Route
              path="/avaliacoes/:id"
              element={
                <ProtectedRoute>
                  <VisualizarAvaliacao />
                </ProtectedRoute>
              }
            />
            {/* ADICIONADO: Rota para Chat */}
            <Route
              path="/chat"
              element={
                <Layout headerTitle="Assistente" headerSubtitle="Seu assistente educacional inteligente">
                  <Chat />
                </Layout>
              }
            />
            {/* ADICIONADO: Rota para Monitoramento de Tokens */}
            <Route
              path="/tokens"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TokenMonitoring />
                  </Layout>
                </ProtectedRoute>
              }
            />
            {/* ADICIONADO: Rota para Diagnóstico de Alunos */}
            <Route
              path="/diagnostico-alunos"
              element={
                <ProtectedRoute>
                  <Layout
                    headerTitle="Diagnóstico de Alunos"
                    headerSubtitle="Análise de desempenho e acompanhamento pedagógico"
                    headerIcon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                    mostrarEscola={true}
                  >
                    <DiagnosticoAlunos />
                  </Layout>
                </ProtectedRoute>
              }
            />
             {/* Rota para Configurações */}
             <Route 
              path="/configuracoes"
              element={ 
                <ProtectedRoute>
                  <Layout
                    headerTitle="Configurações"
                    headerSubtitle="Gerencie seu perfil e preferências do sistema"
                    headerIcon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                    mostrarEscola={true}
                  >
                    <ConfiguracoesPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* ROTAS PARA CORREÇÃO MOBILE */}
            <Route 
              path="/correcao-mobile"
              element={ 
                <ProtectedRoute>
                  <CorrecaoMobilePage />
                </ProtectedRoute>
              }
            />
            
            <Route 
              path="/correcoes-avaliacoes"
              element={ 
                <ProtectedRoute>
                  <CorrecoesAvaliacoesPage />
                </ProtectedRoute>
              }
            />
            
            <Route 
              path="/correcao-mobile/nova-sessao"
              element={ 
                <ProtectedRoute>
                  <NovaSessaoPage />
                </ProtectedRoute>
              }
            />
            
            <Route 
              path="/correcao-mobile/escanear"
              element={ 
                <ProtectedRoute>
                  <EscanearProvaPage />
                </ProtectedRoute>
              }
            />
            
            <Route 
              path="/correcao-mobile/sessao/:sessaoId/escanear"
              element={ 
                <ProtectedRoute>
                  <EscanearProvaPage />
                </ProtectedRoute>
              }
            />
            
            <Route 
              path="/correcao-mobile/sessao/:sessaoId/detalhes"
              element={ 
                <ProtectedRoute>
                  <DetalhesSessaoPage />
                </ProtectedRoute>
              }
            />

            <Route path="/suporte-tecnico" element={<Layout><EmptyPage /></Layout>} />

            {/* Rota para o Chat Interno */}
            <Route
              path="/chat-interno"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ChatInternoPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Rota para Notificações */}
            <Route
              path="/notificacoes"
              element={
                <ProtectedRoute>
                  <Layout
                    headerTitle="Notificações"
                    headerSubtitle="Acompanhe suas mensagens e lembretes importantes"
                    headerIcon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-2H4v2zM4 15h8v-2H4v2zM4 11h10V9H4v2zM4 7h12V5H4v2z" /></svg>}
                    mostrarEscola={true}
                  >
                    <NotificacoesPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Rota catch-all para páginas não encontradas - Adicionado */}
            <Route path="*" element={<Layout><EmptyPage /></Layout>} /> 

          </Routes>
    </>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        {/* Stagewise toolbar removida */}
        <AuthProvider>
          <EscolaProvider>
            <LayoutProvider>
              <AppContent />
            </LayoutProvider>
          </EscolaProvider>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
