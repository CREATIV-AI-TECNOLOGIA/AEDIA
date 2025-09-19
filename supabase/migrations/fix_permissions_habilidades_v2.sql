-- Corrigir permissões da tabela habilidades_bncc_v2
-- Garantir que os roles anon e authenticated tenham acesso

-- Conceder permissões SELECT para o role anon (usuários não autenticados)
GRANT SELECT ON habilidades_bncc_v2 TO anon;

-- Conceder todas as permissões para o role authenticated (usuários autenticados)
GRANT ALL PRIVILEGES ON habilidades_bncc_v2 TO authenticated;

-- Verificar se RLS está habilitado (deve estar)
ALTER TABLE habilidades_bncc_v2 ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir leitura para usuários autenticados
DROP POLICY IF EXISTS "Permitir leitura de habilidades para usuários autenticados" ON habilidades_bncc_v2;
CREATE POLICY "Permitir leitura de habilidades para usuários autenticados" 
  ON habilidades_bncc_v2 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Criar política para permitir leitura para usuários anônimos (se necessário)
DROP POLICY IF EXISTS "Permitir leitura de habilidades para usuários anônimos" ON habilidades_bncc_v2;
CREATE POLICY "Permitir leitura de habilidades para usuários anônimos" 
  ON habilidades_bncc_v2 
  FOR SELECT 
  TO anon 
  USING (true);

-- Permissões aplicadas com sucesso