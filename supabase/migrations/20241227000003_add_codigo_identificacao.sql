-- Migração para adicionar código de identificação único nas avaliações
-- Este código será usado para identificar automaticamente as provas escaneadas

-- Adicionar coluna codigo_identificacao
ALTER TABLE avaliacoes 
ADD COLUMN codigo_identificacao VARCHAR(20) UNIQUE;

-- Criar índice para busca rápida
CREATE INDEX idx_avaliacoes_codigo_identificacao ON avaliacoes(codigo_identificacao);

-- Função para gerar código único
CREATE OR REPLACE FUNCTION gerar_codigo_avaliacao()
RETURNS TEXT AS $$
DECLARE
    codigo TEXT;
    existe BOOLEAN;
BEGIN
    LOOP
        -- Gerar código no formato: AV-YYYY-XXXX (ex: AV-2024-1234)
        codigo := 'AV-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(FLOOR(RANDOM() * 9999 + 1)::TEXT, 4, '0');
        
        -- Verificar se já existe
        SELECT EXISTS(SELECT 1 FROM avaliacoes WHERE codigo_identificacao = codigo) INTO existe;
        
        -- Se não existe, usar este código
        IF NOT existe THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN codigo;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar código automaticamente ao inserir nova avaliação
CREATE OR REPLACE FUNCTION trigger_gerar_codigo_avaliacao()
RETURNS TRIGGER AS $$
BEGIN
    -- Se não foi fornecido código, gerar automaticamente
    IF NEW.codigo_identificacao IS NULL THEN
        NEW.codigo_identificacao := gerar_codigo_avaliacao();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_codigo_avaliacao ON avaliacoes;
CREATE TRIGGER trigger_codigo_avaliacao
    BEFORE INSERT ON avaliacoes
    FOR EACH ROW
    EXECUTE FUNCTION trigger_gerar_codigo_avaliacao();

-- Gerar códigos para avaliações existentes
UPDATE avaliacoes 
SET codigo_identificacao = gerar_codigo_avaliacao()
WHERE codigo_identificacao IS NULL;

-- Comentários
COMMENT ON COLUMN avaliacoes.codigo_identificacao IS 'Código único de identificação da avaliação para correção automática (formato: AV-YYYY-XXXX)';
COMMENT ON FUNCTION gerar_codigo_avaliacao() IS 'Gera código único para identificação de avaliações';
COMMENT ON FUNCTION trigger_gerar_codigo_avaliacao() IS 'Trigger para gerar código automaticamente ao criar avaliação'; 