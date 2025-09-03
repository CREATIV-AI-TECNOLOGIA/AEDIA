# Visão Exponencial do App Atualizada - Parte 1

## Essência e Propósito Geral do App
O aplicativo "App Gestor Escolar" é uma plataforma educacional abrangente e inteligente, projetada para otimizar e personalizar a gestão escolar e o processo de ensino-aprendizagem. Ele atende a diversos perfis de usuários – alunos, professores e diretores/gestores – com funcionalidades específicas para cada um, sempre com o foco em:
*   **Personalização via IA**: Oferecer experiências de aprendizado e ensino adaptadas às necessidades individuais através de inteligência artificial.
*   **Gestão Educacional Eficiente**: Simplificar e automatizar tarefas administrativas e pedagógicas.
*   **Comunicação e Colaboração**: Facilitar a interação entre todos os membros da comunidade escolar.
*   **Acompanhamento do Desempenho**: Fornecer ferramentas para monitorar o progresso dos alunos e a performance da escola.

## Fluxo e Detalhes das Telas Principais

### `src/pages/LoginRolesPage.tsx`
*   **Propósito**: Esta é a tela de entrada principal do aplicativo, responsável pela autenticação dos usuários.
*   **Funcionalidade**:
    *   **Autenticação**: Permite que os usuários façam login utilizando suas credenciais (email e senha), que são autenticadas via Supabase.
    *   **Determinação de Papel**: Após o login, o sistema determina o papel do usuário (Aluno, Professor, Diretora) com base no domínio e padrões do email fornecido. Isso é crucial para direcionar o usuário para a interface correta.
    *   **Redirecionamento**: Redireciona o usuário para o dashboard apropriado de acordo com o seu papel (`/aluno`, `/dashboard-professor`, `/gestao`).
    *   **Feedback ao Usuário**: Inclui tratamento de erros para falhas de login e exibe estados de carregamento para uma melhor experiência do usuário.
*   **Fluxo**: Usuário insere credenciais -> Autenticação Supabase -> Validação de papel -> Redirecionamento para o dashboard específico.

### `src/pages/Aluno/AlunoDashboardPage.tsx`
*   **Propósito**: Painel de controle principal para usuários com o papel de "Aluno".
*   **Funcionalidade**:
    *   **Visão Geral do Desempenho**: Apresenta informações sobre o desempenho acadêmico do aluno, incluindo um gráfico de desempenho (atualmente um mockup) e um painel de perfil.
    *   **Perfil do Aluno**: Exibe o nome do aluno, turma, uma barra de progresso "Estrela Dourada" (provavelmente ligada a gamificação), pontuação e atividades recentes (dados estáticos para demonstração).
    *   **Interatividade**: Possui um campo de pesquisa para atividades e um botão "Melhorar desempenho", indicando futuras funcionalidades de suporte ao estudo.
    *   **Tecnologias**: Utiliza o hook `useAuth` para gerenciar o estado de autenticação do aluno e Tailwind CSS para estilização.
*   **Fluxo**: Aluno loga -> Redirecionado para este dashboard -> Visualiza seu progresso e opções.

### `src/pages/Aluno/AlunoTarefasPage.tsx`
*   **Propósito**: Tela destinada a exibir as tarefas do aluno.
*   **Funcionalidade**: Atualmente serve como um *placeholder* informativo, indicando que a funcionalidade "Minhas Tarefas" está em desenvolvimento. No entanto, já renderiza o componente `TarefasPlanoAula`, sugerindo que as tarefas dos planos de aula serão o foco aqui.
*   **Fluxo**: Aluno acessa "Minhas Tarefas" -> Vê mensagem de desenvolvimento e o componente de tarefas do plano de aula.

### `src/pages/Gestao/DashboardGestaoPage.tsx`
*   **Propósito**: Painel de controle central para usuários com o papel de "Diretora" ou "Gestão Escolar".
*   **Funcionalidade**:
    *   **Visão Panorâmica**: Fornece uma visão geral de indicadores educacionais chave: número de professores, turmas, alunos e diagnósticos, incluindo variações percentuais para análise rápida.
    *   **Listas de Recursos**: Exibe listas de professores e turmas (atualmente com dados fictícios).
    *   **Gráficos e Estatísticas**: Inclui um gráfico de modalidades (mockup) e seções para "Próximas Atividades" e "Diagnósticos Recentes" com seus respectivos status.
    *   **Filtragem de Dados**: Permite selecionar mês e ano para filtrar os dados exibidos.
    *   **Tecnologias**: Utiliza o componente `PageContainer` para layout, o hook `useAuth` para autenticação, ícones de `lucide-react` e estilização com Tailwind CSS.
*   **Fluxo**: Usuário com perfil de gestão loga -> Acessa este dashboard -> Monitora indicadores e atividades escolares.

### `src/pages/PlanoAula/TarefasPage.tsx`
*   **Propósito**: Serve como um invólucro simples para o componente principal de gerenciamento de tarefas de plano de aula.
*   **Funcionalidade**: Apenas renderiza o componente `TarefasPlanoAula`.
*   **Fluxo**: Acesso à página de tarefas -> Carregamento do componente `TarefasPlanoAula`.

### `src/components/PlanoAula/TarefasPlanoAula.tsx`
*   **Propósito**: Componente robusto para gerenciar e acompanhar tarefas derivadas de planos de aula.
*   **Funcionalidade**:
    *   **Carregamento de Tarefas**: Busca tarefas do Supabase, especificamente da tabela `tarefas_plano_aula`.
    *   **Status da Tarefa**: Determina e exibe o status de cada tarefa (pendente, concluída, atrasada) com base em lógicas de data.
    *   **Filtros e Pesquisa**: Permite aos usuários pesquisar tarefas por título e filtrar por status (pendente, concluída, atrasada) e período.
    *   **Exibição de Tarefas**: Apresenta as tarefas em cards individuais, mostrando detalhes como disciplina, turma, data de entrega, observações e status.
    *   **Interações com Tarefas**: Oferece botões para "Ver Detalhes" (que abre um modal `DetalheTarefaModal`) e "Marcar como Concluída", permitindo a interação direta com o ciclo de vida da tarefa.
    *   **Tecnologias**: Interage com o Supabase para operações de dados, utiliza `date-fns` para manipulação de datas, `lucide-react` para ícones e Tailwind CSS para estilização.
*   **Fluxo**: Usuário acessa tarefas -> Carregamento e exibição de tarefas do Supabase -> Filtragem/Pesquisa -> Interação com cards de tarefas.

### `src/pages/PlanoAula/RevisaoPlanoPage.tsx`
*   **Propósito**: Tela para revisão final de um plano de aula antes de sua geração e persistência.
*   **Funcionalidade**:
    *   **Recebimento de Dados**: Recebe os dados do plano de aula (modalidade, disciplina, ano, turma, habilidades, etc.) via `location.state` (provavelmente de uma tela de criação anterior).
    *   **Exibição de Detalhes**: Apresenta todos os detalhes do plano de aula para revisão.
    *   **Habilidades e Práticas de Linguagem**: Busca e exibe "práticas de linguagem" associadas a cada habilidade (atualmente simulado, mas indica uma futura interação com a tabela `matriz_curricular` no Supabase).
    *   **Ações**: Possui botões "Voltar e Editar" para ajustes e "Gerar Plano de Aula" para finalizar o processo.
*   **Fluxo**: Criação de plano de aula -> Navegação para a tela de revisão -> Visualização e confirmação -> Geração do plano.

### `src/pages/Chat.tsx`
*   **Propósito**: Interface avançada de chat que integra funcionalidades de IA para professores.
*   **Funcionalidade**:
    *   **Autenticação e Perfil**: Autentica o professor e carrega seu perfil para personalizar a experiência do chat.
    *   **Histórico de Conversas**: Gerencia o histórico de conversas (visualizar lista, carregar conversas anteriores, deletar conversas individuais, limpar todo o histórico).
    *   **Memória de Longo Prazo da IA**: Integra o `conversationMemory.ts` para permitir que a IA mantenha uma memória de longo prazo das interações.
    *   **Personalização da IA (Personas)**: Utiliza `aiPersonaService.ts` para gerenciar personas da IA (criação, ativação, atualização, exclusão, templates) e permite ao professor personalizar a IA através de um modal `PersonaManager`.
    *   **Geração de Respostas da IA**: Utiliza `aiService.generateResponseWithContextStream` para gerar respostas da IA, suportando *streaming* de texto para uma experiência mais fluida.
    *   **Busca na Web (Tavily)**: Inclui integração com `tavilyIntegration.ts` para buscar informações na web e enriquecer as respostas da IA, mesmo que atualmente esteja com um *mock* desabilitado.
    *   **Otimização de Contexto**: Emprega `contextOptimizer.ts` para otimizar o contexto das conversas enviado à IA, visando reduzir o uso de tokens e os custos associados.
    *   **Reconhecimento de Voz**: Integra `webkitSpeechRecognition` para reconhecimento de voz e utiliza `aiService.addPunctuationToTranscript` para melhorar a qualidade das transcrições.
    *   **Monitoramento de Custos**: Monitora o uso de tokens e os custos (`tokenService.ts`, via `TokenUsagePanel`) para informar o professor sobre o consumo de recursos.
    *   **Experiência do Usuário (UX)**: Inclui funcionalidades para aprimorar a UX, como rolagem automática para a última mensagem, foco automático no campo de entrada e a capacidade de copiar mensagens.
*   **Fluxo**: Professor acessa o chat -> Interage com a IA (texto ou voz) -> IA gera respostas personalizadas com base em contexto, memória e busca web -> Monitoramento de uso e custos.

## Serviços de IA: O Cérebro do App

### `src/services/aiService.ts`
Este é o serviço central de orquestração para todas as interações com a Inteligência Artificial. Ele age como um hub, coordenando o uso de diversos outros serviços para fornecer respostas personalizadas e otimizadas. Suas responsabilidades abrangem:
*   **Orquestração Principal da IA**: É o ponto de entrada para a maioria das requisições relacionadas à IA, direcionando-as para os provedores (atualmente `openaiService`) e aplicando as otimizações necessárias.
*   **Geração de Respostas Personalizadas**: Utiliza o `aiPersonaService` para construir prompts de sistema e de usuário altamente personalizados, incorporando a "persona" configurada para o professor e informações de contexto relevantes.
*   **Gerenciamento de Contexto e Memória**: Integra o `conversationMemory` para buscar e injetar contexto relevante de conversas passadas no prompt do sistema, garantindo que a IA mantenha uma memória de longo prazo. Além disso, emprega o `contextOptimizer` para comprimir o histórico da conversa, otimizando o uso de tokens e reduzindo custos.
*   **Integração de Busca na Web**: Possui lógica para integrar a busca na web (através do `tavilyIntegration.ts`, embora atualmente esteja com um *mock* desabilitado) para enriquecer o prompt do usuário com informações em tempo real, se habilitado.
*   **Geração de Planos de Aula e Avaliações**: Expõe métodos específicos (`generatePlanoAula`, `generateAvaliacao`) para acionar a IA na criação de planos de aula e avaliações com base em parâmetros fornecidos.
*   **Suporte a Streaming**: Oferece a funcionalidade de `generateResponseWithContextStream` para permitir o recebimento de respostas da IA em tempo real, proporcionando uma experiência de usuário mais fluida no chat.
*   **Processamento de Transcrições de Voz**: Inclui uma função `addPunctuationToTranscript` para adicionar pontuação a transcrições de reconhecimento de voz, melhorando a qualidade do texto para a IA.
*   **Monitoramento e Insights**: Trabalha em conjunto com o `tokenService` para monitorar o uso de tokens e com o `aiPersonaService` para gerar *insights* a partir das interações com a IA.
*   **Tratamento de Erros e Logs**: Contém mecanismos robustos para lidar com erros de comunicação com as APIs de IA e inclui logs detalhados para diagnóstico e depuração.

### `src/services/aiPersonaService.ts`
Este serviço é o coração da personalização da experiência do professor com a IA, permitindo que a inteligência artificial se adapte ao estilo e às necessidades individuais de cada usuário. Suas principais funções incluem:
*   **Gestão de Personas**: Permite a criação, leitura, atualização e exclusão de "personas" para a IA. Cada persona define características como personalidade, estilo de ensino, estilo de comunicação, expertise e instruções personalizadas, moldando o comportamento da IA.
*   **Ativação de Personas**: Gerencia qual persona está ativa para um determinado professor, garantindo que a IA opere de acordo com as preferências selecionadas.
*   **Geração de Prompts Personalizados**: Utiliza as configurações da persona ativa, juntamente com o contexto do professor (`aiContextService`) e a memória de conversas (`conversationMemory`), para construir prompts de sistema e de usuário altamente detalhados e personalizados para a IA. Isso garante que as respostas da IA sejam contextualmente relevantes e alinhadas ao perfil do professor.
*   **Memória e Insights da IA**: Possui um sistema de memória (`AIMemory`) para registrar interações e um sistema de *insights* (`AIInsight`) para analisar padrões e comportamentos da IA, aprimorando continuamente a personalização.
*   **Templates de Persona**: Oferece a capacidade de criar personas a partir de templates pré-definidos, facilitando a configuração inicial e a padronização.
*   **Persistência de Dados**: Interage com o Supabase para armazenar e recuperar todas as configurações de personas, memórias e insights, garantindo a persistência dos dados entre as sessões.

### `src/services/aiContextService.ts`
Este serviço é responsável por coletar e consolidar um contexto abrangente sobre o professor e o ambiente educacional. Este contexto é essencial para a IA gerar respostas personalizadas e relevantes.
*   **Coleta de Dados Contextuais**: Agrega informações de diversas fontes relacionadas ao professor (como suas turmas, planos de aula, avaliações criadas, estatísticas de uso, dados da escola, experiência profissional, formação, etc.).
*   **Consolidação de Contexto**: Une todas essas informações em um objeto de contexto unificado e detalhado.
*   **Otimização com Cache**: Utiliza um mecanismo de cache para armazenar o contexto do professor, evitando buscas repetitivas no Supabase e otimizando o desempenho das interações com a IA.
*   **Integração com IA**: Fornece este contexto enriquecido para o `aiPersonaService` e, consequentemente, para o `aiService`, permitindo que a IA tenha uma compreensão profunda do ambiente do professor e gere respostas mais precisas e personalizadas. 