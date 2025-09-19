import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

// Componente do gráfico de desempenho
const PerformanceChart: React.FC = () => {
  return (
    <div className="bg-white rounded-xl p-5 shadow-xl h-full transition-shadow duration-300 ease-in-out hover:shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg text-foreground">Meu Desempenho</h3>
        </div>
        <select className="bg-gray-50 text-sm border border-gray-200 rounded-lg p-2">
          <option>Mensal</option>
          <option>Bimestral</option>
          <option>Semestral</option>
        </select>
      </div>
      
      <div className="flex flex-col">
        <div className="mb-6 relative pt-4">
          {/* Área do gráfico - mockup visual */}
          <div className="h-48 w-full relative">
            <div className="absolute bottom-0 left-0 w-full h-full">
              {/* Linha do gráfico semelhante à imagem */}
              <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                <div className="absolute top-4 left-0 right-0 flex justify-center">
                  <div className="bg-white/80 text-blue-500 px-3 py-1 rounded-full text-xs font-medium shadow-sm border border-blue-100">
                    Desempenho crescente
                  </div>
                </div>
                <p className="opacity-0">Gráfico de desempenho ao longo do tempo</p>
                <svg className="absolute w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                  <path 
                    d="M0,150 C50,120 100,170 150,100 C200,40 250,90 300,70 C350,60 400,80 400,100" 
                    fill="none" 
                    stroke="#38bdf8" 
                    strokeWidth="1.5"
                  />
                  <path 
                    d="M0,150 C50,140 100,160 150,130 C200,110 250,130 300,110 C350,100 400,120 400,130" 
                    fill="none" 
                    stroke="#a5b4fc" 
                    strokeWidth="1" 
                    strokeDasharray="3,3"
                    strokeOpacity="0.6"
                  />
                </svg>
              </div>
            </div>
            
            {/* Eixos Y */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-muted-foreground">
              <span>R$10.000</span>
              <span>R$8.000</span>
              <span>R$6.000</span>
              <span>R$4.000</span>
              <span>R$2.000</span>
              <span>R$0</span>
            </div>
          </div>
          
          {/* Meses no eixo X */}
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Mar</span>
            <span>Abr</span>
            <span>Mai</span>
            <span>Jun</span>
            <span>Jul</span>
            <span>Ago</span>
            <span>Set</span>
          </div>
        </div>
        
        {/* Estatísticas de desempenho */}
        <div className="flex justify-between mt-2">
          <div className="p-4 bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-lg flex-1 mr-4 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-1">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <div className="text-sm font-medium">Este mês</div>
            </div>
            <div className="text-2xl font-bold">7.2</div>
            <div className="text-xs font-light mt-1">
              <span className="text-green-300 font-semibold">+8%</span> vs. último mês
            </div>
          </div>
          <div className="p-4 bg-gradient-to-r from-purple-400 to-purple-500 text-white rounded-lg flex-1 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-1">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <div className="text-sm font-medium">Último mês</div>
            </div>
            <div className="text-2xl font-bold">6.7</div>
            <div className="text-xs font-light mt-1">Média anterior</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente para o perfil do aluno
const StudentProfilePanel: React.FC<{ userName: string }> = ({ userName }) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-xl flex flex-col items-center text-center h-full transition-shadow duration-300 ease-in-out hover:shadow-2xl">
      <div className="relative mb-4">
        <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg transform transition-transform duration-300 hover:scale-105">
          <img 
            src="https://avatar.iran.liara.run/public/boy?w=256" 
            alt="Perfil do aluno" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute -bottom-2 -right-2 bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-md">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-1">
        {userName}
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        Turma: 8º ano B - matutino
      </p>
      
      <div className="w-full mt-4">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-600 mr-2 shadow-sm">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-foreground/90">Estrela Dourada</span>
          </div>
          <span className="text-sm font-bold text-amber-500">88%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
          <div className="bg-gradient-to-r from-amber-300 to-amber-500 h-3 rounded-full transition-all duration-1000 ease-out" style={{ width: '88%' }}></div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 w-full mt-6">
        <div className="bg-gradient-to-br from-sky-400 to-cyan-500 text-white rounded-lg p-3 text-center shadow-md hover:shadow-lg transition-shadow transform hover:scale-105 duration-300">
          <div className="flex items-center justify-center mb-1">
            <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
            <span className="text-sm font-medium">Pontuação</span>
          </div>
          <span className="block text-xl font-bold">4.8M</span>
        </div>
        <div className="bg-gradient-to-br from-emerald-400 to-green-500 text-white rounded-lg p-3 text-center shadow-md hover:shadow-lg transition-shadow transform hover:scale-105 duration-300">
          <div className="flex items-center justify-center mb-1">
            <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Atividades</span>
          </div>
          <span className="block text-xl font-bold">142</span>
        </div>
      </div>
      
      <div className="w-full mt-8">
        <button className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all duration-300 ease-in-out hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
          </svg>
          Melhorar desempenho
        </button>
      </div>
    </div>
  );
};

// Componente principal do Dashboard do Aluno
const AlunoDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [userName, setUserName] = useState('Estudante');

  useEffect(() => {
    // Obtém dados do aluno se disponíveis
    if (user) {
      setUserName(user.user_metadata?.name || user.email?.split('@')[0] || 'Estudante');
    }
  }, [user]);
  
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="page-center px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        <div className="standard-page-card space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Meu Desempenho</h1>
              <p className="text-muted-foreground">Bem-vindo, {userName}! Confira suas estatísticas.</p>
            </div>
            
            <div className="mt-4 md:mt-0 relative">
              <div className="flex items-center bg-white rounded-lg p-2 px-4 shadow-sm">
                <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input 
                  type="text" 
                  placeholder="Pesquisar atividade" 
                  className="border-none text-sm focus:ring-0 focus:outline-none w-44"
                />
                <button className="ml-1 text-gray-400 hover:text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:items-stretch">
            {/* Colunas 1-3: Conteúdo principal */}
            <div className="lg:col-span-3 space-y-6 animate-fadeIn">
              {/* Gráfico de Desempenho */}
              <PerformanceChart />
            </div>
            
            {/* Coluna 4: Perfil do aluno */}
            <div className="lg:col-span-1 animate-slideIn">
              <StudentProfilePanel userName={userName} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlunoDashboardPage;