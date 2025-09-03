# Estratégia de Integração do Saeb ao Aplicativo

Este documento detalha o plano de ação para integrar os dados e a metodologia do Sistema de Avaliação da Educação Básica (Saeb) ao nosso aplicativo, transformando-o em uma plataforma de gestão pedagógica ainda mais poderosa e alinhada às metas educacionais brasileiras e à BNCC.

A análise baseia-se na pesquisa sobre os usos práticos do Saeb e no conhecimento profundo da arquitetura atual do nosso sistema.

## Visão Estratégica

O objetivo é evoluir o aplicativo de um assistente de IA para um **cérebro pedagógico proativo**. Em vez de apenas responder às solicitações do professor, o sistema usará os dados do Saeb para:

1.  **Diagnosticar** as necessidades de aprendizagem em nível de turma e escola de forma automatizada.
2.  **Recomendar** ações pedagógicas personalizadas e baseadas em evidências através de módulos específicos.
3.  **Monitorar** o progresso em relação às metas oficiais (Ideb) no painel do gestor.
4.  **Capacitar** professores e gestores com ferramentas de ação imediata e de alto valor.

## Plano de Ação Detalhado

A implementação será dividida em três fases principais, que se baseiam em componentes já existentes no nosso ecossistema.

### Fase 1: Fundação de Dados - A Importação Guiada pelo Gestor

O primeiro passo é trazer a inteligência do Saeb para dentro do nosso app, colocando o poder nas mãos do gestor escolar.

**1.1. O Módulo de Importação para Gestores:**
*   **Ação:** Desenvolver uma nova seção "Central Saeb" no `DashboardGestaoPage.tsx`.
*   **Fluxo do Usuário (Gestor):**
    1.  O gestor clica em "Importar Resultados do Saeb".
    2.  O app fornece um link direto para o portal do Inep e instruções claras sobre qual arquivo baixar (ex: planilha de proficiência da escola).
    3.  O gestor faz o upload do arquivo diretamente na plataforma.
*   **Backend:** Nosso sistema processa a planilha, valida os dados e popula as tabelas `saeb_habilidades` e `saeb_resultados_escola` no Supabase.

**1.2. Mapeamento Crítico (Backend):**
*   **Ação:** Manter uma tabela de mapeamento `saeb_bncc` que conecte cada descritor do Saeb ao seu código correspondente na BNCC. Este é o "de-para" que dá sentido pedagógico aos dados.

**1.3. Expansão do `aiContextService.ts`:**
*   **Ação:** Modificar o `aiContextService` para que ele possa consultar os resultados da escola importados pelo gestor. Este contexto será consumido por todas as outras funcionalidades de IA.

### Fase 2: Funcionalidades para o Professor - A Pedagogia em Ação

Com os dados no lugar, criamos ferramentas de alto valor que se integram à rotina do professor, sem depender exclusivamente do chat.

**2.1. Um Dashboard Mais Inteligente para o Professor:**
*   **Ação:** Adicionar um widget dinâmico no dashboard do professor.
*   **Resultado:** O widget pode mostrar "Radar de Habilidades", destacando os 3 principais pontos de atenção do Saeb para as turmas daquele professor, com um link para "Gerar Atividades de Reforço".
*   **Impacto:** Direciona o foco do professor para o que é mais importante, de forma proativa.

**2.2. Evoluir o Gerador de Planos de Aula:**
*   **Ação:** Otimizar a `RevisaoPlanoPage.tsx` e seu fluxo.
*   **Funcionalidade:** Ao gerar um plano, a IA usará o contexto do `aiContextService` para sugerir a inclusão de atividades focadas nas habilidades críticas do Saeb. A sugestão aparecerá de forma contextual no processo, não como um desvio.

**2.3. Módulo Dedicado de "Simulados Saeb":**
*   **Ação:** Desenvolver um novo módulo, acessível pelo menu principal, que se aproveita da estrutura de `TarefasPlanoAula.tsx` e `AlunoTarefasPage.tsx`.
*   **Funcionalidade:**
    1.  O professor acessa o "Criador de Simulados".
    2.  Ele seleciona as habilidades (o sistema pode destacar as mais críticas).
    3.  O sistema monta um simulado usando as questões da nossa tabela `saeb_questoes`.
    4.  Após a realização pelo aluno, o sistema gera um relatório de desempenho individual e por turma.

**2.4. O Papel do Chat (`Chat.tsx`):**
*   **Ação:** O chat não será o iniciador, mas um consumidor inteligente do contexto.
*   **Exemplo:** Se o professor perguntar "me dê ideias para a aula de matemática do 5º ano", a IA, sabendo do contexto do Saeb, pode responder: "Claro. Uma ótima ideia seria focar em problemas envolvendo frações, que é um ponto de desenvolvimento para a escola segundo o último Saeb. Que tal um projeto sobre 'pizzaria matemática'?".

### Fase 3: Visão Gerencial - O Painel do Gestor

Capacitar a liderança da escola com dados para tomada de decisão, agora alimentados por eles mesmos.

**3.1. Enriquecer o `DashboardGestaoPage.tsx`:**
*   **Ação:** Após a importação dos dados, a "Central Saeb" se expande com novos componentes visuais.
*   **Novos Widgets:**
    *   **"Raio-X do Saeb":** Gráfico interativo mostrando o desempenho da escola em cada habilidade avaliada, com filtros por ano e disciplina.
    *   **"Calculadora de Metas Ideb":** Uma ferramenta que permite ao gestor simular cenários: "Se melhorarmos a nota de matemática em X pontos, qual será nosso novo Ideb?".
    *   **"Alerta de Habilidades Críticas":** Uma lista que destaca as 3 habilidades com desempenho mais baixo, com um botão de "Criar Plano de Ação", que inicia um fluxo de recomendação de planos de aula para os professores responsáveis.

## Conclusão da Estratégia

A integração com o Saeb é o passo que eleva nosso aplicativo de uma ferramenta "útil" para uma ferramenta **"indispensável"**. Ele conecta a rotina da sala de aula com as políticas públicas de educação, economiza tempo de planejamento do professor, direciona o foco para as dificuldades reais dos alunos e fornece aos gestores uma visão clara do caminho a seguir. Esta estratégia, refinada com um fluxo de uso claro e papéis bem definidos, nos posiciona como um líder na aplicação de IA para a melhoria concreta da educação básica no Brasil. 