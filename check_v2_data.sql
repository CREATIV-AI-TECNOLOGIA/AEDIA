-- Verificar dados existentes nas tabelas V2
SELECT 'habilidades_bncc_v2' as tabela, COUNT(*) as total FROM habilidades_bncc_v2
UNION ALL
SELECT 'praticas_linguagem_v2' as tabela, COUNT(*) as total FROM praticas_linguagem_v2
UNION ALL
SELECT 'objetos_conhecimento_v2' as tabela, COUNT(*) as total FROM objetos_conhecimento_v2
UNION ALL
SELECT 'planos_aula_v2' as tabela, COUNT(*) as total FROM planos_aula_v2;

-- Verificar algumas habilidades de exemplo
SELECT codigo, descricao, disciplina, ano_serie, pratica_linguagem 
FROM habilidades_bncc_v2 
WHERE disciplina = 'Língua Portuguesa' 
LIMIT 5;

-- Verificar práticas de linguagem
SELECT codigo, nome, categoria, anos_aplicaveis 
FROM praticas_linguagem_v2 
LIMIT 5;