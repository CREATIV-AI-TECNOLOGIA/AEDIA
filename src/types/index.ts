export interface Professor {
  id: number; // ID da tabela professores (geralmente SERIAL)
  user_id: string | null; // UUID da tabela auth.users, pode ser null se não vinculado
  nome: string;
  email: string | null;
  telefone?: string | null;
  avatar_url?: string | null; // URL da foto de perfil
  escola_id: number | null; // Se houver uma escola principal direta, caso contrário, usar professor_escolas
  created_at?: string;
  updated_at?: string;
}

export interface Aluno {
  id: number; // ID da tabela alunos (geralmente SERIAL)
  user_id: string | null; // UUID da tabela auth.users, pode ser null se não vinculado
  matricula: string;
  nome: string;
  idade?: number | null;
  telefone?: string | null;
  email?: string | null;
  endereco?: string | null;
  turma_id: number | null;
  created_at?: string;
  updated_at?: string;
}