import React, { useState, useEffect } from 'react'
import { DatabaseService } from '../services/DatabaseService'

interface DadosBanco {
  professores: any[]
  disciplinas: any[]
  habilidades: any[]
  generos: any[]
  professorTurmas: any[]
}

export const TesteBancoDados: React.FC = () => {
  const [dados, setDados] = useState<DadosBanco | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const verificarDados = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const [professores, disciplinas, habilidades, generos, professorTurmas] = await Promise.all([
        DatabaseService.verificarProfessores(),
        DatabaseService.verificarDisciplinas(),
        DatabaseService.verificarHabilidadesBNCC(),
        DatabaseService.verificarGenerosTextuais(),
        DatabaseService.verificarProfessorTurmas()
      ])

      setDados({
        professores: professores || [],
        disciplinas: disciplinas || [],
        habilidades: habilidades || [],
        generos: generos || [],
        professorTurmas: professorTurmas || []
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    verificarDados()
  }, [])

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">🔍 Verificando Dados do Banco</h2>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4 text-red-600">❌ Erro na Conexão</h2>
        <p className="text-red-500 mb-4">{error}</p>
        <button 
          onClick={verificarDados}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Tentar Novamente
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">📊 Status do Banco de Dados</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 border rounded">
          <h3 className="font-semibold text-blue-600">👨‍🏫 Professores</h3>
          <p className="text-2xl font-bold">{dados?.professores.length || 0}</p>
          {dados?.professores.length > 0 && (
            <p className="text-sm text-gray-600">Exemplo: {dados.professores[0]?.nome}</p>
          )}
        </div>

        <div className="p-4 border rounded">
          <h3 className="font-semibold text-green-600">📚 Disciplinas</h3>
          <p className="text-2xl font-bold">{dados?.disciplinas.length || 0}</p>
          {dados?.disciplinas.length > 0 && (
            <p className="text-sm text-gray-600">Exemplo: {dados.disciplinas[0]?.nome}</p>
          )}
        </div>

        <div className="p-4 border rounded">
          <h3 className="font-semibold text-purple-600">🎯 Habilidades BNCC</h3>
          <p className="text-2xl font-bold">{dados?.habilidades.length || 0}</p>
          {dados?.habilidades.length > 0 && (
            <p className="text-sm text-gray-600">Exemplo: {dados.habilidades[0]?.codigo}</p>
          )}
        </div>

        <div className="p-4 border rounded">
          <h3 className="font-semibold text-orange-600">📝 Gêneros Textuais</h3>
          <p className="text-2xl font-bold">{dados?.generos.length || 0}</p>
          {dados?.generos.length > 0 && (
            <p className="text-sm text-gray-600">Exemplo: {dados.generos[0]?.nome}</p>
          )}
        </div>

        <div className="p-4 border rounded">
          <h3 className="font-semibold text-red-600">🏫 Prof-Turmas</h3>
          <p className="text-2xl font-bold">{dados?.professorTurmas.length || 0}</p>
          {dados?.professorTurmas.length > 0 && (
            <p className="text-sm text-gray-600">Relacionamentos ativos</p>
          )}
        </div>
      </div>

      <button 
        onClick={verificarDados}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        🔄 Atualizar Dados
      </button>

      {dados && (
        <div className="mt-6">
          <h3 className="font-semibold mb-2">📋 Detalhes (JSON):</h3>
          <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-64">
            {JSON.stringify(dados, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}