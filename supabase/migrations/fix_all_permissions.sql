-- Corrigir permissões para todas as tabelas necessárias
-- Garantir que os roles anon e authenticated tenham acesso adequado

-- Tabela alunos
GRANT SELECT ON alunos TO anon;
GRANT ALL PRIVILEGES ON alunos TO authenticated;

-- Tabela turmas
GRANT SELECT ON turmas TO anon;
GRANT ALL PRIVILEGES ON turmas TO authenticated;

-- Tabela disciplinas
GRANT SELECT ON disciplinas TO anon;
GRANT ALL PRIVILEGES ON disciplinas TO authenticated;

-- Tabela modalidades
GRANT SELECT ON modalidades TO anon;
GRANT ALL PRIVILEGES ON modalidades TO authenticated;

-- Tabela habilidades
GRANT SELECT ON habilidades TO anon;
GRANT ALL PRIVILEGES ON habilidades TO authenticated;

-- Tabela praticas_linguagem
GRANT SELECT ON praticas_linguagem TO anon;
GRANT ALL PRIVILEGES ON praticas_linguagem TO authenticated;

-- Tabela planos_aula
GRANT SELECT ON planos_aula TO anon;
GRANT ALL PRIVILEGES ON planos_aula TO authenticated;

-- Tabela escolas
GRANT SELECT ON escolas TO anon;
GRANT ALL PRIVILEGES ON escolas TO authenticated;

-- Verificar permissões atuais para as principais tabelas
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name IN ('professores', 'alunos', 'turmas', 'disciplinas', 'modalidades', 'habilidades', 'praticas_linguagem', 'planos_aula', 'escolas')
AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee, privilege_type;