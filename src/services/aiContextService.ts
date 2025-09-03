import { supabase } from '../lib/supabaseClient';
import { Professor } from '../types';

export interface TurmaContext {
  id: number;
  nome: string;
  disciplina: string;
  periodo: string;
  ano_letivo: string;
  total_alunos: number;
  alunos_ativos: number;
}

export interface AlunoContext {
  id: number;
  nome: string;
  matricula: string;
  idade?: number;
  desempenho_geral?: string;
  frequencia?: number;
  observacoes?: string;
}

export interface PlanoAulaContext {
  id: number;
  titulo: string;
  disciplina: string;
  data_aula: string;
  objetivos: string[];
  conteudo: string;
  metodologia: string;
  recursos: string[];
  avaliacao: string;
  status: string;
}

export interface AvaliacaoContext {
  id: number;
  titulo: string;
  tipo: string;
  disciplina: string;
  data_aplicacao: string;
  nota_media: number;
  total_alunos: number;
  aprovados: number;
  reprovados: number;
}

export interface AIContext {
  // Contexto do Professor
  professor: {
    nome: string;
    email: string;
    telefone?: string;
    especialidades: string[];
    experiencia_anos?: number;
    formacao?: string;
  };
  
  // Contexto Institucional
  instituicao: {
    nome?: string;
    tipo?: string;
    nivel_ensino: string[];
    metodologia_preferida?: string;
  };
  
  // Contexto da Sessão Atual
  sessao: {
    turma_ativa?: TurmaContext;
    disciplina_ativa?: string;
    periodo_letivo: string;
    data_atual: string;
    hora_atual: string;
  };
  
  // Contexto Educacional
  educacional: {
    turmas: TurmaContext[];
    total_alunos: number;
    disciplinas_lecionadas: string[];
    planos_aula_recentes: PlanoAulaContext[];
    avaliacoes_recentes: AvaliacaoContext[];
    desafios_identificados: string[];
    objetivos_pedagogicos: string[];
  };
  
  // Contexto de Interação
  interacao: {
    historico_conversas: number;
    temas_frequentes: string[];
    preferencias_resposta: {
      nivel_detalhamento: 'basico' | 'intermediario' | 'avancado';
      formato_preferido: 'texto' | 'lista' | 'estruturado';
      incluir_exemplos: boolean;
      incluir_referencias: boolean;
    };
  };
}

export class AIContextService {
  private static instance: AIContextService;
  private contextCache: Map<string, any> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  public static getInstance(): AIContextService {
    if (!AIContextService.instance) {
      AIContextService.instance = new AIContextService();
    }
    return AIContextService.instance;
  }

  private isCacheValid(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    return expiry ? Date.now() < expiry : false;
  }

  private setCache(key: string, data: any): void {
    this.contextCache.set(key, data);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_DURATION);
  }

  private getCache(key: string): any {
    if (this.isCacheValid(key)) {
      return this.contextCache.get(key);
    }
    this.contextCache.delete(key);
    this.cacheExpiry.delete(key);
    return null;
  }

  async buildCompleteContext(professorData: Professor): Promise<AIContext> {
    const cacheKey = `context_${professorData.id}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      console.log('🔍 Iniciando coleta de contexto real para professor:', professorData.nome);
      
      const [
        turmasData,
        planosAulaData,
        avaliacoesData,
        estatisticasData,
        escolaData
      ] = await Promise.all([
        this.getTurmasContext(professorData.id),
        this.getPlanosAulaContext(professorData.id),
        this.getAvaliacoesContext(professorData.id),
        this.getEstatisticasGerais(professorData.id),
        this.getEscolaData(undefined) // Professor não tem escola_id direta
      ]);

      console.log('📊 Dados coletados:', {
        turmas: turmasData.length,
        planos: planosAulaData.length,
        avaliacoes: avaliacoesData.length,
        total_alunos: estatisticasData.totalAlunos,
        escola: escolaData?.nome
      });

      const context: AIContext = {
        professor: {
          nome: professorData.nome,
          email: professorData.email || '',
          telefone: professorData.telefone || undefined,
          especialidades: await this.getDisciplinasLecionadas(professorData.id),
          experiencia_anos: await this.calcularExperiencia(professorData.id),
          formacao: await this.getFormacao(professorData.id)
        },
        
        instituicao: {
          nome: escolaData?.nome || 'Escola',
          tipo: 'Escola',
          nivel_ensino: await this.getNiveisEnsino(professorData.id),
          metodologia_preferida: await this.getMetodologiaPreferida(professorData.id)
        },
        
        sessao: {
          turma_ativa: turmasData[0] || undefined,
          disciplina_ativa: turmasData[0]?.disciplina,
          periodo_letivo: this.getPeriodoLetivoAtual(),
          data_atual: new Date().toLocaleDateString('pt-BR'),
          hora_atual: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        },
        
        educacional: {
          turmas: turmasData,
          total_alunos: estatisticasData.totalAlunos,
          disciplinas_lecionadas: await this.getDisciplinasLecionadas(professorData.id),
          planos_aula_recentes: planosAulaData,
          avaliacoes_recentes: avaliacoesData,
          desafios_identificados: await this.getDesafiosIdentificados(professorData.id),
          objetivos_pedagogicos: await this.getObjetivosPedagogicos(professorData.id)
        },
        
        interacao: {
          historico_conversas: await this.getHistoricoConversas(professorData.id),
          temas_frequentes: await this.getTemasFrequentes(professorData.id),
          preferencias_resposta: {
            nivel_detalhamento: 'intermediario',
            formato_preferido: 'estruturado',
            incluir_exemplos: true,
            incluir_referencias: true
          }
        }
      };

      this.setCache(cacheKey, context);
      console.log('✅ Contexto da IA construído com sucesso');
      return context;
    } catch (error) {
      console.error('❌ Erro ao construir contexto da IA:', error);
      throw error;
    }
  }

  private async getTurmasContext(professorId: number): Promise<TurmaContext[]> {
    try {
      console.log('🔍 Buscando turmas do professor:', professorId);
      
      // Buscar turmas através da tabela de relacionamento professores_turmas_disciplinas
      const { data: relacionamentos, error: errorRel } = await supabase
        .from('professores_turmas_disciplinas')
        .select(`
          turma_id,
          disciplina_id,
          turmas!inner(
            id,
            nome,
            ano
          ),
          disciplinas!inner(
            id,
            nome
          )
        `)
        .eq('professor_id', professorId);

      if (errorRel) {
        console.error('Erro ao buscar relacionamentos:', errorRel);
        throw errorRel;
      }

      if (!relacionamentos || relacionamentos.length === 0) {
        console.log('⚠️ Nenhuma turma encontrada para o professor');
        return [];
      }

      // Processar dados das turmas
      const turmasMap = new Map<number, TurmaContext>();
      
      for (const rel of relacionamentos) {
        const turmaId = rel.turma_id;
        
        if (!turmasMap.has(turmaId)) {
          // Buscar alunos da turma
          const { data: alunos, error: errorAlunos } = await supabase
            .from('alunos')
            .select('id')
            .eq('turma_id', turmaId);

          if (errorAlunos) {
            console.error('Erro ao buscar alunos da turma:', errorAlunos);
          }

          const totalAlunos = alunos?.length || 0;

                     turmasMap.set(turmaId, {
             id: turmaId,
             nome: (rel as any).turmas.nome,
             disciplina: (rel as any).disciplinas.nome,
             periodo: 'Manhã', // Valor padrão - pode ser expandido
             ano_letivo: (rel as any).turmas.ano,
             total_alunos: totalAlunos,
             alunos_ativos: totalAlunos
           });
        }
      }

      const turmas = Array.from(turmasMap.values());
      console.log('✅ Turmas encontradas:', turmas.length);
      return turmas;
    } catch (error) {
      console.error('❌ Erro ao buscar turmas:', error);
      return [];
    }
  }

  private async getPlanosAulaContext(professorId: number): Promise<PlanoAulaContext[]> {
    try {
      console.log('🔍 Buscando planos de aula do professor:', professorId);
      
      // Verificar se a tabela planos_aula existe
      const { data, error } = await supabase
        .from('planos_aula')
        .select('*')
        .eq('professor_id', professorId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Erro ao buscar planos de aula (tabela pode não existir):', error);
        return [];
      }

      const planos = data?.map(plano => ({
        id: plano.id,
        titulo: plano.titulo || 'Plano sem título',
        disciplina: plano.disciplina || 'Disciplina não informada',
        data_aula: plano.data_aula || new Date().toISOString().split('T')[0],
        objetivos: plano.objetivos ? (Array.isArray(plano.objetivos) ? plano.objetivos : [plano.objetivos]) : [],
        conteudo: plano.conteudo || '',
        metodologia: plano.metodologia || '',
        recursos: plano.recursos ? (Array.isArray(plano.recursos) ? plano.recursos : [plano.recursos]) : [],
        avaliacao: plano.avaliacao || '',
        status: plano.status || 'ativo'
      })) || [];

      console.log('✅ Planos de aula encontrados:', planos.length);
      return planos;
    } catch (error) {
      console.error('❌ Erro ao buscar planos de aula:', error);
      return [];
    }
  }

  private async getAvaliacoesContext(professorId: number): Promise<AvaliacaoContext[]> {
    try {
      console.log('🔍 Buscando avaliações do professor:', professorId);
      
      const { data, error } = await supabase
        .from('avaliacoes')
        .select('*')
        .eq('professor_id', professorId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Erro ao buscar avaliações:', error);
        return [];
      }

      const avaliacoes = data?.map(avaliacao => ({
        id: avaliacao.id,
        titulo: avaliacao.titulo || 'Avaliação sem título',
        tipo: avaliacao.tipo || 'avaliacao',
        disciplina: avaliacao.disciplina || 'Disciplina não informada',
        data_aplicacao: avaliacao.data_aplicacao || new Date().toISOString().split('T')[0],
        nota_media: avaliacao.nota_media || 0,
        total_alunos: avaliacao.total_alunos || 0,
        aprovados: avaliacao.aprovados || 0,
        reprovados: avaliacao.reprovados || 0
      })) || [];

      console.log('✅ Avaliações encontradas:', avaliacoes.length);
      return avaliacoes;
    } catch (error) {
      console.error('❌ Erro ao buscar avaliações:', error);
      return [];
    }
  }

  private async getEstatisticasGerais(professorId: number): Promise<{ totalAlunos: number }> {
    try {
      console.log('🔍 Calculando estatísticas gerais do professor:', professorId);
      
      // Buscar todas as turmas do professor
      const { data: relacionamentos, error } = await supabase
        .from('professores_turmas_disciplinas')
        .select('turma_id')
        .eq('professor_id', professorId);

      if (error) {
        console.error('Erro ao buscar turmas para estatísticas:', error);
        return { totalAlunos: 0 };
      }

      if (!relacionamentos || relacionamentos.length === 0) {
        return { totalAlunos: 0 };
      }

      // Buscar alunos de todas as turmas
      const turmaIds = [...new Set(relacionamentos.map(rel => rel.turma_id))];
      
      const { data: alunos, error: errorAlunos } = await supabase
        .from('alunos')
        .select('id')
        .in('turma_id', turmaIds);

      if (errorAlunos) {
        console.error('Erro ao buscar alunos para estatísticas:', errorAlunos);
        return { totalAlunos: 0 };
      }

      const totalAlunos = alunos?.length || 0;
      console.log('✅ Total de alunos calculado:', totalAlunos);
      
      return { totalAlunos };
    } catch (error) {
      console.error('❌ Erro ao calcular estatísticas:', error);
      return { totalAlunos: 0 };
    }
  }

  private async getEscolaData(escolaId?: number): Promise<{ nome: string } | null> {
    if (!escolaId) return null;
    
    try {
      const { data, error } = await supabase
        .from('escolas')
        .select('nome')
        .eq('id', escolaId)
        .single();

      if (error) {
        console.error('Erro ao buscar dados da escola:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ Erro ao buscar escola:', error);
      return null;
    }
  }

  private async getDisciplinasLecionadas(professorId: number): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('professores_turmas_disciplinas')
        .select(`
          disciplinas!inner(nome)
        `)
        .eq('professor_id', professorId);

      if (error) {
        console.error('Erro ao buscar disciplinas:', error);
        return [];
      }

             const disciplinas = data ? [...new Set(data.map(item => (item as any).disciplinas.nome).filter(Boolean))] : [];
      return disciplinas;
    } catch (error) {
      console.error('❌ Erro ao buscar disciplinas:', error);
      return [];
    }
  }

  private async calcularExperiencia(professorId: number): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('professores')
        .select('created_at')
        .eq('id', professorId)
        .single();

      if (error) {
        console.error('Erro ao buscar data de criação do professor:', error);
        return 1;
      }

      const dataInicio = new Date(data.created_at);
      const agora = new Date();
      const anos = Math.floor((agora.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24 * 365));
      return Math.max(anos, 1);
    } catch (error) {
      console.error('❌ Erro ao calcular experiência:', error);
      return 1;
    }
  }

  private async getFormacao(professorId: number): Promise<string> {
    // Por enquanto retorna um valor padrão, pode ser expandido com tabela de formações
    return 'Licenciatura em Educação';
  }

  private async getNiveisEnsino(professorId: number): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('professores_turmas_disciplinas')
        .select(`
          turmas!inner(ano)
        `)
        .eq('professor_id', professorId);

      if (error) {
        console.error('Erro ao buscar níveis de ensino:', error);
        return ['Ensino Fundamental'];
      }

             const anos = data ? [...new Set(data.map(item => (item as any).turmas.ano).filter(Boolean))] : [];
      
      // Inferir níveis baseado nos anos
      const niveis = new Set<string>();
      anos.forEach(ano => {
        const anoNum = parseInt(ano);
        if (anoNum >= 1 && anoNum <= 5) {
          niveis.add('Ensino Fundamental I');
        } else if (anoNum >= 6 && anoNum <= 9) {
          niveis.add('Ensino Fundamental II');
        } else if (anoNum >= 10 && anoNum <= 12) {
          niveis.add('Ensino Médio');
        }
      });

      return Array.from(niveis);
    } catch (error) {
      console.error('❌ Erro ao buscar níveis de ensino:', error);
      return ['Ensino Fundamental'];
    }
  }

  private async getMetodologiaPreferida(professorId: number): Promise<string> {
    try {
      // Buscar configurações da IA do professor se existir
      const { data, error } = await supabase
        .from('professor_ia_configuracoes')
        .select('metodologia_preferida')
        .eq('professor_id', professorId)
        .single();

      if (error || !data?.metodologia_preferida) {
        return 'Metodologia Ativa';
      }

      return data.metodologia_preferida;
    } catch (error) {
      console.error('❌ Erro ao buscar metodologia preferida:', error);
      return 'Metodologia Ativa';
    }
  }

  private getPeriodoLetivoAtual(): string {
    const agora = new Date();
    const ano = agora.getFullYear();
    const mes = agora.getMonth() + 1;
    
    if (mes >= 2 && mes <= 6) return `1º Semestre ${ano}`;
    if (mes >= 7 && mes <= 12) return `2º Semestre ${ano}`;
    return `${ano}`;
  }

  private async getDesafiosIdentificados(professorId: number): Promise<string[]> {
    // Pode ser baseado em análise de dados ou configuração manual
    return [
      'Engajamento dos alunos',
      'Avaliação formativa',
      'Uso de tecnologia em sala'
    ];
  }

  private async getObjetivosPedagogicos(professorId: number): Promise<string[]> {
    // Pode ser baseado nos planos de aula ou configuração manual
    return [
      'Desenvolver pensamento crítico',
      'Promover aprendizagem colaborativa',
      'Integrar tecnologia ao ensino'
    ];
  }

  private async getHistoricoConversas(professorId: number): Promise<number> {
    try {
      const { chatService } = await import('./chatService');
      return await chatService.getConversationCount(professorId);
    } catch (error) {
      console.error('❌ Erro ao buscar histórico de conversas:', error);
      return 0;
    }
  }

  private async getTemasFrequentes(professorId: number): Promise<string[]> {
    // Implementar análise de temas frequentes
    return ['Planejamento de aulas', 'Avaliação', 'Metodologias ativas'];
  }

  generateSystemPrompt(context: AIContext): string {
    return `Você é um assistente educacional especializado, personalizado para o Professor ${context.professor.nome}.

CONTEXTO DO PROFESSOR:
- Nome: ${context.professor.nome}
- Especialidades: ${context.professor.especialidades.join(', ')}
- Experiência: ${context.professor.experiencia_anos} anos
- Formação: ${context.professor.formacao}

CONTEXTO EDUCACIONAL ATUAL:
- Período Letivo: ${context.sessao.periodo_letivo}
- Total de Alunos: ${context.educacional.total_alunos}
- Disciplinas: ${context.educacional.disciplinas_lecionadas.join(', ')}
- Turmas Ativas: ${context.educacional.turmas.length}

DADOS RECENTES:
- Planos de Aula: ${context.educacional.planos_aula_recentes.length} recentes
- Avaliações: ${context.educacional.avaliacoes_recentes.length} recentes
- Desafios Identificados: ${context.educacional.desafios_identificados.join(', ')}

DIRETRIZES DE RESPOSTA:
1. Sempre se dirija ao professor pelo nome (${context.professor.nome})
2. Considere o contexto educacional específico dele
3. Forneça respostas no nível ${context.interacao.preferencias_resposta.nivel_detalhamento}
4. Use formato ${context.interacao.preferencias_resposta.formato_preferido}
5. ${context.interacao.preferencias_resposta.incluir_exemplos ? 'Inclua exemplos práticos' : 'Mantenha respostas concisas'}
6. ${context.interacao.preferencias_resposta.incluir_referencias ? 'Inclua referências quando relevante' : 'Foque na aplicação prática'}

ESPECIALIZAÇÃO:
- Foque em soluções pedagógicas práticas
- Considere os desafios específicos identificados
- Adapte sugestões ao contexto das disciplinas lecionadas
- Mantenha tom profissional mas acolhedor
- Priorize metodologias ativas e inovação educacional

Responda sempre considerando este contexto específico do Professor ${context.professor.nome}.`;
  }

  generateUserPrompt(userMessage: string, context: AIContext): string {
    const contextualInfo = [];
    
    if (context.sessao.turma_ativa) {
      contextualInfo.push(`Turma Ativa: ${context.sessao.turma_ativa.nome} (${context.sessao.turma_ativa.disciplina})`);
    }
    
    if (context.educacional.planos_aula_recentes.length > 0) {
      const ultimoPlano = context.educacional.planos_aula_recentes[0];
      contextualInfo.push(`Último Plano: ${ultimoPlano.titulo} (${ultimoPlano.disciplina})`);
    }
    
    if (context.educacional.avaliacoes_recentes.length > 0) {
      const ultimaAvaliacao = context.educacional.avaliacoes_recentes[0];
      contextualInfo.push(`Última Avaliação: ${ultimaAvaliacao.titulo} - Média: ${ultimaAvaliacao.nota_media}`);
    }

    const contextInfo = contextualInfo.length > 0 
      ? `\n\nCONTEXTO ATUAL:\n${contextualInfo.join('\n')}\n\n`
      : '\n\n';

    return `${contextInfo}PERGUNTA DO PROFESSOR ${context.professor.nome}:\n${userMessage}`;
  }
}

export const aiContextService = AIContextService.getInstance(); 