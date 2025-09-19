-- Migração: Estrutura Otimizada BNCC para Performance Máxima
-- Data: 2025-01-27
-- Objetivo: Criar estrutura otimizada para planos de aula baseada na BNCC

-- =====================================================
-- 1. TABELA PRINCIPAL DE HABILIDADES BNCC OTIMIZADA
-- =====================================================

CREATE TABLE IF NOT EXISTS habilidades_bncc_v2 (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE, -- Ex: EF15LP01
    descricao TEXT NOT NULL,
    disciplina VARCHAR(50) NOT NULL, -- Português, Matemática, etc.
    ano_serie INTEGER NOT NULL CHECK (ano_serie >= 1 AND ano_serie <= 9),
    serie_nome VARCHAR(20) NOT NULL, -- "1º ano", "2º ano", etc.
    
    -- Campos específicos para Português
    pratica_linguagem VARCHAR(100), -- Leitura, Escrita, Oralidade, etc.
    objetos_conhecimento TEXT[],     -- Array de objetos de conhecimento
    
    -- Organização temporal
    trimestre_sugerido INTEGER CHECK (trimestre_sugerido >= 1 AND trimestre_sugerido <= 4),
    
    -- Metadados para performance
    nivel_complexidade VARCHAR(20) DEFAULT 'medio', -- basico, medio, avancado
    prerequisitos INTEGER[], -- Array de IDs de habilidades prerequisitas
    
    -- Campos de controle
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentários para documentação
COMMENT ON TABLE habilidades_bncc_v2 IS 'Tabela otimizada de habilidades BNCC com estrutura normalizada para máxima performance';
COMMENT ON COLUMN habilidades_bncc_v2.codigo IS 'Código único da habilidade conforme BNCC (ex: EF15LP01)';
COMMENT ON COLUMN habilidades_bncc_v2.objetos_conhecimento IS 'Array de objetos de conhecimento relacionados';
COMMENT ON COLUMN habilidades_bncc_v2.prerequisitos IS 'Array de IDs de habilidades que são pré-requisitos';

-- =====================================================
-- 2. TABELA DE VÍNCULOS PROFESSOR-HABILIDADES
-- =====================================================

CREATE TABLE IF NOT EXISTS professor_habilidades_vinculos (
    id SERIAL PRIMARY KEY,
    professor_id INTEGER NOT NULL REFERENCES professores(id) ON DELETE CASCADE,
    habilidade_id INTEGER NOT NULL REFERENCES habilidades_bncc_v2(id) ON DELETE CASCADE,
    turma_id INTEGER REFERENCES turmas(id) ON DELETE CASCADE,
    
    -- Status do trabalho com a habilidade
    status VARCHAR(20) DEFAULT 'planejado', -- planejado, em_andamento, concluido
    trimestre_trabalhado INTEGER CHECK (trimestre_trabalhado >= 1 AND trimestre_trabalhado <= 4),
    
    -- Avaliação da habilidade
    nivel_dominio VARCHAR(20), -- nao_trabalhado, iniciante, desenvolvimento, consolidado
    observacoes TEXT,
    
    -- Datas de controle
    data_inicio DATE,
    data_conclusao DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para evitar duplicatas
    UNIQUE(professor_id, habilidade_id, turma_id, trimestre_trabalhado)
);

COMMENT ON TABLE professor_habilidades_vinculos IS 'Vínculos entre professores e habilidades trabalhadas por turma e trimestre';

-- =====================================================
-- 3. TABELA DE PLANOS DE AULA V2 (OTIMIZADA)
-- =====================================================

CREATE TABLE IF NOT EXISTS planos_aula_v2 (
    id SERIAL PRIMARY KEY,
    professor_id INTEGER NOT NULL REFERENCES professores(id) ON DELETE CASCADE,
    turma_id INTEGER NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,
    disciplina_id INTEGER REFERENCES disciplinas(id),
    
    -- Informações básicas
    titulo VARCHAR(255) NOT NULL,
    data_aula DATE NOT NULL,
    duracao_minutos INTEGER DEFAULT 50,
    
    -- Habilidades trabalhadas (array para performance)
    habilidades_ids INTEGER[] NOT NULL, -- Array de IDs das habilidades
    habilidades_codigos VARCHAR(20)[] NOT NULL, -- Array dos códigos para busca rápida
    
    -- Conteúdo estruturado
    objetivo_geral TEXT NOT NULL,
    objetivos_especificos TEXT[],
    conteudo_programatico TEXT NOT NULL,
    metodologia TEXT NOT NULL,
    recursos_necessarios TEXT[],
    avaliacao TEXT,
    
    -- Organização temporal
    trimestre INTEGER NOT NULL CHECK (trimestre >= 1 AND trimestre <= 4),
    semana_do_trimestre INTEGER,
    
    -- Status e controle
    status VARCHAR(20) DEFAULT 'rascunho', -- rascunho, aprovado, executado
    versao INTEGER DEFAULT 1,
    
    -- Metadados para busca e performance
    tags TEXT[], -- Tags para categorização
    nivel_dificuldade VARCHAR(20) DEFAULT 'medio',
    
    -- Campos de controle
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE planos_aula_v2 IS 'Tabela otimizada de planos de aula com arrays para máxima performance';
COMMENT ON COLUMN planos_aula_v2.habilidades_ids IS 'Array de IDs das habilidades para joins rápidos';
COMMENT ON COLUMN planos_aula_v2.habilidades_codigos IS 'Array dos códigos das habilidades para busca textual rápida';

-- =====================================================
-- 4. TABELA DE PRÁTICAS DE LINGUAGEM OTIMIZADA
-- =====================================================

CREATE TABLE IF NOT EXISTS praticas_linguagem_v2 (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    
    -- Organização hierárquica
    categoria VARCHAR(50), -- Leitura, Escrita, Oralidade, Análise Linguística
    subcategoria VARCHAR(100),
    
    -- Progressão por ano
    anos_aplicaveis INTEGER[] NOT NULL, -- [1,2,3,4,5] para anos iniciais
    
    -- Metadados
    ordem_apresentacao INTEGER DEFAULT 1,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE praticas_linguagem_v2 IS 'Práticas de linguagem otimizadas com estrutura hierárquica';

-- =====================================================
-- 5. TABELA DE OBJETOS DE CONHECIMENTO OTIMIZADA
-- =====================================================

CREATE TABLE IF NOT EXISTS objetos_conhecimento_v2 (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nome VARCHAR(200) NOT NULL,
    descricao TEXT,
    
    -- Relacionamento com práticas de linguagem
    pratica_linguagem_id INTEGER REFERENCES praticas_linguagem_v2(id),
    
    -- Organização por ano e trimestre
    anos_aplicaveis INTEGER[] NOT NULL,
    trimestres_sugeridos INTEGER[] DEFAULT '{1,2,3,4}',
    
    -- Hierarquia e progressão
    nivel_complexidade VARCHAR(20) DEFAULT 'medio',
    prerequisitos INTEGER[], -- IDs de objetos prerequisitos
    
    -- Metadados
    ordem_apresentacao INTEGER DEFAULT 1,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE objetos_conhecimento_v2 IS 'Objetos de conhecimento otimizados com relacionamentos eficientes';

-- =====================================================
-- 6. ÍNDICES PARA PERFORMANCE MÁXIMA
-- =====================================================

-- Índices para habilidades_bncc_v2
CREATE INDEX IF NOT EXISTS idx_habilidades_v2_codigo ON habilidades_bncc_v2(codigo);
CREATE INDEX IF NOT EXISTS idx_habilidades_v2_disciplina_ano ON habilidades_bncc_v2(disciplina, ano_serie);
CREATE INDEX IF NOT EXISTS idx_habilidades_v2_pratica_linguagem ON habilidades_bncc_v2(pratica_linguagem) WHERE pratica_linguagem IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_habilidades_v2_trimestre ON habilidades_bncc_v2(trimestre_sugerido) WHERE trimestre_sugerido IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_habilidades_v2_ativo ON habilidades_bncc_v2(ativo) WHERE ativo = true;

-- Índices para professor_habilidades_vinculos
CREATE INDEX IF NOT EXISTS idx_prof_hab_vinculos_professor ON professor_habilidades_vinculos(professor_id);
CREATE INDEX IF NOT EXISTS idx_prof_hab_vinculos_habilidade ON professor_habilidades_vinculos(habilidade_id);
CREATE INDEX IF NOT EXISTS idx_prof_hab_vinculos_turma ON professor_habilidades_vinculos(turma_id);
CREATE INDEX IF NOT EXISTS idx_prof_hab_vinculos_status ON professor_habilidades_vinculos(status);
CREATE INDEX IF NOT EXISTS idx_prof_hab_vinculos_trimestre ON professor_habilidades_vinculos(trimestre_trabalhado);

-- Índices para planos_aula_v2
CREATE INDEX IF NOT EXISTS idx_planos_v2_professor ON planos_aula_v2(professor_id);
CREATE INDEX IF NOT EXISTS idx_planos_v2_turma ON planos_aula_v2(turma_id);
CREATE INDEX IF NOT EXISTS idx_planos_v2_data ON planos_aula_v2(data_aula);
CREATE INDEX IF NOT EXISTS idx_planos_v2_trimestre ON planos_aula_v2(trimestre);
CREATE INDEX IF NOT EXISTS idx_planos_v2_status ON planos_aula_v2(status);
CREATE INDEX IF NOT EXISTS idx_planos_v2_habilidades_ids ON planos_aula_v2 USING GIN(habilidades_ids);
CREATE INDEX IF NOT EXISTS idx_planos_v2_habilidades_codigos ON planos_aula_v2 USING GIN(habilidades_codigos);
CREATE INDEX IF NOT EXISTS idx_planos_v2_tags ON planos_aula_v2 USING GIN(tags);

-- Índices para práticas de linguagem
CREATE INDEX IF NOT EXISTS idx_praticas_v2_categoria ON praticas_linguagem_v2(categoria);
CREATE INDEX IF NOT EXISTS idx_praticas_v2_anos ON praticas_linguagem_v2 USING GIN(anos_aplicaveis);
CREATE INDEX IF NOT EXISTS idx_praticas_v2_ativo ON praticas_linguagem_v2(ativo) WHERE ativo = true;

-- Índices para objetos de conhecimento
CREATE INDEX IF NOT EXISTS idx_objetos_v2_pratica ON objetos_conhecimento_v2(pratica_linguagem_id);
CREATE INDEX IF NOT EXISTS idx_objetos_v2_anos ON objetos_conhecimento_v2 USING GIN(anos_aplicaveis);
CREATE INDEX IF NOT EXISTS idx_objetos_v2_trimestres ON objetos_conhecimento_v2 USING GIN(trimestres_sugeridos);
CREATE INDEX IF NOT EXISTS idx_objetos_v2_ativo ON objetos_conhecimento_v2(ativo) WHERE ativo = true;

-- =====================================================
-- 7. TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_habilidades_v2_updated_at BEFORE UPDATE ON habilidades_bncc_v2 FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_prof_hab_vinculos_updated_at BEFORE UPDATE ON professor_habilidades_vinculos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_planos_v2_updated_at BEFORE UPDATE ON planos_aula_v2 FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. VIEWS PARA COMPATIBILIDADE COM INTERFACE ANTIGA
-- =====================================================

-- View para manter compatibilidade com a tabela habilidades antiga
CREATE OR REPLACE VIEW habilidades_compatibilidade AS
SELECT 
    id,
    codigo,
    descricao,
    NULL::integer as disciplina_id, -- Será mapeado via disciplina nome
    ano_serie as ano,
    serie_nome as serie,
    disciplina,
    pratica_linguagem,
    trimestre_sugerido as trimestre,
    array_to_string(objetos_conhecimento, '; ') as objetos_conhecimento,
    NULL::text as expectativas_aprendizagem,
    created_at,
    updated_at
FROM habilidades_bncc_v2
WHERE ativo = true;

COMMENT ON VIEW habilidades_compatibilidade IS 'View para compatibilidade com interface antiga da tabela habilidades';

-- =====================================================
-- 9. FUNÇÕES AUXILIARES PARA PERFORMANCE
-- =====================================================

-- Função para buscar habilidades por filtros otimizada
CREATE OR REPLACE FUNCTION buscar_habilidades_otimizada(
    p_disciplina VARCHAR DEFAULT NULL,
    p_ano_serie INTEGER DEFAULT NULL,
    p_trimestre INTEGER DEFAULT NULL,
    p_pratica_linguagem VARCHAR DEFAULT NULL
)
RETURNS TABLE(
    id INTEGER,
    codigo VARCHAR,
    descricao TEXT,
    disciplina VARCHAR,
    ano_serie INTEGER,
    pratica_linguagem VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        h.id,
        h.codigo,
        h.descricao,
        h.disciplina,
        h.ano_serie,
        h.pratica_linguagem
    FROM habilidades_bncc_v2 h
    WHERE h.ativo = true
        AND (p_disciplina IS NULL OR h.disciplina = p_disciplina)
        AND (p_ano_serie IS NULL OR h.ano_serie = p_ano_serie)
        AND (p_trimestre IS NULL OR h.trimestre_sugerido = p_trimestre)
        AND (p_pratica_linguagem IS NULL OR h.pratica_linguagem = p_pratica_linguagem)
    ORDER BY h.codigo;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION buscar_habilidades_otimizada IS 'Função otimizada para busca de habilidades com filtros múltiplos';

-- =====================================================
-- 10. CONFIGURAÇÕES DE SEGURANÇA (RLS)
-- =====================================================

-- Habilitar RLS nas novas tabelas
ALTER TABLE habilidades_bncc_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE professor_habilidades_vinculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE planos_aula_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE praticas_linguagem_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE objetos_conhecimento_v2 ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (todos podem ler habilidades e práticas)
CREATE POLICY "Habilidades são públicas para leitura" ON habilidades_bncc_v2 FOR SELECT USING (true);
CREATE POLICY "Práticas são públicas para leitura" ON praticas_linguagem_v2 FOR SELECT USING (true);
CREATE POLICY "Objetos são públicos para leitura" ON objetos_conhecimento_v2 FOR SELECT USING (true);

-- Políticas para professores (apenas seus próprios dados)
CREATE POLICY "Professores veem seus vínculos" ON professor_habilidades_vinculos FOR ALL USING (auth.uid()::text = professor_id::text);
CREATE POLICY "Professores veem seus planos" ON planos_aula_v2 FOR ALL USING (auth.uid()::text = professor_id::text);

-- =====================================================
-- 11. GRANTS DE PERMISSÃO
-- =====================================================

-- Conceder permissões para roles anon e authenticated
GRANT SELECT ON habilidades_bncc_v2 TO anon, authenticated;
GRANT SELECT ON praticas_linguagem_v2 TO anon, authenticated;
GRANT SELECT ON objetos_conhecimento_v2 TO anon, authenticated;
GRANT SELECT ON habilidades_compatibilidade TO anon, authenticated;

GRANT ALL PRIVILEGES ON professor_habilidades_vinculos TO authenticated;
GRANT ALL PRIVILEGES ON planos_aula_v2 TO authenticated;

GRANT USAGE ON SEQUENCE habilidades_bncc_v2_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE professor_habilidades_vinculos_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE planos_aula_v2_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE praticas_linguagem_v2_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE objetos_conhecimento_v2_id_seq TO authenticated;

-- =====================================================
-- FIM DA MIGRAÇÃO
-- =====================================================