-- Teste para verificar dados na tabela habilidades_bncc_v2

-- Verificar total de registros
SELECT COUNT(*) as total_registros FROM habilidades_bncc_v2;

-- Verificar disciplinas disponíveis
SELECT DISTINCT disciplina, COUNT(*) as quantidade 
FROM habilidades_bncc_v2 
GROUP BY disciplina 
ORDER BY disciplina;

-- Verificar dados específicos de Língua Portuguesa
SELECT 
    disciplina,
    ano_serie,
    pratica_linguagem,
    COUNT(*) as quantidade
FROM habilidades_bncc_v2 
WHERE disciplina = 'Língua Portuguesa'
GROUP BY disciplina, ano_serie, pratica_linguagem 
ORDER BY ano_serie, pratica_linguagem;

-- Verificar alguns registros específicos
SELECT 
    id,
    codigo,
    disciplina,
    ano_serie,
    pratica_linguagem,
    LEFT(descricao, 100) as descricao_resumida
FROM habilidades_bncc_v2 
WHERE disciplina = 'Língua Portuguesa'
ORDER BY ano_serie, codigo