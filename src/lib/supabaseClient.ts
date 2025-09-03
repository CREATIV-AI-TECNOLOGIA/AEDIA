import { createClient } from '@supabase/supabase-js';
import type { Database } from './supabase-types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://kdjpvjvptqikgqjtjmcp.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkanB2anZwdHFpa2dxanRqbWNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0Mzc1ODgsImV4cCI6MjA2MjAxMzU4OH0.SAdHV9ba5vGnjBgKASb0hoVV7X4E-Ip-bPbSuJZNSsw';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL ou Anon Key não estão definidas. Verifique suas variáveis de ambiente ou a configuração do cliente.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
}); 