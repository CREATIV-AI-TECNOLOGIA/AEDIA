import React from 'react';

const AlunoTarefasPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="page-center px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        <div className="standard-page-card space-y-6 text-center max-w-md w-full">
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
    </div>
  );
};

export default AlunoTarefasPage;