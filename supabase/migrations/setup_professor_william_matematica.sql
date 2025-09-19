-- Configurar Professor William (ID 7) com disciplina de Matemática

-- Primeiro, verificar se as disciplinas existem
INSERT INTO disciplinas (id, nome, codigo, descricao, ativo) VALUES 
(1, 'Língua Portuguesa', 'LP', 'Disciplina de Língua Portuguesa', true),
(2, 'Matemática', 'MAT', 'Disciplina de Matemática', true),
(3, 'Ciências', 'CIE', 'Disciplina de Ciências', true)
ON CONFLICT (id) DO NOTHING;

-- Verificar se as modalidades existem
INSERT INTO modalidades (id, nome, descricao) VALUES 
(1, 'Ensino Fundamental I', 'Anos iniciais do ensino fundamental'),
(2, 'Ensino Fundamental II', 'Anos finais do ensino fundamental'),
(3, 'Ensino Médio', 'Ensino médio regular')
ON CONFLICT (id) DO NOTHING;

-- Verificar se as turmas existem
INSERT INTO turmas (id, nome, ano, escola_id, modalidade_id, periodo) VALUES 
(1, '1º Ano A', '1', 1, 1, 'Matutino'),
(2, '1º Ano B', '1', 1, 1, 'Vespertino'),
(3, '2º Ano A', '2', 1, 1, 'Matutino')
ON CONFLICT (id) DO NOTHING;

-- Limpar associações existentes do Professor William
DELETE FROM professores_turmas_disciplinas WHERE professor_id = 7;

-- Associar Professor William (ID 7) com Matemática para turmas do 1º ano
INSERT INTO professores_turmas_disciplinas (professor_id, turma_id, disciplina_id) VALUES 
(7, 1, 2), -- Professor William, 1º Ano A, Matemática
(7, 2, 2); -- Professor William, 1º Ano B, Matemática

-- Verificar os dados inseridos
SELECT 
    p.id as professor_id,
    p.nome as professor_nome,
    d.id as disciplina_id,
    d.nome as disciplina_nome,
    t.id as turma_id,
    t.nome as turma_nome,
    t.ano as turma_ano,
    m.nome as modalidade_nome
FROM professores_turmas_disciplinas ptd
JOIN professores p ON ptd.professor_id = p.id
JOIN disciplinas d ON ptd.disciplina_id = d.id
JOIN turmas t ON ptd.turma_id = t.id
JOIN modalidades m ON t.modalidade_id = m.id
WHERE ptd.professor_id = 7
ORDER BY t.ano, d.nome;