import React, { useState, useEffect, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCamposCurricularesTrimestre } from '../../services/apiPlanoAula';
import { applyAutoCapitalize } from '../../utils/textUtils';
import { ProfessorPreferenciasService } from '../../services/ProfessorPreferenciasService';

// Tipos
export interface Habilidade {
  id: string;
  codigo: string;
  descricao: string;
}

// Nova interface para os dados da turma que vêm da tela anterior
interface TurmaInfoParaModal {
  id: number;
  nome: string;
  ano: string;
  modalidade_nome: string;
}

interface SeletorHabilidadesProps {
  habilidades: Habilidade[];
  habilidadesSelecionadas: Habilidade[];
  onConfirmOriginal: (habilidadesSelecionadas: Habilidade[]) => void;
  disciplinaNome: string;
  anoEnsino: string; // Ano geral da série/contexto, pode ser diferente do ano específico da turma
  disciplinaId?: number;
  trimestre?: string;
  modalidade: string; // Nome da modalidade geral de ensino (ex: Fundamental 1)
  professorId: number | null;
  modalidadeId: number | null; // ID da modalidade geral de ensino
  turmaSelecionadaAnteriormente?: TurmaInfoParaModal; // Turma específica já selecionada
}

const SeletorHabilidades: React.FC<SeletorHabilidadesProps> = ({
  habilidades,
  habilidadesSelecionadas,
  disciplinaNome,
  anoEnsino,
  disciplinaId,
  trimestre,
  modalidade,
  professorId,
  modalidadeId,
  turmaSelecionadaAnteriormente,
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [filteredHabilidades, setFilteredHabilidades] = useState<Habilidade[]>(habilidades);
  const [generosTextuais, setGenerosTextuais] = useState<string[]>([]);
  const [objetosConhecimento, setObjetosConhecimento] = useState<string[]>([]);
  const [carregandoCamposCurriculares, setCarregandoCamposCurriculares] = useState(false);
  const [mostrarConteudos, setMostrarConteudos] = useState(true); // Valor inicial, será carregado das preferências

  // Carregar preferência do banco de dados
  useEffect(() => {
    const carregarPreferencia = async () => {
      if (professorId) {
        try {
          const preferencias = await ProfessorPreferenciasService.getPreferencias(professorId);
          setMostrarConteudos(preferencias.plano_aula_conteudos_curriculares_visible);
        } catch (error) {
          console.error('Erro ao carregar preferência de conteúdos curriculares:', error);
          // Manter valor padrão em caso de erro
        }
      }
    };
    carregarPreferencia();
  }, [professorId]);

  useEffect(() => {
    const initialSelected: Record<string, boolean> = {};
    habilidadesSelecionadas.forEach(hab => {
      initialSelected[hab.id] = true;
    });
    setSelected(initialSelected);
  }, [habilidadesSelecionadas]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredHabilidades(habilidades);
      return;
    }
    const normalizedSearchTerm = searchTerm.toLowerCase().trim();
    const filtered = habilidades.filter(
      (hab) =>
        hab.codigo.toLowerCase().includes(normalizedSearchTerm) ||
        hab.descricao.toLowerCase().includes(normalizedSearchTerm)
    );
    setFilteredHabilidades(filtered);
  }, [searchTerm, habilidades]);

  // Efeito para carregar os gêneros textuais e objetos de conhecimento do trimestre
  useEffect(() => {
    if (disciplinaId && trimestre && anoEnsino) {
      const buscarCamposCurriculares = async () => {
        setCarregandoCamposCurriculares(true);
        try {
          const { generosTextuais, objetosConhecimento } = await fetchCamposCurricularesTrimestre(
            disciplinaId,
            anoEnsino,
            trimestre
          );
          setGenerosTextuais(generosTextuais);
          setObjetosConhecimento(objetosConhecimento);
        } catch (error) {
          console.error('Erro ao buscar campos curriculares:', error);
        } finally {
          setCarregandoCamposCurriculares(false);
        }
      };
      
      buscarCamposCurriculares();
    }
  }, [disciplinaId, trimestre, anoEnsino]);

  const handleCheckboxChange = (habilidade: Habilidade) => {
    setSelected((prev) => ({
      ...prev,
      [habilidade.id]: !prev[habilidade.id]
    }));
  };

  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Aplicar capitalização automática usando a função utilitária
    const capitalizedValue = applyAutoCapitalize(value, false, {
      placeholder: e.target.placeholder,
      name: e.target.name,
      id: e.target.id
    });
    setSearchTerm(capitalizedValue);
  };

  const handleAbrirRevisao = () => {
    const HabilidadesConfirmadas = habilidades.filter((h) => selected[h.id]);
    
    if (HabilidadesConfirmadas.length === 0) {
      console.warn("Nenhuma habilidade selecionada para confirmar.");
      return;
    }

    if (typeof disciplinaId === 'undefined' || !trimestre) {
      console.error("Erro: disciplinaId ou trimestre não estão definidos no SeletorHabilidades. A revisão não pode ser aberta.");
      return;
    }

    if (!turmaSelecionadaAnteriormente?.id) {
      console.error("Erro: turma não selecionada. A revisão não pode ser aberta.");
      return;
    }

    // Navegar para a página de revisão com os dados
    const dadosRevisao = {
      disciplinaNome,
      anoEnsino, // Este é o ano geral do contexto (ex: 1º Ano do Fundamental)
      disciplinaId: disciplinaId!,
      trimestre: trimestre!,
      modalidade: modalidade, // Nome da modalidade geral (ex: Fundamental 1)
      habilidadesSelecionadas: HabilidadesConfirmadas.map(h => ({ codigo: h.codigo, descricao: h.descricao })),
      professorId: professorId,
      modalidadeId: modalidadeId, // ID da modalidade geral
      // Passando dados da turma específica selecionada na tela anterior
      turmaId: turmaSelecionadaAnteriormente.id,
      turmaNome: turmaSelecionadaAnteriormente.nome,
      turmaAno: turmaSelecionadaAnteriormente.ano, // Ano específico da turma
      turmaModalidadeNome: turmaSelecionadaAnteriormente.modalidade_nome, // Modalidade específica da turma
    };

    navigate('/planos-aula/revisao', { state: dadosRevisao });
  };

  const toggleMostrarConteudos = async () => {
    const newVisibility = !mostrarConteudos;
    setMostrarConteudos(newVisibility);
    
    // Salvar preferência no banco de dados
    if (professorId) {
      try {
        await ProfessorPreferenciasService.atualizarPreferencia(
          professorId, 
          'plano_aula_conteudos_curriculares_visible', 
          newVisibility
        );
      } catch (error) {
        console.error('Erro ao salvar preferência de conteúdos curriculares:', error);
      }
    }
  };

  const selectedCount = Object.values(selected).filter(Boolean).length;

  // Verificar se tem conteúdo curricular para exibir
  const temConteudoCurricular = generosTextuais.length > 0 || objetosConhecimento.length > 0;
  const buscaConcluida = !carregandoCamposCurriculares && (disciplinaId && trimestre && anoEnsino);

  // Adicionando verificação para o botão de confirmar/revisar
  const podeAbrirModalRevisao = 
    habilidades.filter((h) => selected[h.id]).length > 0 &&
    typeof disciplinaId !== 'undefined' && 
    trimestre &&
    turmaSelecionadaAnteriormente && 
    typeof turmaSelecionadaAnteriormente.id === 'number';

  return (
    <>
      <div className="bg-white w-full rounded-xl overflow-hidden shadow-xl flex flex-col border border-gray-200">
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-700 text-white p-5 flex justify-between items-center">
          <h1 className="text-xl font-semibold">Selecione as habilidades</h1>
          <div className="text-indigo-100 text-sm">
            {selectedCount > 0 && `${selectedCount} selecionada${selectedCount > 1 ? 's' : ''}`}
          </div>
        </div>

        {/* Seção de Campos Curriculares do Trimestre */}
        {buscaConcluida && (
          <div className="bg-indigo-50 border-b border-indigo-100">
            <button 
              className="w-full flex justify-between items-center px-5 py-4 border-b border-indigo-100 hover:bg-indigo-100/50 transition-colors focus:outline-none focus:bg-indigo-100/50" 
              onClick={toggleMostrarConteudos}
            >
              <h3 className="font-semibold text-indigo-700 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                </svg>
                Conteúdos Curriculares do {trimestre}
              </h3>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-200 text-indigo-600 ${mostrarConteudos ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {mostrarConteudos && (
              <div className="p-5">
                {temConteudoCurricular ? (
                  <>
                    {generosTextuais.length > 0 && (
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-indigo-800 mb-3">Gêneros Textuais:</h4>
                        <div className="flex flex-wrap gap-2">
                          {generosTextuais.map((genero, index) => (
                            <span 
                              key={index} 
                              className="px-3 py-2 bg-white text-indigo-600 text-sm font-medium rounded-full border border-indigo-200 shadow-sm hover:shadow-md transition-shadow"
                            >
                              {genero}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {objetosConhecimento.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-indigo-800 mb-3">Objetos de Conhecimento:</h4>
                        <div className="flex flex-wrap gap-2">
                          {objetosConhecimento.map((objeto, index) => (
                            <span 
                              key={index} 
                              className="px-3 py-2 bg-white text-emerald-600 text-sm font-medium rounded-full border border-emerald-200 shadow-sm hover:shadow-md transition-shadow"
                            >
                              {objeto}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-6 text-indigo-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <p className="text-sm">Nenhum conteúdo curricular específico encontrado para este trimestre.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Campo de Busca */}
        <div className="p-5 border-b border-gray-200 bg-gray-50">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200 group-hover:text-indigo-600">
              <svg className="h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors duration-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              className="pl-12 pr-12 py-4 w-full border-2 border-indigo-200 rounded-xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white transition-all duration-300 placeholder-gray-500 text-gray-900 font-medium shadow-lg hover:shadow-xl hover:border-indigo-300 hover:scale-[1.02] transform"
              placeholder="Buscar por código ou descrição da habilidade..."
              value={searchTerm}
              onChange={handleSearch}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-red-500 transition-all duration-200 hover:scale-110 transform"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Seção de Habilidades */}
        <div className="p-5 bg-gray-50 border-b border-gray-200">
          <h2 className="font-semibold text-gray-700 text-base flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Selecione uma ou mais habilidades:
          </h2>
        </div>

        {/* Grid de Habilidades */}
        <div className="p-2 overflow-y-auto flex-grow max-h-[400px] bg-white">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-2">
            {filteredHabilidades.length > 0 ? (
              filteredHabilidades.map((habilidade) => (
                <div
                  key={habilidade.id}
                  onClick={() => handleCheckboxChange(habilidade)}
                  className={`group relative border rounded-md cursor-pointer transition-all duration-200 hover:shadow-md select-none min-h-[90px] flex flex-col
                    ${
                      selected[habilidade.id]
                        ? 'border-indigo-500 bg-indigo-600 shadow-md ring-2 ring-indigo-300'
                        : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300'
                    }`}
                >
                  {/* Checkbox */}
                  <div className="absolute top-2 left-2 z-10">
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors
                      ${selected[habilidade.id] 
                        ? 'bg-indigo-600 border-indigo-600' 
                        : 'bg-white border-gray-300 group-hover:border-indigo-400'
                      }`}
                    >
                      {selected[habilidade.id] && (
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Conteúdo */}
                  <div className="p-2 pt-7 flex flex-col h-full">
                    <div className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full mb-1.5 self-start ${
                      selected[habilidade.id] 
                        ? 'bg-white text-indigo-600' 
                        : 'bg-indigo-600 text-white'
                    }`}>
                      {habilidade.codigo}
                    </div>
                    <p className={`text-[10px] leading-tight flex-grow line-clamp-4 ${
                      selected[habilidade.id] ? 'text-white' : 'text-gray-700'
                    }`}>
                      {habilidade.descricao}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.837 0-5.376-1.474-6.845-3.708.673-.404 1.358-.812 2.063-1.228C8.936 9.086 10.442 9 12 9s3.064.086 4.782 1.064c.705.416 1.39.824 2.063 1.228C17.376 13.526 14.837 15 12 15zM15 9a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h3 className="text-lg font-medium mb-2">Nenhuma habilidade encontrada</h3>
                <p className="text-sm text-center max-w-md">
                  {searchTerm ? `Não encontramos habilidades que correspondam à busca "${searchTerm}".` : 'Nenhuma habilidade disponível para os critérios selecionados.'}
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="mt-3 px-4 py-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Limpar busca
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Rodapé com contador e botão */}
        <div className="bg-white border-t border-gray-200 p-5 flex justify-between items-center sticky bottom-0 z-10 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${selectedCount > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <span className="text-sm font-medium text-gray-700">
              {selectedCount === 0 && 'Nenhuma habilidade selecionada'}
              {selectedCount === 1 && '1 habilidade selecionada'}
              {selectedCount > 1 && `${selectedCount} habilidades selecionadas`}
            </span>
          </div>
          <button
            onClick={handleAbrirRevisao}
            disabled={!podeAbrirModalRevisao}
            className={`px-6 py-3 font-semibold rounded-lg transition-all duration-200 ${
              podeAbrirModalRevisao
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Confirmar e Revisar Seleção
          </button>
        </div>
      </div>
    </>
  );
};

export default SeletorHabilidades; 