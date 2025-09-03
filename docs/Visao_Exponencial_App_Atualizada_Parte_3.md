# Visão Exponencial do App Atualizada - Parte 3

## Serviços de Suporte e Otimização

### `src/services/tokenService.ts`
Este serviço é vital para o monitoramento e cálculo do uso de tokens e os custos associados às interações com a IA. Ele define os preços dos modelos OpenAI (`MODEL_PRICING`), gerencia a taxa de câmbio USD-BRL (salva no `localStorage`), estima tokens em textos, calcula custos com base em tokens de entrada/saída (incluindo tokens em cache com desconto), analisa o uso de tokens de conversas completas, formata custos em BRL e USD, e gera relatórios de uso detalhados. Salva e recupera dados de uso no `localStorage` por professor e limpa dados antigos.

### `src/services/conversationMemory.ts`
Este serviço gerencia a memória de longo prazo das conversas da IA, operando em segundo plano. Ele é responsável por:
*   **Resumo de Conversas**: Gera automaticamente resumos de conversas, extraindo tópicos, pontos-chave e até informações pessoais para contextualização futura.
*   **Armazenamento de Memória**: Armazena esses resumos de forma eficiente no `localStorage`, aplicando um limite (`MAX_SUMMARIES`) para evitar sobrecarga.
*   **Cache de Contexto**: Implementa um robusto sistema de cache (`contextCache`) para otimizar o uso de tokens. Ele armazena contextos relevantes por um período determinado (`CACHE_DURATION`) e possui mecanismos para limpar entradas expiradas, garantindo que o contexto seja sempre atualizado e relevante.
*   **Busca e Recuperação**: Permite a busca por conversas passadas relevantes baseadas na mensagem atual, utilizando um cálculo de relevância "fuzzy" para encontrar correspondências aproximadas.
*   **Gerenciamento de Dados**: Inclui funcionalidades para migrar conversas antigas e redefinir a memória, assegurando a flexibilidade e manutenção do sistema.
*   **Estatísticas e Depuração**: Oferece métodos para obter estatísticas sobre o uso da memória e para depurar a análise de mensagens, auxiliando no entendimento e otimização do comportamento da IA.

### `src/services/openaiService.ts`
Este serviço é a camada de interação direta com a API da OpenAI. Suas principais responsabilidades incluem:
*   **Geração de Planos de Aula**: Possui a função `generateLessonPlanWithOpenAI` que envia parâmetros detalhados (disciplina, série, tópico, objetivos BNCC, etc.) para a OpenAI, gerando planos de aula trimestrais completos em formato HTML.
*   **Geração de Avaliações**: Inclui a função `generateAvaliacaoWithOpenAI`, que está em desenvolvimento, mas é destinada a criar avaliações com base em configurações específicas.
*   **Streaming de Respostas para Chat**: A classe `OpenAIChatService` (exportada como `openaiService`) gerencia as interações de chat, enviando prompts e histórico de conversas para a OpenAI e processando as respostas em *streaming* para uma experiência de usuário fluida.
*   **Configuração da IA**: Integra-se com `ProfessorIAConfigService` para carregar configurações personalizadas da IA, influenciando a forma como os prompts são construídos e as respostas são geradas.
*   **Segurança de Conteúdo**: Utiliza `DOMPurify` para sanitizar o conteúdo HTML recebido da OpenAI, prevenindo ataques de XSS e garantindo a segurança da aplicação.
*   **Tratamento de Erros e Logs**: Implementa um robusto tratamento de erros para falhas na comunicação com a API da OpenAI e inclui logs detalhados para diagnóstico das requisições.

### `src/services/costOptimizedChatService.ts`
Este serviço é responsável por otimizar o custo e o desempenho das interações de chat com a IA, aplicando uma lógica de decisão inteligente antes de acionar a API da OpenAI. Suas principais funcionalidades incluem:
*   **Verificação de Limites e Configurações**: Antes de processar uma requisição, verifica as configurações de uso do professor (limites mensais/diários de tokens e mensagens) e se o acesso está bloqueado, conforme definido por `ProfessorUsageConfig` e `MonthlyUsage`.
*   **Respostas Pré-computadas**: Prioriza a busca por respostas em um banco de dados de respostas pré-computadas (`PreComputedAnswer`) com base em palavras-chave e categorias. Se uma resposta de alta confiança for encontrada, ela é utilizada, evitando chamadas desnecessárias à API da IA.
*   **Cache de Respostas**: Implementa um sistema de cache (`CacheEntry`) para armazenar respostas de IA já geradas para perguntas frequentes. Isso reduz significativamente o custo, pois a resposta é servida diretamente do cache em vez de gerar uma nova requisição à IA. O cache é baseado em um hash da pergunta original.
*   **Modo de Otimização (Stream ou Completo)**: Oferece dois modos de processamento:
    *   `processOptimizedQuestionWithStream`: Prioriza o *streaming* da resposta da IA, mas ainda verifica respostas pré-computadas e cache antes de chamar a IA.
    *   `processOptimizedQuestion`: Processa a pergunta com todas as otimizações, mas não oferece *streaming*.
*   **Métricas de Otimização**: Registra detalhadamente os resultados da otimização (`OptimizationResult`), incluindo a fonte da resposta (cache, pré-computada, IA), custos, tokens usados, economia gerada e tempo de processamento.
*   **Integração com Serviços de IA e Tokens**: Colabora diretamente com `aiService` para gerar respostas de IA quando necessário e com `tokenService` para estimar o uso de tokens.

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

---

## Conclusão: O Que é o Aplicativo e Para Que Serve

Após uma análise detalhada da arquitetura, das telas e dos serviços, fica claro que o "App Gestor Escolar" transcende a definição de um simples aplicativo. Ele se revela como uma **plataforma de gestão pedagógica assistida por Inteligência Artificial**, um ecossistema robusto projetado para otimizar, personalizar e dar inteligência ao fluxo de trabalho de **professores e gestores escolares**.

Em essência, a plataforma serve para:

1.  **Potencializar o Professor**: Oferece um ciclo completo de ferramentas que abrange desde a **criação de planos de aula e avaliações** até a **correção de provas** (em desenvolvimento). O objetivo é automatizar tarefas repetitivas e enriquecer o conteúdo pedagógico.

2.  **Fornecer um Assistente de IA Personalizado**: O chat é, na verdade, um **copiloto pedagógico**. Ele utiliza um complexo sistema de personas, contexto e memória para se adaptar ao estilo de cada professor, compreender suas turmas e alunos, e oferecer suporte relevante e personalizado, muito além de respostas genéricas.

3.  **Empoderar a Gestão Escolar**: Através de dashboards e da coleta de dados, a plataforma visa fornecer aos **diretores e gestores** uma visão clara do panorama escolar. Os diagnósticos por turma e aluno, uma vez funcionais, permitirão a identificação de tendências e a tomada de decisões baseadas em dados.

4.  **Garantir Flexibilidade e Adaptação**: O "aparato de coisas por trás", como as inúmeras configurações para IA, planos de aula e avaliações, demonstra a ambição de criar um sistema flexível, capaz de se moldar às necessidades e realidades de diferentes metodologias de ensino e perfis de escola.

Em resumo, o aplicativo é uma solução integrada que busca posicionar a tecnologia, especialmente a IA, como uma parceira estratégica para educadores, facilitando a gestão, a criação de conteúdo e a análise de desempenho, e, em última instância, aprimorando a qualidade do ensino. 