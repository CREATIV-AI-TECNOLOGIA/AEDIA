import { useState } from 'react'
import { convidarProfessor } from '../services/adminService'

export default function AdminConvite() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const result = await convidarProfessor(email)
      if (result.success) {
        setMessage({
          type: 'success',
          text: 'Convite enviado com sucesso! O professor receberá um email com as instruções.'
        })
        setEmail('')
      } else {
        throw new Error('Falha ao enviar convite')
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Erro ao enviar convite. Por favor, tente novamente.'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Convidar Professor
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email do Professor
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            placeholder="professor@escola.com"
          />
        </div>

        {message && (
          <div className={`p-3 rounded-md ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`
            w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
            ${loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary'
            }
          `}
        >
          {loading ? 'Enviando...' : 'Enviar Convite'}
        </button>
      </form>

      <div className="mt-6 text-sm text-gray-600">
        <h2 className="font-semibold mb-2">Instruções:</h2>
        <ol className="list-decimal list-inside space-y-2">
          <li>Digite o email do professor</li>
          <li>O professor receberá um email com um link de convite</li>
          <li>Ao clicar no link, ele poderá definir sua senha</li>
          <li>Após definir a senha, o acesso estará liberado</li>
        </ol>
      </div>
    </div>
  )
} 