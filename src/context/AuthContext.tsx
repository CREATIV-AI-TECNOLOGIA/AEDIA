import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { User, Session } from '@supabase/supabase-js'
import { Professor, Aluno } from '../types'
import { logSupabaseError } from '../utils/supabaseErrorHandler'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  escolaId: number | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  sendMagicLink: (email: string) => Promise<void>
  inviteUser: (email: string) => Promise<void>
  refreshSession: () => Promise<void>
  refreshProfessorData: () => Promise<void>
  getRedirectPath: () => string
  authEvent: string | null
  userProfile: 'professor' | 'aluno' | 'diretora' | null
  professorData: Professor | null
  alunoData: Aluno | null
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [authEvent, setAuthEvent] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<'professor' | 'aluno' | 'diretora' | null>(null)
  const [professorData, setProfessorData] = useState<Professor | null>(null)
  const [alunoData, setAlunoData] = useState<Aluno | null>(null)
  const [fetchingProfile, setFetchingProfile] = useState(false)
  
  // Refs para evitar re-renderizações desnecessárias
  const lastUserIdRef = useRef<string | null>(null)
  const lastProfileFetchRef = useRef<number>(0)

  const getRedirectPath = useCallback((): string => {
    if (!user) {
      return '/login';
    }
    if (user.user_metadata?.role === 'diretora') {
      return '/gestao';
    }
    if (userProfile === 'professor') {
      return '/';
    }
    if (userProfile === 'aluno') {
      return '/aluno';
    }
    console.warn('[AuthContext] getRedirectPath: Usuário logado sem perfil claro ou role de diretora. Redirecionando para /login.', user, userProfile);
    return '/login';
  }, [user, userProfile])

  useEffect(() => {
    const inicializarAuth = async () => {
      setLoading(true)
      try {
        const { data, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) {
          console.error('Erro ao obter sessão inicial:', sessionError)
        } else if (data && data.session && data.session.user) {
          setSession(data.session)
          setUser(data.session.user)
          await fetchUserProfile(data.session.user)
        }
      } catch (error) {
        console.error('Erro catastrófico ao inicializar autenticação:', error)
      } finally {
        setLoading(false)
      }
    }

    inicializarAuth()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, currentSessionOrNull) => {
      console.log('Auth state changed (AuthContext):', event, currentSessionOrNull?.user?.email, currentSessionOrNull?.user?.user_metadata?.role)
      setSession(currentSessionOrNull)
      setUser(currentSessionOrNull?.user ?? null)
      setAuthEvent(event)
      
      if (currentSessionOrNull?.user) {
        fetchUserProfile(currentSessionOrNull.user)
      } else {
        setUserProfile(null)
        setProfessorData(null)
        setAlunoData(null)
      }
      if (event === 'INITIAL_SESSION') {
        // setLoading já foi tratado em getInitialSession ou será false se não houver sessão inicial
      } else {
        setLoading(false)
      }
    })

    return () => authListener.subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    const { error, data } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    if (data && data.user && !data.session) { 
      console.log('Usuário criado, aguardando confirmação de email.', data.user)
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      throw error
    }
  }, [])

  const sendMagicLink = useCallback(async (email: string) => {
    const redirectTo = window.location.hostname === 'localhost' 
      ? 'http://localhost:5173' 
      : window.location.origin

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo
      }
    })
    if (error) throw error
  }, [])

  const inviteUser = useCallback(async (email: string) => {
    const redirectTo = window.location.hostname === 'localhost' 
      ? 'http://localhost:5173/definir-senha' 
      : `${window.location.origin}/definir-senha`

    const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: {
        role: 'professor'
      }
    })
    if (error) throw error
  }, [])

  const refreshSession = useCallback(async () => {
    try {
      await supabase.auth.refreshSession()
    } catch (error) {
      console.error('Erro catastrófico ao atualizar sessão explicitamente:', error)
    }
  }, [])

  const refreshProfessorData = useCallback(async () => {
    if (user && userProfile === 'professor') {
      await fetchUserProfile(user)
    }
  }, [user, userProfile])

  const fetchUserProfile = async (authUser: User) => {
    // Evitar chamadas duplicadas usando flag específica e verificação de usuário
    const currentUserId = authUser.id;
    const now = Date.now();
    
    if (fetchingProfile || 
        (lastUserIdRef.current === currentUserId && 
         now - lastProfileFetchRef.current < 5000)) { // 5 segundos de cooldown
      console.log('[AuthContext] fetchUserProfile já está em execução ou foi executado recentemente, ignorando chamada duplicada');
      return;
    }
    
    lastUserIdRef.current = currentUserId;
    lastProfileFetchRef.current = now;
    setFetchingProfile(true)
    setLoading(true)
    setUserProfile(null)
    setProfessorData(null)
    setAlunoData(null)

    try {
      if (authUser.user_metadata?.role === 'diretora') {
        setUserProfile('diretora')
        console.log('[AuthContext] Usuário identificado como Diretora via metadata.')
        setLoading(false)
        setFetchingProfile(false)
        return
      }

      // Buscar professor primeiro - usando array ao invés de single() para evitar erro de múltiplas linhas
      let { data: professorData, error: professorError } = await supabase
        .from('professores')
        .select('*')
        .eq('user_id', authUser.id)
        .limit(1)

      // Fallback: se não encontrou por user_id, tenta buscar por email
      if ((!professorData || professorData.length === 0) && authUser.email) {
        console.log('[AuthContext] Professor não encontrado por user_id, tentando buscar por email:', authUser.email);
        const { data: professorByEmail, error: professorByEmailError } = await supabase
          .from('professores')
          .select('*')
          .eq('email', authUser.email)
          .limit(1);
        
        if (professorByEmail && professorByEmail.length > 0 && !professorByEmailError) {
          professorData = professorByEmail;
          professorError = null;
          
          // Atualizar o user_id do professor para futuras consultas
          const { error: updateError } = await supabase
            .from('professores')
            .update({ user_id: authUser.id })
            .eq('id', professorByEmail[0].id);
          
          if (updateError) {
            console.warn('[AuthContext] Erro ao atualizar user_id do professor:', updateError);
          } else {
            console.log('[AuthContext] user_id do professor atualizado com sucesso');
          }
        }
      }

      if (professorData && professorData.length > 0 && !professorError) {
        const professorInfo = professorData[0]
        setUserProfile('professor')
        setProfessorData(professorInfo as Professor)
        setAlunoData(null)
        console.log('[AuthContext] Usuário identificado como Professor:', professorInfo)
        setLoading(false)
        setFetchingProfile(false)
        return
      }

      // Se não encontrou como professor, buscar como aluno
      const { data: alunoData, error: alunoError } = await supabase
        .from('alunos')
        .select('*')
        .eq('user_id', authUser.id)
        .limit(1)

      if (alunoData && alunoData.length > 0 && !alunoError) {
        const alunoInfo = alunoData[0]
        setUserProfile('aluno')
        setAlunoData(alunoInfo as Aluno)
        setProfessorData(null)
        console.log('[AuthContext] Usuário identificado como Aluno:', alunoInfo)
             } else {
         setUserProfile(null)
         setProfessorData(null)
         setAlunoData(null)
         console.warn('[AuthContext] Usuário não encontrado como professor ou aluno.')
         if (professorError) logSupabaseError('AuthContext - Professor', professorError, { userId: authUser.id })
         if (alunoError) logSupabaseError('AuthContext - Aluno', alunoError, { userId: authUser.id })
       }
    } catch (error) {
      console.error('[AuthContext] Erro ao buscar perfil do usuário:', error)
    } finally {
      setLoading(false)
      setFetchingProfile(false)
    }
  }

  const value = useMemo(() => ({
    user,
    session,
    loading,
    escolaId: professorData?.escola_id ?? null,
    signIn,
    signUp,
    signOut,
    sendMagicLink,
    inviteUser,
    refreshSession,
    refreshProfessorData,
    getRedirectPath,
    authEvent,
    userProfile,
    professorData,
    alunoData
  }), [user, session, loading, signIn, signUp, signOut, sendMagicLink, inviteUser, refreshSession, refreshProfessorData, getRedirectPath, authEvent, userProfile, professorData, alunoData])

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
} 