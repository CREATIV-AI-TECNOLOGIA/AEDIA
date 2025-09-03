import { supabase } from '../lib/supabase'

// Função para gerar senha temporária aleatória
function gerarSenhaTemporaria(length = 12) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let senha = ''
  for (let i = 0; i < length; i++) {
    senha += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return senha
}

export async function convidarProfessor(email: string) {
  try {
    const baseUrl = 'http://localhost:5174'
    const redirectUrl = `${baseUrl}/definir-senha`

    // Envia o convite usando o método padrão do Supabase
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: { 
        role: 'professor'
      },
      redirectTo: redirectUrl // URL para a página de definir senha
    })

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Erro ao convidar professor:', error)
    return { success: false, error }
  }
} 