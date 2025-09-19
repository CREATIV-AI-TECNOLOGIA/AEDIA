-- Corrigir permissões da tabela professores
-- Garantir que os roles anon e authenticated tenham acesso adequado

-- Conceder permissões SELECT para o role anon (usuários não autenticados)
GRANT SELECT ON professores TO anon;

-- Conceder todas as permissões para o role authenticated (usuários autenticados)
GRANT ALL PRIVILEGES ON professores TO authenticated;

-- Verificar se RLS está habilitado
ALTER TABLE professores ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir que usuários autenticados vejam todos os professores
CREATE POLICY "Authenticated users can view all professores" ON professores
    FOR SELECT
    TO authenticated
    USING (true);

-- Criar política para permitir que usuários anônimos vejam professores (se necessário)
CREATE POLICY "Anonymous users can view professores" ON professores
    FOR SELECT
    TO anon
    USING (true);

-- Verificar permissões atuais
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'professores'
AND grantee IN ('anon', 'authenticated') 
ORDER BY grantee, privilege_type;