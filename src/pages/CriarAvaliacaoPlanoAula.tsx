import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { 
  BookOpen, 
  Users, 
  Calendar, 
  Clock, 
  Target, 
  CheckCircle,
  AlertCircle,
  Settings,
  FileText,
  Award,
  Sparkles,
  Eye,
  X} from 'lucide-react';
import Layout from '../components/layout/Layout';
import { generateAvaliacaoWithOpenAI } from '../services/openaiService';

interface PlanoAulaDetalhado {
  id: string;
  titulo: string;
  descricao: string;
  professor_id: number;
  turma_id: number;
  disciplina_id: number;
  escola_id: number;
  trimestre: string;
  habilidades: string[];
  disciplinaNome: string;
  turmaAno: string;
  turmaNome: string;
  modalidadeNome: string;
  professorNome: string;
  escolaNome: string;
  faixaEtaria: string;
}

interface ConfiguracaoFaixaEtaria {
  faixa_etaria: string;
  nome_exibicao: string;
  tempo_recomendado_minutos: number;
  tipos_questoes_permitidas: string[];
  recursos_obrigatorios: string[];
  recursos_recomendados: string[];
  configuracoes_automaticas: any;
  distribuicao_questoes_padrao: any;
  distribuicao_dificuldade_padrao: any;
  adaptacoes_especificas_idade: any;
  criterios_padrao: any;
}

interface ConteudoExtract {
  tipo: 'mes' | 'semana' | 'habilidade';
  id: string;
  titulo: string;
  descricao: string;
  periodo?: string;
  selecionado: boolean;
  mesAssociado?: string | null;
}

interface ConfiguracoesAvaliacao {
  // Seleção de conteúdo
  conteudoSelecionado: string[];
  
  // Configurações básicas
  tipo: string;
  titulo: string;
  descricao: string;
  dataAplicacao: string;
  tempoEstimado: number;
  notaMaxima: number;
  peso: number;
  
  // Novo: Formato da avaliação
  formatoAvaliacao: 'impressa' | 'digital';
  
  // Configurações automáticas (baseadas na faixa etária)
  formatoEntrega: string;
  tiposQuestoes: Record<string, number>;
  distribuicaoDificuldade: Record<string, number>;
  
  // Personalizações do professor
  quantidadeQuestoes: number;
  incluirImagens: boolean;
  incluirAudio: boolean;
  adaptacoesInclusivas: Record<string, boolean>;
  
  // Critérios específicos
  focoAvaliacao: string;
  observacoesEspeciais: string;
  
  // Novo: Instruções personalizadas para o aluno
  instrucoesPersonalizadas?: string;
  
  // Novo: Recursos opcionais selecionados pelo professor
  recursosOpcionais?: string[];
}

const CriarAvaliacaoPlanoAula: React.FC = () => {
  const { id: planoId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { professorData } = useAuth();

  const [searchParams, setSearchParams] = useSearchParams();

  const [planoAula, setPlanoAula] = useState<PlanoAulaDetalhado | null>(null);
  const [configuracaoFaixa, setConfiguracaoFaixa] = useState<ConfiguracaoFaixaEtaria | null>(null);
  const [conteudosExtracted, setConteudosExtracted] = useState<ConteudoExtract[]>([]);
  const [configuracoes, setConfiguracoes] = useState<ConfiguracoesAvaliacao>({
    conteudoSelecionado: [],
    tipo: '', // Forçar seleção
    titulo: '',
    descricao: '',
    dataAplicacao: '',
    tempoEstimado: 30,
    notaMaxima: 10, // Valor padrão válido
    peso: 1,
    formatoAvaliacao: 'impressa',
    formatoEntrega: 'misto',
    tiposQuestoes: {},
    distribuicaoDificuldade: {},
    quantidadeQuestoes: 5, // Valor padrão válido
    incluirImagens: false, // CORREÇÃO: Padrão false - só incluir se professor selecionar
    incluirAudio: false,
    adaptacoesInclusivas: {},
    focoAvaliacao: '', // Forçar seleção
    observacoesEspeciais: '',
    instrucoesPersonalizadas: undefined // Padrão undefined = usar instruções padrão
  });

  const [loading, setLoading] = useState(true);

  const [generating, setGenerating] = useState(false);
  const [etapaAtual, setEtapaAtual] = useState(() => {
    const etapaUrl = searchParams.get('etapa');
    return etapaUrl ? parseInt(etapaUrl) : 1;
  });
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
  const [mesDetalhes, setMesDetalhes] = useState<string | null>(null);
  const [secoesProcessadas, setSecoesProcessadas] = useState<{
    titulo: string;
    habilidades: string[];
    objetivos: string[];
    desenvolvimento: string[];
    atividades: string[];
    observacoes: string[];
  } | null>(null);

  const etapasContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const etapaUrl = searchParams.get('etapa');
    const etapaNumero = etapaUrl ? parseInt(etapaUrl) : 1;
    if (etapaNumero !== etapaAtual && etapaNumero >= 1 && etapaNumero <= 4) {
      setEtapaAtual(etapaNumero);
    }
  }, [searchParams]);

  useEffect(() => {
    const resetScroll = () => {
      // Primeiro, tentar usar a ref do container das etapas
      if (etapasContainerRef.current) {
        etapasContainerRef.current.scrollIntoView({ 
          behavior: 'instant', 
          block: 'start',
          inline: 'nearest'
        });
      }
      
      // Resetar scroll da janela principal
      window.scrollTo({ top: 0, behavior: 'instant' });
      
      // Resetar scroll do documento
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      
      // Resetar scroll de containers específicos que podem existir
      const containers = document.querySelectorAll('[data-scroll-container], .overflow-y-auto, .overflow-auto');
      containers.forEach(container => {
        if (container.scrollTop > 0) {
          container.scrollTop = 0;
        }
      });
    };

    // Usar requestAnimationFrame para garantir que aconteça após a renderização
    requestAnimationFrame(() => {
      resetScroll();
      // Dupla verificação após um pequeno delay
      setTimeout(resetScroll, 50);
    });
  }, [etapaAtual]);

  // Função para criar plano de teste quando não existir
  const criarPlanoTeste = async (): Promise<boolean> => {
    try {
      console.log('[DEBUG] Criando plano de teste...');
      
      const planoTeste = {
        id: parseInt(planoId),
        titulo: 'Plano de Aula - Teste de Avaliação',
        descricao: `
# PLANO DE AULA - TESTE

## MÊS 1: Introdução aos Conceitos Fundamentais

### Semana 1: Apresentação e Diagnóstico
- Apresentação do tema principal
- Avaliação diagnóstica dos conhecimentos prévios
- Estabelecimento de objetivos de aprendizagem

### Semana 2: Desenvolvimento dos Conceitos Básicos
- Introdução aos conceitos fundamentais
- Atividades práticas de fixação
- Exercícios individuais e em grupo

### Semana 3: Aprofundamento e Prática
- Exercícios práticos aplicados
- Resolução de problemas contextualizados
- Atividades lúdicas e interativas

### Semana 4: Consolidação e Avaliação
- Revisão dos conteúdos trabalhados
- Avaliação formativa do primeiro mês
- Feedback e orientações para continuidade

## MÊS 2: Desenvolvimento e Aplicação

### Semana 5: Revisão e Ampliação
- Revisão dos conceitos do mês anterior
- Introdução de novos tópicos relacionados
- Conexões interdisciplinares

### Semana 6: Novos Tópicos e Metodologias
- Apresentação de novos conteúdos
- Metodologias ativas de aprendizagem
- Trabalho colaborativo

### Semana 7: Atividades Práticas Avançadas
- Atividades em grupo e individuais
- Projetos práticos aplicados
- Desenvolvimento de competências específicas

### Semana 8: Projeto Integrador
- Desenvolvimento de projeto prático
- Aplicação dos conhecimentos adquiridos
- Apresentação dos resultados

## MÊS 3: Consolidação e Síntese

### Semana 9: Revisão Geral
- Revisão sistemática de todos os conteúdos
- Identificação de dúvidas e dificuldades
- Atividades de reforço personalizadas

### Semana 10: Preparação para Avaliação
- Simulados e exercícios preparatórios
- Técnicas de estudo e organização
- Orientações para a avaliação final

### Semana 11: Avaliação Somativa
- Aplicação da avaliação final
- Análise dos resultados obtidos
- Feedback individualizado

### Semana 12: Síntese e Encerramento
- Síntese dos aprendizados do trimestre
- Autoavaliação dos estudantes
- Planejamento para próximas etapas
        `,
        data: new Date().toISOString().split('T')[0],
        disciplina_id: 1,
        turma_id: 1,
        professor_id: 1,
        escola_id: 1,
        trimestre: '1º Trimestre',
        habilidades: [
          'EF01LP01 - Reconhecer que textos são lidos e escritos da esquerda para a direita e de cima para baixo da página',
          'EF01LP02 - Escrever, espontaneamente ou por ditado, palavras e frases de forma alfabética',
          'EF01LP03 - Observar escritas convencionais, comparando-as às suas produções escritas',
          'EF01LP05 - Reconhecer o sistema de escrita alfabética como representação dos sons da fala',
          'EF01LP08 - Relacionar elementos sonoros (sílabas, fonemas, partes de palavras) com sua representação escrita'
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Inserir o plano no banco
      const { data: novoPlano, error: errorInsert } = await supabase
        .from('planos_aula')
        .insert([planoTeste])
        .select()
        .single();
        
      if (errorInsert) {
        console.error('[DEBUG] Erro ao criar plano de teste:', errorInsert);
        throw errorInsert;
      }
      
      console.log('[DEBUG] Plano de teste criado com sucesso:', novoPlano);
       return true;
       
     } catch (error) {
       console.error('[DEBUG] Erro ao criar plano de teste:', error);
       toast.error('Erro ao criar plano de teste');
       return false;
     }
   };

  // Função para navegar entre etapas e atualizar URL
  const navegarParaEtapa = (novaEtapa: number) => {
    setEtapaAtual(novaEtapa);
    // Atualizar URL preservando outros parâmetros
    const novoSearchParams = new URLSearchParams(searchParams);
    novoSearchParams.set('etapa', novaEtapa.toString());
    setSearchParams(novoSearchParams);
    
    // Função robusta para resetar scroll
    const resetScroll = () => {
      // Primeiro, tentar usar a ref do container das etapas
      if (etapasContainerRef.current) {
        etapasContainerRef.current.scrollIntoView({ 
          behavior: 'instant', 
          block: 'start',
          inline: 'nearest'
        });
      }
      
      // Resetar scroll da janela principal
      window.scrollTo({ top: 0, behavior: 'instant' });
      
      // Resetar scroll do documento
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      
      // Resetar scroll de containers específicos que podem existir
      const containers = document.querySelectorAll('[data-scroll-container], .overflow-y-auto, .overflow-auto');
      containers.forEach(container => {
        if (container.scrollTop > 0) {
          container.scrollTop = 0;
        }
      });
    };

    // Aplicar reset imediatamente e depois confirmar
    resetScroll();
    requestAnimationFrame(() => {
      resetScroll();
      setTimeout(resetScroll, 50);
    });
  };

  // Carregar dados do plano de aula
  useEffect(() => {
    if (!planoId) return;
    carregarDadosPlano();
  }, [planoId]);

  const carregarDadosPlano = async () => {
    try {
      setLoading(true);
      
      console.log('[DEBUG] ===== CARREGANDO PLANO DE AULA =====');
      console.log('[DEBUG] Plano ID:', planoId);
      
      // Primeiro, verificar se o plano existe
      const { data: planoExiste, error: errorExiste } = await supabase
        .from('planos_aula')
        .select('id, titulo')
        .eq('id', planoId)
        .single();
        
      console.log('[DEBUG] Verificação de existência:', { planoExiste, errorExiste });
      
      if (errorExiste || !planoExiste) {
         console.log('[DEBUG] Plano não encontrado, criando plano de teste...');
         const sucesso = await criarPlanoTeste();
         if (!sucesso) {
           console.log('[DEBUG] Falha ao criar plano de teste');
           setLoading(false);
           return;
         }
         console.log('[DEBUG] Plano de teste criado com sucesso, continuando carregamento...');
       }
      
      // Buscar plano de aula com dados relacionados
      const { data: plano, error: errorPlano } = await supabase
        .from('planos_aula')
        .select(`
          *,
          disciplinas(nome),
          turmas(nome, ano, modalidade_id, modalidades(nome)),
          professores(nome),
          escolas(nome)
        `)
        .eq('id', planoId)
        .single();
        
      console.log('[DEBUG] Dados do plano carregados:', { plano, errorPlano });

      if (errorPlano) throw errorPlano;

      // Determinar faixa etária
      const ano = plano.turmas?.ano || '';
      const faixaEtaria = determinarFaixaEtaria(ano);

      const planoDetalhado: PlanoAulaDetalhado = {
        ...plano,
        disciplinaNome: plano.disciplinas?.nome || '',
        turmaAno: plano.turmas?.ano || '',
        turmaNome: plano.turmas?.nome || '',
        modalidadeNome: plano.turmas?.modalidades?.nome || '',
        professorNome: plano.professores?.nome || '',
        escolaNome: plano.escolas?.nome || '',
        faixaEtaria
      };

      setPlanoAula(planoDetalhado);

      // Buscar configurações da faixa etária
      let configFaixa: ConfiguracaoFaixaEtaria;
      
      try {
        const { data: configFaixaData, error: errorConfig } = await supabase
        .from('configuracoes_avaliacao_faixa_etaria')
        .select('*')
        .eq('faixa_etaria', faixaEtaria)
        .single();

        if (errorConfig || !configFaixaData) {
          // Criar configuração padrão se não encontrar no banco
          console.warn('Configuração de faixa etária não encontrada, usando configuração padrão');
          configFaixa = criarConfiguracaoPadrao(faixaEtaria);
        } else {
          configFaixa = configFaixaData;
        }
      } catch (error) {
        console.warn('Erro ao buscar configuração de faixa etária, usando configuração padrão:', error);
        configFaixa = criarConfiguracaoPadrao(faixaEtaria);
      }

      setConfiguracaoFaixa(configFaixa);

      // Extrair conteúdos do plano para o checklist
      console.log('[DEBUG] ===== INICIANDO EXTRAÇÃO DE CONTEÚDOS =====');
      console.log('[DEBUG] Descrição do plano (primeiros 1000 chars):', plano.descricao?.substring(0, 1000));
      console.log('[DEBUG] Habilidades do plano:', plano.habilidades);
      
      // Se não há descrição ou habilidades, criar dados de teste
      let descricaoParaTeste = plano.descricao;
      let habilidadesParaTeste = plano.habilidades || [];
      
      if (!descricaoParaTeste || descricaoParaTeste.trim().length === 0) {
        console.log('[DEBUG] Descrição vazia, criando dados de teste...');
        descricaoParaTeste = `
          MÊS 1: Introdução aos conceitos básicos
          Semana 1: Apresentação do tema principal
          Semana 2: Desenvolvimento dos conceitos iniciais
          Semana 3: Exercícios práticos
          Semana 4: Avaliação do primeiro mês
          
          MÊS 2: Aprofundamento dos conhecimentos
          Semana 5: Revisão dos conceitos anteriores
          Semana 6: Novos tópicos e aplicações
          Semana 7: Atividades em grupo
          Semana 8: Projeto prático
          
          MÊS 3: Consolidação e avaliação
          Semana 9: Revisão geral
          Semana 10: Preparação para avaliação
          Semana 11: Avaliação final
          Semana 12: Feedback e encerramento
        `;
      }
      
      if (habilidadesParaTeste.length === 0) {
        console.log('[DEBUG] Habilidades vazias, criando dados de teste...');
        habilidadesParaTeste = [
          'EF01LP01 - Reconhecer que textos são lidos e escritos da esquerda para a direita e de cima para baixo da página',
          'EF01LP02 - Escrever, espontaneamente ou por ditado, palavras e frases de forma alfabética',
          'EF01LP03 - Observar escritas convencionais, comparando-as às suas produções escritas'
        ];
      }
      
      console.log('[DEBUG] ===== CHAMANDO EXTRAÇÃO =====');
      console.log('[DEBUG] Descrição para teste (length):', descricaoParaTeste.length);
      console.log('[DEBUG] Habilidades para teste:', habilidadesParaTeste.length);
      console.log('[DEBUG] Primeiros 200 chars da descrição:', descricaoParaTeste.substring(0, 200));
      
      const conteudos = extrairConteudosDoPlano(descricaoParaTeste, habilidadesParaTeste);
      console.log('[DEBUG] ===== CONTEÚDOS EXTRAÍDOS =====', conteudos);
      console.log('[DEBUG] Total de conteúdos:', conteudos.length);
      
      // Log detalhado de cada tipo
      const meses = conteudos.filter(c => c.tipo === 'mes');
      const semanas = conteudos.filter(c => c.tipo === 'semana');
      const habilidades = conteudos.filter(c => c.tipo === 'habilidade');
      
      console.log('[DEBUG] Meses extraídos:', meses.length, meses.map(m => m.titulo));
      console.log('[DEBUG] Semanas extraídas:', semanas.length, semanas.map(s => s.titulo));
      console.log('[DEBUG] Habilidades extraídas:', habilidades.length, habilidades.map(h => h.titulo.substring(0, 50)));
      
      setConteudosExtracted(conteudos);

      // Configurar valores iniciais baseados na faixa etária
      setConfiguracoes(prev => ({
        ...prev,
        // Só atualizar o título se estiver vazio
        titulo: prev.titulo || 'Criando avaliação',
        // Só atualizar tempo se não foi modificado pelo usuário
        tempoEstimado: prev.tempoEstimado === 30 ? configFaixa.tempo_recomendado_minutos : prev.tempoEstimado,
        // Configurações automáticas - sempre atualizar
        tiposQuestoes: configFaixa.distribuicao_questoes_padrao,
        distribuicaoDificuldade: configFaixa.distribuicao_dificuldade_padrao,
        adaptacoesInclusivas: { ...prev.adaptacoesInclusivas, ...configFaixa.adaptacoes_especificas_idade },
        // Só atualizar conteúdo selecionado se estiver vazio
        conteudoSelecionado: prev.conteudoSelecionado.length > 0 ? prev.conteudoSelecionado : (() => {
          console.log('[DEBUG] ===== CONFIGURANDO SELEÇÃO INICIAL =====');
          console.log('[DEBUG] Conteúdos disponíveis para seleção:', conteudos.length);
          console.log('[DEBUG] Tipos disponíveis:', conteudos.map(c => c.tipo));
          
          // Selecionar automaticamente o primeiro mês e todos os seus itens relacionados
          const conteudosInicialmenteSelecionados = [];
          
          // Garantir que pelo menos um mês esteja selecionado (preferencialmente o primeiro)
          const primeiroMes = conteudos.find(c => c.tipo === 'mes' && c.titulo.includes('Mês 1')) || 
                             conteudos.find(c => c.tipo === 'mes');
          
          console.log('[DEBUG] Primeiro mês encontrado:', primeiroMes);
          
          if (primeiroMes) {
            conteudosInicialmenteSelecionados.push(primeiroMes.id);
            
            // Extrair o número do mês selecionado
            const numeroMes = primeiroMes.titulo.match(/Mês (\d+)/)?.[1];
            
            if (numeroMes) {
              console.log('[DEBUG] Selecionando automaticamente todas as semanas e habilidades do mês', numeroMes);
              
              // Selecionar todas as semanas associadas a este mês
              const semanasDoMes = conteudos.filter(c => 
                c.tipo === 'semana' && c.mesAssociado === numeroMes
              );
              semanasDoMes.forEach(semana => {
                conteudosInicialmenteSelecionados.push(semana.id);
              });
              
              // Selecionar todas as habilidades associadas a este mês
              const habilidadesDoMes = conteudos.filter(c => 
                c.tipo === 'habilidade' && c.mesAssociado === numeroMes
              );
              habilidadesDoMes.forEach(habilidade => {
                conteudosInicialmenteSelecionados.push(habilidade.id);
              });
              
              console.log('[DEBUG] Selecionados automaticamente:', {
                mes: primeiroMes.titulo,
                semanas: semanasDoMes.length,
                habilidades: habilidadesDoMes.length,
                total: conteudosInicialmenteSelecionados.length
              });
            }
          }
          
          // Se não conseguiu selecionar itens através do mês, usar fallback
          if (conteudosInicialmenteSelecionados.length === 0) {
            console.log('[DEBUG] Fallback: selecionando mínimos necessários');
            
            // Garantir que pelo menos uma semana esteja selecionada
            const primeiraSemana = conteudos.find(c => c.tipo === 'semana' && c.titulo.includes('Semana 1')) || 
                                  conteudos.find(c => c.tipo === 'semana');
            if (primeiraSemana) {
              conteudosInicialmenteSelecionados.push(primeiraSemana.id);
            }
            
            // Garantir que pelo menos uma habilidade esteja selecionada
            const primeiraHabilidade = conteudos.find(c => c.tipo === 'habilidade');
            if (primeiraHabilidade) {
              conteudosInicialmenteSelecionados.push(primeiraHabilidade.id);
            }
          }
          
          console.log('[DEBUG] Configuração inicial completa - selecionados:', conteudosInicialmenteSelecionados.length, 'de', conteudos.length);
          return conteudosInicialmenteSelecionados;
        })()
      }));

    } catch (error) {
      console.error('Erro ao carregar dados do plano:', error);
      toast.error('Erro ao carregar dados do plano de aula');
      navigate('/planos-aula');
    } finally {
      setLoading(false);
    }
  };

  const determinarFaixaEtaria = (ano: string): string => {
    if (ano.includes('1º') || ano.includes('2º')) return '1-2_ano';
    if (ano.includes('3º') || ano.includes('4º') || ano.includes('5º')) return '3-5_ano';
    if (ano.includes('6º') || ano.includes('7º') || ano.includes('8º') || ano.includes('9º')) return '6-9_ano';
    if (ano.includes('Médio') || ano.includes('médio')) return 'ensino_medio';
    return '1-2_ano';
  };

  // Função para obter descrições dos recursos de adaptação

  // Função para criar configuração padrão quando não encontrada no banco
  const criarConfiguracaoPadrao = (faixaEtaria: string): ConfiguracaoFaixaEtaria => {
    const configuracoesPadrao: { [key: string]: ConfiguracaoFaixaEtaria } = {
      '1-2_ano': {
        faixa_etaria: '1-2_ano',
        nome_exibicao: '1º e 2º Anos',
        tempo_recomendado_minutos: 30,
        tipos_questoes_permitidas: ['múltipla_escolha', 'verdadeiro_falso', 'desenho', 'oral'],
        recursos_obrigatorios: [],
        recursos_recomendados: ['sons', 'atividades_ludicas', 'textos_simples', 'imagens_descritivas', 'tempo_estendido'],
        configuracoes_automaticas: {
          linguagem_simples: true,
          imagens_obrigatorias: true,
          audio_opcional: true
        },
        distribuicao_questoes_padrao: {
          'múltipla_escolha': 40,
          'verdadeiro_falso': 30,
          'desenho': 20,
          'oral': 10
        },
        distribuicao_dificuldade_padrao: {
          'fácil': 60,
          'médio': 30,
          'difícil': 10
        },
        adaptacoes_especificas_idade: {
          'sons': true,
          'atividades_ludicas': true,
          'textos_simples': true,
          'imagens_descritivas': true
        },
        criterios_padrao: {
          'participacao': 30,
          'compreensao': 40,
          'criatividade': 30
        }
      },
      '3-5_ano': {
        faixa_etaria: '3-5_ano',
        nome_exibicao: '3º ao 5º Anos',
        tempo_recomendado_minutos: 45,
        tipos_questoes_permitidas: ['múltipla_escolha', 'verdadeiro_falso', 'dissertativa_curta', 'associação'],
        recursos_obrigatorios: [],
        recursos_recomendados: ['atividades_ludicas', 'jogos', 'textos_simples', 'imagens_descritivas', 'tempo_estendido'],
        configuracoes_automaticas: {
          linguagem_intermediaria: true,
          leitura_independente: true
        },
        distribuicao_questoes_padrao: {
          'múltipla_escolha': 35,
          'verdadeiro_falso': 25,
          'dissertativa_curta': 25,
          'associação': 15
        },
        distribuicao_dificuldade_padrao: {
          'fácil': 50,
          'médio': 40,
          'difícil': 10
        },
        adaptacoes_especificas_idade: {
          'atividades_ludicas': true,
          'jogos': true,
          'textos_simples': true
        },
        criterios_padrao: {
          'conhecimento': 40,
          'compreensao': 35,
          'aplicacao': 25
        }
      },
      '6-9_ano': {
        faixa_etaria: '6-9_ano',
        nome_exibicao: '6º ao 9º Anos',
        tempo_recomendado_minutos: 60,
        tipos_questoes_permitidas: ['múltipla_escolha', 'verdadeiro_falso', 'dissertativa', 'associação', 'análise'],
        recursos_obrigatorios: [],
        recursos_recomendados: ['jogos', 'atividades_ludicas', 'imagens_descritivas', 'tempo_estendido', 'contraste_alto'],
        configuracoes_automaticas: {
          linguagem_padrao: true,
          pensamento_critico: true
        },
        distribuicao_questoes_padrao: {
          'múltipla_escolha': 30,
          'verdadeiro_falso': 20,
          'dissertativa': 30,
          'associação': 10,
          'análise': 10
        },
        distribuicao_dificuldade_padrao: {
          'fácil': 30,
          'médio': 50,
          'difícil': 20
        },
        adaptacoes_especificas_idade: {
          'jogos': true,
          'imagens_descritivas': true
        },
        criterios_padrao: {
          'conhecimento': 30,
          'compreensao': 30,
          'aplicacao': 25,
          'analise': 15
        }
      },
      'ensino_medio': {
        faixa_etaria: 'ensino_medio',
        nome_exibicao: 'Ensino Médio',
        tempo_recomendado_minutos: 90,
        tipos_questoes_permitidas: ['múltipla_escolha', 'dissertativa', 'análise', 'síntese', 'estudo_caso'],
        recursos_obrigatorios: [],
        recursos_recomendados: ['contraste_alto', 'fonte_ampliada', 'tempo_estendido'],
        configuracoes_automaticas: {
          linguagem_avancada: true,
          pensamento_abstrato: true
        },
        distribuicao_questoes_padrao: {
          'múltipla_escolha': 25,
          'dissertativa': 40,
          'análise': 20,
          'síntese': 10,
          'estudo_caso': 5
        },
        distribuicao_dificuldade_padrao: {
          'fácil': 20,
          'médio': 50,
          'difícil': 30
        },
        adaptacoes_especificas_idade: {},
        criterios_padrao: {
          'conhecimento': 25,
          'compreensao': 25,
          'aplicacao': 25,
          'analise': 15,
          'sintese': 10
        }
      }
    };

    return configuracoesPadrao[faixaEtaria] || configuracoesPadrao['1-2_ano'];
  };

  const extrairConteudosDoPlano = (descricao: string, habilidades: string[]): ConteudoExtract[] => {
    const conteudos: ConteudoExtract[] = [];
    let contadorMes = 0;
    let contadorSemana = 0;
    
    // Debug: mostrar o que estamos processando
    console.log('[DEBUG] Processando descrição para extrair conteúdos...');
    console.log('[DEBUG] Descrição length:', descricao.length);
    console.log('[DEBUG] Primeiros 500 caracteres:', descricao.substring(0, 500));
    
    // Teste da regex de meses
    const regexTesteMeses = /(?:##\s*)?MÊS\s+(\d+):/gi;
    const testesRegex = descricao.match(regexTesteMeses);
    console.log('[DEBUG] Teste regex meses - matches encontrados:', testesRegex);
    console.log('[DEBUG] Primeiros 1000 chars para análise:', descricao.substring(0, 1000));
    
    // Teste com diferentes variações
    const variacoesMes = [
      /(?:##\s*)?MÊS\s+(\d+):/gi,
      /(?:##\s*)?MES\s+(\d+):/gi,
      /(?:##\s*)?Mês\s+(\d+):/gi,
      /(?:##\s*)?mês\s+(\d+):/gi
    ];
    
    variacoesMes.forEach((regex, index) => {
      const matches = descricao.match(regex);
      console.log(`[DEBUG] Variação ${index + 1} (${regex.source}):`, matches);
    });
    
    // Primeiro, extrair e mapear a estrutura completa do plano
    
    // Extrair meses do plano (buscar por variações de "MÊS 1:", "MES 1:", etc.)
    // Considerar também formato markdown com ## e variações de acentuação
    const regexMeses = /(?:##\s*)?(MÊS|MES|Mês|mês)\s+(\d+)(?::)?\s*([^\n<]*)/gi;
    let matchMes;
    const mesesEncontrados = new Set<string>();
    
    while ((matchMes = regexMeses.exec(descricao)) !== null) {
      const numeroMes = matchMes[2];
      contadorMes++;
      
      // Evitar duplicatas usando Set
      if (!mesesEncontrados.has(numeroMes)) {
        mesesEncontrados.add(numeroMes);
        conteudos.push({
          tipo: 'mes',
          id: `mes-${numeroMes}-${contadorMes}`, // ID único
          titulo: `Mês ${numeroMes}`,
          descricao: matchMes[3].trim().replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').replace(/div|span|p/gi, ' ').trim(),
          periodo: `Mês ${numeroMes}`,
          selecionado: true
        });
        console.log('[DEBUG] Mês encontrado:', numeroMes, matchMes[3].trim().substring(0, 50));
        console.log(`Mês extraído: ${numeroMes} - Descrição: ${matchMes[3]}`);
      }
    }

    // Extrair semanas (buscar por variações de "Semana X:")
    // Considerar também formato markdown com ### e variações de capitalização
    const regexSemanas = /(?:###\s*)?[Ss][Ee][Mm][Aa][Nn][Aa]\s+(\d+)(?::)?\s*([^\n<]*)/gi;
    let matchSemana;
    const semanasEncontradas = new Set<string>();
    
    while ((matchSemana = regexSemanas.exec(descricao)) !== null) {
      const numeroSemana = matchSemana[1];
      contadorSemana++;
      
      // Evitar duplicatas
      if (!semanasEncontradas.has(numeroSemana)) {
        semanasEncontradas.add(numeroSemana);
        
        // Determinar a qual mês esta semana pertence
        const mesQuePertenece = determinarMesDaSemana(numeroSemana, descricao);
        
        conteudos.push({
          tipo: 'semana',
          id: `semana-${numeroSemana}-${contadorSemana}`, // ID único
          titulo: `Semana ${numeroSemana}`,
          descricao: matchSemana[2].trim().replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').replace(/div|span|p/gi, ' ').trim(),
          periodo: `Semana ${numeroSemana}`,
          mesAssociado: mesQuePertenece, // Nova propriedade para associar ao mês
          selecionado: true
        });
        console.log('[DEBUG] Semana encontrada:', numeroSemana, 'pertence ao mês:', mesQuePertenece, matchSemana[2].trim().substring(0, 50));
        console.log(`Semana extraída: ${numeroSemana} - Descrição: ${matchSemana[2]}`);
      }
    }

    // Adicionar habilidades BNCC
    habilidades.forEach((hab, index) => {
      // Determinar a qual mês esta habilidade pertence
      const mesQuePertenece = determinarMesDaHabilidade(hab, descricao);
      
      conteudos.push({
        tipo: 'habilidade',
        id: `habilidade-${index}-${hab.replace(/\W/g, '')}`, // ID único baseado no índice
        titulo: hab,
        descricao: `Habilidade BNCC: ${hab}`,
        mesAssociado: mesQuePertenece, // Nova propriedade para associar ao mês
        selecionado: true
      });
    });
    
    console.log('[DEBUG] Total conteúdos extraídos:', conteudos.length);
    console.log('[DEBUG] Meses:', conteudos.filter(c => c.tipo === 'mes').length);
    console.log('[DEBUG] Semanas:', conteudos.filter(c => c.tipo === 'semana').length);
    console.log('[DEBUG] Habilidades:', conteudos.filter(c => c.tipo === 'habilidade').length);
    console.log('Primeiros 1000 caracteres do planoAulaDescricao:', descricao.substring(0, 1000));

    return conteudos;
  };

  // Nova função para determinar a qual mês uma semana pertence
  const determinarMesDaSemana = (numeroSemana: string, descricao: string): string | null => {
    const semanaNum = parseInt(numeroSemana);
    console.log('[DEBUG] determinarMesDaSemana - analisando semana:', semanaNum);
    
    // Estratégia 1: Buscar na estrutura do documento
    const linhas = descricao.split('\n');
    let mesAtual = null;
    
    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i].toUpperCase();
      
      // Detectar novo mês (considerar formato markdown)
      const matchMes = linha.match(/(?:##\s*)?MÊS\s+(\d+)[:\s]/);
      if (matchMes) {
        mesAtual = matchMes[1];
        console.log('[DEBUG] Novo mês detectado:', mesAtual, 'na linha:', i);
      }
      
      // Detectar semana e associar ao mês atual (considerar formato markdown)
      const matchSemana = linha.match(/(?:###\s*)?SEMANA\s+(\d+)[:\s]/);
      if (matchSemana && matchSemana[1] === numeroSemana) {
        console.log('[DEBUG] Semana', numeroSemana, 'encontrada no mês', mesAtual);
        return mesAtual;
      }
    }
    
    // Estratégia 2: Distribuição sequencial (fallback inteligente)
    // Assumindo 4 semanas por mês em um plano trimestral
    console.log('[DEBUG] Não encontrou associação direta, usando distribuição sequencial');
    
    if (semanaNum >= 1 && semanaNum <= 4) {
      console.log('[DEBUG] Semana', semanaNum, 'atribuída ao mês 1 (semanas 1-4)');
      return '1';
    } else if (semanaNum >= 5 && semanaNum <= 8) {
      console.log('[DEBUG] Semana', semanaNum, 'atribuída ao mês 2 (semanas 5-8)');
      return '2';
    } else if (semanaNum >= 9 && semanaNum <= 12) {
      console.log('[DEBUG] Semana', semanaNum, 'atribuída ao mês 3 (semanas 9-12)');
      return '3';
    }
    
    console.log('[DEBUG] Semana', semanaNum, 'fora do range esperado, retornando null');
    return null;
  };

  // Nova função para determinar a qual mês uma habilidade pertence  
  const determinarMesDaHabilidade = (habilidade: string, descricao: string): string | null => {
    console.log('[DEBUG] determinarMesDaHabilidade - analisando:', habilidade);
    
    const linhas = descricao.split('\n');
    let mesAtual = null;
    let habilidadesEncontradas = [];
    
    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i].toUpperCase();
      
      // Detectar novo mês (considerar formato markdown)
      const matchMes = linha.match(/(?:##\s*)?MÊS\s+(\d+)[:\s]/);
      if (matchMes) {
        mesAtual = matchMes[1];
        console.log('[DEBUG] Novo mês detectado para habilidades:', mesAtual);
      }
      
      // Verificar se a habilidade aparece nesta linha
      if (linha.includes(habilidade.toUpperCase())) {
        console.log('[DEBUG] Habilidade', habilidade, 'encontrada no mês', mesAtual, 'linha:', i);
        habilidadesEncontradas.push({ mes: mesAtual, linha: i });
      }
    }
    
    // Se encontrou a habilidade, retornar o primeiro mês onde apareceu
    if (habilidadesEncontradas.length > 0) {
      const primeiraOcorrencia = habilidadesEncontradas[0];
      console.log('[DEBUG] Habilidade', habilidade, 'associada ao mês', primeiraOcorrencia.mes);
      return primeiraOcorrencia.mes;
    }
    
    // Estratégia fallback: distribuir habilidades uniformemente entre os 3 meses
    console.log('[DEBUG] Habilidade não encontrada no texto, usando distribuição inteligente');
    
    // Baseado no código da habilidade, distribuir de forma mais equilibrada
    const codigoMatch = habilidade.match(/EF\d+LP(\d+)/);
    if (codigoMatch) {
      const numero = parseInt(codigoMatch[1]);
      
      // Distribuição mais pedagógica: 
      // Habilidades básicas (12, 15) no mês 1
      // Habilidades intermediárias (16, 17, 18) no mês 2  
      // Habilidades avançadas (19+) no mês 3
      let mesCalculado;
      if (numero <= 15) {
        mesCalculado = '1';
      } else if (numero <= 18) {
        mesCalculado = '2';
      } else {
        mesCalculado = '3';
      }
      
      console.log('[DEBUG] Habilidade', habilidade, 'distribuída para mês', mesCalculado, 'baseado no código LP' + numero, '(distribuição pedagógica)');
      return mesCalculado;
    }
    
    // Se não conseguir extrair código, distribuir por hash do nome para consistência
    const hash = habilidade.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const mesCalculado = ((hash % 3) + 1).toString();
    
    console.log('[DEBUG] Habilidade', habilidade, 'distribuída para mês', mesCalculado, 'baseado em hash');
    return mesCalculado;
  };

  // Nova função para extrair estrutura completa (placeholder por enquanto)

  // Nova função para filtrar conteúdos baseado nos meses selecionados
  const obterConteudosFiltrados = (): ConteudoExtract[] => {
    console.log('[DEBUG] ===== OBTENDO CONTEÚDOS FILTRADOS =====');
    console.log('[DEBUG] conteudosExtracted.length:', conteudosExtracted.length);
    console.log('[DEBUG] configuracoes.conteudoSelecionado:', configuracoes.conteudoSelecionado);
    
    // Obter quais meses estão selecionados
    const mesesSelecionados = conteudosExtracted
      .filter(c => c.tipo === 'mes' && configuracoes.conteudoSelecionado.includes(c.id))
      .map(c => {
        const numeroMes = c.titulo.match(/Mês (\d+)/)?.[1];
        return numeroMes;
      })
      .filter(Boolean);

    console.log('[DEBUG] Meses selecionados:', mesesSelecionados);

    if (mesesSelecionados.length === 0) {
      // Se nenhum mês selecionado, mostrar todos
      console.log('[DEBUG] Nenhum mês selecionado, retornando todos os conteúdos:', conteudosExtracted.length);
      return conteudosExtracted;
    }

    // Filtrar todos os conteúdos baseado nos meses selecionados
    const conteudosFiltrados = conteudosExtracted.filter(conteudo => {
      if (conteudo.tipo === 'mes') {
        // Sempre mostrar os meses
        return true;
      } else if (conteudo.tipo === 'semana') {
        // Mostrar APENAS semanas que pertencem aos meses selecionados
        // Se não tem mesAssociado, não mostrar (correção do bug)
        return conteudo.mesAssociado && mesesSelecionados.includes(conteudo.mesAssociado);
      } else if (conteudo.tipo === 'habilidade') {
        // Mostrar APENAS habilidades que pertencem aos meses selecionados  
        // Se não tem mesAssociado, não mostrar (correção do bug)
        return conteudo.mesAssociado && mesesSelecionados.includes(conteudo.mesAssociado);
      }
      return true;
    });
    
    console.log('[DEBUG] Conteúdos após filtragem:', conteudosFiltrados.length);
    console.log('[DEBUG] Tipos após filtragem:', conteudosFiltrados.map(c => c.tipo));
    
    return conteudosFiltrados;
  };

  const toggleConteudoSelecionado = (conteudoId: string) => {
    const conteudo = conteudosExtracted.find(c => c.id === conteudoId);
    if (!conteudo) return;

    setConfiguracoes(prev => {
      const isCurrentlySelected = prev.conteudoSelecionado.includes(conteudoId);
      let novosSelecionados = [...prev.conteudoSelecionado];

      if (isCurrentlySelected) {
        // Se está tentando desmarcar um mês, verificar se é o último mês selecionado
        if (conteudo.tipo === 'mes') {
          const mesesAtualmenteSelecionados = conteudosExtracted
            .filter(c => c.tipo === 'mes' && prev.conteudoSelecionado.includes(c.id))
            .length;
          
          if (mesesAtualmenteSelecionados <= 1) {
            console.log('[DEBUG] Bloqueando desmarcação - este é o último mês selecionado. Total de meses selecionados:', mesesAtualmenteSelecionados);
            console.log('[DEBUG] Professor pode selecionar outros meses e depois desmarcar este.');
            // Retorna sem fazer alterações, mantendo o mês selecionado
            return prev;
          } else {
            console.log('[DEBUG] Permitindo desmarcação - ainda restam', mesesAtualmenteSelecionados - 1, 'meses selecionados');
          }
        }

        // Se está tentando desmarcar uma semana, verificar se é a última semana selecionada
        if (conteudo.tipo === 'semana') {
          const semanasAtualmenteSelecionadas = conteudosExtracted
            .filter(c => c.tipo === 'semana' && prev.conteudoSelecionado.includes(c.id))
            .length;
          
          if (semanasAtualmenteSelecionadas <= 1) {
            console.log('[DEBUG] Bloqueando desmarcação - esta é a última semana selecionada. Total de semanas selecionadas:', semanasAtualmenteSelecionadas);
            console.log('[DEBUG] Professor pode selecionar outras semanas e depois desmarcar esta.');
            // Retorna sem fazer alterações, mantendo a semana selecionada
            return prev;
          } else {
            console.log('[DEBUG] Permitindo desmarcação - ainda restam', semanasAtualmenteSelecionadas - 1, 'semanas selecionadas');
          }
        }

        // Se está tentando desmarcar uma habilidade, verificar se é a última habilidade selecionada
        if (conteudo.tipo === 'habilidade') {
          const habilidadesAtualmenteSelecionadas = conteudosExtracted
            .filter(c => c.tipo === 'habilidade' && prev.conteudoSelecionado.includes(c.id))
            .length;
          
          if (habilidadesAtualmenteSelecionadas <= 1) {
            console.log('[DEBUG] Bloqueando desmarcação - esta é a última habilidade selecionada. Total de habilidades selecionadas:', habilidadesAtualmenteSelecionadas);
            console.log('[DEBUG] Professor pode selecionar outras habilidades e depois desmarcar esta.');
            // Retorna sem fazer alterações, mantendo a habilidade selecionada
            return prev;
          } else {
            console.log('[DEBUG] Permitindo desmarcação - ainda restam', habilidadesAtualmenteSelecionadas - 1, 'habilidades selecionadas');
          }
        }

        // Desmarcando item
        novosSelecionados = novosSelecionados.filter(id => id !== conteudoId);

        // Se está desmarcando um mês, desmarcar também suas semanas e habilidades associadas
        if (conteudo.tipo === 'mes') {
          const numeroMes = conteudo.titulo.match(/Mês (\d+)/)?.[1];
          if (numeroMes) {
            console.log('[DEBUG] Desmarcando mês', numeroMes, '- removendo semanas e habilidades associadas');
            
            // Remover semanas associadas a este mês
            const semanasParaRemover = conteudosExtracted
              .filter(c => c.tipo === 'semana' && c.mesAssociado === numeroMes)
              .map(c => c.id);
            
            // Remover habilidades associadas a este mês
            const habilidadesParaRemover = conteudosExtracted
              .filter(c => c.tipo === 'habilidade' && c.mesAssociado === numeroMes)
              .map(c => c.id);

            novosSelecionados = novosSelecionados.filter(id => 
              !semanasParaRemover.includes(id) && !habilidadesParaRemover.includes(id)
            );

            console.log('[DEBUG] Removidas', semanasParaRemover.length, 'semanas e', habilidadesParaRemover.length, 'habilidades');
          }
        }

        // Se está desmarcando uma semana ou habilidade, verificar se deve desmarcar o mês pai
        if (conteudo.tipo === 'semana' || conteudo.tipo === 'habilidade') {
          if (conteudo.mesAssociado) {
            // Verificar quantas semanas e habilidades deste mês ainda estarão selecionadas
            const semanasDoMesRestantes = conteudosExtracted
              .filter(c => 
                c.tipo === 'semana' && 
                c.mesAssociado === conteudo.mesAssociado && 
                novosSelecionados.includes(c.id) // Ainda selecionadas após a remoção
              );

            const habilidadesDoMesRestantes = conteudosExtracted
              .filter(c => 
                c.tipo === 'habilidade' && 
                c.mesAssociado === conteudo.mesAssociado && 
                novosSelecionados.includes(c.id) // Ainda selecionadas após a remoção
              );

            // Se não há mais semanas nem habilidades deste mês selecionadas, desmarcar o mês pai
            if (semanasDoMesRestantes.length === 0 && habilidadesDoMesRestantes.length === 0) {
              const mesAssociado = conteudosExtracted.find(c => 
                c.tipo === 'mes' && c.titulo.includes(`Mês ${conteudo.mesAssociado}`)
              );
              
              if (mesAssociado && novosSelecionados.includes(mesAssociado.id)) {
                // Verificar se o mês pode ser desmarcado (não é o último)
                const mesesQueRestarao = conteudosExtracted
                  .filter(c => 
                    c.tipo === 'mes' && 
                    novosSelecionados.includes(c.id) && 
                    c.id !== mesAssociado.id
                  ).length;

                // Verificar se desmarcar o mês violaria as proteções de semanas ou habilidades
                const semanasGlobaisRestantes = conteudosExtracted
                  .filter(c => 
                    c.tipo === 'semana' && 
                    novosSelecionados.includes(c.id) &&
                    c.mesAssociado !== conteudo.mesAssociado // Excluir semanas do mês que seria desmarcado
                  ).length;

                const habilidadesGlobaisRestantes = conteudosExtracted
                  .filter(c => 
                    c.tipo === 'habilidade' && 
                    novosSelecionados.includes(c.id) &&
                    c.mesAssociado !== conteudo.mesAssociado // Excluir habilidades do mês que seria desmarcado
                  ).length;

                if (mesesQueRestarao > 0 && semanasGlobaisRestantes > 0 && habilidadesGlobaisRestantes > 0) {
                  console.log('[DEBUG] Desmarcando automaticamente o mês', conteudo.mesAssociado, 'pois não há mais semanas/habilidades selecionadas');
                  novosSelecionados = novosSelecionados.filter(id => id !== mesAssociado.id);
                } else {
                  console.log('[DEBUG] Não é possível desmarcar o mês', conteudo.mesAssociado, 'pois violaria as proteções mínimas (meses:', mesesQueRestarao, ', semanas:', semanasGlobaisRestantes, ', habilidades:', habilidadesGlobaisRestantes, ')');
                }
              }
            } else {
              console.log('[DEBUG] Mês', conteudo.mesAssociado, 'permanece marcado. Restam', semanasDoMesRestantes.length, 'semanas e', habilidadesDoMesRestantes.length, 'habilidades');
            }
          }
        }
      } else {
        // Marcando item
        novosSelecionados.push(conteudoId);

        // Se está marcando um mês, marcar também suas semanas e habilidades associadas
        if (conteudo.tipo === 'mes') {
          const numeroMes = conteudo.titulo.match(/Mês (\d+)/)?.[1];
          if (numeroMes) {
            console.log('[DEBUG] Marcando mês', numeroMes, '- marcando automaticamente semanas e habilidades associadas');
            
            // Marcar semanas associadas a este mês
            const semanasParaMarcar = conteudosExtracted
              .filter(c => c.tipo === 'semana' && c.mesAssociado === numeroMes)
              .map(c => c.id)
              .filter(id => !novosSelecionados.includes(id)); // Apenas as que não estão marcadas
            
            // Marcar habilidades associadas a este mês
            const habilidadesParaMarcar = conteudosExtracted
              .filter(c => c.tipo === 'habilidade' && c.mesAssociado === numeroMes)
              .map(c => c.id)
              .filter(id => !novosSelecionados.includes(id)); // Apenas as que não estão marcadas

            novosSelecionados.push(...semanasParaMarcar, ...habilidadesParaMarcar);

            console.log('[DEBUG] Marcadas automaticamente', semanasParaMarcar.length, 'semanas e', habilidadesParaMarcar.length, 'habilidades');
          }
        }

        // Se está marcando uma semana ou habilidade, verificar se o mês pai está marcado
        if (conteudo.tipo === 'semana' || conteudo.tipo === 'habilidade') {
          if (conteudo.mesAssociado) {
            const mesAssociado = conteudosExtracted.find(c => 
              c.tipo === 'mes' && c.titulo.includes(`Mês ${conteudo.mesAssociado}`)
            );
            
            if (mesAssociado && !novosSelecionados.includes(mesAssociado.id)) {
              console.log('[DEBUG] Marcando automaticamente o mês', conteudo.mesAssociado, 'por causa da', conteudo.tipo);
              novosSelecionados.push(mesAssociado.id);
            }
          }
        }
      }

      return {
        ...prev,
        conteudoSelecionado: novosSelecionados
      };
    });
  };

  const extrairDetalhesDoMes = (numeroMes: string, descricaoCompleta: string): string => {
    console.log('[DEBUG] extrairDetalhesDoMes - buscando mês:', numeroMes);
    
    // Primeiro, limpar HTML do conteúdo para facilitar a busca
    const conteudoLimpo = descricaoCompleta
      .replace(/<[^>]*>/g, ' ')  // Remove tags HTML
      .replace(/&[^;]+;/g, ' ')  // Remove entidades HTML
      .replace(/\s+/g, ' ')     // Normaliza espaços
      .replace(/div|span|p/gi, ' ') // Remove restos de tags comuns
      .trim();
    const linhas = conteudoLimpo.split('\n').map(linha => linha.trim()).filter(linha => linha.length > 0);
    
    console.log('[DEBUG] Total de linhas após limpeza:', linhas.length);
    
    // Buscar o início da seção do mês específico
    let inicioMes = -1;
    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i].toUpperCase();
      
      // Buscar por padrões mais específicos do mês
      if (linha.includes(`MÊS ${numeroMes}:`) || 
          linha.includes(`MES ${numeroMes}:`) ||
          linha.match(new RegExp(`MÊS\\s+${numeroMes}\\s*:`, 'i')) ||
          linha.match(new RegExp(`MES\\s+${numeroMes}\\s*:`, 'i'))) {
        
        inicioMes = i;
        console.log('[DEBUG] Mês encontrado na linha', i, ':', linhas[i].substring(0, 100));
        break;
      }
    }
    
    if (inicioMes === -1) {
      console.log('[DEBUG] Tentando busca mais flexível...');
      
      // Busca mais flexível para título do mês
      for (let i = 0; i < linhas.length; i++) {
        const linha = linhas[i];
        // Buscar linha que contenha "MÊS X" seguido do título
        if (linha.match(new RegExp(`MÊS\\s+${numeroMes}\\s*[:\\-]?\\s*\\w+`, 'i'))) {
          inicioMes = i;
          console.log('[DEBUG] Mês encontrado com busca flexível na linha', i, ':', linha.substring(0, 100));
          break;
        }
      }
    }
    
    if (inicioMes === -1) {
      console.log('[DEBUG] Mês não encontrado em nenhuma variação');
      return `Conteúdo do Mês ${numeroMes} não encontrado.`;
    }
    
    // Encontrar o fim do mês (próximo mês ou fim do conteúdo)
    let fimMes = linhas.length;
    for (let i = inicioMes + 1; i < linhas.length; i++) {
      const linha = linhas[i].toUpperCase();
      
      // Procurar o próximo mês
      const proximoMesMatch = linha.match(/MÊS\s+(\d+)\s*[:\-]|MES\s+(\d+)\s*[:\-]/);
      if (proximoMesMatch) {
        const outroNumeroMes = proximoMesMatch[1] || proximoMesMatch[2];
        if (outroNumeroMes && outroNumeroMes !== numeroMes) {
          fimMes = i;
          console.log('[DEBUG] Fim do mês encontrado na linha', i, ', próximo mês:', outroNumeroMes);
          break;
        }
      }
    }
    
    // Extrair apenas o conteúdo do mês específico
    const conteudoDoMes = linhas.slice(inicioMes, fimMes).join('\n');
    
    console.log('[DEBUG] Conteúdo extraído do mês (tamanho):', conteudoDoMes.length);
    console.log('[DEBUG] Linhas extraídas: de', inicioMes, 'até', fimMes);
    console.log('[DEBUG] Conteúdo extraído (primeiros 300 chars):', conteudoDoMes.substring(0, 300));
    
    return conteudoDoMes || `Conteúdo do Mês ${numeroMes} não encontrado.`;
  };

  const processarConteudoDoMes = (conteudoBruto: string) => {
    console.log('[DEBUG] processarConteudoDoMes - tamanho do conteúdo:', conteudoBruto.length);
    
    // O conteúdo já vem limpo da função anterior, apenas dividir em linhas
    const linhas = conteudoBruto.split('\n').map(linha => linha.trim()).filter(linha => linha.length > 0);
    
    console.log('[DEBUG] Total de linhas para processar:', linhas.length);
    
    const secoes = {
      titulo: '',
      habilidades: [] as string[],
      objetivos: [] as string[],
      desenvolvimento: [] as string[],
      atividades: [] as string[],
      observacoes: [] as string[]
    };
    
    let secaoAtual = '';
    
    linhas.forEach((linha, index) => {
      const linhaMaiuscula = linha.toUpperCase();
      
      // Capturar o título do mês
      if (linhaMaiuscula.match(/MÊS\s+\d+\s*[:\-]?\s*\w+/)) {
        secoes.titulo = linha;
        console.log('[DEBUG] Título capturado:', linha);
        return;
      }
      
      // Identificar seções
      if (linhaMaiuscula.includes('HABILIDADES') && linhaMaiuscula.includes('BNCC')) {
        secaoAtual = 'habilidades';
        console.log('[DEBUG] Seção HABILIDADES detectada na linha:', index);
      } else if (linhaMaiuscula.includes('OBJETIVOS ESPECÍFICOS') || 
                 (linhaMaiuscula.includes('OBJETIVO') && linhaMaiuscula.includes('ESPECÍFICO'))) {
        secaoAtual = 'objetivos';
        console.log('[DEBUG] Seção OBJETIVOS detectada na linha:', index);
      } else if (linhaMaiuscula.includes('DESENVOLVIMENTO DAS AULAS') || 
                 linhaMaiuscula.includes('DESENVOLVIMENTO DA AULA')) {
        secaoAtual = 'desenvolvimento';
        console.log('[DEBUG] Seção DESENVOLVIMENTO detectada na linha:', index);
      } else if (linhaMaiuscula.includes('ATIVIDADES') || 
                 linhaMaiuscula.includes('EXERCÍCIO')) {
        secaoAtual = 'atividades';
        console.log('[DEBUG] Seção ATIVIDADES detectada na linha:', index);
      } else if (linhaMaiuscula.includes('SEMANA')) {
        // Reset seção quando encontra uma nova semana
        secaoAtual = '';
      } else if (linha.length > 15 && secaoAtual) {
        // Adicionar conteúdo à seção atual
        switch (secaoAtual) {
          case 'habilidades':
            if (linha.includes('EF') || linha.length < 300) {
              secoes.habilidades.push(linha);
              console.log('[DEBUG] Habilidade adicionada:', linha.substring(0, 50));
            }
            break;
          case 'objetivos':
            if (linha.length < 200) {
              secoes.objetivos.push(linha);
              console.log('[DEBUG] Objetivo adicionado:', linha.substring(0, 50));
            }
            break;
          case 'desenvolvimento':
            if (linha.length < 400) {
              secoes.desenvolvimento.push(linha);
              console.log('[DEBUG] Desenvolvimento adicionado:', linha.substring(0, 50));
            }
            break;
          case 'atividades':
            if (linha.length < 300) {
              secoes.atividades.push(linha);
              console.log('[DEBUG] Atividade adicionada:', linha.substring(0, 50));
            }
            break;
        }
      }
    });
    
    console.log('[DEBUG] Seções finais processadas:', {
      titulo: secoes.titulo ? 'PRESENTE' : 'AUSENTE',
      habilidades: secoes.habilidades.length,
      objetivos: secoes.objetivos.length,
      desenvolvimento: secoes.desenvolvimento.length,
      atividades: secoes.atividades.length
    });
    
    return secoes;
  };

  const abrirDetalhesDoMes = (item: ConteudoExtract) => {
    console.log('[DEBUG] abrirDetalhesDoMes chamado com item:', item);
    
    if (!planoAula) {
      console.log('[DEBUG] planoAula não disponível');
      return;
    }
    
    // Extrair o número do mês do título
    const numeroMes = item.titulo.match(/Mês (\d+)/)?.[1] || item.titulo.match(/(\d+)/)?.[1];
    console.log('[DEBUG] Número do mês extraído:', numeroMes);
    
    if (!numeroMes) {
      console.log('[DEBUG] Não foi possível extrair número do mês do título:', item.titulo);
      return;
    }
    
    console.log('[DEBUG] Iniciando extração de detalhes para mês:', numeroMes);
    console.log('[DEBUG] Descrição do plano tem', planoAula.descricao.length, 'caracteres');
    
    const detalhes = extrairDetalhesDoMes(numeroMes, planoAula.descricao);
    console.log('[DEBUG] Detalhes extraídos (primeiros 200 chars):', detalhes.substring(0, 200));
    
    const secoes = processarConteudoDoMes(detalhes);
    console.log('[DEBUG] Seções processadas:', secoes);
    
    setMesDetalhes(item.titulo);
    setSecoesProcessadas(secoes);
    setModalDetalhesAberto(true);
    
    console.log('[DEBUG] Modal de detalhes deve estar aberto agora');
  };

  const extrairDetalhesDaSemana = (numeroSemana: string, descricaoCompleta: string): string => {
    console.log('[DEBUG] extrairDetalhesDaSemana - buscando semana:', numeroSemana);
    
    // Primeiro, limpar HTML do conteúdo para facilitar a busca
    const conteudoLimpo = descricaoCompleta
      .replace(/<[^>]*>/g, ' ')  // Remove tags HTML
      .replace(/&[^;]+;/g, ' ')  // Remove entidades HTML
      .replace(/\s+/g, ' ')     // Normaliza espaços
      .replace(/div|span|p/gi, ' ') // Remove restos de tags comuns
      .trim();
    const linhas = conteudoLimpo.split('\n').map(linha => linha.trim()).filter(linha => linha.length > 0);
    
    console.log('[DEBUG] Total de linhas após limpeza:', linhas.length);
    
    // Buscar o início da seção da semana específica
    let inicioSemana = -1;
    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i].toUpperCase();
      
      // Buscar por padrões mais específicos da semana
      if (linha.includes(`SEMANA ${numeroSemana}:`) || 
          linha.match(new RegExp(`SEMANA\\s+${numeroSemana}\\s*:`, 'i'))) {
        
        inicioSemana = i;
        console.log('[DEBUG] Semana encontrada na linha', i, ':', linhas[i].substring(0, 100));
        break;
      }
    }
    
    if (inicioSemana === -1) {
      console.log('[DEBUG] Tentando busca mais flexível para semana...');
      
      // Busca mais flexível para título da semana
      for (let i = 0; i < linhas.length; i++) {
        const linha = linhas[i];
        // Buscar linha que contenha "SEMANA X" seguido do título
        if (linha.match(new RegExp(`SEMANA\\s+${numeroSemana}\\s*[:\\-]?\\s*\\w+`, 'i'))) {
          inicioSemana = i;
          console.log('[DEBUG] Semana encontrada com busca flexível na linha', i, ':', linha.substring(0, 100));
          break;
        }
      }
    }
    
    if (inicioSemana === -1) {
      console.log('[DEBUG] Semana não encontrada em nenhuma variação');
      return `Conteúdo da Semana ${numeroSemana} não encontrado.`;
    }
    
    // Encontrar o fim da semana (próxima semana ou fim do conteúdo)
    let fimSemana = linhas.length;
    for (let i = inicioSemana + 1; i < linhas.length; i++) {
      const linha = linhas[i].toUpperCase();
      
      // Procurar a próxima semana ou próximo mês
      const proximaSemanaMatch = linha.match(/SEMANA\s+(\d+)\s*[:\-]/);
      const proximoMesMatch = linha.match(/MÊS\s+(\d+)\s*[:\-]|MES\s+(\d+)\s*[:\-]/);
      
      if (proximaSemanaMatch) {
        const outroNumeroSemana = proximaSemanaMatch[1];
        if (outroNumeroSemana && outroNumeroSemana !== numeroSemana) {
          fimSemana = i;
          console.log('[DEBUG] Fim da semana encontrado na linha', i, ', próxima semana:', outroNumeroSemana);
          break;
        }
      } else if (proximoMesMatch) {
        fimSemana = i;
        console.log('[DEBUG] Fim da semana encontrado na linha', i, ', próximo mês detectado');
        break;
      }
    }
    
    // Extrair apenas o conteúdo da semana específica
    const conteudoDaSemana = linhas.slice(inicioSemana, fimSemana).join('\n');
    
    console.log('[DEBUG] Conteúdo extraído da semana (tamanho):', conteudoDaSemana.length);
    console.log('[DEBUG] Linhas extraídas: de', inicioSemana, 'até', fimSemana);
    console.log('[DEBUG] Conteúdo extraído (primeiros 300 chars):', conteudoDaSemana.substring(0, 300));
    
    return conteudoDaSemana || `Conteúdo da Semana ${numeroSemana} não encontrado.`;
  };

  const processarConteudoDaSemana = (conteudoBruto: string) => {
    console.log('[DEBUG] processarConteudoDaSemana - tamanho do conteúdo:', conteudoBruto.length);
    
    // O conteúdo já vem limpo da função anterior, apenas dividir em linhas
    const linhas = conteudoBruto.split('\n').map(linha => linha.trim()).filter(linha => linha.length > 0);
    
    console.log('[DEBUG] Total de linhas para processar:', linhas.length);
    
    const secoes = {
      titulo: '',
      habilidades: [] as string[],
      objetivos: [] as string[],
      desenvolvimento: [] as string[],
      atividades: [] as string[],
      observacoes: [] as string[]
    };
    
    let secaoAtual = '';
    
    linhas.forEach((linha, index) => {
      const linhaMaiuscula = linha.toUpperCase();
      
      // Capturar o título da semana
      if (linhaMaiuscula.match(/SEMANA\s+\d+\s*[:\-]?\s*\w+/)) {
        secoes.titulo = linha;
        console.log('[DEBUG] Título da semana capturado:', linha);
        return;
      }
      
      // Identificar seções
      if (linhaMaiuscula.includes('OBJETIVOS ESPECÍFICOS') || 
         (linhaMaiuscula.includes('OBJETIVO') && linhaMaiuscula.includes('ESPECÍFICO'))) {
        secaoAtual = 'objetivos';
        console.log('[DEBUG] Seção OBJETIVOS detectada na linha:', index);
      } else if (linhaMaiuscula.includes('DESENVOLVIMENTO DAS AULAS') || 
                 linhaMaiuscula.includes('DESENVOLVIMENTO DA AULA')) {
        secaoAtual = 'desenvolvimento';
        console.log('[DEBUG] Seção DESENVOLVIMENTO detectada na linha:', index);
      } else if (linhaMaiuscula.includes('AULA') && linhaMaiuscula.includes('MINUTOS')) {
        secaoAtual = 'desenvolvimento';
        console.log('[DEBUG] Seção AULA detectada na linha:', index);
      } else if (linhaMaiuscula.includes('RECURSOS:') || linhaMaiuscula.includes('RECURSOS')) {
        secaoAtual = 'observacoes';
        console.log('[DEBUG] Seção RECURSOS detectada na linha:', index);
      } else if (linhaMaiuscula.includes('ESTRATÉGIA') || 
                 linhaMaiuscula.includes('AVALIAÇÃO') ||
                 linhaMaiuscula.includes('PARA CASA')) {
        secaoAtual = 'observacoes';
        console.log('[DEBUG] Seção OBSERVAÇÕES detectada na linha:', index);
      } else if (linhaMaiuscula.includes('MOMENTO') || linhaMaiuscula.includes('ABERTURA') || 
                 linhaMaiuscula.includes('SISTEMATIZAÇÃO')) {
        secaoAtual = 'desenvolvimento';
      } else if (linha.length > 15 && secaoAtual) {
        // Adicionar conteúdo à seção atual
        switch (secaoAtual) {
          case 'objetivos':
            if (linha.length < 200) {
              secoes.objetivos.push(linha);
              console.log('[DEBUG] Objetivo adicionado:', linha.substring(0, 50));
            }
            break;
          case 'desenvolvimento':
            if (linha.length < 400) {
              secoes.desenvolvimento.push(linha);
              console.log('[DEBUG] Desenvolvimento adicionado:', linha.substring(0, 50));
            }
            break;
          case 'observacoes':
            if (linha.length < 300) {
              secoes.observacoes.push(linha);
              console.log('[DEBUG] Observação adicionada:', linha.substring(0, 50));
            }
            break;
        }
      }
    });
    
    console.log('[DEBUG] Seções finais processadas para semana:', {
      titulo: secoes.titulo ? 'PRESENTE' : 'AUSENTE',
      objetivos: secoes.objetivos.length,
      desenvolvimento: secoes.desenvolvimento.length,
      observacoes: secoes.observacoes.length
    });
    
    return secoes;
  };

  const abrirDetalhesDaSemana = (item: ConteudoExtract) => {
    console.log('[DEBUG] abrirDetalhesDaSemana chamado com item:', item);
    
    if (!planoAula) {
      console.log('[DEBUG] planoAula não disponível');
      return;
    }
    
    // Extrair o número da semana do título
    const numeroSemana = item.titulo.match(/Semana (\d+)/)?.[1] || item.titulo.match(/(\d+)/)?.[1];
    console.log('[DEBUG] Número da semana extraído:', numeroSemana);
    
    if (!numeroSemana) {
      console.log('[DEBUG] Não foi possível extrair número da semana do título:', item.titulo);
      return;
    }
    
    console.log('[DEBUG] Iniciando extração de detalhes para semana:', numeroSemana);
    console.log('[DEBUG] Descrição do plano tem', planoAula.descricao.length, 'caracteres');
    
    const detalhes = extrairDetalhesDaSemana(numeroSemana, planoAula.descricao);
    console.log('[DEBUG] Detalhes extraídos da semana (primeiros 200 chars):', detalhes.substring(0, 200));
    
    const secoes = processarConteudoDaSemana(detalhes);
    console.log('[DEBUG] Seções processadas da semana:', secoes);
    
    setMesDetalhes(item.titulo); // Reutilizando o mesmo estado para mostrar o título
    setSecoesProcessadas(secoes);
    setModalDetalhesAberto(true);
    
    console.log('[DEBUG] Modal de detalhes da semana deve estar aberto agora');
  };

  const gerarAvaliacao = async () => {
    console.log('[DEBUG] 🚀 Iniciando geração de avaliação - VERSÃO NOVA');
    
    try {
      setGenerating(true);
      
      console.log('[DEBUG] ✅ SetGenerating(true) executado');
      
      // Validação 1: Campos básicos
      if (!configuracoes.titulo.trim()) {
        console.log('[DEBUG] ❌ Erro: Título vazio');
        toast.error('Preencha o título da avaliação');
        setGenerating(false);
        return;
      }
      console.log('[DEBUG] ✅ Validação 1 passou - Título OK');

      // Validação 2: Quantidade de questões
      if (configuracoes.quantidadeQuestoes < 1 || configuracoes.quantidadeQuestoes > 50) {
        console.log('[DEBUG] ❌ Erro: Quantidade de questões inválida:', configuracoes.quantidadeQuestoes);
        toast.error('A quantidade de questões deve estar entre 1 e 50');
        setGenerating(false);
        return;
      }
      console.log('[DEBUG] ✅ Validação 2 passou - Quantidade de questões OK:', configuracoes.quantidadeQuestoes);

      // Validação 3: Professor
      if (!professorData?.id) {
        console.log('[DEBUG] ❌ Erro: Dados do professor não encontrados. ProfessorData:', professorData);
        toast.error('Dados do professor não encontrados');
        setGenerating(false);
        return;
      }
      console.log('[DEBUG] ✅ Validação 3 passou - Professor OK:', professorData.id);

      // Validação 4: Plano de aula e configuração
      if (!planoAula || !configuracaoFaixa) {
        console.log('[DEBUG] ❌ Erro: Dados do plano não carregados. PlanoAula:', !!planoAula, 'ConfiguracaoFaixa:', !!configuracaoFaixa);
        toast.error('Dados do plano de aula não carregados');
        setGenerating(false);
        return;
      }
      console.log('[DEBUG] ✅ Validação 4 passou - Plano e configuração OK');

      console.log('[DEBUG] 📊 Iniciando extração de conteúdos selecionados...');

      // Extrair conteúdos selecionados
      const conteudosSelecionados = conteudosExtracted
        .filter(c => configuracoes.conteudoSelecionado.includes(c.id));

      console.log('[DEBUG] 📋 Conteúdos selecionados encontrados:', conteudosSelecionados.length);
      console.log('[DEBUG] 📋 IDs selecionados:', configuracoes.conteudoSelecionado);
      console.log('[DEBUG] 📋 Total de conteúdos disponíveis:', conteudosExtracted.length);

      if (conteudosSelecionados.length === 0) {
        console.log('[DEBUG] ❌ Erro: Nenhum conteúdo selecionado');
        toast.error('Selecione pelo menos um conteúdo do plano de aula');
        setGenerating(false);
        return;
      }

      console.log('[DEBUG] 🔄 Processando meses selecionados...');
      
      // Processar meses selecionados
      const mesesSelecionados = conteudosSelecionados
        .filter(c => c.tipo === 'mes')
        .map(mesConteudo => {
          console.log('[DEBUG] 📅 Processando mês:', mesConteudo.titulo);
          const numeroMes = mesConteudo.titulo.match(/Mês (\d+)/)?.[1];
          const detalhes = extrairDetalhesDoMes(numeroMes || '1', planoAula.descricao);
          const secoes = processarConteudoDoMes(detalhes);
          
          return {
            numero: numeroMes,
            titulo: mesConteudo.titulo,
            habilidades: secoes.habilidades || [],
            objetivos: secoes.objetivos || [],
            desenvolvimento: secoes.desenvolvimento || [],
            atividades: secoes.atividades || []
          };
        });

      console.log('[DEBUG] 🔄 Processando semanas selecionadas...');
      
      // Processar semanas selecionadas
      const semanasSelecionadas = conteudosSelecionados
        .filter(c => c.tipo === 'semana')
        .map(semanaConteudo => {
          console.log('[DEBUG] 📅 Processando semana:', semanaConteudo.titulo);
          const numeroSemana = semanaConteudo.titulo.match(/Semana (\d+)/)?.[1];
          const detalhes = extrairDetalhesDaSemana(numeroSemana || '1', planoAula.descricao);
          const secoes = processarConteudoDaSemana(detalhes);
          
          return {
            numero: numeroSemana,
            titulo: semanaConteudo.titulo,
            objetivos: secoes.objetivos || [],
            desenvolvimento: secoes.desenvolvimento || [],
            observacoes: secoes.observacoes || []
          };
        });

      console.log('[DEBUG] ✅ Processamento concluído. Meses:', mesesSelecionados.length, 'Semanas:', semanasSelecionadas.length);

      if (mesesSelecionados.length === 0 && semanasSelecionadas.length === 0) {
        console.log('[DEBUG] ❌ Erro: Nenhum mês ou semana processado corretamente');
        toast.error('Selecione pelo menos um mês ou semana do plano de aula');
        setGenerating(false);
        return;
      }

      const detalhesConteudo = {
        meses: mesesSelecionados,
        semanas: semanasSelecionadas
      };

      console.log('[DEBUG] 🎯 Preparando parâmetros para OpenAI...');

      // Preparar parâmetros para a IA
      const avaliacaoParams = {
        planoAula: {
          titulo: planoAula.titulo,
          disciplinaNome: planoAula.disciplinaNome,
          turmaAno: planoAula.turmaAno,
          turmaNome: planoAula.turmaNome,
          modalidadeNome: planoAula.modalidadeNome,
          trimestre: planoAula.trimestre,
          professorNome: planoAula.professorNome,
          professorId: planoAula.professor_id,
          escolaId: planoAula.escola_id
        },
        configuracoes: {
          titulo: configuracoes.titulo,
          tipo: configuracoes.tipo,
          descricao: configuracoes.descricao,
          dataAplicacao: configuracoes.dataAplicacao,
          quantidadeQuestoes: configuracoes.quantidadeQuestoes,
          notaMaxima: configuracoes.notaMaxima,
          tempoEstimado: configuracoes.tempoEstimado,
          focoAvaliacao: configuracoes.focoAvaliacao,
          incluirImagens: configuracoes.incluirImagens,
          incluirAudio: configuracoes.incluirAudio
        },
        configuracaoFaixa: {
          nome_exibicao: configuracaoFaixa.nome_exibicao,
          tipos_questoes_permitidas: configuracaoFaixa.tipos_questoes_permitidas,
          recursos_obrigatorios: configuracoes.recursosOpcionais || [],
          distribuicao_dificuldade_padrao: configuracaoFaixa.distribuicao_dificuldade_padrao
        },
        detalhesConteudo
      };

      console.log('[DEBUG] ✅ Parâmetros preparados:', JSON.stringify(avaliacaoParams, null, 2));
      console.log('[DEBUG] 🤖 Importando serviço OpenAI...');

      // Serviço já importado estaticamente no topo do arquivo
      console.log('[DEBUG] ✅ Serviço OpenAI disponível (import estático)');
      
      console.log('[DEBUG] ⚡ Chamando generateAvaliacaoWithOpenAI...');
      
      // Chamar a função de geração
      let avaliacaoGerada;
      try {
        avaliacaoGerada = await generateAvaliacaoWithOpenAI(avaliacaoParams);
        console.log('[DEBUG] ✅ Função OpenAI retornou. Tamanho do resultado:', avaliacaoGerada?.length || 0);
      } catch (openaiError) {
        console.error('[DEBUG] ❌ Erro na chamada OpenAI:', openaiError);
        const errorMsg = openaiError instanceof Error ? openaiError.message : String(openaiError);
        toast.error(`Erro na geração da IA: ${errorMsg}`);
        setGenerating(false);
        return;
      }

      if (!avaliacaoGerada?.trim()) {
        console.log('[DEBUG] ❌ Erro: IA retornou conteúdo vazio');
        toast.error('A IA não conseguiu gerar a avaliação');
        setGenerating(false);
        return;
      }

      // Limitar tamanho do conteúdo HTML para evitar overflow
      const maxHTMLSize = 1000000; // 1MB de limite
      let conteudoHTMLFinal = avaliacaoGerada;
      if (avaliacaoGerada.length > maxHTMLSize) {
        conteudoHTMLFinal = avaliacaoGerada.substring(0, maxHTMLSize) + '\n\n[Conteúdo truncado devido ao tamanho]';
        console.log('[DEBUG] ⚠️ Conteúdo HTML truncado devido ao tamanho:', avaliacaoGerada.length, '->', conteudoHTMLFinal.length);
      }

      console.log('[DEBUG] 💾 Salvando avaliação no banco de dados...');

      // Salvar no banco
      let avaliacaoSalva;
      try {
        // Validar limites dos campos numéricos para evitar overflow
        const tempoEstimadoSeguro = Math.min(Math.max(configuracoes.tempoEstimado || 30, 1), 999);
        // Campo nota_maxima agora suporta DECIMAL(6,2) - até 9999.99
        const notaMaximaSegura = Math.min(Math.max(configuracoes.notaMaxima || 10, 1), 9999.99);
        const pesoSeguro = Math.min(Math.max(configuracoes.peso || 1, 1), 10);
        const quantidadeQuestoesSegura = Math.min(Math.max(configuracoes.quantidadeQuestoes || 10, 1), 50);

        // Verificar se algum valor resultou em NaN
        if (isNaN(tempoEstimadoSeguro) || isNaN(notaMaximaSegura) || isNaN(pesoSeguro) || isNaN(quantidadeQuestoesSegura)) {
          throw new Error(`Valores inválidos detectados: tempo=${tempoEstimadoSeguro}, nota=${notaMaximaSegura}, peso=${pesoSeguro}, questoes=${quantidadeQuestoesSegura}`);
        }

        console.log('[DEBUG] 🔢 Valores numéricos validados:', {
          tempo_estimado: tempoEstimadoSeguro,
          nota_maxima: notaMaximaSegura,
          peso: pesoSeguro,
          quantidade_questoes: quantidadeQuestoesSegura,
          valores_originais: {
            tempo_estimado_original: configuracoes.tempoEstimado,
            nota_maxima_original: configuracoes.notaMaxima,
            peso_original: configuracoes.peso,
            quantidade_questoes_original: configuracoes.quantidadeQuestoes
          }
        });

        // Validar IDs numéricos para evitar overflow
        const professorId = Number(planoAula.professor_id);
        const turmaId = Number(planoAula.turma_id);
        const disciplinaId = Number(planoAula.disciplina_id);
        const escolaId = Number(planoAula.escola_id);
        
        // CORREÇÃO: Validar se o planoId é UUID ou numérico
        let planoAulaId: string | number;
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(planoId || '');
        
        if (isUUID) {
          // Se for UUID, manter como string
          planoAulaId = planoId!;
          console.log('[DEBUG] 🆔 Plano ID é UUID:', planoAulaId);
        } else {
          // Se for numérico, converter e validar
          planoAulaId = Number(planoId);
          if (!Number.isInteger(planoAulaId) || planoAulaId <= 0 || planoAulaId > 2147483647) {
            throw new Error(`ID do plano de aula inválido: ${planoId}`);
          }
          console.log('[DEBUG] 🆔 Plano ID é numérico:', planoAulaId);
        }

        if (!Number.isInteger(professorId) || professorId <= 0 || professorId > 2147483647) {
          throw new Error(`ID do professor inválido: ${planoAula.professor_id}`);
        }
        if (!Number.isInteger(turmaId) || turmaId <= 0 || turmaId > 2147483647) {
          throw new Error(`ID da turma inválido: ${planoAula.turma_id}`);
        }
        if (!Number.isInteger(disciplinaId) || disciplinaId <= 0 || disciplinaId > 2147483647) {
          throw new Error(`ID da disciplina inválido: ${planoAula.disciplina_id}`);
        }
        if (!Number.isInteger(escolaId) || escolaId <= 0 || escolaId > 2147483647) {
          throw new Error(`ID da escola inválido: ${planoAula.escola_id}`);
        }

        // Preparar campos JSON e validar tamanho
        const conteudoSelecionadoJSON = JSON.stringify(configuracoes.conteudoSelecionado);
        const configuracoesAutomaticasJSON = JSON.stringify({
          faixa_etaria: configuracaoFaixa?.faixa_etaria || 'anos_iniciais',
          tipos_questoes: configuracaoFaixa?.tipos_questoes_permitidas || [],
          recursos_obrigatorios: configuracoes.recursosOpcionais || []
        });

        // Validar tamanho dos campos para evitar overflow
        if (conteudoHTMLFinal.length > 50000) {
          throw new Error(`Conteúdo HTML muito grande: ${conteudoHTMLFinal.length} caracteres (máximo: 50.000)`);
        }
        if (conteudoSelecionadoJSON.length > 10000) {
          throw new Error(`Conteúdo selecionado muito grande: ${conteudoSelecionadoJSON.length} caracteres (máximo: 10.000)`);
        }
        if (configuracoesAutomaticasJSON.length > 5000) {
          throw new Error(`Configurações automáticas muito grandes: ${configuracoesAutomaticasJSON.length} caracteres (máximo: 5.000)`);
        }

        // NOVA VALIDAÇÃO: Verificar se os JSONs são válidos e não contêm caracteres problemáticos
        try {
          JSON.parse(conteudoSelecionadoJSON); // Testar se é válido
          JSON.parse(configuracoesAutomaticasJSON); // Testar se é válido
        } catch (jsonError) {
          throw new Error(`Erro na validação JSON: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`);
        }

        // NOVA VALIDAÇÃO: Verificar se não há caracteres especiais problemáticos
        const caracteresProblematicos = ['\x00', '\uFFFD', '\uFEFF'];
        for (const campo of [conteudoHTMLFinal, conteudoSelecionadoJSON, configuracoesAutomaticasJSON]) {
          for (const char of caracteresProblematicos) {
            if (campo.includes(char)) {
              throw new Error(`Caractere problemático detectado no campo: ${char.charCodeAt(0).toString(16)}`);
            }
          }
        }

        console.log('[DEBUG] 📄 VALIDAÇÃO JSON - Tamanhos:', {
          conteudo_html: conteudoHTMLFinal.length,
          conteudo_selecionado: conteudoSelecionadoJSON.length,
          configuracoes_automaticas: configuracoesAutomaticasJSON.length,
          conteudo_selecionado_preview: conteudoSelecionadoJSON.substring(0, 200),
          configuracoes_automaticas_preview: configuracoesAutomaticasJSON.substring(0, 200)
        });

        // Preparar dados para inserção
        const dadosInsercao = {
          titulo: configuracoes.titulo?.substring(0, 200) || 'Sem título',
          descricao: configuracoes.descricao?.substring(0, 500) || '',
          conteudo_html: conteudoHTMLFinal,
            tipo: configuracoes.tipo,
          data_aplicacao: configuracoes.dataAplicacao || null,
          tempo_estimado: tempoEstimadoSeguro,
          nota_maxima: notaMaximaSegura,
          peso: pesoSeguro,
          quantidade_questoes: quantidadeQuestoesSegura,
            foco_avaliacao: configuracoes.focoAvaliacao,
          incluir_imagens: Boolean(configuracoes.incluirImagens), // CORREÇÃO: Forçar boolean
          incluir_audio: Boolean(configuracoes.incluirAudio), // CORREÇÃO: Forçar boolean
          plano_aula_id: planoAulaId, // CORREÇÃO: Usar o valor numérico convertido
          professor_id: professorId,
          turma_id: turmaId,
          disciplina_id: disciplinaId,
          escola_id: escolaId,
          trimestre: String(planoAula.trimestre),
          conteudo_selecionado: conteudoSelecionadoJSON,
          configuracoes_automaticas: configuracoesAutomaticasJSON,
          instrucoes_personalizadas: configuracoes.instrucoesPersonalizadas || null
        };

        console.log('[DEBUG] 📋 Dados preparados para inserção:', {
          titulo_length: dadosInsercao.titulo.length,
          descricao_length: dadosInsercao.descricao.length,
          conteudo_html_length: dadosInsercao.conteudo_html.length,
          conteudo_selecionado_length: dadosInsercao.conteudo_selecionado.length,
          configuracoes_automaticas_length: dadosInsercao.configuracoes_automaticas.length,
          professor_id: dadosInsercao.professor_id,
          turma_id: dadosInsercao.turma_id,
          disciplina_id: dadosInsercao.disciplina_id,
          escola_id: dadosInsercao.escola_id,
          plano_aula_id: dadosInsercao.plano_aula_id
        });

        // NOVA VERIFICAÇÃO: Validar tipos de dados antes da inserção
        const camposTiposEsperados = {
          titulo: 'string',
          descricao: 'string', 
          conteudo_html: 'string',
          tipo: 'string',
          data_aplicacao: ['string', 'object'], // pode ser null
          tempo_estimado: 'number',
          nota_maxima: 'number',
          peso: 'number',
          quantidade_questoes: 'number',
          foco_avaliacao: 'string',
          incluir_imagens: 'boolean',
          incluir_audio: 'boolean',
          plano_aula_id: ['string', 'number'], // pode ser UUID ou número
          professor_id: 'number',
          turma_id: 'number',
          disciplina_id: 'number',
          escola_id: 'number',
          trimestre: 'string',
          conteudo_selecionado: 'string',
          configuracoes_automaticas: 'string'
        };

        // Verificar cada campo
        for (const [campo, tipoEsperado] of Object.entries(camposTiposEsperados)) {
          const valor = dadosInsercao[campo as keyof typeof dadosInsercao];
          const tipoAtual = typeof valor;
          
          if (Array.isArray(tipoEsperado)) {
            if (!tipoEsperado.includes(tipoAtual) && valor !== null) {
              throw new Error(`Campo ${campo} tem tipo inválido: ${tipoAtual} (esperado: ${tipoEsperado.join(' ou ')}, valor: ${valor})`);
            }
          } else {
            if (tipoAtual !== tipoEsperado && valor !== null) {
              throw new Error(`Campo ${campo} tem tipo inválido: ${tipoAtual} (esperado: ${tipoEsperado}, valor: ${valor})`);
            }
          }
        }

        // Validação final para detectar valores que podem causar overflow
        const camposNumericos = {
          tempo_estimado: dadosInsercao.tempo_estimado,
          nota_maxima: dadosInsercao.nota_maxima,
          peso: dadosInsercao.peso,
          quantidade_questoes: dadosInsercao.quantidade_questoes,
          professor_id: dadosInsercao.professor_id,
          turma_id: dadosInsercao.turma_id,
          disciplina_id: dadosInsercao.disciplina_id,
          escola_id: dadosInsercao.escola_id
          // REMOVIDO: plano_aula_id pode ser UUID (string), não apenas numérico
        };

        // Verificar se algum campo numérico está fora dos limites seguros
        for (const [campo, valor] of Object.entries(camposNumericos)) {
          if (typeof valor !== 'number' || isNaN(valor)) {
            throw new Error(`Campo ${campo} tem valor inválido: ${valor} (tipo: ${typeof valor})`);
          }
          if (valor > 2147483647) {
            throw new Error(`Campo ${campo} muito grande para o banco: ${valor} (máximo: 2147483647)`);
          }
          if (valor < 0) {
            throw new Error(`Campo ${campo} não pode ser negativo: ${valor}`);
          }
        }

        // Validação separada para plano_aula_id (pode ser string UUID ou número)
        if (typeof planoAulaId === 'number') {
          if (isNaN(planoAulaId) || planoAulaId > 2147483647 || planoAulaId < 0) {
            throw new Error(`ID do plano de aula numérico inválido: ${planoAulaId}`);
          }
        } else if (typeof planoAulaId === 'string') {
          if (!isUUID) {
            throw new Error(`ID do plano de aula string inválido (não é UUID): ${planoAulaId}`);
          }
        } else {
          throw new Error(`Tipo de ID do plano de aula não suportado: ${typeof planoAulaId}`);
        }

        // Log final de verificação antes do insert
        console.log('[DEBUG] ✅ VALORES FINAIS PARA BANCO:', {
          'Campos Numéricos': {
            tempo_estimado: `${dadosInsercao.tempo_estimado} (${typeof dadosInsercao.tempo_estimado})`,
            nota_maxima: `${dadosInsercao.nota_maxima} (${typeof dadosInsercao.nota_maxima})`,
            peso: `${dadosInsercao.peso} (${typeof dadosInsercao.peso})`,
            quantidade_questoes: `${dadosInsercao.quantidade_questoes} (${typeof dadosInsercao.quantidade_questoes})`,
            professor_id: `${dadosInsercao.professor_id} (${typeof dadosInsercao.professor_id})`,
            turma_id: `${dadosInsercao.turma_id} (${typeof dadosInsercao.turma_id})`,
            disciplina_id: `${dadosInsercao.disciplina_id} (${typeof dadosInsercao.disciplina_id})`,
            escola_id: `${dadosInsercao.escola_id} (${typeof dadosInsercao.escola_id})`,
            plano_aula_id: `${dadosInsercao.plano_aula_id} (${typeof dadosInsercao.plano_aula_id})` // Pode ser UUID ou número
          },
          'Verificação NaN': {
            tempoNaN: isNaN(dadosInsercao.tempo_estimado),
            notaNaN: isNaN(dadosInsercao.nota_maxima),
            pesoNaN: isNaN(dadosInsercao.peso),
            questoesNaN: isNaN(dadosInsercao.quantidade_questoes),
            professorNaN: isNaN(dadosInsercao.professor_id),
            turmaNaN: isNaN(dadosInsercao.turma_id),
            disciplinaNaN: isNaN(dadosInsercao.disciplina_id),
            escolaNaN: isNaN(dadosInsercao.escola_id)
            // REMOVIDO: planoAulaNaN - pode ser UUID string
          },
          'Verificação Limites PostgreSQL': {
            tempo_overflow: dadosInsercao.tempo_estimado > 2147483647,
            nota_overflow: dadosInsercao.nota_maxima > 2147483647,
            peso_overflow: dadosInsercao.peso > 2147483647,
            questoes_overflow: dadosInsercao.quantidade_questoes > 2147483647,
            professor_overflow: dadosInsercao.professor_id > 2147483647,
            turma_overflow: dadosInsercao.turma_id > 2147483647,
            disciplina_overflow: dadosInsercao.disciplina_id > 2147483647,
            escola_overflow: dadosInsercao.escola_id > 2147483647
          },
          'Tamanhos dos Campos String': {
            titulo_length: dadosInsercao.titulo.length,
            descricao_length: dadosInsercao.descricao.length,
            conteudo_html_length: dadosInsercao.conteudo_html.length,
            conteudo_selecionado_length: dadosInsercao.conteudo_selecionado.length,
            configuracoes_automaticas_length: dadosInsercao.configuracoes_automaticas.length,
            trimestre_length: dadosInsercao.trimestre.length
          }
        });

        // NOVO LOG CRÍTICO: Dump completo do objeto dadosInsercao
        console.log('[DEBUG] 🔍 DUMP COMPLETO - DADOS INSERÇÃO:', JSON.stringify(dadosInsercao, null, 2));
        
        // NOVO LOG CRÍTICO: Verificar se existe algum valor infinito ou NaN oculto
        const valoresProblematicos = [];
        for (const [chave, valor] of Object.entries(dadosInsercao)) {
          if (typeof valor === 'number') {
            if (isNaN(valor)) valoresProblematicos.push(`${chave}: NaN`);
            if (!isFinite(valor)) valoresProblematicos.push(`${chave}: ${valor} (infinito)`);
            if (valor === Infinity) valoresProblematicos.push(`${chave}: Infinity`);
            if (valor === -Infinity) valoresProblematicos.push(`${chave}: -Infinity`);
          }
        }
        
        if (valoresProblematicos.length > 0) {
          console.error('[DEBUG] ⚠️ VALORES PROBLEMÁTICOS DETECTADOS:', valoresProblematicos);
          throw new Error(`Valores problemáticos detectados: ${valoresProblematicos.join(', ')}`);
        }

        const { data, error } = await supabase
          .from('avaliacoes')
          .insert([dadosInsercao])
          .select()
          .single();

        if (error) {
          console.error('[DEBUG] ❌ Erro ao salvar no banco:', error);
          console.error('[DEBUG] 🔍 DETALHES COMPLETOS DO ERRO SUPABASE:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          
          // Analisar erro específico
          if (error.message.includes('numeric field overflow')) {
            console.error('[DEBUG] 🔍 NUMERIC OVERFLOW DETECTADO - Análise detalhada:');
            console.error('[DEBUG] 📊 Todos os valores numéricos enviados:', {
              tempo_estimado: `${dadosInsercao.tempo_estimado} (max: 2147483647)`,
              nota_maxima: `${dadosInsercao.nota_maxima} (max: 9999.99 para DECIMAL(6,2))`,
              peso: `${dadosInsercao.peso} (max: 2147483647)`,
              quantidade_questoes: `${dadosInsercao.quantidade_questoes} (max: 2147483647)`,
              professor_id: `${dadosInsercao.professor_id} (max: 2147483647)`,
              turma_id: `${dadosInsercao.turma_id} (max: 2147483647)`,
              disciplina_id: `${dadosInsercao.disciplina_id} (max: 2147483647)`,
              escola_id: `${dadosInsercao.escola_id} (max: 2147483647)`
            });
          }
          
          throw new Error(`Erro ao salvar no banco: ${error.message}. Detalhes: ${error.details || 'N/A'}`);
        }

        avaliacaoSalva = data;
        console.log('[DEBUG] ✅ Avaliação salva com sucesso. ID:', avaliacaoSalva.id);
      } catch (dbError) {
        console.error('[DEBUG] ❌ Erro ao salvar avaliação:', dbError);
        const errorMsg = dbError instanceof Error ? dbError.message : String(dbError);
        toast.error(`Erro ao salvar: ${errorMsg}`);
        setGenerating(false);
        return;
      }

      // Sucesso total
      console.log('[DEBUG] 🎉 Processo completo com sucesso!');
      toast.success('Avaliação gerada e salva com sucesso!');
      
      console.log('[DEBUG] 🧭 Navegando para visualização:', `/avaliacoes/${avaliacaoSalva.id}?created=true`);
      
      // Navegar para visualização
      navigate(`/avaliacoes/${avaliacaoSalva.id}?created=true`);

    } catch (error) {
      console.error('[DEBUG] ❌ Erro geral na função gerarAvaliacao:', error);
      console.error('[DEBUG] ❌ Stack trace:', error instanceof Error ? error.stack : 'N/A');
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast.error(`Erro ao gerar avaliação: ${errorMessage}`);
      
      setGenerating(false);
    }
  };

  // Função para validar campos obrigatórios
  const validarCamposObrigatorios = () => {
    const camposFaltando = [];

    if (!configuracoes.titulo || configuracoes.titulo.trim() === '') {
      camposFaltando.push('Título da Avaliação');
    }

    if (!configuracoes.tipo || configuracoes.tipo.trim() === '') {
      camposFaltando.push('Tipo de Avaliação');
    }

    if (!configuracoes.notaMaxima || configuracoes.notaMaxima <= 0) {
      camposFaltando.push('Nota Máxima');
    }

    if (!configuracoes.quantidadeQuestoes || configuracoes.quantidadeQuestoes <= 0) {
      camposFaltando.push('Quantidade de Questões');
    }

    if (!configuracoes.focoAvaliacao || configuracoes.focoAvaliacao.trim() === '') {
      camposFaltando.push('Foco da Avaliação');
    }

    if (configuracoes.conteudoSelecionado.length === 0) {
      camposFaltando.push('Pelo menos um conteúdo selecionado');
    }

    return {
      valido: camposFaltando.length === 0,
      camposFaltando
    };
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando dados do plano de aula...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!planoAula || !configuracaoFaixa) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <p className="mt-4 text-gray-600">Erro ao carregar dados do plano de aula</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      headerTitle="Criar Avaliação"
      headerSubtitle={planoAula ? `Baseada no plano: ${planoAula.titulo}` : "Carregando..."}
      headerIcon={<Sparkles className="h-5 w-5 text-indigo-600" />}
      mostrarEscola={true}
    >
      <div className="page-center px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        <div className="standard-page-card space-y-6">
          {/* Informações do Plano */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-indigo-600" />
              Informações do Plano de Aula
            </h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <div className="flex items-center space-x-1 flex-shrink-0">
                <BookOpen className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-gray-600">Disciplina:</span>
                <span className="text-sm font-medium text-gray-900">{planoAula.disciplinaNome}</span>
              </div>
              <div className="flex items-center space-x-1 flex-shrink-0">
                <Users className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-600">Turma:</span>
                <span className="text-sm font-medium text-gray-900">{planoAula.turmaAno}</span>
              </div>
              <div className="flex items-center space-x-1 flex-shrink-0">
                <Target className="h-4 w-4 text-purple-500" />
                <span className="text-sm text-gray-600">Modalidade:</span>
                <span className="text-sm font-medium text-gray-900">{planoAula.modalidadeNome}</span>
              </div>
              <div className="flex items-center space-x-1 flex-shrink-0">
                <Calendar className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-gray-600">Período:</span>
                <span className="text-sm font-medium text-gray-900">{planoAula.trimestre}</span>
              </div>
              <div className="flex items-center space-x-1 flex-shrink-0">
                <Award className="h-4 w-4 text-indigo-500" />
                <span className="text-sm text-gray-600">Faixa:</span>
                <span className="text-sm font-medium text-gray-900">{configuracaoFaixa.nome_exibicao}</span>
              </div>
            </div>
          </div>

          {/* Navegação por Etapas */}
          <div className="mb-6">
            <div className="relative">
              {/* Linha de progresso */}
              <div className="absolute top-6 left-0 w-full h-0.5 bg-gray-200 z-0"></div>
              <div 
                className="absolute top-6 left-0 h-0.5 bg-indigo-500 z-0 transition-all duration-300"
                style={{ width: `${((etapaAtual - 1) / 3) * 100}%` }}
              ></div>
              
              <div className="flex items-center justify-between relative z-10">
                {[
                  { 
                    num: 1, 
                    titulo: 'O que avaliar?', 
                    subtitulo: 'Escolha o conteúdo', 
                    icon: '📚' 
                  },
                  { 
                    num: 2, 
                    titulo: 'Como avaliar?', 
                    subtitulo: 'Configure o formato', 
                    icon: '⚙️' 
                  },
                  { 
                    num: 3, 
                    titulo: 'Personalizar', 
                    subtitulo: 'Ajustar detalhes', 
                    icon: '🎨' 
                  },
                  { 
                    num: 4, 
                    titulo: 'Finalizar', 
                    subtitulo: 'Revisar e gerar', 
                    icon: '✨' 
                  }
                ].map((etapa) => {
                  const isCompleted = etapaAtual > etapa.num;
                  const isCurrent = etapaAtual === etapa.num;
                  const isAccessible = etapa.num <= etapaAtual + 1; // Permite ir para a próxima etapa
                  
                  return (
                <div
                  key={etapa.num}
                      className={`flex flex-col items-center cursor-pointer transition-all duration-200 group ${
                        !isAccessible ? 'cursor-not-allowed opacity-50' : ''
                      }`}
                      onClick={() => isAccessible && navegarParaEtapa(etapa.num)}
                    >
                      {/* Círculo com ícone */}
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold mb-2 transition-all duration-200 ${
                          isCompleted
                            ? 'bg-green-500 text-white shadow-lg'
                            : isCurrent
                            ? 'bg-indigo-500 text-white shadow-lg ring-4 ring-indigo-100'
                            : isAccessible
                            ? 'bg-gray-200 text-gray-600 group-hover:bg-gray-300'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {isCompleted ? '✓' : etapa.icon}
                </div>
                      
                      {/* Texto */}
                      <div className="text-center max-w-24">
                        <div
                          className={`font-medium text-sm transition-colors ${
                            isCurrent
                              ? 'text-indigo-700'
                              : isCompleted
                              ? 'text-green-700'
                              : isAccessible
                              ? 'text-gray-700 group-hover:text-indigo-600'
                              : 'text-gray-400'
                          }`}
                        >
                          {etapa.titulo}
                        </div>
                        <div
                          className={`text-xs mt-1 transition-colors ${
                            isCurrent
                              ? 'text-indigo-600'
                              : isCompleted
                              ? 'text-green-600'
                              : isAccessible
                              ? 'text-gray-500 group-hover:text-indigo-500'
                              : 'text-gray-400'
                          }`}
                        >
                          {etapa.subtitulo}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Indicador de progresso em texto */}
            <div className="mt-4 text-center">
              <span className="text-sm text-gray-600">
                Passo {etapaAtual} de 4: 
                <span className="font-medium ml-1">
                  {etapaAtual === 1 && 'Selecionando conteúdo do plano de aula'}
                  {etapaAtual === 2 && 'Configurando formato e tipo de avaliação'}
                  {etapaAtual === 3 && 'Personalizando recursos e adaptações'}
                  {etapaAtual === 4 && 'Revisando configurações e gerando avaliação'}
                </span>
              </span>
            </div>
          </div>

          {/* Conteúdo das Etapas */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5" ref={etapasContainerRef}>
            {etapaAtual === 1 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Selecione o Conteúdo para Avaliação
                </h2>
                <p className="text-gray-600 mb-4">
                  Escolha quais partes do plano de aula devem ser incluídas na avaliação. 
                  Por padrão, todos os itens estão selecionados.
                </p>

                {/* Debug: Mostrar informações de debug */}
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">Debug Info:</h4>
                  <p className="text-sm text-yellow-700">Total conteúdos extraídos: {conteudosExtracted.length}</p>
                  <p className="text-sm text-yellow-700">Conteúdo selecionado: {configuracoes.conteudoSelecionado.length}</p>
                  <p className="text-sm text-yellow-700">Loading: {loading ? 'true' : 'false'}</p>
                  <p className="text-sm text-yellow-700">Plano ID: {planoId}</p>
                  {conteudosExtracted.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-yellow-700">Tipos disponíveis:</p>
                      <ul className="text-xs text-yellow-600 ml-4">
                        {['mes', 'semana', 'habilidade'].map(tipo => {
                          const count = conteudosExtracted.filter(c => c.tipo === tipo).length;
                          return <li key={tipo}>{tipo}: {count}</li>;
                        })}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {/* Agrupar por tipo */}
                  {['mes', 'semana', 'habilidade'].map(tipo => {
                    const conteudosFiltrados = obterConteudosFiltrados();
                    const itens = conteudosFiltrados.filter(c => c.tipo === tipo);
                    
                    console.log(`[DEBUG] Renderizando tipo ${tipo}:`, itens.length, 'itens');
                    
                    if (itens.length === 0) {
                      console.log(`[DEBUG] Nenhum item do tipo ${tipo} encontrado`);
                      return (
                        <div key={tipo} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                          <h3 className="text-lg font-medium text-red-800 mb-2">
                            {tipo === 'mes' ? 'Meses do Plano' : tipo === 'semana' ? 'Semanas Específicas' : 'Habilidades BNCC'}
                          </h3>
                          <p className="text-sm text-red-600">Nenhum item do tipo "{tipo}" foi encontrado.</p>
                        </div>
                      );
                    }

                    const tipoLabel = {
                      mes: 'Meses do Plano',
                      semana: 'Semanas Específicas', 
                      habilidade: 'Habilidades BNCC'
                    }[tipo];

                    return (
                      <div key={tipo}>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          {tipoLabel}
                          {tipo !== 'mes' && (
                            <span className="text-sm text-gray-500 ml-2">
                              (baseado nos meses selecionados)
                            </span>
                          )}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {itens.map(item => {
                            // Para meses, verificar se é o último selecionado
                            const mesesSelecionados = conteudosFiltrados.filter(c => 
                              c.tipo === 'mes' && 
                              configuracoes.conteudoSelecionado.includes(c.id)
                            );

                            // Para semanas, verificar se é a última selecionada
                            const semanasSelecionadas = conteudosFiltrados.filter(c => 
                              c.tipo === 'semana' && 
                              configuracoes.conteudoSelecionado.includes(c.id)
                            );

                            // Para habilidades, verificar se é a última selecionada
                            const habilidadesSelecionadas = conteudosFiltrados.filter(c => 
                              c.tipo === 'habilidade' && 
                              configuracoes.conteudoSelecionado.includes(c.id)
                            );
                            
                            const podeDesmarcar = 
                              // Se não está selecionado, pode ser marcado
                              !configuracoes.conteudoSelecionado.includes(item.id) ||
                              // Para meses: pode desmarcar se há mais de 1 mês selecionado
                              (item.tipo === 'mes' && mesesSelecionados.length > 1) ||
                              // Para semanas: pode desmarcar se há mais de 1 semana selecionada
                              (item.tipo === 'semana' && semanasSelecionadas.length > 1) ||
                              // Para habilidades: pode desmarcar se há mais de 1 habilidade selecionada
                              (item.tipo === 'habilidade' && habilidadesSelecionadas.length > 1);

                            const isUltimoItemSelecionado = 
                              configuracoes.conteudoSelecionado.includes(item.id) && (
                                (item.tipo === 'mes' && mesesSelecionados.length === 1) ||
                                (item.tipo === 'semana' && semanasSelecionadas.length === 1) ||
                                (item.tipo === 'habilidade' && habilidadesSelecionadas.length === 1)
                              );

                            const tipoTexto = {
                              mes: 'mês',
                              semana: 'semana', 
                              habilidade: 'habilidade'
                            }[item.tipo];

                            return (
                              <div
                                key={item.id}
                                className={`p-3 rounded-lg border-2 transition-all ${
                                  configuracoes.conteudoSelecionado.includes(item.id)
                                    ? 'border-indigo-300 bg-indigo-50'
                                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                                }`}
                              >
                                <div className="flex items-start justify-between">
                                  <div 
                                    className={`flex-1 ${podeDesmarcar ? 'cursor-pointer' : 'cursor-not-allowed opacity-75'}`}
                                    onClick={() => podeDesmarcar && toggleConteudoSelecionado(item.id)}
                                  >
                                    <h4 className="font-medium text-gray-900 text-sm">{item.titulo}</h4>
                                    <p className="text-xs text-gray-600 mt-1">{item.descricao}</p>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                    {item.periodo && (
                                        <span className="inline-block px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded">
                                        {item.periodo}
                                      </span>
                                    )}
                                    {isUltimoItemSelecionado && (
                                        <span className="inline-block px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded">
                                          Obrigatório
                                      </span>
                                    )}
                                  </div>
                                  </div>
                                  <div className="ml-2 flex flex-col items-center space-y-1">
                                    <div 
                                      className={`${podeDesmarcar ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'} ${
                                        configuracoes.conteudoSelecionado.includes(item.id)
                                          ? 'text-indigo-600'
                                          : 'text-gray-400'
                                      }`}
                                      onClick={() => podeDesmarcar && toggleConteudoSelecionado(item.id)}
                                      title={
                                        !podeDesmarcar 
                                          ? `Pelo menos ${tipoTexto === 'habilidade' ? 'uma' : tipoTexto === 'semana' ? 'uma' : 'um'} ${tipoTexto} deve permanecer selecionado${tipoTexto === 'habilidade' ? 'a' : tipoTexto === 'semana' ? 'a' : ''}. Selecione outr${tipoTexto === 'habilidade' ? 'a' : tipoTexto === 'semana' ? 'a' : 'o'} ${tipoTexto} primeiro para poder desmarcar est${tipoTexto === 'habilidade' ? 'a' : tipoTexto === 'semana' ? 'a' : 'e'}.` 
                                          : configuracoes.conteudoSelecionado.includes(item.id) 
                                            ? 'Clique para desmarcar'
                                            : 'Clique para selecionar'
                                      }
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                    </div>
                                    {(item.tipo === 'mes' || item.tipo === 'semana') && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          item.tipo === 'mes' ? abrirDetalhesDoMes(item) : abrirDetalhesDaSemana(item);
                                        }}
                                        className="p-1 rounded-full text-gray-500 hover:text-indigo-600 hover:bg-indigo-100 transition-colors"
                                        title={`Ver detalhes ${item.tipo === 'mes' ? 'do mês' : 'da semana'}`}
                                      >
                                        <Eye className="h-3 w-3" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {etapaAtual === 2 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Configurações Automáticas
                </h2>
                <p className="text-gray-600 mb-6">
                  Configurações pedagógicas aplicadas automaticamente para {configuracaoFaixa.nome_exibicao}
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Informações Básicas */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Informações Básicas</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Título da Avaliação <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={configuracoes.titulo}
                        onChange={(e) => setConfiguracoes(prev => ({ ...prev, titulo: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          !configuracoes.titulo.trim() ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                        placeholder="Digite o título da avaliação..."
                      />
                      {!configuracoes.titulo.trim() && (
                        <p className="text-red-500 text-xs mt-1">Este campo é obrigatório</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de Avaliação <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={configuracoes.tipo}
                        onChange={(e) => setConfiguracoes(prev => ({ ...prev, tipo: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          !configuracoes.tipo ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Selecione o tipo...</option>
                        <option value="atividade">Atividade</option>
                        <option value="prova">Prova</option>
                        <option value="trabalho">Trabalho</option>
                        <option value="projeto">Projeto</option>
                        <option value="apresentacao">Apresentação</option>
                      </select>
                      {!configuracoes.tipo && (
                        <p className="text-red-500 text-xs mt-1">Este campo é obrigatório</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nota Máxima <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="9999.99"
                          step="0.01"
                          value={configuracoes.notaMaxima}
                          onChange={(e) => setConfiguracoes(prev => ({ ...prev, notaMaxima: Number(e.target.value) }))}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                            !configuracoes.notaMaxima || configuracoes.notaMaxima <= 0 ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                        />
                        {(!configuracoes.notaMaxima || configuracoes.notaMaxima <= 0) && (
                          <p className="text-red-500 text-xs mt-1">Obrigatório</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Peso
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={configuracoes.peso}
                          onChange={(e) => setConfiguracoes(prev => ({ ...prev, peso: Number(e.target.value) }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Configurações Automáticas */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Configurações por Faixa Etária</h3>
                    
                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-3">
                        <Clock className="h-5 w-5 text-indigo-600" />
                        <span className="font-medium text-indigo-900">Tempo Recomendado</span>
                      </div>
                      <p className="text-indigo-700">{configuracaoFaixa.tempo_recomendado_minutos} minutos</p>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-3">
                        <Target className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-900">Tipos de Questões Permitidas</span>
                      </div>
                      <div className="space-y-1">
                        {configuracaoFaixa.tipos_questoes_permitidas.map(tipo => (
                          <span key={tipo} className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-sm mr-2">
                            {tipo.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-center space-x-2 mb-3">
                        <Award className="h-5 w-5 text-purple-600" />
                        <span className="font-medium text-purple-900">Recursos Recomendados (Opcionais)</span>
                      </div>
                      <div className="space-y-3">
                        <p className="text-sm text-purple-700">
                          Selecione os recursos que deseja incluir na avaliação:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {configuracaoFaixa.recursos_recomendados.map(recurso => (
                            <label key={recurso} className="flex items-center space-x-2 p-2 bg-white rounded border border-purple-200 hover:bg-purple-25 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={configuracoes.recursosOpcionais?.includes(recurso) || false}
                                onChange={(e) => {
                                  const recursosAtuais = configuracoes.recursosOpcionais || [];
                                  if (e.target.checked) {
                                    setConfiguracoes(prev => ({
                                      ...prev,
                                      recursosOpcionais: [...recursosAtuais, recurso]
                                    }));
                                  } else {
                                    setConfiguracoes(prev => ({
                                      ...prev,
                                      recursosOpcionais: recursosAtuais.filter(r => r !== recurso)
                                    }));
                                  }
                                }}
                                className="text-purple-600 focus:ring-purple-500"
                              />
                              <span className="text-sm text-purple-800">
                                {recurso.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {etapaAtual === 3 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Personalização da Avaliação
                </h2>
                <p className="text-gray-600 mb-6">
                  Ajuste as configurações específicas conforme suas necessidades pedagógicas.
                </p>

                {/* Layout único em coluna */}
                <div className="max-w-4xl mx-auto space-y-8">
                  {/* Configurações de Questões */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                      <Settings className="h-5 w-5 mr-2 text-indigo-600" />
                      Configurações de Questões
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantidade de Questões <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center space-x-4">
                        <input
                          type="range"
                          min="3"
                          max="50"
                          value={configuracoes.quantidadeQuestoes}
                          onChange={(e) => setConfiguracoes(prev => ({ ...prev, quantidadeQuestoes: Number(e.target.value) }))}
                          className="flex-1"
                        />
                        <span className={`font-medium px-3 py-1 rounded ${
                          !configuracoes.quantidadeQuestoes || configuracoes.quantidadeQuestoes <= 0 
                            ? 'text-red-600 bg-red-100' 
                            : 'text-indigo-600 bg-indigo-100'
                        }`}>
                          {configuracoes.quantidadeQuestoes}
                        </span>
                      </div>
                      {(!configuracoes.quantidadeQuestoes || configuracoes.quantidadeQuestoes <= 0) && (
                        <p className="text-red-500 text-xs mt-1">Este campo é obrigatório</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data de Aplicação (Opcional)
                      </label>
                      <input
                        type="date"
                        value={configuracoes.dataAplicacao}
                        onChange={(e) => setConfiguracoes(prev => ({ ...prev, dataAplicacao: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      </div>
                    </div>

                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Foco da Avaliação <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={configuracoes.focoAvaliacao}
                        onChange={(e) => setConfiguracoes(prev => ({ ...prev, focoAvaliacao: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          !configuracoes.focoAvaliacao ? 'border-red-300 bg-red-50' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Selecione o foco da avaliação...</option>
                        <option value="diagnostica">Diagnóstica - Identificar conhecimentos prévios e dificuldades</option>
                        <option value="formativa">Formativa - Acompanhar progresso durante o aprendizado</option>
                        <option value="somativa">Somativa - Avaliar resultados finais e atribuir notas</option>
                        <option value="autoavaliacao">Autoavaliação - Estimular reflexão do aluno sobre seu aprendizado</option>
                      </select>
                      {!configuracoes.focoAvaliacao && (
                        <p className="text-red-500 text-xs mt-1">Este campo é obrigatório</p>
                      )}
                    </div>

                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descrição da Avaliação <span className="text-gray-400 text-xs">(Opcional)</span>
                      </label>
                      <textarea
                        rows={4}
                        value={configuracoes.descricao}
                        onChange={(e) => setConfiguracoes(prev => ({ ...prev, descricao: e.target.value }))}
                        placeholder="Descreva os objetivos e instruções da avaliação..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Instruções para o Aluno <span className="text-gray-400 text-xs">(Opcional)</span>
                      </label>
                      <textarea
                        rows={3}
                        value={configuracoes.instrucoesPersonalizadas || ''}
                        onChange={(e) => setConfiguracoes(prev => ({ 
                          ...prev, 
                          instrucoesPersonalizadas: e.target.value || undefined 
                        }))}
                        placeholder="Digite instruções específicas para esta avaliação..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <div className="mt-2 text-xs text-gray-500">
                        <p className="mb-1">💡 <strong>Dica:</strong> Personalize as instruções conforme o tipo de avaliação:</p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li><strong>Prova consultiva:</strong> "Consulta permitida: livro didático e caderno"</li>
                          <li><strong>Redação:</strong> "Mínimo 15 linhas, máximo 25 linhas"</li>
                          <li><strong>Matemática:</strong> "Mostre todos os cálculos"</li>
                          <li><strong>Deixe vazio</strong> se não quiser instruções específicas</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Formato da Avaliação */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-indigo-600" />
                      Formato da Avaliação
                    </h3>
                    
                    {/* Seleção do formato - vertical stack */}
                    <div className="space-y-4 mb-8">
                      <div 
                        className={`p-6 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                          configuracoes.formatoAvaliacao === 'impressa' 
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                        onClick={() => setConfiguracoes(prev => ({ ...prev, formatoAvaliacao: 'impressa' }))}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            configuracoes.formatoAvaliacao === 'impressa' 
                              ? 'border-blue-500 bg-blue-500' 
                              : 'border-gray-300'
                          }`}>
                            {configuracoes.formatoAvaliacao === 'impressa' && (
                              <div className="w-3 h-3 bg-white rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                              📄 Formato Impresso
                            </h4>
                            <p className="text-gray-600 mt-1">
                              Avaliação otimizada para aplicação em papel, com layout limpo e espaçamento adequado para impressão
                            </p>
                          </div>
                        </div>
                      </div>

                      <div 
                        className={`p-6 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                          configuracoes.formatoAvaliacao === 'digital' 
                            ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200' 
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                        onClick={() => setConfiguracoes(prev => ({ ...prev, formatoAvaliacao: 'digital' }))}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            configuracoes.formatoAvaliacao === 'digital' 
                              ? 'border-purple-500 bg-purple-500' 
                              : 'border-gray-300'
                          }`}>
                            {configuracoes.formatoAvaliacao === 'digital' && (
                              <div className="w-3 h-3 bg-white rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                              📱 Formato Digital
                            </h4>
                            <p className="text-gray-600 mt-1">
                              Avaliação interativa para tablets e dispositivos móveis, com recursos multimídia e adaptações inclusivas
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recursos específicos apenas para formato digital */}
                    {configuracoes.formatoAvaliacao === 'digital' && (
                      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-4">
                          <span className="text-lg">⚙️</span>
                          <h4 className="text-base font-semibold text-purple-900">Recursos Digitais</h4>
                        </div>
                        
                        {/* Grid compacto dos recursos */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                          <div className="flex items-center justify-between p-3 bg-white rounded border border-purple-200">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">📷</span>
                              <span className="text-sm font-medium text-gray-900">Imagens Interativas</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={configuracoes.incluirImagens}
                            onChange={(e) => setConfiguracoes(prev => ({ ...prev, incluirImagens: e.target.checked }))}
                            className="sr-only peer"
                          />
                              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                      </div>

                          <div className="flex items-center justify-between p-3 bg-white rounded border border-purple-200">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">🎵</span>
                              <span className="text-sm font-medium text-gray-900">Áudio e Sons</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={configuracoes.incluirAudio}
                            onChange={(e) => setConfiguracoes(prev => ({ ...prev, incluirAudio: e.target.checked }))}
                            className="sr-only peer"
                          />
                              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                      </div>

                          <div className="flex items-center justify-between p-3 bg-white rounded border border-purple-200">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">🎮</span>
                              <span className="text-sm font-medium text-gray-900">Jogos Interativos</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={configuracoes.adaptacoesInclusivas.jogos || false}
                                onChange={(e) => setConfiguracoes(prev => ({
                                  ...prev,
                                  adaptacoesInclusivas: {
                                    ...prev.adaptacoesInclusivas,
                                    jogos: e.target.checked
                                  }
                                }))}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                    </div>

                          <div className="flex items-center justify-between p-3 bg-white rounded border border-purple-200">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">📱</span>
                              <span className="text-sm font-medium text-gray-900">Interface Touch</span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                                checked={configuracoes.adaptacoesInclusivas.interface_touch || false}
                                onChange={(e) => setConfiguracoes(prev => ({
                                  ...prev,
                                  adaptacoesInclusivas: {
                                    ...prev.adaptacoesInclusivas,
                                    interface_touch: e.target.checked
                                  }
                                }))}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                          </div>
                        </div>

                        {/* Adaptações inclusivas em grid compacto */}
                        <div className="pt-3 border-t border-purple-200">
                          <h5 className="text-sm font-semibold text-purple-900 mb-3 flex items-center">
                            <span className="text-base mr-1">♿</span>
                            Adaptações Inclusivas
                          </h5>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {configuracaoFaixa?.recursos_recomendados?.map(recurso => (
                              <label key={recurso} className="flex items-center space-x-2 p-2 bg-white rounded border border-purple-100 hover:bg-purple-25 transition-colors cursor-pointer text-xs">
                                <input
                                  type="checkbox"
                              checked={configuracoes.adaptacoesInclusivas[recurso] || false}
                              onChange={(e) => setConfiguracoes(prev => ({
                                ...prev,
                                adaptacoesInclusivas: {
                                  ...prev.adaptacoesInclusivas,
                                  [recurso]: e.target.checked
                                }
                              }))}
                                  className="h-3 w-3 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                />
                                <span className="text-xs font-medium text-gray-900 leading-tight">
                                  {recurso.charAt(0).toUpperCase() + recurso.slice(1).replace(/_/g, ' ')}
                                </span>
                            </label>
                            )) || []}
                          </div>
                      </div>
                      </div>
                    )}
                    </div>

                  {/* Observações Especiais */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <AlertCircle className="h-5 w-5 mr-2 text-indigo-600" />
                        Observações Especiais
                    </h3>
                      <textarea
                      rows={4}
                        value={configuracoes.observacoesEspeciais}
                        onChange={(e) => setConfiguracoes(prev => ({ ...prev, observacoesEspeciais: e.target.value }))}
                      placeholder="Instruções especiais, adaptações específicas ou orientações pedagógicas adicionais..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      />
                  </div>
                </div>
              </div>
            )}

            {etapaAtual === 4 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Revisão e Geração da Avaliação
                </h2>
                <p className="text-gray-600 mb-4">
                  Confirme todas as configurações antes de gerar a avaliação com IA.
                </p>

                  <div className="space-y-4">
                  {/* Resumo Compacto */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-indigo-600" />
                      Resumo da Avaliação
                    </h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-lg font-bold text-indigo-600">{configuracoes.quantidadeQuestoes}</div>
                        <div className="text-xs text-gray-600">Questões</div>
                        </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-lg font-bold text-green-600">{configuracoes.notaMaxima}</div>
                        <div className="text-xs text-gray-600">Nota Máxima</div>
                        </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="text-lg font-bold text-purple-600">{configuracoes.tempoEstimado}min</div>
                        <div className="text-xs text-gray-600">Tempo</div>
                        </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          configuracoes.formatoAvaliacao === 'digital' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {configuracoes.formatoAvaliacao === 'digital' ? '📱 Digital' : '📄 Impresso'}
                        </span>
                      </div>
                      </div>
                    </div>

                  {/* Conteúdo Selecionado - Layout Compacto Horizontal */}
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                    <h3 className="text-sm font-medium text-indigo-900 mb-2 flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" />
                        Conteúdo Selecionado
                      </h3>
                    {/* Estatísticas em linha */}
                    <div className="flex items-center mb-2 text-xs">
                      <div className="flex space-x-3">
                        <span className="flex items-center space-x-1">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                          <span className="text-blue-700 font-medium">{conteudosExtracted.filter(c => c.tipo === 'mes' && configuracoes.conteudoSelecionado.includes(c.id)).length}</span>
                          <span className="text-blue-600">mês{conteudosExtracted.filter(c => c.tipo === 'mes' && configuracoes.conteudoSelecionado.includes(c.id)).length !== 1 ? 'es' : ''}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                          <span className="text-green-700 font-medium">{conteudosExtracted.filter(c => c.tipo === 'semana' && configuracoes.conteudoSelecionado.includes(c.id)).length}</span>
                          <span className="text-green-600">semana{conteudosExtracted.filter(c => c.tipo === 'semana' && configuracoes.conteudoSelecionado.includes(c.id)).length !== 1 ? 's' : ''}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                          <span className="text-purple-700 font-medium">{conteudosExtracted.filter(c => c.tipo === 'habilidade' && configuracoes.conteudoSelecionado.includes(c.id)).length}</span>
                          <span className="text-purple-600">habilidade{conteudosExtracted.filter(c => c.tipo === 'habilidade' && configuracoes.conteudoSelecionado.includes(c.id)).length !== 1 ? 's' : ''}</span>
                        </span>
                      </div>
                    </div>

                    {/* Cards compactos lado a lado */}
                    <div className="flex flex-wrap gap-1.5">
                        {conteudosExtracted
                          .filter(c => configuracoes.conteudoSelecionado.includes(c.id))
                          .map(conteudo => (
                          <div 
                            key={conteudo.id} 
                            className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium border ${
                              conteudo.tipo === 'mes' 
                                ? 'bg-blue-100 text-blue-800 border-blue-200' :
                              conteudo.tipo === 'semana' 
                                ? 'bg-green-100 text-green-800 border-green-200' 
                                : 'bg-purple-100 text-purple-800 border-purple-200'
                            }`}
                            title={conteudo.descricao}
                          >
                            <div className={`w-1 h-1 rounded-full ${
                                conteudo.tipo === 'mes' ? 'bg-blue-500' :
                                conteudo.tipo === 'semana' ? 'bg-green-500' : 'bg-purple-500'
                              }`}></div>
                            <span className="whitespace-nowrap">{conteudo.titulo}</span>
                            </div>
                          ))}
                    </div>
                      </div>
                      
                  {/* Geração por IA e Verificação Final - Layout lado a lado */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Geração por IA - Layout mais compacto */}
                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Sparkles className="h-4 w-4 text-purple-600" />
                          <h3 className="text-sm font-medium text-purple-900">Geração por IA</h3>
                    </div>
                  </div>
                      <p className="text-xs text-purple-700 mb-2">Adaptada para {configuracaoFaixa.nome_exibicao}</p>
                      
                      <div className="space-y-1 text-xs text-purple-700">
                        <div className="flex items-center space-x-1">
                          <span className="text-purple-500">✨</span>
                          <span>Questões personalizadas</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="text-purple-500">📚</span>
                          <span>Diretrizes da BNCC</span>
                        </div>
                      </div>

                      {configuracoes.observacoesEspeciais && (
                        <div className="mt-2 p-2 bg-white bg-opacity-60 rounded border border-purple-200">
                          <p className="text-xs text-purple-800">
                            <strong>Observações:</strong> {configuracoes.observacoesEspeciais}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Verificação Final - Formato compacto */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <h4 className="text-sm font-medium text-yellow-900">Verificação Final</h4>
                      </div>
                      <div className="space-y-1 text-xs text-yellow-800">
                        <div className="flex items-center space-x-1">
                        <span className="text-yellow-600">✓</span>
                          <span>Conteúdos selecionados</span>
                    </div>
                        <div className="flex items-center space-x-1">
                        <span className="text-yellow-600">✓</span>
                          <span>Formato definido</span>
                      </div>
                        <div className="flex items-center space-x-1">
                        <span className="text-yellow-600">✓</span>
                          <span>Personalização aplicada</span>
                      </div>
                        <div className="flex items-center space-x-1">
                        <span className="text-yellow-600">✓</span>
                          <span>Pronto para gerar</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Botões de Navegação */}
            <div className="flex justify-between pt-6 border-t border-gray-200 mt-6">
              <button
                onClick={() => navegarParaEtapa(Math.max(1, etapaAtual - 1))}
                disabled={etapaAtual === 1}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              
              {etapaAtual < 4 ? (
                <button
                  onClick={() => navegarParaEtapa(Math.min(4, etapaAtual + 1))}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Próximo
                </button>
              ) : (
                (() => {
                  const validacao = validarCamposObrigatorios();
                  const podeGerar = validacao.valido && !generating;
                  
                  return (
                    <div className="relative group">
                      <button
                        onClick={podeGerar ? gerarAvaliacao : undefined}
                        disabled={!podeGerar}
                        className={`px-6 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                          podeGerar
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                        title={
                          !validacao.valido
                            ? `Campos obrigatórios faltando: ${validacao.camposFaltando.join(', ')}`
                            : ''
                        }
                      >
                        {generating ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            <span>Gerando...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            <span>Gerar Avaliação</span>
                          </>
                        )}
                      </button>
                      
                      {!validacao.valido && (
                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block">
                          <div className="bg-red-600 text-white text-xs rounded py-2 px-3 shadow-lg whitespace-nowrap">
                            <div className="font-semibold mb-1">Campos obrigatórios faltando:</div>
                            <ul className="text-left">
                              {validacao.camposFaltando.map((campo, index) => (
                                <li key={index}>• {campo}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Detalhes do Mês */}
      {modalDetalhesAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header do Modal */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <Calendar className="h-6 w-6 text-indigo-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Detalhes - {mesDetalhes}
                </h2>
              </div>
              <button
                onClick={() => setModalDetalhesAberto(false)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {secoesProcessadas && (
                <div className="space-y-6">
                  {/* Título do Mês */}
                  {secoesProcessadas.titulo && (
                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                      <h3 className="text-lg font-semibold text-indigo-900">
                        {secoesProcessadas.titulo}
                      </h3>
                    </div>
                  )}

                  {/* Habilidades BNCC */}
                  {secoesProcessadas && secoesProcessadas.habilidades.length > 0 && (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h4 className="text-base font-semibold text-green-900 mb-3 flex items-center">
                        <Target className="h-4 w-4 mr-2" />
                        Habilidades BNCC
                      </h4>
                      <ul className="space-y-2">
                        {secoesProcessadas.habilidades.map((habilidade, index) => (
                          <li key={index} className="text-sm text-green-800 flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 flex-shrink-0"></span>
                            <span className="truncate">{habilidade}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Objetivos */}
                  {secoesProcessadas && secoesProcessadas.objetivos.length > 0 && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="text-base font-semibold text-blue-900 mb-3 flex items-center">
                        <Award className="h-4 w-4 mr-2" />
                        Objetivos Específicos
                      </h4>
                      <ul className="space-y-2">
                        {secoesProcessadas.objetivos.map((objetivo, index) => (
                          <li key={index} className="text-sm text-blue-800 flex items-center">
                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 flex-shrink-0"></span>
                            <span className="truncate">{objetivo}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Desenvolvimento das Aulas */}
                  {secoesProcessadas && secoesProcessadas.desenvolvimento.length > 0 && (
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <h4 className="text-base font-semibold text-purple-900 mb-3 flex items-center">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Desenvolvimento das Aulas
                      </h4>
                      <ul className="space-y-2">
                        {secoesProcessadas.desenvolvimento.map((item, index) => (
                          <li key={index} className="text-sm text-purple-800 flex items-center">
                            <span className="w-2 h-2 bg-purple-500 rounded-full mr-2 flex-shrink-0"></span>
                            <span className="truncate">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Atividades */}
                  {secoesProcessadas && secoesProcessadas.atividades.length > 0 && (
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <h4 className="text-base font-semibold text-orange-900 mb-3 flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        Atividades Planejadas
                      </h4>
                      <ul className="space-y-2">
                        {secoesProcessadas.atividades.map((atividade, index) => (
                          <li key={index} className="text-sm text-orange-800 flex items-center">
                            <span className="w-2 h-2 bg-orange-500 rounded-full mr-2 flex-shrink-0"></span>
                            <span className="truncate">{atividade}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Observações e Recursos */}
                  {secoesProcessadas && secoesProcessadas.observacoes.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        Recursos e Observações
                      </h4>
                      <ul className="space-y-2">
                        {secoesProcessadas.observacoes.map((observacao, index) => (
                          <li key={index} className="text-sm text-gray-800 flex items-center">
                            <span className="w-2 h-2 bg-gray-500 rounded-full mr-2 flex-shrink-0"></span>
                            <span className="truncate">{observacao}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Caso não encontre conteúdo estruturado */}
                  {secoesProcessadas && !secoesProcessadas.titulo && 
                   secoesProcessadas.habilidades.length === 0 && 
                   secoesProcessadas.objetivos.length === 0 && 
                   secoesProcessadas.desenvolvimento.length === 0 && 
                   secoesProcessadas.atividades.length === 0 && (
                    <div className="bg-gray-50 p-6 rounded-lg text-center">
                      <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">
                        Não foi possível extrair o conteúdo estruturado para este mês.
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Verifique se o plano de aula está formatado corretamente.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer do Modal */}
            <div className="flex justify-end p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setModalDetalhesAberto(false)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default CriarAvaliacaoPlanoAula;