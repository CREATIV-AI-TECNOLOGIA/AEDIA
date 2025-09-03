-- Migração para popular períodos letivos de 2025
-- Criado em: 2025-01-30

-- Inserir períodos letivos padrão para 2025 (trimestres)
-- Nota: Estes são dados de exemplo. Ajuste as datas conforme o calendário escolar real.

INSERT INTO periodos_letivos (nome, numero, tipo, ano, data_inicio, data_fim, professor_id) 
SELECT 
    '1º Trimestre' as nome,
    1 as numero,
    'trimestre'::periodo_tipo as tipo,
    2025 as ano,
    '2025-02-03'::date as data_inicio, -- Início do ano letivo
    '2025-05-02'::date as data_fim,    -- Fim do 1º trimestre
    p.id as professor_id
FROM professores p
WHERE NOT EXISTS (
    SELECT 1 FROM periodos_letivos pl 
    WHERE pl.professor_id = p.id AND pl.ano = 2025 AND pl.numero = 1 AND pl.tipo = 'trimestre'
);

INSERT INTO periodos_letivos (nome, numero, tipo, ano, data_inicio, data_fim, professor_id) 
SELECT 
    '2º Trimestre' as nome,
    2 as numero,
    'trimestre'::periodo_tipo as tipo,
    2025 as ano,
    '2025-05-05'::date as data_inicio, -- Início do 2º trimestre
    '2025-08-01'::date as data_fim,    -- Fim do 2º trimestre
    p.id as professor_id
FROM professores p
WHERE NOT EXISTS (
    SELECT 1 FROM periodos_letivos pl 
    WHERE pl.professor_id = p.id AND pl.ano = 2025 AND pl.numero = 2 AND pl.tipo = 'trimestre'
);

INSERT INTO periodos_letivos (nome, numero, tipo, ano, data_inicio, data_fim, professor_id) 
SELECT 
    '3º Trimestre' as nome,
    3 as numero,
    'trimestre'::periodo_tipo as tipo,
    2025 as ano,
    '2025-08-04'::date as data_inicio, -- Início do 3º trimestre
    '2025-11-28'::date as data_fim,    -- Fim do 3º trimestre
    p.id as professor_id
FROM professores p
WHERE NOT EXISTS (
    SELECT 1 FROM periodos_letivos pl 
    WHERE pl.professor_id = p.id AND pl.ano = 2025 AND pl.numero = 3 AND pl.tipo = 'trimestre'
);

-- Inserir períodos letivos para semestres (caso alguns professores usem semestres)
INSERT INTO periodos_letivos (nome, numero, tipo, ano, data_inicio, data_fim, professor_id) 
SELECT 
    '1º Semestre' as nome,
    1 as numero,
    'semestre'::periodo_tipo as tipo,
    2025 as ano,
    '2025-02-03'::date as data_inicio, -- Início do ano letivo
    '2025-07-04'::date as data_fim,    -- Fim do 1º semestre
    p.id as professor_id
FROM professores p
WHERE NOT EXISTS (
    SELECT 1 FROM periodos_letivos pl 
    WHERE pl.professor_id = p.id AND pl.ano = 2025 AND pl.numero = 1 AND pl.tipo = 'semestre'
);

INSERT INTO periodos_letivos (nome, numero, tipo, ano, data_inicio, data_fim, professor_id) 
SELECT 
    '2º Semestre' as nome,
    2 as numero,
    'semestre'::periodo_tipo as tipo,
    2025 as ano,
    '2025-07-28'::date as data_inicio, -- Início do 2º semestre
    '2025-12-19'::date as data_fim,    -- Fim do 2º semestre
    p.id as professor_id
FROM professores p
WHERE NOT EXISTS (
    SELECT 1 FROM periodos_letivos pl 
    WHERE pl.professor_id = p.id AND pl.ano = 2025 AND pl.numero = 2 AND pl.tipo = 'semestre'
);

-- Comentário sobre os dados inseridos
-- As datas são baseadas em um calendário escolar típico brasileiro
-- Ajuste conforme necessário para sua região/escola específica