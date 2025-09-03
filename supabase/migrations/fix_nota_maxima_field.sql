-- Migração para corrigir o campo nota_maxima na tabela avaliacoes
-- Problema: Campo atual DECIMAL(4,2) só permite até 99.99
-- Solução: Alterar para DECIMAL(6,2) para permitir até 9999.99

-- Alterar o tipo da coluna nota_maxima
ALTER TABLE avaliacoes 
ALTER COLUMN nota_maxima TYPE DECIMAL(6,2);

-- Comentário explicativo
COMMENT ON COLUMN avaliacoes.nota_maxima IS 'Nota máxima da avaliação (permite até 9999.99 pontos)';

-- Verificar se existem dados que precisam ser atualizados
UPDATE avaliacoes 
SET nota_maxima = 100.00 
WHERE nota_maxima > 99.99 AND nota_maxima <= 100;

-- Log da alteração
SELECT 'Campo nota_maxima alterado para DECIMAL(6,2) - agora permite até 9999.99 pontos' as resultado; 