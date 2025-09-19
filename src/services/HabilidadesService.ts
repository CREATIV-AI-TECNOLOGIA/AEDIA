import { supabase } from './DatabaseService'

export interface HabilidadeBNCC {
  id: number
  codigo: string
  descricao: string
  disciplina: string
  ano_serie: string
  periodo?: string
  trimestre_sugerido?: number
  genero_textual?: string
  pratica_linguagem?: string
  created_at?: string
  updated_at?: string
}

export interface FiltroHabilidades {
  disciplina?: string
  anoSerie?: string
  periodo?: string
  generoTextual?: string
  praticaLinguagem?: string
}

// Helper para mapear '1º Trimestre' -> 1, etc.
function mapPeriodoToTrimestre(periodo?: string): number | null {
  if (!periodo) return null
  const p = periodo.toLowerCase()
  if (p.includes('1º trimestre') || p.includes('1o trimestre')) return 1
  if (p.includes('2º trimestre') || p.includes('2o trimestre')) return 2
  if (p.includes('3º trimestre') || p.includes('3o trimestre')) return 3
  return null
}

export interface ContextoProfessor {
  professorId: number
  disciplinas: string[]
  turmas: Array<{
    id: number
    nome: string
    ano: string
  }>
}

export class HabilidadesService {
  /**
   * Busca habilidades BNCC com filtros opcionais
   */
  static async buscarHabilidades(filtros: FiltroHabilidades = {}): Promise<HabilidadeBNCC[]> {
    try {
      let query = supabase
        .from('habilidades_bncc_v2')
        .select('*')
        .order('codigo')

      // Aplicar filtros
      if (filtros.disciplina) {
        query = query.eq('disciplina', filtros.disciplina)
      }
      
      if (filtros.anoSerie) {
        const anoParsed = parseInt(String(filtros.anoSerie), 10)
        query = query.eq('ano_serie', isNaN(anoParsed) ? filtros.anoSerie : anoParsed)
      }
      
      if (filtros.periodo) {
        const trimestre = mapPeriodoToTrimestre(filtros.periodo)
        if (trimestre) {
          query = query.eq('trimestre_sugerido', trimestre)
        }
      }
      
      if (filtros.generoTextual) {
        query = query.eq('genero_textual', filtros.generoTextual)
      }
      
      if (filtros.praticaLinguagem) {
        query = query.eq('pratica_linguagem', filtros.praticaLinguagem)
      }

      const { data, error } = await query
      
      if (error) {
        console.error('Erro ao buscar habilidades BNCC:', error)
        throw error
      }
      
      return data || []
    } catch (error) {
      console.error('Erro no HabilidadesService.buscarHabilidades:', error)
      throw error
    }
  }

  /**
   * Converte ano da turma (string) para número
   */
  private static converterAnoParaNumero(ano: string | number): number {
    // Se já é um número, retornar diretamente
    if (typeof ano === 'number') {
      return ano;
    }
    
    // Se não é string, retornar 1 como padrão
    if (typeof ano !== 'string') {
      console.warn('[WARN] HabilidadesService - Ano inválido, usando padrão 1:', ano);
      return 1;
    }
    
    // Extrair número do formato "1º Ano", "2º Ano", etc.
    const match = ano.match(/^(\d+)/);
    const resultado = match ? parseInt(match[1], 10) : 1;
    
    console.log('[DEBUG] HabilidadesService - Convertendo ano:', ano, '->', resultado);
    return resultado;
  }

  /**
   * Busca habilidades filtradas pelo contexto do professor
   */
  static async buscarHabilidadesPorContexto(
    contexto: ContextoProfessor, 
    filtros: FiltroHabilidades = {}
  ): Promise<HabilidadeBNCC[]> {
    try {
      // Verificar se o contexto e turmas existem
      if (!contexto || !contexto.turmas || !Array.isArray(contexto.turmas)) {
        console.error('[ERROR] HabilidadesService - Contexto ou turmas inválidos:', contexto);
        throw new Error('Contexto do professor inválido ou turmas não encontradas');
      }
      
      // Obter anos das turmas do professor e converter para números
      const anosSeriePermitidos = contexto.turmas.map(turma => 
        HabilidadesService.converterAnoParaNumero(turma.ano)
      )
      
      console.log('[DEBUG] HabilidadesService - Buscando habilidades com contexto:', {
        disciplinas: contexto.disciplinas,
        anosSeriePermitidos: anosSeriePermitidos,
        filtros: filtros
      });
      
      let query = supabase
        .from('habilidades_bncc_v2')
        .select('*')
        .in('disciplina', contexto.disciplinas)
        .in('ano_serie', anosSeriePermitidos)
        .order('codigo')

      // Aplicar filtros adicionais
      if (filtros.periodo) {
        const p = filtros.periodo.toLowerCase()
        const trimestre = p.includes('1º trimestre') || p.includes('1o trimestre') ? 1
          : p.includes('2º trimestre') || p.includes('2o trimestre') ? 2
          : p.includes('3º trimestre') || p.includes('3o trimestre') ? 3
          : null
        if (trimestre) {
          query = query.eq('trimestre_sugerido', trimestre)
          console.log('[DEBUG] HabilidadesService - Filtro trimestre_sugerido aplicado:', trimestre);
        }
      }
      
      if (filtros.generoTextual) {
        query = query.eq('genero_textual', filtros.generoTextual)
        console.log('[DEBUG] HabilidadesService - Filtro genero_textual aplicado:', filtros.generoTextual);
      }
      
      if (filtros.praticaLinguagem) {
        query = query.eq('pratica_linguagem', filtros.praticaLinguagem)
        console.log('[DEBUG] HabilidadesService - Filtro pratica_linguagem aplicado:', filtros.praticaLinguagem);
      }

      console.log('[DEBUG] HabilidadesService - Executando query no Supabase...');
      const { data, error } = await query
      
      if (error) {
        console.error('[ERROR] HabilidadesService - Erro ao buscar habilidades por contexto:', error)
        throw error
      }
      
      console.log('[DEBUG] HabilidadesService - Habilidades encontradas:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('[DEBUG] HabilidadesService - Primeira habilidade:', data[0]);
      }
      return data || []
    } catch (error) {
      console.error('[ERROR] HabilidadesService - Erro no HabilidadesService.buscarHabilidadesPorContexto:', error)
      throw error
    }
  }

  /**
   * Busca gêneros textuais únicos das habilidades
   */
  static async buscarGeneros(filtros: FiltroHabilidades = {}): Promise<string[]> {
    try {
      let query = supabase
        .from('habilidades_bncc_v2')
        .select('genero_textual')
        .not('genero_textual', 'is', null)

      // Aplicar filtros
      if (filtros.disciplina) {
        query = query.eq('disciplina', filtros.disciplina)
      }
      
      if (filtros.anoSerie) {
        const anoParsed = parseInt(String(filtros.anoSerie), 10)
        query = query.eq('ano_serie', isNaN(anoParsed) ? filtros.anoSerie : anoParsed)
      }
      
      if (filtros.periodo) {
        const trimestre = mapPeriodoToTrimestre(filtros.periodo)
        if (trimestre) {
          query = query.eq('trimestre_sugerido', trimestre)
        }
      }

      const { data, error } = await query
      
      if (error) {
        console.error('Erro ao buscar gêneros textuais:', error)
        throw error
      }
      
      // Extrair gêneros únicos
      const generosUnicos = [...new Set(
        data?.map(item => item.genero_textual).filter(Boolean) || []
      )].sort()
      
      return generosUnicos
    } catch (error) {
      console.error('Erro no HabilidadesService.buscarGeneros:', error)
      throw error
    }
  }

  /**
   * Busca práticas de linguagem únicas
   */
  static async buscarPraticasLinguagem(filtros: FiltroHabilidades = {}): Promise<string[]> {
    try {
      console.log('[DEBUG] HabilidadesService - Buscando práticas de linguagem com filtros:', filtros);
      
      let query = supabase
        .from('habilidades_bncc_v2')
        .select('pratica_linguagem')
        .not('pratica_linguagem', 'is', null);

      // Aplicar filtros
      if (filtros.disciplina) {
        query = query.eq('disciplina', filtros.disciplina);
        console.log('[DEBUG] HabilidadesService - Filtro disciplina aplicado:', filtros.disciplina);
      }
      
      if (filtros.anoSerie) {
        const anoNumero = HabilidadesService.converterAnoParaNumero(filtros.anoSerie);
        console.log('[DEBUG] HabilidadesService - Convertendo ano:', filtros.anoSerie, '->', anoNumero);
        if (anoNumero !== null) {
          query = query.eq('ano_serie', anoNumero);
          console.log('[DEBUG] HabilidadesService - Filtro ano_serie aplicado:', anoNumero);
        }
      }
      
      if (filtros.periodo) {
        const trimestre = mapPeriodoToTrimestre(filtros.periodo);
        console.log('[DEBUG] HabilidadesService - Convertendo período:', filtros.periodo, '->', trimestre);
        if (trimestre !== null) {
          query = query.eq('trimestre_sugerido', trimestre);
          console.log('[DEBUG] HabilidadesService - Filtro trimestre_sugerido aplicado:', trimestre);
        }
      }
      
      if (filtros.generoTextual) {
        query = query.eq('genero_textual', filtros.generoTextual)
      }
      
      if (filtros.praticaLinguagem) {
        query = query.eq('pratica_linguagem', filtros.praticaLinguagem)
      }

      console.log('[DEBUG] HabilidadesService - Executando query para práticas...');
      const { data, error } = await query;

      if (error) {
        console.error('[ERROR] HabilidadesService - Erro ao buscar práticas de linguagem:', error);
        throw new Error(`Erro ao buscar práticas de linguagem: ${error.message}`);
      }

      console.log('[DEBUG] HabilidadesService - Dados brutos retornados:', data?.length || 0);
      if (data && data.length > 0) {
        console.log('[DEBUG] HabilidadesService - Primeiros 3 registros:', data.slice(0, 3));
      }

      // Extrair práticas únicas
      const praticasUnicas = [...new Set(
        data?.map(item => item.pratica_linguagem).filter(Boolean) || []
      )].sort();
      
      console.log('[DEBUG] HabilidadesService - Práticas únicas encontradas:', praticasUnicas.length);
      console.log('[DEBUG] HabilidadesService - Lista de práticas:', praticasUnicas);
      return praticasUnicas;
    } catch (error) {
      console.error('[ERROR] HabilidadesService - Erro no serviço de práticas de linguagem:', error);
      throw error;
    }
  }

  /**
   * Obter contexto do professor (disciplinas e turmas)
   */
  static async obterContextoProfessor(professorId: number): Promise<ContextoProfessor> {
    try {
      const { data, error } = await supabase
        .from('professores_turmas_disciplinas')
        .select(`
          disciplina_id,
          turma_id,
          disciplinas(id, nome),
          turmas(id, nome, ano)
        `)
        .eq('professor_id', professorId)

      if (error) {
        console.error('Erro ao obter contexto do professor:', error)
        throw error
      }

      // Processar dados para extrair disciplinas e turmas únicas
      const disciplinasUnicas = [...new Set(
        data?.map(item => item.disciplinas?.nome).filter(Boolean) || []
      )]
      
      const turmasUnicas = data?.reduce((acc, item) => {
        if (item.turmas && !acc.find(t => t.id === item.turmas.id)) {
          acc.push({
            id: item.turmas.id,
            nome: item.turmas.nome,
            ano: item.turmas.ano
          })
        }
        return acc
      }, [] as Array<{id: number, nome: string, ano: string}>) || []

      return {
        professorId,
        disciplinas: disciplinasUnicas,
        turmas: turmasUnicas
      }
    } catch (error) {
      console.error('Erro no HabilidadesService.obterContextoProfessor:', error)
      throw error
    }
  }

  /**
   * Busca disciplinas disponíveis
   */
  static async buscarDisciplinas(): Promise<Array<{id: number, nome: string}>> {
    try {
      const { data, error } = await supabase
        .from('disciplinas')
        .select('id, nome')
        .order('nome')

      if (error) {
        console.error('Erro ao buscar disciplinas:', error)
        throw error
      }
      
      return data || []
    } catch (error) {
      console.error('Erro no HabilidadesService.buscarDisciplinas:', error)
      throw error
    }
  }
}