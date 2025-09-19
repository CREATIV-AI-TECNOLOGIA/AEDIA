-- Debug: Verificar dados do Professor William (ID 7)
-- Consultar informações básicas do professor
SELECT 
    p.id,
    p.nome,
    p.email,
    p.escola_id
FROM professores p
WHERE p.id = 7;

-- Consultar disciplinas que o professor leciona
SELECT 
    ptd.professor_id,
    ptd.disciplina_id,
    d.nome as disciplina_nome,
    d.codigo as disciplina_codigo,
    ptd.turma_id,
    t.nome as turma_nome,
    t.ano as turma_ano,
    t.modalidade_id,
    m.nome as modalidade_nome
FROM professores_turmas_disciplinas ptd
JOIN disciplinas d ON ptd.disciplina_id = d.id
JOIN turmas t ON ptd.turma_id = t.id
JOIN modalidades m ON t.modalidade_id = m.id
WHERE ptd.professor_id = 7
ORDER BY t.ano, d.nome;

-- Consultar todas as disciplinas disponíveis
SELECT 
    id,
    nome,
    codigo,
    ativo
FROM disciplinas
WHERE ativo = true
ORDER BY nome;

-- Consultar todas as modalidades disponíveis
SELECT 
    id,
    nome,
    descricao
FROM modalidades
ORDER BY nome;