import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [message, setMessage] = useState('Processando autenticação...')

  useEffect(() => {
    const processAuth = async () => {
      try {
        setMessage('Verificando credenciais...')
        
        // Verifica se há um hash na URL
        if (window.location.hash) {
          const hashParams = new URLSearchParams(
            window.location.hash.substring(1) // Remove o # do início
          )
          
          const accessToken = hashParams.get('access_token')
          const type = hashParams.get('type')

          if (accessToken) {
            setMessage('Configurando sua sessão...')
            
            // Define o token na sessão
            const { error: setSessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: hashParams.get('refresh_token') || '',
            })
            
            if (setSessionError) throw setSessionError

            // Obtém os dados do usuário
            const { data: { user } } = await supabase.auth.getUser()
            
            // Verifica se o usuário já tem senha definida
            if (type === 'invite' || !user?.user_metadata?.has_password) {
              setMessage('Redirecionando para definição de senha...')
              navigate('/definir-senha')
            } else {
              setMessage('Redirecionando para o dashboard...')
              navigate('/dashboard')
            }
          } else {
            throw new Error('Token de acesso não encontrado')
          }
        } else {
          throw new Error('Nenhum token encontrado na URL')
        }
      } catch (error) {
        console.error('Erro ao processar autenticação:', error)
        setMessage('Erro na autenticação. Redirecionando para login...')
        setTimeout(() => navigate('/login'), 2000)
      }
    }

    processAuth()
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">{message}</p>
        </div>
      </div>
    </div>
  )
} 