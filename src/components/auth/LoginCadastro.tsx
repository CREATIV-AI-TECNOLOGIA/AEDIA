import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function LoginCadastro() {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Todos os estados juntos
  const [, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState(location.state?.message || '')
  const [isConvite, setIsConvite] = useState(false)
  const [initializing, setInitializing] = useState(true)

  // Único useEffect para inicialização e monitoramento
  useEffect(() => {
    const initializeComponent = async () => {
      try {
        // Verifica se há parâmetros de convite na URL
        const params = new URLSearchParams(window.location.hash.substring(1))
        const emailFromUrl = params.get('email')
        const token = params.get('access_token')
        
        if (emailFromUrl && token) {
          setEmail(emailFromUrl)
          setIsLogin(false)
          setIsConvite(true)
        }
      } catch (error) {
        console.error('Erro na inicialização:', error)
        setError('Erro ao carregar a página')
      } finally {
        setInitializing(false)
      }
    }

    initializeComponent()
  }, [])

  // Se ainda está inicializando, mostra um loader
  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      // Verifica se temos uma sessão válida
      if (!data.session) {
        throw new Error('Não foi possível obter a sessão')
      }

      // Redireciona para a página inicial
      navigate('/')
    } catch (err: any) {
      console.error('Erro no login:', err)
      setError(err.message || 'Erro ao fazer login. Verifique suas credenciais.')
    } finally {
      setLoading(false)
    }
  }

  const handleDefinirSenha = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    setLoading(true)

    try {
      // Pega os tokens do convite da URL
      const params = new URLSearchParams(window.location.hash.substring(1))
      const token = params.get('access_token')
      const refreshToken = params.get('refresh_token')

      if (!token) {
        throw new Error('Token de acesso não encontrado')
      }

      // Define a sessão com o token do convite
      await supabase.auth.setSession({
        access_token: token,
        refresh_token: refreshToken || ''
      })

      // Atualiza a senha do usuário
      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      })

      if (updateError) throw updateError

      setMessage('Senha definida com sucesso! Faça login para continuar.')
      setIsLogin(true)
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
          {isConvite ? 'Definir Senha' : 'Login'}
        </h2>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-50 text-green-500 p-3 rounded-md mb-4">
            {message}
          </div>
        )}

        <form onSubmit={isConvite ? handleDefinirSenha : handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isConvite}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md 
                ${isConvite ? 'bg-gray-100' : 'focus:ring-blue-500 focus:border-blue-500'}`}
              placeholder="Digite seu email"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isConvite ? 'Nova Senha' : 'Senha'}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder={isConvite ? 'Digite sua nova senha' : 'Digite sua senha'}
              required
              autoComplete={isConvite ? "new-password" : "current-password"}
            />
          </div>

          {isConvite && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirme sua Nova Senha
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Digite sua nova senha novamente"
                required
                autoComplete="new-password"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`
              w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
              ${loading 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }
            `}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Carregando...
              </div>
            ) : (
              isConvite ? 'Definir Senha' : 'Entrar'
            )}
          </button>

          {!isConvite && (
            <p className="text-center text-sm text-gray-600 mt-4">
              Não tem uma conta? Entre em contato com o administrador.
            </p>
          )}
        </form>
      </div>
    </div>
  )
} 