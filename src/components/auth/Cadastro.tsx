import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function Cadastro() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Extrai o email e o token dos parâmetros da URL
    const params = new URLSearchParams(window.location.hash.substring(1))
    const emailFromUrl = params.get('email')
    const token = params.get('access_token')
    
    if (emailFromUrl) {
      setEmail(emailFromUrl)
    }
    
    // Se não tiver token, redireciona para login
    if (!token) {
      navigate('/login')
    }
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validações
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    try {
      setLoading(true)

      // Extrai o token de acesso da URL
      const params = new URLSearchParams(window.location.hash.substring(1))
      const token = params.get('access_token')
      const refreshToken = params.get('refresh_token')

      if (!token) {
        throw new Error('Token de acesso não encontrado')
      }

      // Define a sessão com o token do convite
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: token,
        refresh_token: refreshToken || ''
      })

      if (sessionError) throw sessionError

      // Define a senha do usuário
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) throw updateError

      // Redireciona para o login
      navigate('/login', { 
        state: { 
          message: 'Senha definida com sucesso! Por favor, faça login com suas credenciais.' 
        }
      })

    } catch (err: any) {
      setError(err.message || 'Erro ao definir senha')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
          Defina sua senha de acesso
        </h2>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Digite sua senha"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirme sua Senha
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Digite sua senha novamente"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`
              w-full py-2 px-4 rounded-md text-white font-medium
              ${loading 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'}
              transition-colors
            `}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span className="ml-2">Processando...</span>
              </div>
            ) : (
              'Definir Senha'
            )}
          </button>
        </form>
      </div>
    </div>
  )
} 