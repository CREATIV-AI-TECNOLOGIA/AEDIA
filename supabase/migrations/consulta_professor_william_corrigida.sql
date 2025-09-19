-- Consulta corrigida dos dados do Professor William (ID 7)
-- Usando as estruturas corretas das tabelas

-- 1. Dados básicos do Professor William
SELECT 
    'Dados Básicos' as consulta,
    id,
    nome,
    email,
    telefone,
    escola_id,
    created_at,
    updated_at
FROM professores 
WHERE id = 7;

-- 2. Modalidades do professor através de avaliacoes
SELECT 
    'Modalidades em Avaliacoes' as consulta,
    modalidade_nome,
    COUNT(*) as quantidade_avaliacoes
FROM avaliacoes 
WHERE professor_id = 7 AND modalidade_nome IS NOT NULL
GROUP BY modalidade_nome;

-- 3. Turmas e disciplinas do professor através da tabela de relacionamento
SELECT 
    'Turmas e Disciplinas' as consulta,
    ptd.turma_id,
    t.nome as turma_nome,
    t.ano as turma_ano,
    ptd.disciplina_id,
    d.nome as disciplina_nome
FROM professores_turmas_disciplinas ptd
JOIN turmas t ON ptd.turma_id = t.id
LEFT JOIN disciplinas d ON ptd.disciplina_id = d.id
WHERE ptd.professor_id = 7;

-- 4. Planos de aula do Professor William
SELECT 
    'Planos de Aula' as consulta,
    pa.id,
    pa.titulo,
    pa.data,
    pa.turma_id,
    t.nome as turma_nome,
    pa.disciplina_id,
    d.nome as disciplina_nome,
    pa.trimestre,
    pa.status,
    pa.created_at
FROM planos_aula pa
LEFT JOIN turmas t ON pa.turma_id = t.id
LEFT JOIN disciplinas d ON pa.disciplina_id = d.id
WHERE pa.professor_id = 7
ORDER BY pa.created_at DESC;

-- 5. Resumo consolidado do Professor William
SELECT 
    'Resumo Consolidado' as consulta,
    p.nome as professor_nome,
    p.email,
    COUNT(DISTINCT ptd.turma_id) as total_turmas_vinculadas,
    COUNT(DISTINCT ptd.disciplina_id) as total_disciplinas_vinculadas,
    COUNT(DISTINCT pa.id) as total_planos_aula,
    COUNT(DISTINCT av.id) as total_avaliacoes
FROM professores p
LEFT JOIN professores_turmas_disciplinas ptd ON p.id = ptd.professor_id
LEFT JOIN planos_aula pa ON p.id = pa.professor_id
LEFT JOIN avaliacoes av ON p.id = av.professor_id
WHERE p.id = 7
GROUP BY p.id, p.nome, p.email;

-- 6. Disciplinas distintas nos planos de aula
SELECT 
    'Disciplinas nos Planos' as consulta,
    d.nome as disciplina,
    COUNT(pa.id) as quantidade_planos
FROM planos_aula pa
JOIN disciplinas d ON pa.disciplina_id = d.id
WHERE pa.professor_id = 7
GROUP BY d.id, d.nome
ORDER BY quantidade_planos DESC;