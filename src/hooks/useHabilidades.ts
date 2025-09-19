import { useState, useEffect, useCallback } from 'react'
import { HabilidadesService, HabilidadeBNCC, FiltroHabilidades, ContextoProfessor } from '../services/HabilidadesService'

export interface UseHabilidadesReturn {
  habilidades: HabilidadeBNCC[]
  loading: boolean
  error: string | null
  generos: string[]
  praticas: string[]
  contexto: ContextoProfessor | null
  carregarHabilidades: (filtros?: FiltroHabilidades) => Promise<void>
  carregarGeneros: (filtros?: FiltroHabilidades) => Promise<void>
  carregarPraticas: (filtros?: FiltroHabilidades) => Promise<void>
  carregarContextoProfessor: (professorId: number | string) => Promise<void>
  limparErro: () => void
}

export const useHabilidades = (professorId?: number | string): UseHabilidadesReturn => {
  const [habilidades, setHabilidades] = useState<HabilidadeBNCC[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generos, setGeneros] = useState<string[]>([])
  const [praticas, setPraticas] = useState<string[]>([])
  const [contexto, setContexto] = useState<ContextoProfessor | null>(null)

  const limparErro = useCallback(() => {
    setError(null)
  }, [])

  const carregarHabilidades = useCallback(async (filtros?: FiltroHabilidades) => {
    console.log('[DEBUG] useHabilidades - Iniciando carregamento de habilidades com filtros:', filtros);
    
    // Se filtros foram fornecidos, usar buscarHabilidades
    if (filtros) {
      setLoading(true);
      setError(null);
      
      try {
        const habilidadesCarregadas = await HabilidadesService.buscarHabilidades(filtros);
        console.log('[DEBUG] useHabilidades - Habilidades carregadas com filtros:', habilidadesCarregadas?.length || 0);
        if (habilidadesCarregadas && habilidadesCarregadas.length > 0) {
          console.log('[DEBUG] useHabilidades - Primeiras 3 habilidades:', habilidadesCarregadas.slice(0, 3));
        }
        setHabilidades(habilidadesCarregadas || []);
      } catch (err) {
        console.error('[ERROR] useHabilidades - Erro ao carregar habilidades com filtros:', err);
        setError(err instanceof Error ? err.message : 'erro ao carregar habilidades');
      } finally {
        setLoading(false);
      }
      return;
    }
    
    // Se não há filtros, usar contexto do professor
    if (!contexto) {
      console.error('[ERROR] useHabilidades - Contexto não encontrado e filtros não fornecidos');
      setError('Contexto do professor não encontrado');
      return;
    }
    
    console.log('[DEBUG] useHabilidades - Contexto detalhado:', {
      disciplinas: contexto.disciplinas,
      turmas: contexto.turmas,
      professorId: contexto.professorId
    });
    setLoading(true);
    setError(null);
    
    try {
      const habilidadesCarregadas = await HabilidadesService.buscarHabilidadesPorContexto(contexto);
      console.log('[DEBUG] useHabilidades - Habilidades carregadas por contexto:', habilidadesCarregadas?.length || 0);
      if (habilidadesCarregadas && habilidadesCarregadas.length > 0) {
        console.log('[DEBUG] useHabilidades - Primeiras 3 habilidades:', habilidadesCarregadas.slice(0, 3));
      }
      setHabilidades(habilidadesCarregadas || []);
    } catch (err) {
      console.error('[ERROR] useHabilidades - Erro ao carregar habilidades por contexto:', err);
      setError(err instanceof Error ? err.message : 'erro ao carregar habilidades');
    } finally {
      setLoading(false);
    }
  }, [contexto])

  const carregarGeneros = useCallback(async (filtros: FiltroHabilidades = {}) => {
    try {
      setError(null)
      const resultado = await HabilidadesService.buscarGeneros(filtros)
      setGeneros(resultado)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar gêneros textuais'
      setError(errorMessage)
      console.error('Erro ao carregar gêneros:', err)
    }
  }, [])

  const carregarPraticas = useCallback(async (filtros: FiltroHabilidades = {}) => {
    try {
      setError(null)
      const resultado = await HabilidadesService.buscarPraticasLinguagem(filtros)
      setPraticas(resultado)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar práticas de linguagem'
      setError(errorMessage)
      console.error('Erro ao carregar práticas:', err)
    }
  }, [])

  const carregarContextoProfessor = useCallback(async (id: number | string) => {
    try {
      setError(null)
      // Converter string para number se necessário
      const professorIdNumber = typeof id === 'string' ? parseInt(id, 10) : id
      if (isNaN(professorIdNumber)) {
        throw new Error('ID do professor inválido')
      }
      const resultado = await HabilidadesService.obterContextoProfessor(professorIdNumber)
      setContexto(resultado)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar contexto do professor'
      setError(errorMessage)
      console.error('Erro ao carregar contexto do professor:', err)
    }
  }, [])

  // Carregar contexto do professor automaticamente se ID for fornecido
  useEffect(() => {
    if (professorId) {
      console.log('[DEBUG] useHabilidades - Carregando contexto para professorId:', professorId, 'tipo:', typeof professorId)
      carregarContextoProfessor(professorId)
    }
  }, [professorId, carregarContextoProfessor])

  // Carregar habilidades quando o contexto mudar
  useEffect(() => {
    if (contexto) {
      carregarHabilidades(contexto)
    }
  }, [contexto, carregarHabilidades])

  return {
    habilidades,
    loading,
    error,
    generos,
    praticas,
    contexto,
    carregarHabilidades,
    carregarGeneros,
    carregarPraticas,
    carregarContextoProfessor,
    limparErro
  }
}

// Hook específico para gêneros textuais
export const useGeneros = (filtros: FiltroHabilidades = {}) => {
  const [generos, setGeneros] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const carregarGeneros = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const resultado = await HabilidadesService.buscarGeneros(filtros)
      setGeneros(resultado)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar gêneros textuais'
      setError(errorMessage)
      console.error('Erro ao carregar gêneros:', err)
    } finally {
      setLoading(false)
    }
  }, [filtros])

  useEffect(() => {
    carregarGeneros()
  }, [carregarGeneros])

  return {
    generos,
    loading,
    error,
    recarregar: carregarGeneros
  }
}

// Hook específico para práticas de linguagem
export const usePraticas = (filtros: FiltroHabilidades = {}) => {
  const [praticas, setPraticas] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  console.log('[DEBUG] usePraticas hook executado com filtros:', filtros);

  const carregarPraticas = useCallback(async () => {
    try {
      console.log('[DEBUG] usePraticas - Iniciando carregamento de práticas com filtros:', filtros);
      console.log('[DEBUG] usePraticas - Filtros detalhados:', {
        disciplina: filtros.disciplina,
        anoSerie: filtros.anoSerie,
        periodo: filtros.periodo,
        generoTextual: filtros.generoTextual,
        praticaLinguagem: filtros.praticaLinguagem
      });
      setLoading(true)
      setError(null)
      const resultado = await HabilidadesService.buscarPraticasLinguagem(filtros)
      console.log('[DEBUG] usePraticas - Práticas carregadas no hook:', resultado.length);
      console.log('[DEBUG] usePraticas - Práticas encontradas:', resultado);
      setPraticas(resultado)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar práticas de linguagem'
      console.error('[ERROR] usePraticas - Erro ao carregar práticas:', err);
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [filtros])

  useEffect(() => {
    console.log('[DEBUG] useEffect do usePraticas executado');
    carregarPraticas()
  }, [carregarPraticas])

  return {
    praticas,
    loading,
    error,
    recarregar: carregarPraticas
  }
}