import React from 'react';

const AlunoTarefasPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white shadow-md rounded-lg p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-primary mb-6">Minhas Tarefas</h1>
        <p className="text-gray-700 mb-4">
          Bem-vindo(a) à sua área de tarefas!
        </p>
        <p className="text-gray-600">
          Aqui você poderá visualizar as tarefas enviadas pelo seu professor e acompanhar seu progresso.
        </p>
        <div className="mt-8 py-4 px-6 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-700">
            Esta página ainda está em desenvolvimento. Volte em breve para mais novidades!
          </p>
        </div>
      </div>
    </div>
  );
};

export default AlunoTarefasPage; 