import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kdjpvjvptqikgqjtjmcp.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkanB2anZwdHFpa2dxanRqbWNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0Mzc1ODgsImV4cCI6MjA2MjAxMzU4OH0.SAdHV9ba5vGnjBgKASb0hoVV7X4E-Ip-bPbSuJZNSsw'

export const supabase = createClient(supabaseUrl, supabaseKey)

export class DatabaseService {
  // Verificar dados dos professores
  static async verificarProfessores() {
    try {
      const { data, error } = await supabase
        .from('professores')
        .select('id, nome, email')
        .limit(5)
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao verificar professores:', error)
      throw error
    }
  }

  // Verificar relação professor-turmas
  static async verificarProfessorTurmas(professorId?: number) {
    try {
      let query = supabase
        .from('professores_turmas_disciplinas')
        .select(`
          id,
          professor_id,
          turma_id,
          disciplina_id,
          professores(nome, email),
          turmas(nome, ano),
          disciplinas(nome)
        `)
      
      if (professorId) {
        query = query.eq('professor_id', professorId)
      }
      
      const { data, error } = await query.limit(10)
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao verificar professor-turmas:', error)
      throw error
    }
  }

  // Verificar habilidades BNCC
  static async verificarHabilidadesBNCC() {
    try {
      const { data, error } = await supabase
        .from('habilidades_bncc_v2')
        .select('id, codigo, descricao, disciplina, ano_serie')
        .limit(10)
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao verificar habilidades BNCC:', error)
      throw error
    }
  }

  // Verificar gêneros textuais
  static async verificarGenerosTextuais() {
    try {
      const { data, error } = await supabase
        .from('generos_textuais')
        .select('id, nome, descricao')
        .limit(10)
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao verificar gêneros textuais:', error)
      throw error
    }
  }

  // Verificar disciplinas
  static async verificarDisciplinas() {
    try {
      const { data, error } = await supabase
        .from('disciplinas')
        .select('id, nome')
        .limit(10)
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao verificar disciplinas:', error)
      throw error
    }
  }
}