// Serviço proxy para chamadas ao MCP do Supabase
const PROJECT_ID = 'kdjpvjvptqikgqjtjmcp';

export interface SupabaseProxyResponse<T = any> {
  data: T;
  error?: string;
}

export class SupabaseProxy {
  // Executar SQL diretamente no banco
  static async executeSQL(query: string): Promise<any[]> {
    try {
      // Simular chamada ao MCP - em produção seria uma chamada real
      console.log('Executando query:', query);
      
      // Para desenvolvimento, retornar dados mock baseados na query
      if (query.includes('turmas')) {
        // Se a query inclui filtro por professor, retornar apenas turmas específicas
        if (query.includes('professor_turmas') || query.includes('WHERE')) {
          return [
            { turma_id: 4, turma_nome: 'Turma 101', ano: '1º Ano', periodo: 'Manhã', escola_nome: 'Escola Municipal', modalidade_nome: 'Ciclo de Alfabetização', total_alunos: 20 },
            { turma_id: 7, turma_nome: 'Turma 301', ano: '3º Ano', periodo: 'Manhã', escola_nome: 'Escola Municipal', modalidade_nome: 'Fundamental 1', total_alunos: 22 }
          ];
        }
        // Caso contrário, retornar todas as turmas
        return [
          { turma_id: 4, turma_nome: 'Turma 101', ano: '1º Ano', periodo: 'Manhã', escola_nome: 'Escola Municipal', modalidade_nome: 'Ciclo de Alfabetização', total_alunos: 20 },
          { turma_id: 5, turma_nome: 'Turma 102', ano: '1º Ano', periodo: 'Tarde', escola_nome: 'Escola Municipal', modalidade_nome: 'Ciclo de Alfabetização', total_alunos: 18 },
          { turma_id: 7, turma_nome: 'Turma 301', ano: '3º Ano', periodo: 'Manhã', escola_nome: 'Escola Municipal', modalidade_nome: 'Fundamental 1', total_alunos: 22 }
        ];
      }
      
      if (query.includes('alunos')) {
        return [
          { aluno_id: 1, nome: 'Ana Silva Santos', matricula: '2024001', idade: 7, turma_id: 4, turma_nome: 'Turma 101', ano: '1º Ano' },
          { aluno_id: 2, nome: 'Bruno Costa Lima', matricula: '2024002', idade: 7, turma_id: 4, turma_nome: 'Turma 101', ano: '1º Ano' },
          { aluno_id: 3, nome: 'Carla Dias Oliveira', matricula: '2024003', idade: 7, turma_id: 5, turma_nome: 'Turma 102', ano: '1º Ano' },
          { aluno_id: 4, nome: 'Daniel Santos Pereira', matricula: '2024004', idade: 9, turma_id: 7, turma_nome: 'Turma 301', ano: '3º Ano' },
          { aluno_id: 5, nome: 'Elena Oliveira Costa', matricula: '2024005', idade: 9, turma_id: 7, turma_nome: 'Turma 301', ano: '3º Ano' },
          { aluno_id: 6, nome: 'Felipe Rodrigues Silva', matricula: '2024006', idade: 7, turma_id: 4, turma_nome: 'Turma 101', ano: '1º Ano' },
          { aluno_id: 7, nome: 'Gabriela Ferreira Santos', matricula: '2024007', idade: 7, turma_id: 5, turma_nome: 'Turma 102', ano: '1º Ano' },
          { aluno_id: 8, nome: 'Henrique Alves Lima', matricula: '2024008', idade: 9, turma_id: 7, turma_nome: 'Turma 301', ano: '3º Ano' }
        ];
      }
      
      if (query.includes('avaliacoes')) {
        return [
          { id: '302048d1-4f21-415c-a05f-5c388e92ed9f', titulo: 'Avaliação - Testando Id único', turma_id: 7, disciplina_id: 2, quantidade_questoes: 5, nota_maxima: '10.00', status: 'rascunho', created_at: '2025-06-02 22:00:28.105358+00', turma_nome: 'Turma 301', disciplina_nome: 'Matemática' },
          { id: '06b970e0-a7f8-4e95-85f1-f799167573ac', titulo: 'Avaliação - testando avaliação impressa', turma_id: 4, disciplina_id: 1, quantidade_questoes: 10, nota_maxima: '99.99', status: 'rascunho', created_at: '2025-05-30 20:04:28.983911+00', turma_nome: 'Turma 101', disciplina_nome: 'Língua Portuguesa' },
          { id: '8d4fc7fc-3a73-4430-8720-75c30f8997b2', titulo: 'Avaliação de Leitura e Escrita - 1º Ano', turma_id: 4, disciplina_id: 1, quantidade_questoes: 10, nota_maxima: '10.00', status: 'rascunho', created_at: '2025-05-29 13:52:09.569563+00', turma_nome: 'Turma 101', disciplina_nome: 'Língua Portuguesa' },
          { id: '12525e6e-8ad7-4248-9190-bc1e94fc7584', titulo: 'Avaliação - sem fru fru', turma_id: 4, disciplina_id: 1, quantidade_questoes: 10, nota_maxima: '99.99', status: 'rascunho', created_at: '2025-05-30 19:54:30.778826+00', turma_nome: 'Turma 101', disciplina_nome: 'Língua Portuguesa' }
        ];
      }
      
      if (query.includes('COUNT')) {
        return [{ total: 8 }];
      }
      
      return [];
    } catch (error) {
      console.error('Erro ao executar SQL:', error);
      throw error;
    }
  }

  // Buscar turmas com dados completos (filtradas por professor)
  static async getTurmasCompletas(professorId?: number) {
    let query = `
      SELECT 
        t.id as turma_id,
        t.nome as turma_nome,
        t.ano,
        t.periodo,
        e.nome as escola_nome,
        m.nome as modalidade_nome,
        COUNT(a.id) as total_alunos
      FROM turmas t
      LEFT JOIN escolas e ON t.escola_id = e.id
      LEFT JOIN modalidades m ON t.modalidade_id = m.id
      LEFT JOIN alunos a ON t.id = a.turma_id
    `;
    
    // Se professorId for fornecido, filtrar apenas turmas do professor
    if (professorId) {
      query += `
      WHERE t.id IN (
        SELECT DISTINCT turma_id 
        FROM professor_turmas pt 
        WHERE pt.professor_id = ${professorId}
      )
      `;
    }
    
    query += `
      GROUP BY t.id, t.nome, t.ano, t.periodo, e.nome, m.nome
      ORDER BY t.nome
    `;
    
    return this.executeSQL(query);
  }

  // Buscar alunos com dados das turmas
  static async getAlunosCompletos() {
    const query = `
      SELECT 
        a.id as aluno_id,
        a.nome,
        a.matricula,
        a.idade,
        a.turma_id,
        t.nome as turma_nome,
        t.ano,
        t.periodo
      FROM alunos a
      LEFT JOIN turmas t ON a.turma_id = t.id
      WHERE a.turma_id IS NOT NULL
      ORDER BY a.nome
    `;
    
    return this.executeSQL(query);
  }

  // Buscar avaliações com dados completos
  static async getAvaliacoesCompletas() {
    const query = `
      SELECT 
        av.id,
        av.titulo,
        av.turma_id,
        av.disciplina_id,
        av.quantidade_questoes,
        av.nota_maxima,
        av.status,
        av.created_at,
        t.nome as turma_nome,
        d.nome as disciplina_nome
      FROM avaliacoes av
      LEFT JOIN turmas t ON av.turma_id = t.id
      LEFT JOIN disciplinas d ON av.disciplina_id = d.id
      ORDER BY av.created_at DESC
    `;
    
    return this.executeSQL(query);
  }

  // Contar planos de aula
  static async getCountPlanosAula() {
    const query = `SELECT COUNT(*) as total FROM planos_aula`;
    const result = await this.executeSQL(query);
    return result[0]?.total || 0;
  }
} 