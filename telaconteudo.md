Aqui está a versão perfeita e responsiva para React + TypeScript, igual ao visual do seu último print, pronta para usar no seu projeto!

O layout foi ajustado para max-w-5xl e o card centralizado ocupa espaço amplo e confortável.

Está com o mesmo grid, espaçamentos e visual do HTML final.

É completamente estática como maquete/UI (não faz mudanças de estado ou eventos de clique, mas está pronta para adicionar isso).

Inclui tipagem dos dados, recomendada para React TS.

tsx
import React from "react";

// Dados de exemplo (pode evoluir para estados)
const genres = [
  { name: "Conto", count: 2, active: true },
  { name: "Poema", count: 1, active: false },
  { name: "Fábula", count: 1, active: false },
  { name: "Notícia", count: 3, active: false },
  { name: "Carta", count: 2, active: false },
  { name: "Relato", count: 1, active: false },
];

const abilities = [
  {
    code: "EF03LP01",
    desc:
      "Ler e compreender, com autonomia, textos injuntivos instrucionais (receitas, manuais de instrução, etc.), considerando a situação comunicativa e o tema/assunto do texto.",
  },
  {
    code: "EF03LP02",
    desc: "Identificar a ideia central do texto, demonstrando compreensão global.",
  },
];

const selectedSummary = [
  { name: "Conto", count: 2 },
  { name: "Poema", count: 1 },
  { name: "Fábula", count: 1 },
];

// Não esqueça de adicionar o import global do Material Symbols na sua <head>:
// <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet"/>

const ContentSelection: React.FC = () => {
  return (
    <div
      className="flex w-full max-w-5xl mx-auto px-4 sm:px-6 min-h-[650px]"
      style={{
        fontFamily: 'Manrope, "Noto Sans", sans-serif',
      }}
    >
      <div className="flex flex-col w-full">
        <main className="flex-grow pb-28">
          <div className="mx-auto max-w-5xl px-4 pt-8 sm:px-6 lg:px-8">
            {/* Barra de progresso */}
            <nav aria-label="Progress" className="mb-12">
              <ol className="flex items-center justify-center space-x-4 text-sm font-medium text-gray-500 sm:space-x-8">
                <li className="flex items-center">
                  <a className="text-[#1380ec] hover:text-[#0a6ac9]" href="#">
                    Tipo de Período
                  </a>
                  <span className="material-symbols-outlined mx-2 text-gray-300">
                    chevron_right
                  </span>
                </li>
                <li className="flex items-center">
                  <a className="text-[#1380ec] hover:text-[#0a6ac9]" href="#">
                    Datas
                  </a>
                  <span className="material-symbols-outlined mx-2 text-gray-300">
                    chevron_right
                  </span>
                </li>
                <li className="flex items-center">
                  <span aria-current="page" className="text-[#1380ec]">
                    Conteúdo
                  </span>
                  <span className="material-symbols-outlined mx-2 text-gray-300">
                    chevron_right
                  </span>
                </li>
                <li className="flex items-center">
                  <span>Resumo/Confirmação</span>
                </li>
              </ol>
            </nav>
            <div className="mx-auto max-w-4xl px-0 sm:px-0 lg:px-0">
              <div className="space-y-10">
                {/* Título */}
                <div className="text-center">
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                    Seleção de Conteúdo
                  </h1>
                  <p className="mt-4 text-lg text-gray-600">
                    Selecione os gêneros textuais e as habilidades para o seu plano de aula. As sugestões são baseadas no 1º trimestre.
                  </p>
                </div>
                <div className="space-y-8">
                  {/* Card */}
                  <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200">
                      <div className="flex items-center justify-between px-6 py-4">
                        <h2 className="text-lg font-bold text-gray-900">Gêneros e Habilidades</h2>
                        <button className="flex items-center gap-1.5 rounded-md border border-dashed border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-600 transition-colors hover:border-[#1380ec] hover:bg-[#1380ec] hover:bg-opacity-5 hover:text-[#1380ec]">
                          <span className="material-symbols-outlined text-base">add</span>
                          <span>Adicionar Gênero</span>
                        </button>
                      </div>
                      {/* Tabs dos gêneros */}
                      <div className="relative">
                        <div className="tabs-container flex overflow-x-auto border-b border-gray-200">
                          {genres.map((g) => (
                            <button
                              key={g.name}
                              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold 
                                ${
                                  g.active
                                    ? "border-[#1380ec] text-[#1380ec]"
                                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                                }`}
                            >
                              <span>{g.name}</span>
                              <span
                                className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                                  g.active ? "bg-[#1380ec1a]" : "bg-gray-100"
                                }`}
                              >
                                {g.count}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    {/* Grid */}
                    <div className="grid grid-cols-1 gap-8 p-6 md:grid-cols-12">
                      {/* Bloco central: conteúdo e habilidades */}
                      <div className="md:col-span-8">
                        <h3 className="text-xl font-bold text-gray-900">Conto</h3>
                        <p className="mt-1 text-sm text-gray-600">
                          Passe o mouse sobre o código da habilidade para ver a descrição completa.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-3">
                          {abilities.map((ab) => (
                            <div
                              key={ab.code}
                              className="tooltip flex items-center gap-1.5 rounded-full bg-blue-100 py-1 pl-2 pr-3 text-sm font-semibold text-blue-800"
                            >
                              <span className="material-symbols-outlined text-base">
                                auto_awesome
                              </span>
                              <span>({ab.code})</span>
                              <button className="ml-1 text-blue-600 hover:text-blue-800" tabIndex={-1}>
                                <span className="material-symbols-outlined !text-base">close</span>
                              </button>
                              <span className="tooltiptext">{ab.desc}</span>
                            </div>
                          ))}
                          <button className="flex items-center gap-1.5 rounded-md border border-dashed border-gray-300 px-3 py-1 text-sm font-semibold text-gray-600 transition-colors hover:border-[#1380ec] hover:bg-[#1380ec] hover:bg-opacity-5 hover:text-[#1380ec]">
                            <span className="material-symbols-outlined text-base">add</span>
                            <span>Adicionar Habilidade</span>
                          </button>
                        </div>
                      </div>
                      {/* Bloco direito: resumo */}
                      <div className="md:col-span-4 md:border-l md:pl-8">
                        <h4 className="font-semibold text-gray-900">Itens Selecionados</h4>
                        <p className="mt-1 text-sm text-gray-500">Resumo do que foi adicionado ao plano.</p>
                        <div className="mt-4 space-y-3">
                          {selectedSummary.map((item) => (
                            <div key={item.name} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-800">{item.name}</span>
                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                                  {item.count} Habilidade{item.count > 1 ? "s" : ""}
                                </span>
                              </div>
                              <button className="text-xs font-semibold text-red-600 hover:text-red-800">
                                Remover
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/*/card*/}
                </div>
              </div>
            </div>
          </div>
        </main>
        {/* Footer Fixo */}
        <footer className="fixed bottom-0 left-0 right-0 z-10 border-t border-gray-200 bg-white/90 py-4 backdrop-blur-sm">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  <span className="font-bold text-gray-900">3</span> Gêneros e{" "}
                  <span className="font-bold text-gray-900">4</span> Habilidades selecionadas.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button className="text-sm font-semibold text-gray-900 hover:text-gray-700">
                  Voltar para o passo anterior
                </button>
                <button className="flex min-w-[120px] items-center justify-center rounded-md bg-[#1380ec] px-6 py-3 text-base font-bold text-black shadow-sm transition-colors hover:bg-[#0a6ac9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1380ec]">
                  Próximo
                </button>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ContentSelection;
Como usar:

Adicione o conteúdo acima em um arquivo, ex: ContentSelection.tsx.

No seu HTML global (public/index.html), adicione na <head>:

xml
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet"/>
Importe no seu app:

tsx
import ContentSelection from './ContentSelection';

function App() {
  return <ContentSelection />;
}
Tailwind deve estar habilitado no projeto.

Pronto! O layout fica igual ao seu print, responsivo e escalável para o futuro.