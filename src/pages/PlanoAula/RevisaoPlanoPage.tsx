import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchDisciplinaId } from '../../services/apiPlanoAula'; // Importando do serviço

// Assumindo que você terá uma forma de obter o client Supabase ou usar uma função wrapper para chamadas SQL
// Para este exemplo, vamos simular a importação de uma função que executa SQL via MCP
// import { executeSupabaseSql } from '../services/supabaseService'; // Exemplo de importação

// Tipo para a habilidade recebida como prop (apenas o código)
interface HabilidadeSelecionadaProp {
  codigo: string;
}

// Tipo para a habilidade com práticas de linguagem (estado interno)
interface HabilidadeDetalhada {
  codigo: string;
  praticasLinguagem: string[];
}

// Interface para os dados esperados do estado da rota
interface LocationState extends Omit<RevisaoPlanoPageProps, 'onVoltar' | 'onGerarPlano'> {}

interface RevisaoPlanoPageProps {
  modalidade: string;
  trimestre: string;
  disciplina: string; // Nome da disciplina, ex: 'Língua Portuguesa'
  disciplinaId?: number; // Opcional, idealmente seria passado ou buscado
  anoEnsino: string;
  turma: string;
  habilidadesSelecionadasCodigos: HabilidadeSelecionadaProp[];
  supabaseProjectId: string;
  onVoltar: () => void;      // Função de voltar (pode vir do componente pai ou ser navegação interna)
  onGerarPlano: () => void;  // Função de gerar plano (pode vir do componente pai ou ser navegação interna)
}

// DADOS DE EXEMPLO PARA FALLBACK (se location.state não estiver presente)
const FALLBACK_DATA = {
  modalidade: 'Ensino Fundamental (Exemplo)',
  trimestre: '1º Trimestre (Exemplo)',
  disciplina: 'Língua Portuguesa (Exemplo)',
  // disciplinaId: 1, // Se for fixo para exemplo
  anoEnsino: '1º Ano (Exemplo)',
  turma: 'Turma Exemplo',
  habilidadesSelecionadasCodigos: [{ codigo: 'EF01LP05' }, { codigo: 'EF01LP03' }],
  supabaseProjectId: 'kdjpvjvptqikgqjtjmcp', // SEU PROJECT ID
};

// Função para buscar o ID da disciplina pelo nome (SIMULADO)
// Em um cenário real, isso faria uma chamada ao Supabase na tabela 'disciplinas'
const fetchDisciplinaIdFromSupabase_Simulated = async (nomeDisciplina: string, projectId: string): Promise<number | null> => {
  console.log(`[SIMULADO] Buscando ID para disciplina: ${nomeDisciplina} no projeto ${projectId}`);
  // Query SQL real que seria executada:
  // `SELECT id FROM public.disciplinas WHERE nome ILIKE '${nomeDisciplina}' LIMIT 1;`
  if (nomeDisciplina?.toLowerCase().includes('língua portuguesa')) return 1;
  if (nomeDisciplina?.toLowerCase().includes('matemática')) return 2;
  // Adicione outros mapeamentos conforme necessário para simulação
  return null;
};

// FUNÇÃO REAL PARA BUSCAR PRÁTICAS DE LINGUAGEM NO SUPABASE
const fetchPraticasLinguagemFromSupabase = async (
  codigoHabilidade: string,
  anoEnsino: string,
  trimestre: string,
  disciplinaId: number,
  projectId: string
): Promise<string[]> => {
  // const sql = `SELECT praticas_linguagem FROM public.matriz_curricular WHERE habilidades LIKE '(${codigoHabilidade})%' AND ano = '${anoEnsino}' AND trimestre = '${trimestre}' AND disciplina_id = ${disciplinaId} LIMIT 1;`;
  // console.log("Executando SQL:", sql); // Para depuração

  // A chamada abaixo é uma REPRESENTAÇÃO de como você chamaria a ferramenta mcp_supabase_execute_sql
  // Você precisará adaptar isso para a forma como o mcp_supabase_execute_sql é chamado no seu ambiente Gemini.
  // Por exemplo, não posso chamar 'default_api.mcp_supabase_execute_sql' diretamente aqui.
  // Esta função seria chamada pelo Gemini Agent, não pelo código do frontend diretamente.
  // Para o propósito deste arquivo de frontend, esta função ainda é conceitual.
  // A lógica real de chamada da API Supabase deve estar no backend ou em um service gerenciado pelo Agent.

  // Simulação do que o Agent faria (para manter o código do componente testável no browser sem o Agent):
  console.log(`[SIMULAÇÃO MCP] Buscando práticas para: ${codigoHabilidade}, Ano: ${anoEnsino}, Trimestre: ${trimestre}, DiscId: ${disciplinaId}, Projeto: ${projectId}`);
  if (projectId !== 'kdjpvjvptqikgqjtjmcp') return ['Erro: Project ID incorreto na simulação'];

  // Exemplo de dados que seriam retornados pelo mcp_supabase_execute_sql
  let dbResult: { praticas_linguagem: string } | null = null;
  if (disciplinaId === 1) { // 'Língua Portuguesa'
    if (codigoHabilidade === 'EF01LP05' && anoEnsino.includes('1º Ano') && trimestre.includes('1º Trimestre')) {
      dbResult = { praticas_linguagem: 'Leitura/escuta (compartilhada e autônoma), Análise linguística/semiótica' };
    } else if (codigoHabilidade === 'EF01LP03' && anoEnsino.includes('1º Ano') && trimestre.includes('1º Trimestre')) {
      dbResult = { praticas_linguagem: 'Escrita (compartilhada e autônoma)' };
    } else if (codigoHabilidade === 'EF01LP09' && anoEnsino.includes('1º Ano') && trimestre.includes('1º Trimestre')) {
      dbResult = { praticas_linguagem: 'Oralidade, Leitura/escuta' };
    }
  }

  if (dbResult && dbResult.praticas_linguagem) {
    return dbResult.praticas_linguagem.split(',').map(p => p.trim()).filter(p => p.length > 0);
  }
  return []; // Retorna array vazio se não encontrar ou se a coluna for nula/vazia
};

const InfoItem: React.FC<{ label: string, value: string, colorClass: string }> = ({ label, value, colorClass }) => (
  <div className="mb-2 md:mb-0">
    <span className="font-semibold text-sm text-gray-600">{label}: </span>
    <span className={`font-semibold ${colorClass}`}>{value}</span>
  </div>
);

const RevisaoPlanoPage: React.FC = () => { // Removido Partial<RevisaoPlanoPageProps>
  const location = useLocation();
  const routeState = location.state as LocationState | null;

  // Prioriza dados do estado da rota, senão usa fallback
  const modalidade = routeState?.modalidade || FALLBACK_DATA.modalidade;
  const trimestre = routeState?.trimestre || FALLBACK_DATA.trimestre;
  const disciplina = routeState?.disciplina || FALLBACK_DATA.disciplina;
  const disciplinaIdFromState = routeState?.disciplinaId;
  const anoEnsino = routeState?.anoEnsino || FALLBACK_DATA.anoEnsino;
  const turma = routeState?.turma || FALLBACK_DATA.turma;
  const habilidadesSelecionadasCodigos = routeState?.habilidadesSelecionadasCodigos || FALLBACK_DATA.habilidadesSelecionadasCodigos;
  const supabaseProjectId = routeState?.supabaseProjectId || FALLBACK_DATA.supabaseProjectId;

  // Funções de navegação (onVoltar, onGerarPlano) podem ser implementadas com useNavigate ou vir de um contexto/prop superior
  // Por enquanto, usaremos logs como antes
  const onVoltar = () => console.log('Voltar clicado');
  const onGerarPlano = () => console.log('Gerar Plano clicado');

  const [currentDisciplinaId, setCurrentDisciplinaId] = useState<number | null>(disciplinaIdFromState || null);
  const [habilidadesDetalhadas, setHabilidadesDetalhadas] = useState<HabilidadeDetalhada[]>([]);
  const [carregando, setCarregando] = useState<boolean>(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const carregarDadosIniciais = async () => {
      setCarregando(true);
      setErro(null);
      let discId = disciplinaIdFromState;

      if (discId === undefined && disciplina) {
        // Usando a função importada do serviço
        const id = await fetchDisciplinaId(disciplina);
        if (id) {
          setCurrentDisciplinaId(id);
          discId = id;
        } else {
          setErro(`ID da disciplina '${disciplina}' não encontrado (simulado).`);
          setCarregando(false);
          setHabilidadesDetalhadas([]);
          return;
        }
      } else if (discId !== undefined) {
        setCurrentDisciplinaId(discId);
      }

      if (discId === undefined || discId === null || !habilidadesSelecionadasCodigos || habilidadesSelecionadasCodigos.length === 0) {
        setHabilidadesDetalhadas([]);
        setCarregando(false);
        if (discId === undefined || discId === null) setErro("ID da disciplina não definido ou não encontrado (simulado).");
        return;
      }

      const detalhadasPromises = habilidadesSelecionadasCodigos.map(async (habilidadeProp) => {
        // Usando a função local simulada
        const praticas = await fetchPraticasLinguagemFromSupabase(
          habilidadeProp.codigo,
          anoEnsino,
          trimestre,
          discId as number,
          supabaseProjectId
        );
        return { codigo: habilidadeProp.codigo, praticasLinguagem: praticas };
      });

      try {
        const detalhadas = await Promise.all(detalhadasPromises);
        setHabilidadesDetalhadas(detalhadas);
      } catch (e) {
        console.error("Erro ao buscar práticas de linguagem (simulado):", e);
        setErro("Falha ao carregar dados das habilidades (simulado).");
        setHabilidadesDetalhadas([]);
      } finally {
        setCarregando(false);
      }
    };

    if (supabaseProjectId) {
        carregarDadosIniciais();
    }
  }, [
    habilidadesSelecionadasCodigos,
    anoEnsino,
    trimestre,
    disciplina,
    disciplinaIdFromState,
    supabaseProjectId
  ]);

  if (!supabaseProjectId) {
    return <div className="p-4 text-red-500">Erro: supabaseProjectId não fornecido.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl bg-white shadow-xl rounded-lg p-6 md:p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-indigo-700">Revisão do Plano de Aula</h1>
          <p className="text-gray-600 mt-1">Confirme os detalhes antes de gerar o plano.</p>
        </div>

        <div className="mb-8 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Contexto do Plano</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
            <InfoItem label="Modalidade" value={modalidade} colorClass="text-blue-600" />
            <InfoItem label="Disciplina" value={`${disciplina} (ID: ${currentDisciplinaId || 'N/A'})`} colorClass="text-green-600" />
            <InfoItem label="Ano de Ensino" value={anoEnsino} colorClass="text-purple-600" />
            <InfoItem label="Turma" value={turma} colorClass="text-orange-600" />
            <InfoItem label="Trimestre" value={trimestre} colorClass="text-teal-600" />
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Habilidades Selecionadas</h2>
          {carregando && <p className="text-gray-500">Carregando práticas de linguagem...</p>}
          {erro && <p className="text-red-500">Erro: {erro}</p>}
          {!carregando && !erro && habilidadesDetalhadas.length > 0 && (
            <div className="space-y-4">
              {habilidadesDetalhadas.map((habilidade, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow">
                  <p className="font-bold text-indigo-600 text-lg">{habilidade.codigo}</p>
                  {habilidade.praticasLinguagem.length > 0 ? (
                    <div className="mt-2">
                      <p className="text-sm font-semibold text-gray-600 mb-1">Práticas de Linguagem:</p>
                      <ul className="list-disc list-inside pl-4 space-y-1">
                        {habilidade.praticasLinguagem.map((pratica, i) => (
                          <li key={i} className="text-sm text-gray-700">{pratica}</li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mt-1">Nenhuma prática de linguagem associada (simulado).</p>
                  )}
                </div>
              ))}
            </div>
          )}
          {!carregando && !erro && habilidadesDetalhadas.length === 0 && (
            <p className="text-gray-500">Nenhuma habilidade selecionada ou práticas não encontradas (simulado).</p>
          )}
        </div>

        <div className="mt-10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <button
            onClick={onVoltar}
            className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors border border-indigo-200 shadow-sm"
          >
            &larr; Voltar e Editar
          </button>
          <button
            onClick={onGerarPlano}
            className="w-full sm:w-auto px-8 py-3 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors shadow-md"
          >
            Gerar Plano de Aula &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};

export default RevisaoPlanoPage; 