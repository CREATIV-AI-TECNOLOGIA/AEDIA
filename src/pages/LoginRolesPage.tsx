import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Nova URL da logo conforme solicitado
const logoUrl = 'https://i.imgur.com/hwvGfvh.png';

// Configuração de mapeamento de papéis baseado em domínios e padrões
const ROLE_MAPPING = {
  // Domínios específicos para alunos
  aluno: [
    '@aluno.araruama.rj.gov.br',
    '@estudante.araruama.rj.gov.br',
    '@aluno.edu.br',
    '@estudante.edu.br'
  ],
  // Domínios específicos para professores
  professor: [
    '@professor.araruama.rj.gov.br',
    '@docente.araruama.rj.gov.br',
    '@prof.araruama.rj.gov.br',
    '@educador.araruama.rj.gov.br'
  ],
  // Domínios específicos para diretoras/gestão
  diretora: [
    '@diretora.araruama.rj.gov.br',
    '@gestao.araruama.rj.gov.br',
    '@coordenacao.araruama.rj.gov.br',
    '@admin.araruama.rj.gov.br'
  ]
};

// Padrões de email para detecção adicional
const EMAIL_PATTERNS = {
  aluno: [
    /^[a-zA-Z0-9._%+-]+\.aluno@/i,
    /^aluno\.[a-zA-Z0-9._%+-]+@/i,
    /^estudante\.[a-zA-Z0-9._%+-]+@/i
  ],
  professor: [
    /^[a-zA-Z0-9._%+-]+\.prof@/i,
    /^prof\.[a-zA-Z0-9._%+-]+@/i,
    /^professor\.[a-zA-Z0-9._%+-]+@/i,
    /^docente\.[a-zA-Z0-9._%+-]+@/i
  ],
  diretora: [
    /^[a-zA-Z0-9._%+-]+\.dir@/i,
    /^diretora?\.[a-zA-Z0-9._%+-]+@/i,
    /^gestao\.[a-zA-Z0-9._%+-]+@/i,
    /^admin\.[a-zA-Z0-9._%+-]+@/i
  ]
};

/**
 * Determina o papel do usuário baseado no email usando múltiplas estratégias
 * @param email - Email do usuário
 * @returns Papel do usuário ('aluno', 'professor', 'diretora') ou null se não conseguir determinar
 */
const determineUserRole = (email: string): 'aluno' | 'professor' | 'diretora' | null => {
  if (!email || typeof email !== 'string') {
    console.warn('[determineUserRole] Email inválido fornecido:', email);
    return null;
  }

  const normalizedEmail = email.toLowerCase().trim();
  
  // Estratégia 1: Verificar domínios específicos
  for (const [role, domains] of Object.entries(ROLE_MAPPING)) {
    for (const domain of domains) {
      if (normalizedEmail.endsWith(domain.toLowerCase())) {
        console.log(`[determineUserRole] Papel detectado por domínio: ${role} (${domain})`);
        return role as 'aluno' | 'professor' | 'diretora';
      }
    }
  }
  
  // Estratégia 2: Verificar padrões de email
  for (const [role, patterns] of Object.entries(EMAIL_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(normalizedEmail)) {
        console.log(`[determineUserRole] Papel detectado por padrão: ${role} (${pattern})`);
        return role as 'aluno' | 'professor' | 'diretora';
      }
    }
  }
  
  // Estratégia 3: Fallback para método anterior (mais específico)
  if (normalizedEmail.includes('@aluno')) {
    console.log('[determineUserRole] Papel detectado por fallback: aluno');
    return 'aluno';
  }
  
  // Estratégia 4: Análise de subdomínio
  const emailParts = normalizedEmail.split('@');
  if (emailParts.length === 2) {
    const [localPart, domain] = emailParts;
    
    // Verificar se o domínio contém indicadores de papel
    if (domain.includes('aluno') || domain.includes('estudante')) {
      console.log('[determineUserRole] Papel detectado por análise de domínio: aluno');
      return 'aluno';
    }
    
    if (domain.includes('professor') || domain.includes('docente') || domain.includes('prof')) {
      console.log('[determineUserRole] Papel detectado por análise de domínio: professor');
      return 'professor';
    }
    
    if (domain.includes('diretora') || domain.includes('gestao') || domain.includes('admin')) {
      console.log('[determineUserRole] Papel detectado por análise de domínio: diretora');
      return 'diretora';
    }
    
    // Verificar parte local do email
    if (localPart.includes('aluno') || localPart.includes('estudante')) {
      console.log('[determineUserRole] Papel detectado por análise de parte local: aluno');
      return 'aluno';
    }
    
    if (localPart.includes('prof') || localPart.includes('docente')) {
      console.log('[determineUserRole] Papel detectado por análise de parte local: professor');
      return 'professor';
    }
    
    if (localPart.includes('dir') || localPart.includes('gestao') || localPart.includes('admin')) {
      console.log('[determineUserRole] Papel detectado por análise de parte local: diretora');
      return 'diretora';
    }
  }
  
  console.warn(`[determineUserRole] Não foi possível determinar papel para email: ${email}`);
  return null;
};

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      if (!data.session) {
        throw new Error('Não foi possível obter a sessão');
      }

      // Detecção robusta de papel baseada em domínio e padrões de email
      const userRole = determineUserRole(email);
      
      // Navegação baseada no papel detectado
      switch (userRole) {
        case 'aluno':
          navigate('/aluno');
          break;
        case 'professor':
          navigate('/dashboard-professor');
          break;
        case 'diretora':
          navigate('/gestao');
          break;
        default:
          // Fallback para professor se não conseguir determinar
          console.warn(`[LoginPage] Papel não reconhecido para email: ${email}, usando fallback para professor`);
          navigate('/dashboard-professor');
      }
    } catch (err: any) {
      console.error('Erro no login:', err);
      let errorMessage = 'Falha no login. Verifique suas credenciais.';
      if (err.message.includes('Invalid login credentials')) {
        errorMessage = 'Credenciais de login inválidas. Verifique seu e-mail e senha.';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl flex flex-col md:flex-row bg-card rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh]">
        {/* Lado esquerdo - Usando link direto da imagem */}
        <div className="w-full md:w-3/5 hidden md:flex items-center justify-center relative overflow-hidden bg-card">
          <img 
            src="https://i.imgur.com/qLA4tPr.png" // Usando o link direto para o arquivo .png do Imgur
            alt="Ilustração Login Esquerda" 
            className="w-full h-full object-cover opacity-90"
          />
          {/* Overlay sutil removido */}
          
        </div>
        
        {/* Lado direito - Formulário de login com ilustração NO TOPO */}
        <div className="w-full md:w-2/5 bg-card p-2 md:p-4 flex flex-col">
          {/* Ilustração no topo da coluna direita */}
          <div className="mb-3 p-2 rounded-xl">
            <img 
              src={logoUrl}
              alt="Logo Araruama Educação"
              className="w-full h-auto object-contain rounded-lg max-h-[150px] md:max-h-[190px] drop-shadow-md"
            />
          </div>
          
          {/* Bloco de saudação */}
          <div className="mb-3 text-center mt-0 relative">
            <h1 className="text-xl md:text-2xl font-bold text-primary tracking-tight">
              Olá Novamente!
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Bem-vindo(a) de volta! Sentimos sua falta!
            </p>
          </div>

          {error && (
            <div className="mb-2 p-3 bg-destructive/10 border border-destructive/30 text-destructive rounded-lg text-sm">
              {error}
            </div>
          )}

          <form className="space-y-3" onSubmit={handleLogin}>
            <div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-4 py-3 border border-border rounded-lg leading-5 bg-input placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition duration-150 ease-in-out text-sm"
                placeholder="Email"
              />
            </div>

            <div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full px-4 py-3 border border-border rounded-lg leading-5 bg-input placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition duration-150 ease-in-out text-sm pr-10"
                  placeholder="Senha"
                />
                <div 
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </div>
              </div>
              <div className="text-right mt-2">
                <a href="#" className="text-xs font-medium text-primary hover:text-primary/90 transition-colors">
                  Recuperar Senha
                </a>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-primary-foreground transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-[1.02] ${
                  loading 
                    ? 'bg-primary cursor-not-allowed' 
                    : 'bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50'
                }`}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                    Entrando...
                  </div>
                ) : (
                  'Entrar'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;