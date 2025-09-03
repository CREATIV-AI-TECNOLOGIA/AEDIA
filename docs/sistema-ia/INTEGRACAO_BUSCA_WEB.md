# 🌐 Integração de Busca Web no Assistente

## Problema Identificado

O usuário relatou que a API de busca web (Perplexity) estava configurada e funcionando, mas o assistente não processava corretamente as informações retornadas ou às vezes dizia não ter acesso à internet. O problema estava na **falta de integração** entre a busca web e o fluxo principal do chat, além da **otimização de contexto** que poderia estar truncando informações importantes.

## Solução Implementada

### 1. **Arquitetura da Integração**

```
Pergunta do Usuário
        ↓
Detecção de Necessidade de Busca Web
        ↓
Busca Web via Perplexity (se necessário)
        ↓
Enriquecimento do Prompt do Sistema
        ↓
Processamento pelo ChatGPT 4o mini
        ↓
Resposta com Fontes Citadas
```

### 2. **Componentes Criados**

#### **WebSearchService** (`src/services/webSearchService.ts`)
- **Detecção inteligente** de necessidade de busca web
- **Integração** com a função Perplexity existente
- **Enriquecimento** do prompt do sistema com informações atuais
- **Tratamento de erros** robusto

#### **WebSearchConfig** (`src/services/webSearchConfig.ts`)
- **Configurações centralizadas** para busca educacional
- **Palavras-chave específicas** do contexto educacional brasileiro
- **Domínios confiáveis** (MEC, INEP, universidades)
- **Algoritmos de especificidade** para evitar buscas desnecessárias

#### **PerplexityProxy** (`src/services/perplexityProxy.ts`)
- **Proxy** para a função Perplexity do Supabase
- **Tipagem** adequada para requests/responses
- **Tratamento de erros** específico

#### **WebSearchIndicator** (`src/components/WebSearchIndicator.tsx`)
- **Indicador visual** de busca em andamento
- **Exibição de fontes** consultadas
- **Feedback** de erros na busca web

### 3. **Integração no AIService**

O `AIService` foi modificado para:

1. **Detectar** automaticamente quando usar busca web
2. **Realizar** a busca antes de processar a pergunta
3. **Enriquecer** o prompt do sistema com informações atuais
4. **Preservar** as informações de busca na resposta
5. **Manter** compatibilidade com otimização de contexto

### 4. **Detecção Inteligente de Busca Web**

#### **Critérios de Ativação:**
- **Palavras-chave temporais**: "últimas", "recentes", "atuais", "2024", "2025"
- **Tópicos educacionais**: "BNCC", "MEC", "ENEM", "novo ensino médio"
- **Legislação**: "lei", "decreto", "portaria", "resolução"
- **Dados**: "estatísticas", "pesquisa", "relatório", "censo escolar"

#### **Algoritmo de Especificidade:**
- Calcula um **score** baseado na especificidade da pergunta
- Evita buscas para perguntas muito **genéricas**
- Prioriza perguntas **educacionais** e **específicas**

### 5. **Interface do Usuário**

#### **Indicadores Visuais:**
- 🔍 **Busca em andamento**: Ícone animado durante a busca
- ✅ **Busca concluída**: Badge verde com fontes consultadas
- ⚠️ **Erro na busca**: Badge amarelo com mensagem de erro

#### **Fontes Citadas:**
- **Links clicáveis** para as fontes consultadas
- **Formatação limpa** dos URLs
- **Limite** de 5 fontes exibidas por resposta

## Configurações Específicas

### **Domínios Educacionais Priorizados:**
```typescript
[
  'mec.gov.br',
  'inep.gov.br', 
  'portal.mec.gov.br',
  'basenacionalcomum.mec.gov.br',
  'capes.gov.br',
  'cnpq.br',
  'scielo.br',
  'novaescola.org.br',
  // ... outros domínios confiáveis
]
```

### **Configuração Perplexity:**
```typescript
{
  model: 'llama-3.1-sonar-small-128k-online',
  max_tokens: 1000,
  temperature: 0.3,
  search_recency_filter: 'month',
  return_citations: true
}
```

## Fluxo de Funcionamento

### **1. Detecção Automática**
```typescript
// Exemplo de pergunta que ativa busca web
"Quais são as últimas mudanças na BNCC para 2024?"

// Análise:
// ✅ hasWebKeywords: "últimas", "2024"
// ✅ isEducational: "BNCC"
// ✅ isSpecificEnough: score > 0.3
// → Busca web ATIVADA
```

### **2. Enriquecimento do Prompt**
```typescript
// Prompt original + contexto web
const enhancedPrompt = systemPrompt + `

## 🌐 INFORMAÇÕES ATUAIS DA WEB

**Dados obtidos através de busca web em tempo real:**
${webResult.content}

**Fontes consultadas:**
1. https://basenacionalcomum.mec.gov.br/...
2. https://portal.mec.gov.br/...

**INSTRUÇÕES:**
- Use essas informações atuais para complementar sua resposta
- Sempre mencione que as informações foram obtidas via busca web
- Cite as fontes quando relevante
`;
```

### **3. Resposta Enriquecida**
O assistente agora pode responder com:
- **Informações atualizadas** da web
- **Fontes oficiais** citadas
- **Transparência** sobre o uso de busca web
- **Contexto educacional** preservado

## Benefícios da Implementação

### **Para o Usuário:**
- ✅ **Informações atualizadas** sobre educação
- ✅ **Fontes confiáveis** sempre citadas
- ✅ **Transparência** sobre origem das informações
- ✅ **Economia de tempo** de pesquisa

### **Para o Sistema:**
- ✅ **Detecção inteligente** evita buscas desnecessárias
- ✅ **Integração transparente** com otimização existente
- ✅ **Tratamento robusto** de erros
- ✅ **Configuração centralizada** e flexível

## Resolução do Problema Original

### **Antes:**
- ❌ Busca web funcionava mas não era integrada
- ❌ Assistente dizia "não ter acesso à internet"
- ❌ Informações de busca eram perdidas na otimização
- ❌ Sem feedback visual para o usuário

### **Depois:**
- ✅ Busca web **totalmente integrada** ao fluxo
- ✅ Assistente **usa informações atuais** automaticamente
- ✅ Informações de busca **preservadas** na otimização
- ✅ **Feedback visual** claro para o usuário
- ✅ **Fontes citadas** em todas as respostas

## Monitoramento e Logs

O sistema agora inclui logs detalhados:

```typescript
console.log('🔍 Análise de busca web:', {
  hasWebKeywords: true,
  isEducational: true,
  specificityScore: 0.7,
  shouldSearch: true
});

console.log('🌐 Busca web integrada ao prompt:', {
  contentLength: 1250,
  sourcesCount: 4,
  hasError: false
});
```

## Próximos Passos

1. **Monitorar** uso e eficácia da busca web
2. **Ajustar** algoritmos de detecção baseado no feedback
3. **Expandir** domínios educacionais conforme necessário
4. **Implementar** cache para otimizar performance
5. **Adicionar** métricas de qualidade das fontes

---

**Status:** ✅ **IMPLEMENTADO E FUNCIONAL**  
**Data:** Janeiro 2025  
**Versão:** 1.0 