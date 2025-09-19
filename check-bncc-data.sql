-- Query para verificar dados na tabela habilidades_bncc_v2
SELECT 
    COUNT(*) as total_registros,
    COUNT(DISTINCT disciplina) as total_disciplinas,
    COUNT(DISTINCT ano_serie) as total_anos
FROM habilidades_bncc_v2;

-- Mostrar alguns exemplos dos dados
SELECT 
    codigo,
    disciplina,
    ano_serie,
    serie_nome,
    LEFT(descricao, 100) || '...' as descricao_resumida
FROM habilidades_bncc_v2 
ORDER BY disciplina, ano_serie, codigo
LIMIT 10;

-- Verificar distribuição por disciplina
SELECT 
    disciplina,
    COUNT(*) as quantidade
FROM habilidades_bncc_v2 
GROUP BY disciplina
ORDER BY quantidade DESC;