import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface RegistroFrequencia {
  data: string;
  disciplina: string;
  presenca: boolean;
  justificativa?: string;
}

export default function FrequenciaAluno() {
  const [nomeAluno] = useState('Maria Silva');
  const [turma] = useState('5º Ano - Turma B');
  const [mesAtual, setMesAtual] = useState('Maio 2025');
  const [porcentagemPresenca, setPorcentagemPresenca] = useState(95);
  
  // Dados fictícios para ilustração
  const frequencias: RegistroFrequencia[] = [
    { data: '02/05/2025', disciplina: 'Matemática', presenca: true },
    { data: '02/05/2025', disciplina: 'Português', presenca: true },
    { data: '02/05/2025', disciplina: 'Ciências', presenca: true },
    { data: '03/05/2025', disciplina: 'História', presenca: true },
    { data: '03/05/2025', disciplina: 'Geografia', presenca: true },
    { data: '03/05/2025', disciplina: 'Educação Física', presenca: true },
    { data: '06/05/2025', disciplina: 'Matemática', presenca: false, justificativa: 'Consulta médica' },
    { data: '06/05/2025', disciplina: 'Português', presenca: false, justificativa: 'Consulta médica' },
    { data: '07/05/2025', disciplina: 'Ciências', presenca: true },
    { data: '07/05/2025', disciplina: 'Arte', presenca: true },
    { data: '08/05/2025', disciplina: 'História', presenca: true },
    { data: '09/05/2025', disciplina: 'Geografia', presenca: true },
    { data: '10/05/2025', disciplina: 'Matemática', presenca: true },
    { data: '13/05/2025', disciplina: 'Português', presenca: true },
    { data: '14/05/2025', disciplina: 'Ciências', presenca: true },
  ];
  
  // Agrupar frequências por data para exibição
  const frequenciasPorData = frequencias.reduce<Record<string, RegistroFrequencia[]>>((acc, curr) => {
    if (!acc[curr.data]) {
      acc[curr.data] = [];
    }
    acc[curr.data].push(curr);
    return acc;
  }, {});
  
  // Totais para relatório
  const totalAulas = frequencias.length;
  const totalPresencas = frequencias.filter(f => f.presenca).length;
  const totalFaltas = totalAulas - totalPresencas;
  
  // Navigate between months
  const navegarMes = (direcao: 'anterior' | 'proximo') => {
    // Simulando navegação entre meses - não tem funcionalidade real
    if (direcao === 'anterior') {
      setMesAtual('Abril 2025');
      setPorcentagemPresenca(97);
    } else {
      setMesAtual('Junho 2025');
      setPorcentagemPresenca(93);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Cabeçalho e navegação */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <div className="flex items-center mb-2">
            <Link to="/painel-pais" className="flex items-center px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold rounded-lg transition-colors border border-indigo-200 shadow-sm mr-2">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Voltar
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">Frequência Escolar</h1>
          </div>
          <p className="text-gray-600">{nomeAluno} - {turma}</p>
        </div>
        
        {/* Seletor de mês */}
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          <button
            onClick={() => navegarMes('anterior')}
            className="p-2 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          
          <span className="text-lg font-medium text-gray-700">{mesAtual}</span>
          
          <button
            onClick={() => navegarMes('proximo')}
            className="p-2 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Resumo da frequência */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
        <div className="p-6 flex flex-wrap">
          <div className="w-full md:w-1/3 p-4">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full text-indigo-600 mb-4">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-500">Total de Aulas</h3>
              <p className="text-3xl font-bold text-gray-800">{totalAulas}</p>
            </div>
          </div>
          
          <div className="w-full md:w-1/3 p-4">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full text-green-600 mb-4">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-500">Presenças</h3>
              <p className="text-3xl font-bold text-gray-800">{totalPresencas}</p>
            </div>
          </div>
          
          <div className="w-full md:w-1/3 p-4">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full text-red-600 mb-4">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-500">Faltas</h3>
              <p className="text-3xl font-bold text-gray-800">{totalFaltas}</p>
            </div>
          </div>
        </div>
        
        {/* Barra de progresso */}
        <div className="px-6 pb-6">
          <div className="mb-2 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Porcentagem de presença</span>
            <span className="text-sm font-medium text-gray-700">{porcentagemPresenca}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className={`h-2.5 rounded-full ${porcentagemPresenca >= 75 ? 'bg-green-600' : 'bg-red-600'}`} style={{ width: `${porcentagemPresenca}%` }}></div>
          </div>
          <div className="mt-2 text-xs text-gray-500 text-right">
            Mínimo exigido: 75%
          </div>
        </div>
      </div>
      
      {/* Registros detalhados */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100">
          <h2 className="text-lg font-bold text-indigo-800">Registros Detalhados</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Disciplina
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Observação
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(frequenciasPorData).map(([data, registros]) => (
                registros.map((registro, idx) => (
                  <tr key={`${data}-${registro.disciplina}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {idx === 0 ? data : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {registro.disciplina}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {registro.presenca ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Presente
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Ausente
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {registro.justificativa || '—'}
                    </td>
                  </tr>
                ))
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 