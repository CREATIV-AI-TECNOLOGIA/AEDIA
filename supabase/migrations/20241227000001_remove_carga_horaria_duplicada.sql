-- Remover campo duplicado de carga horária das configurações de IA
-- A carga horária já está disponível na tabela professores
ALTER TABLE professor_ia_configuracoes 
DROP COLUMN IF EXISTS carga_horaria_semanal; 