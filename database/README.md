# Estrutura do Banco de Dados - Versão 1

Este documento descreve a estrutura do banco de dados do sistema escolar.

## Tabelas

### Escolas
- Armazena informações das escolas
- Relacionamentos:
  - Uma escola tem vários professores (1:N)
  - Uma escola tem várias turmas (1:N)

### Professores
- Armazena informações dos professores
- Relacionamentos:
  - Pertence a uma escola (N:1)
  - Pode ter várias turmas e disciplinas (N:N)

### Turmas
- Armazena informações das turmas
- Relacionamentos:
  - Pertence a uma escola (N:1)
  - Tem vários alunos (1:N)
  - Tem vários professores e disciplinas (N:N)

### Alunos
- Armazena informações dos alunos
- Campo `matricula` é único
- Relacionamentos:
  - Pertence a uma turma (N:1)

### Disciplinas
- Armazena informações das disciplinas
- Relacionamentos:
  - Pode ter vários professores e turmas (N:N)
  - Tem várias matrizes curriculares (1:N)

### Professores_Turmas_Disciplinas
- Tabela de junção para relacionamento N:N
- Relaciona professores, turmas e disciplinas

### Matriz_Curricular
- Armazena o currículo das disciplinas
- Relacionamentos:
  - Pertence a uma disciplina (N:1)

## Observações
1. Todas as tabelas possuem:
   - Chave primária `id`
   - Campo `created_at` para controle temporal
2. Chaves estrangeiras permitem NULL
3. Campos únicos:
   - `email` em professores
   - `matricula` em alunos 