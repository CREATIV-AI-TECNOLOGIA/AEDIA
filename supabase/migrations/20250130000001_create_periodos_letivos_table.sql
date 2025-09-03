-- Migração para criar a tabela de períodos letivos
-- Criado em: 2025-01-30

-- Criar enum para tipos de período se não existir
CREATE TYPE IF NOT EXISTS periodo_tipo AS ENUM ('trimestre', 'semestre', 'bimestre');

-- Tabela para períodos letivos (trimestres, semestres, bimestres)
CREATE TABLE IF NOT EXISTS periodos_letivos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(100) NOT NULL, -- Ex: "1º Trimestre", "2º Semestre"
    numero INTEGER NOT NULL, -- 1, 2, 3, etc.
    tipo periodo_tipo NOT NULL, -- 'trimestre', 'semestre', 'bimestre'
    ano INTEGER NOT NULL, -- Ano letivo (ex: 2025)
    data_inicio DATE NOT NULL, -- Data de início do período
    data_fim DATE NOT NULL, -- Data de fim do período
    professor_id INTEGER REFERENCES professores(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_periodos_letivos_professor_id ON periodos_letivos(professor_id);
CREATE INDEX IF NOT EXISTS idx_periodos_letivos_ano ON periodos_letivos(ano);
CREATE INDEX IF NOT EXISTS idx_periodos_letivos_tipo ON periodos_letivos(tipo);
CREATE INDEX IF NOT EXISTS idx_periodos_letivos_datas ON periodos_letivos(data_inicio, data_fim);
CREATE INDEX IF NOT EXISTS idx_periodos_letivos_professor_ano_tipo ON periodos_letivos(professor_id, ano, tipo);

-- RLS (Row Level Security) para segurança
ALTER TABLE periodos_letivos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para periodos_letivos
CREATE POLICY "Professores podem ver seus próprios períodos letivos" ON periodos_letivos
    FOR SELECT USING (professor_id = (SELECT id FROM professores WHERE user_id = auth.uid()));

CREATE POLICY "Professores podem criar seus próprios períodos letivos" ON periodos_letivos
    FOR INSERT WITH CHECK (professor_id = (SELECT id FROM professores WHERE user_id = auth.uid()));

CREATE POLICY "Professores podem atualizar seus próprios períodos letivos" ON periodos_letivos
    FOR UPDATE USING (professor_id = (SELECT id FROM professores WHERE user_id = auth.uid()));

CREATE POLICY "Professores podem deletar seus próprios períodos letivos" ON periodos_letivos
    FOR DELETE USING (professor_id = (SELECT id FROM professores WHERE user_id = auth.uid()));

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_periodos_letivos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_update_periodos_letivos_updated_at
    BEFORE UPDATE ON periodos_letivos
    FOR EACH ROW
    EXECUTE FUNCTION update_periodos_letivos_updated_at();

-- Comentários para documentação
COMMENT ON TABLE periodos_letivos IS 'Períodos letivos (trimestres, semestres, bimestres) por professor';
COMMENT ON COLUMN periodos_letivos.nome IS 'Nome do período (ex: "1º Trimestre", "2º Semestre")';
COMMENT ON COLUMN periodos_letivos.numero IS 'Número sequencial do período no ano letivo';
COMMENT ON COLUMN periodos_letivos.tipo IS 'Tipo do período: trimestre, semestre ou bimestre';
COMMENT ON COLUMN periodos_letivos.ano IS 'Ano letivo do período';
COMMENT ON COLUMN periodos_letivos.data_inicio IS 'Data de início do período letivo';
COMMENT ON COLUMN periodos_letivos.data_fim IS 'Data de fim do período letivo';
COMMENT ON COLUMN periodos_letivos.professor_id IS 'ID do professor responsável pelo período';