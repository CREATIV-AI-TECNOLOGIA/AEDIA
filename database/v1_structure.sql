-- Versão 1 do Banco de Dados - Sistema Escolar

-- Tabela escolas
CREATE TABLE escolas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cidade VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela professores
CREATE TABLE professores (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    escola_id INTEGER REFERENCES escolas(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela turmas
CREATE TABLE turmas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(10) NOT NULL,
    ano VARCHAR(4) NOT NULL,
    escola_id INTEGER REFERENCES escolas(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela alunos
CREATE TABLE alunos (
    id SERIAL PRIMARY KEY,
    matricula VARCHAR(20) UNIQUE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    idade INTEGER,
    telefone VARCHAR(20),
    email VARCHAR(255),
    endereco TEXT,
    turma_id INTEGER REFERENCES turmas(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela disciplinas
CREATE TABLE disciplinas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de relacionamento entre professores, turmas e disciplinas
CREATE TABLE professores_turmas_disciplinas (
    id SERIAL PRIMARY KEY,
    professor_id INTEGER REFERENCES professores(id),
    turma_id INTEGER REFERENCES turmas(id),
    disciplina_id INTEGER REFERENCES disciplinas(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela matriz curricular
CREATE TABLE matriz_curricular (
    id SERIAL PRIMARY KEY,
    ano VARCHAR(4) NOT NULL,
    trimestre INTEGER NOT NULL,
    praticas_linguagem TEXT,
    generos_textuais TEXT,
    objetos_conhecimento TEXT,
    habilidades TEXT,
    disciplina_id INTEGER REFERENCES disciplinas(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
); 