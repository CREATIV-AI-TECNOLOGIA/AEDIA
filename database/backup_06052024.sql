-- Backup do banco de dados - 06/05/2024

-- Limpando todas as tabelas
TRUNCATE TABLE matriz_curricular CASCADE;
TRUNCATE TABLE professores_turmas_disciplinas CASCADE;
TRUNCATE TABLE alunos CASCADE;
TRUNCATE TABLE turmas CASCADE;
TRUNCATE TABLE professores CASCADE;
TRUNCATE TABLE disciplinas CASCADE;
TRUNCATE TABLE modalidades CASCADE;
TRUNCATE TABLE escolas CASCADE;

-- Inserindo dados na tabela escolas
INSERT INTO escolas (id, nome, cidade, endereco, telefone, email, estado, created_at) VALUES
(1, 'Colégio São Bento', 'Araruama', 'Rua da Educação, 123 - Centro', '(22) 2222-2222', 'contato@colegiosb.edu.br', 'Rio de Janeiro', '2025-05-06T05:30:55.823775+00:00');

-- Inserindo dados na tabela modalidades
INSERT INTO modalidades (id, nome, descricao, created_at) VALUES
(1, 'Ciclo de Alfabetização', '1º ao 2º ano', '2025-05-06T21:00:12.479685+00:00'),
(2, 'Fundamental 1', '3º ao 5º ano', '2025-05-06T21:00:12.479685+00:00'),
(3, 'Fundamental 2', '6º ao 9º ano', '2025-05-06T21:00:12.479685+00:00');

-- Inserindo dados na tabela professores
INSERT INTO professores (id, nome, email, telefone, escola_id, created_at) VALUES
(6, 'Kaio Keylan', 'kaio.keylan@gmail.com', '(22) 99999-1111', 1, '2025-05-06T21:00:50.649308+00:00'),
(7, 'William Amaral', 'wijvamaral@gmail.com', '(22) 99999-2222', 1, '2025-05-06T21:00:50.649308+00:00'),
(8, 'Caio Campos', 'kaio.keylan2014@gmail.com', '(22) 99999-3333', 1, '2025-05-06T21:00:50.649308+00:00');

-- Inserindo dados na tabela disciplinas
INSERT INTO disciplinas (id, nome, created_at) VALUES
(1, 'Língua Portuguesa', '2025-05-06T05:30:55.823775+00:00'),
(2, 'Matemática', '2025-05-06T05:30:55.823775+00:00'),
(3, 'Ciências', '2025-05-06T05:30:55.823775+00:00'),
(4, 'Alfabetização', '2025-05-06T15:05:38.156717+00:00');

-- Inserindo dados na tabela turmas
INSERT INTO turmas (id, nome, ano, escola_id, periodo, modalidade_id, created_at) VALUES
(4, 'Turma 101', '1º Ano', 1, 'Manhã', 1, '2025-05-06T21:00:43.569384+00:00'),
(5, 'Turma 102', '1º Ano', 1, 'Tarde', 1, '2025-05-06T21:00:43.569384+00:00'),
(6, 'Turma 201', '2º Ano', 1, 'Manhã', 1, '2025-05-06T21:00:43.569384+00:00'),
(7, 'Turma 301', '3º Ano', 1, 'Tarde', 2, '2025-05-06T21:00:43.569384+00:00'),
(8, 'Turma 501', '5º Ano', 1, 'Vespertino', 2, '2025-05-06T21:00:43.569384+00:00');

-- Inserindo dados na tabela professores_turmas_disciplinas
INSERT INTO professores_turmas_disciplinas (id, professor_id, turma_id, disciplina_id, created_at) VALUES
(6, 6, 4, 1, '2025-05-06T21:01:02.663101+00:00'),
(7, 7, 5, 1, '2025-05-06T21:01:02.663101+00:00'),
(8, 7, 7, 2, '2025-05-06T21:01:02.663101+00:00'),
(9, 8, 4, 3, '2025-05-06T21:01:02.663101+00:00'),
(10, 8, 6, 3, '2025-05-06T21:01:02.663101+00:00'),
(11, 8, 8, 3, '2025-05-06T21:01:02.663101+00:00');

-- Inserindo dados na tabela alunos
INSERT INTO alunos (id, matricula, nome, idade, telefone, email, endereco, turma_id, created_at) VALUES
(7, '2024101', 'Ana Silva', 6, '(22) 98888-1111', 'ana.silva@aluno.colegiosb.edu.br', NULL, 4, '2025-05-06T21:27:33.077253+00:00'),
(8, '2024102', 'Pedro Santos', 6, '(22) 98888-2222', 'pedro.santos@aluno.colegiosb.edu.br', NULL, 4, '2025-05-06T21:27:33.077253+00:00'),
(9, '2024103', 'Maria Oliveira', 6, '(22) 98888-3333', 'maria.oliveira@aluno.colegiosb.edu.br', NULL, 4, '2025-05-06T21:27:33.077253+00:00'),
(10, '2024201', 'João Pereira', 7, '(22) 98888-4444', 'joao.pereira@aluno.colegiosb.edu.br', NULL, 5, '2025-05-06T21:27:33.077253+00:00'),
(11, '2024202', 'Lucas Costa', 7, '(22) 98888-5555', 'lucas.costa@aluno.colegiosb.edu.br', NULL, 5, '2025-05-06T21:27:33.077253+00:00'),
(12, '2024301', 'Julia Lima', 8, '(22) 98888-6666', 'julia.lima@aluno.colegiosb.edu.br', NULL, 6, '2025-05-06T21:27:33.077253+00:00'),
(13, '2024302', 'Gabriel Souza', 8, '(22) 98888-7777', 'gabriel.souza@aluno.colegiosb.edu.br', NULL, 6, '2025-05-06T21:27:33.077253+00:00'),
(14, '2024104', 'Beatriz Almeida', 6, '(22) 98888-8888', 'beatriz.almeida@aluno.colegiosb.edu.br', NULL, 4, '2025-05-06T21:28:18.102867+00:00'),
(15, '2024105', 'Carlos Eduardo', 6, '(22) 98888-9999', 'carlos.eduardo@aluno.colegiosb.edu.br', NULL, 4, '2025-05-06T21:28:18.102867+00:00'),
(16, '2024203', 'Daniela Santos', 7, '(22) 98889-1111', 'daniela.santos@aluno.colegiosb.edu.br', NULL, 5, '2025-05-06T21:28:18.102867+00:00'),
(17, '2024204', 'Eduardo Silva', 7, '(22) 98889-2222', 'eduardo.silva@aluno.colegiosb.edu.br', NULL, 5, '2025-05-06T21:28:18.102867+00:00'),
(18, '2024303', 'Fernanda Lima', 8, '(22) 98889-3333', 'fernanda.lima@aluno.colegiosb.edu.br', NULL, 6, '2025-05-06T21:28:18.102867+00:00'),
(19, '2024304', 'Gabriel Costa', 8, '(22) 98889-4444', 'gabriel.costa@aluno.colegiosb.edu.br', NULL, 6, '2025-05-06T21:28:18.102867+00:00'),
(20, '2024501', 'Helena Oliveira', 10, '(22) 98889-5555', 'helena.oliveira@aluno.colegiosb.edu.br', NULL, 8, '2025-05-06T21:28:18.102867+00:00'),
(21, '2024401', 'Isabella Santos', 8, '(22) 98889-6666', 'isabella.santos@aluno.colegiosb.edu.br', NULL, 7, '2025-05-06T21:44:02.76515+00:00'),
(22, '2024402', 'João Miguel', 8, '(22) 98889-7777', 'joao.miguel@aluno.colegiosb.edu.br', NULL, 7, '2025-05-06T21:44:02.76515+00:00'),
(23, '2024403', 'Laura Oliveira', 8, '(22) 98889-8888', 'laura.oliveira@aluno.colegiosb.edu.br', NULL, 7, '2025-05-06T21:44:02.76515+00:00'),
(24, '2024404', 'Miguel Silva', 8, '(22) 98889-9999', 'miguel.silva@aluno.colegiosb.edu.br', NULL, 7, '2025-05-06T21:44:02.76515+00:00'),
(25, '2024502', 'Pedro Henrique', 10, '(22) 98890-1111', 'pedro.henrique@aluno.colegiosb.edu.br', NULL, 8, '2025-05-06T21:45:11.529861+00:00'),
(26, '2024503', 'Sofia Martins', 10, '(22) 98890-2222', 'sofia.martins@aluno.colegiosb.edu.br', NULL, 8, '2025-05-06T21:45:11.529861+00:00'),
(27, '2024504', 'Theo Santos', 10, '(22) 98890-3333', 'theo.santos@aluno.colegiosb.edu.br', NULL, 8, '2025-05-06T21:45:11.529861+00:00');

-- Resetando as sequências
SELECT setval('escolas_id_seq', (SELECT MAX(id) FROM escolas));
SELECT setval('modalidades_id_seq', (SELECT MAX(id) FROM modalidades));
SELECT setval('professores_id_seq', (SELECT MAX(id) FROM professores));
SELECT setval('disciplinas_id_seq', (SELECT MAX(id) FROM disciplinas));
SELECT setval('turmas_id_seq', (SELECT MAX(id) FROM turmas));
SELECT setval('professores_turmas_disciplinas_id_seq', (SELECT MAX(id) FROM professores_turmas_disciplinas));
SELECT setval('alunos_id_seq', (SELECT MAX(id) FROM alunos)); 