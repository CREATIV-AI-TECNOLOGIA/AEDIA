-- Aplicar permissões para todas as tabelas do sistema
-- Concede acesso básico para anon e completo para authenticated

-- Tabelas de comunicação
GRANT SELECT ON comunicacao_mensagens TO anon;
GRANT ALL PRIVILEGES ON comunicacao_mensagens TO authenticated;

GRANT SELECT ON comunicacao_conversas TO anon;
GRANT ALL PRIVILEGES ON comunicacao_conversas TO authenticated;

GRANT SELECT ON comunicacao_participantes TO anon;
GRANT ALL PRIVILEGES ON comunicacao_participantes TO authenticated;

-- Tabelas de IA
GRANT SELECT ON ai_insights TO anon;
GRANT ALL PRIVILEGES ON ai_insights TO authenticated;

GRANT SELECT ON ai_memories TO anon;
GRANT ALL PRIVILEGES ON ai_memories TO authenticated;

GRANT SELECT ON ai_personas TO anon;
GRANT ALL PRIVILEGES ON ai_personas TO authenticated;

-- Tabelas principais do sistema escolar
GRANT SELECT ON alunos TO anon;
GRANT ALL PRIVILEGES ON alunos TO authenticated;

GRANT SELECT ON avaliacoes TO anon;
GRANT ALL PRIVILEGES ON avaliacoes TO authenticated;

GRANT SELECT ON avaliacoes_escaneadas TO anon;
GRANT ALL PRIVILEGES ON avaliacoes_escaneadas TO authenticated;

GRANT SELECT ON chat_conversations TO anon;
GRANT ALL PRIVILEGES ON chat_conversations TO authenticated;

GRANT SELECT ON chat_messages TO anon;
GRANT ALL PRIVILEGES ON chat_messages TO authenticated;

GRANT SELECT ON chat_optimized_requests TO anon;
GRANT ALL PRIVILEGES ON chat_optimized_requests TO authenticated;

GRANT SELECT ON chat_response_cache TO anon;
GRANT ALL PRIVILEGES ON chat_response_cache TO authenticated;

-- Tabelas de configuração
GRANT SELECT ON configuracoes_avaliacao_faixa_etaria TO anon;
GRANT ALL PRIVILEGES ON configuracoes_avaliacao_faixa_etaria TO authenticated;

GRANT SELECT ON configuracoes_plano_aula TO anon;
GRANT ALL PRIVILEGES ON configuracoes_plano_aula TO authenticated;

GRANT SELECT ON configuracao_periodos TO anon;
GRANT ALL PRIVILEGES ON configuracao_periodos TO authenticated;

-- Tabelas de estrutura escolar
GRANT SELECT ON diretoras TO anon;
GRANT ALL PRIVILEGES ON diretoras TO authenticated;

GRANT SELECT ON disciplinas TO anon;
GRANT ALL PRIVILEGES ON disciplinas TO authenticated;

GRANT SELECT ON escolas TO anon;
GRANT ALL PRIVILEGES ON escolas TO authenticated;

GRANT SELECT ON eventos_calendario TO anon;
GRANT ALL PRIVILEGES ON eventos_calendario TO authenticated;

-- Tabelas de habilidades e currículo
GRANT SELECT ON habilidades TO anon;
GRANT ALL PRIVILEGES ON habilidades TO authenticated;

GRANT SELECT ON habilidades_bncc_v2 TO anon;
GRANT ALL PRIVILEGES ON habilidades_bncc_v2 TO authenticated;

GRANT SELECT ON matriz_curricular TO anon;
GRANT ALL PRIVILEGES ON matriz_curricular TO authenticated;

-- Tabelas de modalidades e turmas
GRANT SELECT ON modalidades TO anon;
GRANT ALL PRIVILEGES ON modalidades TO authenticated;

GRANT SELECT ON turmas TO anon;
GRANT ALL PRIVILEGES ON turmas TO authenticated;

-- Tabelas de notificações e períodos
GRANT SELECT ON notifications TO anon;
GRANT ALL PRIVILEGES ON notifications TO authenticated;

GRANT SELECT ON periodos_letivos TO anon;
GRANT ALL PRIVILEGES ON periodos_letivos TO authenticated;

-- Tabelas de personas e templates
GRANT SELECT ON persona_templates TO anon;
GRANT ALL PRIVILEGES ON persona_templates TO authenticated;

-- Tabelas de planos de aula
GRANT SELECT ON planos_aula TO anon;
GRANT ALL PRIVILEGES ON planos_aula TO authenticated;

GRANT SELECT ON planos_aula_v2 TO anon;
GRANT ALL PRIVILEGES ON planos_aula_v2 TO authenticated;

-- Tabelas de respostas pré-computadas
GRANT SELECT ON precomputed_answers TO anon;
GRANT ALL PRIVILEGES ON precomputed_answers TO authenticated;

-- Tabelas de professores
GRANT SELECT ON professores TO anon;
GRANT ALL PRIVILEGES ON professores TO authenticated;

GRANT SELECT ON professor_escolas TO anon;
GRANT ALL PRIVILEGES ON professor_escolas TO authenticated;

GRANT SELECT ON professor_ia_configuracoes TO anon;
GRANT ALL PRIVILEGES ON professor_ia_configuracoes TO authenticated;

GRANT SELECT ON professor_monthly_usage TO anon;
GRANT ALL PRIVILEGES ON professor_monthly_usage TO authenticated;

GRANT SELECT ON professor_preferencias TO anon;
GRANT ALL PRIVILEGES ON professor_preferencias TO authenticated;

GRANT SELECT ON professor_usage_config TO anon;
GRANT ALL PRIVILEGES ON professor_usage_config TO authenticated;

GRANT SELECT ON professor_habilidades_vinculos TO anon;
GRANT ALL PRIVILEGES ON professor_habilidades_vinculos TO authenticated;

GRANT SELECT ON professores_turmas_disciplinas TO anon;
GRANT ALL PRIVILEGES ON professores_turmas_disciplinas TO authenticated;

-- Tabelas de projetos e tarefas
GRANT SELECT ON projects TO anon;
GRANT ALL PRIVILEGES ON projects TO authenticated;

GRANT SELECT ON tasks TO anon;
GRANT ALL PRIVILEGES ON tasks TO authenticated;

GRANT SELECT ON tarefas_plano_aula TO anon;
GRANT ALL PRIVILEGES ON tarefas_plano_aula TO authenticated;

GRANT SELECT ON tarefas_alunos_status TO anon;
GRANT ALL PRIVILEGES ON tarefas_alunos_status TO authenticated;

-- Tabelas de questões e correções
GRANT SELECT ON questoes_corrigidas_detalhes TO anon;
GRANT ALL PRIVILEGES ON questoes_corrigidas_detalhes TO authenticated;

-- Tabelas de sessões de escaneamento
GRANT SELECT ON sessoes_escaneamento TO anon;
GRANT ALL PRIVILEGES ON sessoes_escaneamento TO authenticated;

-- Tabelas de logs e configurações do sistema
GRANT SELECT ON logs_processamento_ia TO anon;
GRANT ALL PRIVILEGES ON logs_processamento_ia TO authenticated;

GRANT SELECT ON system_cost_config TO anon;
GRANT ALL PRIVILEGES ON system_cost_config TO authenticated;

-- Tabelas de práticas de linguagem e objetos de conhecimento
GRANT SELECT ON praticas_linguagem_detalhadas TO anon;
GRANT ALL PRIVILEGES ON praticas_linguagem_detalhadas TO authenticated;

GRANT SELECT ON praticas_linguagem_v2 TO anon;
GRANT ALL PRIVILEGES ON praticas_linguagem_v2 TO authenticated;

GRANT SELECT ON objetos_conhecimento_detalhados TO anon;
GRANT ALL PRIVILEGES ON objetos_conhecimento_detalhados TO authenticated;

GRANT SELECT ON objetos_conhecimento_v2 TO anon;
GRANT ALL PRIVILEGES ON objetos_conhecimento_v2 TO authenticated;

-- Tabelas de gêneros textuais
GRANT SELECT ON generos_textuais TO anon;
GRANT ALL PRIVILEGES ON generos_textuais TO authenticated;

GRANT SELECT ON periodo_generos_textuais TO anon;
GRANT ALL PRIVILEGES ON periodo_generos_textuais TO authenticated;

GRANT SELECT ON generos_preconfigurados TO anon;
GRANT ALL PRIVILEGES ON generos_preconfigurados TO authenticated;

-- Verificar permissões aplicadas
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;