-- Query para verificar dados na tabela habilidades_bncc_v2
SELECT COUNT(*) as total, disciplina, ano_serie, trimestre_sugerido, pratica_linguagem 
FROM habilidades_bncc_v2 
WHERE disciplina = 'Língua Portuguesa' AND ano_serie = 1 
GROUP BY disciplina, ano_serie, trimestre_sugerido, pratica_linguagem 
ORDER BY trimestre_sugerido, pratica_linguagem
LIMIT 10;

-- Query para verificar se há dados gerais na tabela
SELECT COUNT(*) as total_registros FROM habilidades_bncc_v2;

-- Query para verificar práticas de linguagem disponíveis
SELECT DISTINCT pratica_linguagem FROM habilidades_bncc_v2 WHERE pratica_linguagem IS NOT NULL ORDER BY pratica_linguagem;