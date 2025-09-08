import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// Componentes fictícios para fins de ilustração
interface CardHomeProps {
  title: string;
  icon: JSX.Element;
  value?: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color: string;
  path: string;
}

const CardHome: React.FC<CardHomeProps> = ({ title, icon, value, trend, trendValue, color, path }) => {
  return (
    <Link to={path} className="block">
      <div className={`card-standard overflow-hidden border-t-4 ${color}`}>
        <div className="p-5">
          <div className="flex justify-between items-center">
            <h3 className="text-gray-700 text-lg font-semibold">{title}</h3>
            <div className={`p-2 rounded-full ${color.replace('border-', 'bg-').replace('-500', '-100')}`}>
              {icon}
            </div>
          </div>
          
          {value && (
            <div className="mt-4">
              <div className="text-2xl font-bold text-gray-800">{value}</div>
              
              {trend && (
                <div className="flex items-center mt-1">
                  {trend === 'up' && (
                    <span className="text-green-500 text-sm flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                      {trendValue}
                    </span>
                  )}
                  {trend === 'down' && (
                    <span className="text-red-500 text-sm flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {trendValue}
                    </span>
                  )}
                  {trend === 'neutral' && (
                    <span className="text-gray-500 text-sm flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                      {trendValue}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
          
          <div className="mt-4">
            <button className={`text-sm ${color.replace('border-', 'text-')}`}>
              Ver detalhes →
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};

interface AvisoProps {
  tipo: 'info' | 'alert' | 'success';
  titulo: string;
  mensagem: string;
  data: string;
}

const Aviso: React.FC<AvisoProps> = ({ tipo, titulo, mensagem, data }) => {
  const bgColors = {
    info: 'bg-blue-50 border-blue-200',
    alert: 'bg-amber-50 border-amber-200',
    success: 'bg-green-50 border-green-200'
  };
  
  const iconColors = {
    info: 'text-blue-500',
    alert: 'text-amber-500',
    success: 'text-green-500'
  };
  
  return (
    <div className={`${bgColors[tipo]} border rounded-lg p-4 mb-3`}>
      <div className="flex items-start">
        <div className={`${iconColors[tipo]} p-1`}>
          {tipo === 'info' && (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          )}
          {tipo === 'alert' && (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
          {tipo === 'success' && (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <div className="ml-3 flex-1">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">{titulo}</h3>
            <span className="text-xs text-gray-500">{data}</span>
          </div>
          <div className="mt-1 text-sm text-gray-600">{mensagem}</div>
        </div>
      </div>
    </div>
  );
};

interface CalendarioEventoProps {
  data: string;
  titulo: string;
  tipo: 'aula' | 'prova' | 'tarefa';
  materia: string;
}

const CalendarioEvento: React.FC<CalendarioEventoProps> = ({ data, titulo, tipo, materia }) => {
  const tipoClasses = {
    aula: 'bg-blue-100 text-blue-800',
    prova: 'bg-red-100 text-red-800',
    tarefa: 'bg-green-100 text-green-800'
  };
  
  const tipoLabel = {
    aula: 'Aula',
    prova: 'Avaliação',
    tarefa: 'Tarefa'
  };

  return (
    <div className="flex items-center py-3 border-b border-gray-100 last:border-0">
      <div className="w-16 text-center">
        <div className="text-sm font-medium text-gray-400">{data.split(' ')[0]}</div>
        <div className="text-lg font-bold text-gray-800">{data.split(' ')[1]}</div>
      </div>
      <div className="ml-4 flex-1">
        <div className="font-medium text-gray-800">{titulo}</div>
        <div className="text-sm text-gray-600">{materia}</div>
      </div>
      <div className={`${tipoClasses[tipo]} text-xs font-medium px-2.5 py-0.5 rounded-full ml-2`}>
        {tipoLabel[tipo]}
      </div>
    </div>
  );
};

export default function PainelPais() {
  const [nomeAluno] = useState('Maria Silva');
  const [turma] = useState('5º Ano - Turma B');
  
  // Dados fictícios para ilustração
  const avisos: AvisoProps[] = [
    {
      tipo: 'info',
      titulo: 'Reunião de Pais e Mestres',
      mensagem: 'A reunião será realizada no dia 20/05/2025, às 19h, no auditório da escola.',
      data: '10/05/2025'
    },
    {
      tipo: 'alert',
      titulo: 'Entrega de Atividade Pendente',
      mensagem: 'O trabalho de Ciências deve ser entregue até amanhã.',
      data: '12/05/2025'
    },
    {
      tipo: 'success',
      titulo: 'Projeto Aprovado',
      mensagem: 'O projeto de feira de ciências foi aprovado com nota máxima.',
      data: '08/05/2025'
    }
  ];
  
  const eventos: CalendarioEventoProps[] = [
    {
      data: 'Seg 15',
      titulo: 'Prova Bimestral',
      tipo: 'prova',
      materia: 'Matemática'
    },
    {
      data: 'Qua 17',
      titulo: 'Entrega de Trabalho',
      tipo: 'tarefa',
      materia: 'Português'
    },
    {
      data: 'Sex 19',
      titulo: 'Aula de Reforço',
      tipo: 'aula',
      materia: 'Ciências'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Cabeçalho com informações do aluno */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8 border-l-4 border-indigo-500">
        <div className="flex items-center">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mr-4">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{nomeAluno}</h1>
            <p className="text-gray-600">{turma}</p>
          </div>
          
          <div className="ml-auto">
            <div className="bg-indigo-50 px-3 py-1 rounded-full text-indigo-700 text-sm font-medium inline-flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3.586l2.707 2.707a1 1 0 01-1.414 1.414l-3-3A1 1 0 019 10V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              1º Semestre - 2025
            </div>
          </div>
        </div>
      </div>
      
      {/* Cards principais */}
      <div className="cards-grid cards-equal-height mb-8">
        <CardHome
          title="Frequência Escolar"
          icon={<svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>}
          value="95%"
          trend="up"
          trendValue="2% desde o mês passado"
          color="border-green-500"
          path="/frequencia"
        />
        
        <CardHome
          title="Média Geral"
          icon={<svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
          </svg>}
          value="8,5"
          trend="up"
          trendValue="0,3 desde o último bimestre"
          color="border-blue-500"
          path="/notas"
        />
        
        <CardHome
          title="Tarefas Pendentes"
          icon={<svg className="w-6 h-6 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>}
          value="2"
          trend="down"
          trendValue="3 menos que semana passada"
          color="border-amber-500"
          path="/tarefas"
        />
      </div>
      
      {/* Comunicados e Calendário */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Comunicados */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-indigo-800">Comunicados</h2>
              <Link to="/comunicados" className="text-sm text-indigo-600 hover:text-indigo-800">
                Ver todos →
              </Link>
            </div>
          </div>
          <div className="p-6">
            {avisos.map((aviso, index) => (
              <Aviso key={index} {...aviso} />
            ))}
          </div>
        </div>
        
        {/* Calendário */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-indigo-800">Próximos Eventos</h2>
              <Link to="/calendario" className="text-sm text-indigo-600 hover:text-indigo-800">
                Ver calendário completo →
              </Link>
            </div>
          </div>
          <div className="p-6">
            {eventos.map((evento, index) => (
              <CalendarioEvento key={index} {...evento} />
            ))}
          </div>
        </div>
      </div>
      
      {/* Desempenho nas disciplinas */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
        <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-indigo-800">Desempenho por Disciplina</h2>
            <Link to="/diagnostico" className="text-sm text-indigo-600 hover:text-indigo-800">
              Ver diagnóstico completo →
            </Link>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Matemática */}
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-800">Matemática</h3>
                <span className="text-lg font-bold text-indigo-600">8,7</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: '87%' }}></div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Desempenho acima da média da turma (7,5)
              </div>
            </div>
            
            {/* Português */}
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-800">Português</h3>
                <span className="text-lg font-bold text-indigo-600">9,2</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: '92%' }}></div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Desempenho acima da média da turma (8,1)
              </div>
            </div>
            
            {/* Ciências */}
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-800">Ciências</h3>
                <span className="text-lg font-bold text-indigo-600">7,8</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: '78%' }}></div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Desempenho próximo à média da turma (7,9)
              </div>
            </div>
            
            {/* História */}
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-800">História</h3>
                <span className="text-lg font-bold text-indigo-600">8,3</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: '83%' }}></div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Desempenho acima da média da turma (7,6)
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Acesso rápido às páginas principais */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100">
          <h2 className="text-lg font-bold text-indigo-800">Acesso Rápido</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/frequencia" className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-gray-700 font-medium text-center">Frequência</span>
            </Link>
            
            <Link to="/notas" className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-2">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <span className="text-gray-700 font-medium text-center">Notas</span>
            </Link>
            
            <Link to="/calendario" className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-2">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-gray-700 font-medium text-center">Calendário</span>
            </Link>
            
            <Link to="/diagnostico" className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mb-2">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-gray-700 font-medium text-center">Diagnóstico</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}