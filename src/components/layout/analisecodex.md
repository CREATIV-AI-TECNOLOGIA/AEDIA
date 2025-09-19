egue o mapeamento do fluxo Versão 2.0 com diagnóstico, regras BNCC e plano de correções.

Fluxo Atual

Tela inicial: CriarPlanoAula exibe o toggle Versão 1.0/2.0 e navega para V2 via navigate('/criar-plano-aula-v2') (src/pages/CriarPlanoAula.tsx:348). Mostra saudação, contador de práticas e acesso às configurações de IA.
Seleção de turmas (esperada antes do período): V2 prepara o estado mostrarSelecaoTurma (src/pages/CriarPlanoAulaV2.tsx:20) e renderiza o card de escolha (…V2.tsx:687), porém nunca liga o flag; o efeito inicial está vazio (…V2.tsx:225) e não popula turmasUnicas. Resultado: a tela só aparece quando alguma lógica externa altera o estado (ex.: professores com múltiplas turmas recebendo tratamento especial fora do componente), mas para o fluxo padrão não abre.
Tipo de período: estado inicial etapaAtual='selecao_periodo' (…V2.tsx:14) exibe opções Trimestre/Bimestre, com avanço condicionado (handleContinuarSelecaoPeriodo em …V2.tsx:124). Falta contexto da turma para vincular o período pedagógico real.
Seleção de datas: etapa 'selecao_datas' gera range automático com base no período (…V2.tsx:230). As datas são meramente sugeridas; não há validação com calendário escolar nem sincronização com a BNCC.
Seleção de conteúdo: etapa 'selecao_conteudo' mantém grade fixa 8/4 colunas e apresenta chips por prática (…V2.tsx:580). Painel direito “Itens Selecionados” não possui rolagem própria (…V2.tsx:622). Contador de rodapé lê de getTotalGenerosSelecionados e getTotalHabilidadesSelecionadas (…V2.tsx:659), mas não há sanidade com o painel lateral nem limite de seleção.
Resumo/Confirmação: etapas 'selecao_turma' e 'formulario' são referenciadas (…V2.tsx:138 e …V2.tsx:191), porém não possuem JSX correspondente; o fluxo termina sem revisão ou salvamento real.
Contexto BNCC e filtros por perfil

O hook useHabilidades deveria carregar o contexto do professor via professorId (src/hooks/useHabilidades.ts:18), buscar disciplinas/turmas em HabilidadesService.obterContextoProfessor (src/services/HabilidadesService.ts:182) e filtrar a tabela habilidades_bncc_v2 (…HabilidadesService.ts:49). No entanto, V2 transforma user.id em inteiro com parseInt (src/pages/CriarPlanoAulaV2.tsx:36); IDs UUID iniciados por letra viram NaN, impedindo o carregamento automático e forçando os filtros padrão (disciplina “Língua Portuguesa”, ano “1”) definidos no memo de práticas (…V2.tsx:47).
Quando o contexto está disponível, buscarHabilidadesPorContexto restringe disciplinas e anos das turmas do professor (…HabilidadesService.ts:144), aplica filtro de período mapeando trimestre sugerido (…HabilidadesService.ts:151). Filtros adicionais de gênero/prática são suportados, porém o UI ainda não coleta esses parâmetros.
usePraticas e buscarPraticasLinguagem filtram por disciplina/ano/periodo (src/hooks/useHabilidades.ts:183 e src/services/HabilidadesService.ts:205). A ausência de turma definida mantém o sistema preso ao default de 1º ano.
TODO: confirmar com o time de dados se habilidades_bncc_v2 é a fonte única de BNCC, se existe endpoint complementar para sugestões por período e se há limite institucional de habilidades por plano (ex.: 30 itens). Também falta política oficial de período (bimestre vs trimestre) para configurar o mapeamento em mapPeriodoToTrimestre (…HabilidadesService.ts:26).
Regras de negócio observadas / desejadas

Seleção ilimitada de habilidades; ausência de dependências entre práticas e gêneros. Necessário definir máximo e comportamento ao exceder (feedback progressivo).
Contadores de práticas/habilidades derivam do estado habilidadesPorGenero; divergência ocorre se o objeto ficar com chaves vazias após remoções diretas (…V2.tsx:626).
Navegação “Voltar” apenas muda etapaAtual; não restabelece estados ou validações.
Sugestões dependem de trimestre_sugerido; quando não há dados o app fica silencioso (apenas spinner).
TODO: documentar regras de fallback quando não houver sugestões do período e estabelecer dependências entre prática ↔ gêneros.
Diagnóstico UX com muitas habilidades

Chips selecionáveis usam flex sem contenção; 100+ itens extrapolam largura e criam colunas de altura irregular, especialmente ≤1280px (…V2.tsx:584).
Painel “Itens Selecionados” não tem scroll próprio; lista extensa empurra o layout e some acima da dobra (…V2.tsx:622).
Tooltip depende de title/hover (…V2.tsx:595), inviável em toque e pouco acessível para teclado/leitor.
Rodapé fixo cobre conteúdo em viewport baixa; sem compensação de padding inferior (…V2.tsx:654).
Sem estados de foco/aria nas chips e tabs de práticas, prejudicando navegação teclado.
Contadores do rodapé não comunicam limites ou erro quando excedido; discrepância com painel caso haja duplicidade manual.
Propostas de layout e comportamento

Estrutura: tornar container de conteúdo fluido com max-width configurável (TODO definir valor), reduzir o número de cards aninhados e substituir o flex por um grid responsivo com colunas variáveis por breakpoint.
Painel lateral: fixar altura com scroll independente + virtualização (ex. apenas renderizar itens visíveis) para 100+ seleções; permitir fixar a seção ao topo no desktop.
Seleção em massa: agrupar habilidades por prática/gênero com ações “Selecionar tudo / Limpar” e resumo parcial; refletir imediatamente nos contadores.
Gestão de limites: parametrizar máximo de habilidades; exibir barra de progresso aos 80% e bloqueio com explicação aos 100%.
Interação: permitir remoção inline tanto no chip principal quanto no painel com animação discreta; adicionar undo contextual.
Descoberta: migrar descrição completa para popover acionado por clique/tecla, além de busca com debounce e highlight de termos; adicionar filtros combinados (prática, gênero, período) persistidos entre navegações.
Barra de ações: rodapé pegajoso deve trazer alerta de erro, contadores, “Voltar”, “Próximo”, “Salvar rascunho” com comportamento consistente em todas as etapas.
Acessibilidade: aplicar role/aria-selected nas listas, foco visível, ordem de tabulação lógica, labels autodescritivos e suporte a leitores de tela. TODO definir tokens de tipografia/spacing e breakpoints oficiais.
Auditoria de bugs (Versão 2.0 → Final)

P0 – Seleção de turma não abre: mostrarSelecaoTurma nunca é ativado e turmasUnicas não recebe dados (src/pages/CriarPlanoAulaV2.tsx:20, 225). Repro: clicar Versão 2.0 com qualquer professor. Causa provável: efeito inicial vazio e ausência de fetch. Correção: carregar turmas do professor (ex.: getTurmasDoProfessorDetalhado) e definir mostrarSelecaoTurma = turmas.length > 1, atribuindo automaticamente quando for 1.
P0 – Fluxo trava após Seleção de Conteúdo: handleContinuarSelecaoConteudo envia etapaAtual='selecao_turma' (…V2.tsx:191), mas não há UI; Próximo fica sem efeito tangível. Solução: implementar etapas de turma/periodização/resumo ou ajustar roteamento.
P0 – Contexto BNCC incorreto: parseInt(user.id) (…V2.tsx:36) gera NaN ou ID truncado, quebrando useHabilidades (src/hooks/useHabilidades.ts:121). Repro: docente cujo UUID começa com letra → habilidades vazias. Fix: recuperar professorId via serviço que cruza user.email ou user.user_metadata e repassar o ID real da tabela professores.
P1 – Painel de itens sem sincronização visual: remover prática pelo botão vermelho (…V2.tsx:637) não limpa o grid central; chips continuam marcadas até interação manual. Causa: estado habilidadesPorGenero zera, mas não atualiza generosSelecionados/UI. Sugestão: recalcular seleção e feedback imediato (toast, badging).
P1 – Falta de validação em Próximo: botão habilita mesmo sem habilidades (…V2.tsx:672). Correção: condicionar ao mínimo definido e exibir mensagem inline.
P1 – Tooltip dependente de hover: usuários touch não veem descrição (…V2.tsx:595). Propor popover acionado por clique + tecla Enter/Espaço.
P2 – Counters divergentes no retorno: ao clicar “Voltar para o passo anterior” (…V2.tsx:665), estado permanece, mas UI de chips não recarrega filtros; possível drift. Necessário persistir filtros no contexto ou reset controlado.
TODO: listar endpoints chamados em cada etapa (Supabase RPCs, tabelas), stores de estado globais e eventos de telemetria disponíveis/not used.
Critérios de aceitação propostos

Layout permanece íntegro e responsivo com ≥100 habilidades selecionadas; listas virtualizadas mantêm 60 FPS.
Contadores, chips e painel lateral sempre sincronizados em todas as trocas de etapa, inclusive Voltar/Próximo e mudanças de aba/prática.
Navegação completa via teclado + leitor de tela: foco visível nas chips, popover acessível, botões descritos.
Botões de avanço só habilitam com pré-condições satisfeitas (turma definida, período selecionado, habilidades mínimas) e exibem mensagens claras nos estados vazios/erro.
TODO: definir métricas alvo de desempenho (TTI, input latency) e checklist mínimo de acessibilidade (WCAG AA) com ferramentas de auditoria.
Plano de validação

Matriz cross-browser (Chrome, Edge, Firefox) e resoluções 1440/1280/1024/768/≤600 com zoom 90–125%; incluir interação touch (tablet/phone) e teclado.
Casos extremos: 0, 1, 20, 100, 300 habilidades; códigos e descrições longas; perda/retomada de rede; troca de período e mudança de turma no meio do fluxo.
Performance: medir tempo de carregamento de habilidades, latência ao selecionar/remover (com logs e DevTools Performance).
Telemetria: instrumentar eventos para adicionar/remover habilidade, selecionar tudo, erro de validação, abandono do fluxo; montar funil Versão 2.0 → Resumo.
Entregáveis: mapa de fluxo atualizado, wireframes/protótipos das soluções de layout, backlog de bugs priorizado (P0–P2), critérios de aceitação revisados, plano de rollout/rollback com checkpoints.
Próximos passos recomendados: (1) recuperar o professorId correto e carregar turmas no useEffect inicial, (2) implementar as etapas restantes (turma → resumo) com validações e (3) prototipar o novo layout responsivo antes de codificar.