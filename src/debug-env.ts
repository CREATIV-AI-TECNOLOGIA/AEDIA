// Arquivo temporário para debug das variáveis de ambiente
export function debugEnvironmentVariables() {
  console.log('🔍 [DEBUG] Verificando variáveis de ambiente:', {
    NODE_ENV: process.env.NODE_ENV,
    VITE_OPENAI_API_KEY_EXISTS: !!import.meta.env.VITE_OPENAI_API_KEY,
    VITE_OPENAI_API_KEY_LENGTH: import.meta.env.VITE_OPENAI_API_KEY?.length || 0,
    VITE_OPENAI_API_KEY_PREFIX: import.meta.env.VITE_OPENAI_API_KEY?.substring(0, 10) || 'N/A',
    VITE_SUPABASE_URL_EXISTS: !!import.meta.env.VITE_SUPABASE_URL,
    VITE_TAVILY_API_KEY_EXISTS: !!import.meta.env.VITE_TAVILY_API_KEY,
    ALL_ENV_KEYS: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'))
  });
  
  return {
    openaiKey: import.meta.env.VITE_OPENAI_API_KEY,
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    tavilyKey: import.meta.env.VITE_TAVILY_API_KEY
  };
} 