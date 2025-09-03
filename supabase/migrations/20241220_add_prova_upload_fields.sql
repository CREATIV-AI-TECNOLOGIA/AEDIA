-- Adicionar campos para o novo sistema de upload de provas
ALTER TABLE provas_corrigidas 
ADD COLUMN IF NOT EXISTS nome_detectado TEXT,
ADD COLUMN IF NOT EXISTS codigo_detectado TEXT,
ADD COLUMN IF NOT EXISTS data_envio TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pendente_processamento';

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_provas_corrigidas_status ON provas_corrigidas(status);
CREATE INDEX IF NOT EXISTS idx_provas_corrigidas_data_envio ON provas_corrigidas(data_envio);
CREATE INDEX IF NOT EXISTS idx_provas_corrigidas_nome_detectado ON provas_corrigidas(nome_detectado);
CREATE INDEX IF NOT EXISTS idx_provas_corrigidas_codigo_detectado ON provas_corrigidas(codigo_detectado);

-- Comentários para documentação
COMMENT ON COLUMN provas_corrigidas.nome_detectado IS 'Nome do aluno detectado via OCR';
COMMENT ON COLUMN provas_corrigidas.codigo_detectado IS 'Código da avaliação detectado via OCR';
COMMENT ON COLUMN provas_corrigidas.data_envio IS 'Data e hora do envio da prova pelo professor';
COMMENT ON COLUMN provas_corrigidas.status IS 'Status do processamento: pendente_processamento, processando, concluido, erro'; 