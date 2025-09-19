-- Consulta completa dos dados do Professor William (ID 7)
-- Verificar disciplinas, turmas e planos de aula

-- 1. Dados básicos do professor
SELECT 
    p.id,
    p.nome,
    p.email,
    p.escola_id,
    p.created_at
FROM professores p 
WHERE p.id = 7;

-- 2. Modalidades/Disciplinas do professor
SELECT 
    p.nome as professor_nome,
    m.nome as modalidade_disciplina,
    m.id as modalidade_id
FROM professores p
JOIN professor_modalidades pm ON p.id = pm.professor_id
JOIN modalidades m ON pm.modalidade_id = m.id
WHERE p.id = 7;

-- 3. Turmas que o professor leciona
SELECT 
    p.nome as professor_nome,
    t.id as turma_id,
    t.nome as turma_nome,
    t.ano,
    t.periodo,
    m.nome as modalidade_disciplina
FROM professores p
JOIN professores_turmas_disciplinas ptd ON p.id = ptd.professor_id
JOIN turmas t ON ptd.turma_id = t.id
JOIN modalidades m ON ptd.modalidade_id = m.id
WHERE p.id = 7
ORDER BY t.ano, t.nome;

-- 4. Planos de aula existentes do professor
SELECT 
    pa.id,
    pa.titulo,
    pa.data,
    pa.status,
    t.nome as turma_nome,
    t.ano,
    m.nome as modalidade_disciplina,
    pa.created_at
FROM planos_aula pa
JOIN professores p ON pa.professor_id = p.id
JOIN turmas t ON pa.turma_id = t.id
JOIN modalidades m ON pa.modalidade_id = m.id
WHERE p.id = 7
ORDER BY pa.created_at DESC;

-- 5. Resumo consolidado
SELECT 
    'Professor: ' || p.nome as info,
    'Disciplinas: ' || string_agg(DISTINCT m.nome, ', ') as disciplinas,
    'Total de turmas: ' || COUNT(DISTINCT t.id) as turmas,
    'Total de planos: ' || COUNT(DISTINCT pa.id) as planos
FROM professores p
LEFT JOIN professor_modalidades pm ON p.id = pm.professor_id
LEFT JOIN modalidades m ON pm.modalidade_id = m.id
LEFT JOIN professores_turmas_disciplinas ptd ON p.id = ptd.professor_id
LEFT JOIN turmas t ON ptd.turma_id = t.id
LEFT JOIN planos_aula pa ON p.id = pa.professor_id
WHERE p.id = 7
GROUP BY p.id, p.nome;