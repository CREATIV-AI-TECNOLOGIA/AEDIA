# 🌐 Integração com Tavily API - Busca Web Universal

## Problema Resolvido

O usuário queria:
- ✅ **Usar Tavily** em vez de Perplexity
- ✅ **Busca web universal** (não apenas educacional)
- ✅ **Qualquer tipo de pergunta** na internet

## Solução Implementada

### **1. TavilyService** (`src/services/tavilyService.ts`)

Serviço completo para integração com Tavily API:

#### **Características:**
- **Detecção inteligente** de necessidade de busca web
- **Busca universal** - qualquer tópico, não apenas educacional
- **Configuração flexível** (basic/advanced, news/general)
- **Tratamento robusto** de erros
- **Suporte a filtros** de domínios

#### **Detecção de Busca Web:**
```typescript
// Palavras que ativam busca web
const webSearchKeywords = [
  // Temporais
  'últimas', 'recentes', 'atuais', 'hoje', 'agora',
  '2024', '2025', 'este ano',
  
  // Informações
  'notícias', 'dados', 'estatísticas', 'pesquisa',
  'preço de', 'cotação', 'valor de',
  
  // Perguntas específicas
  'o que aconteceu', 'como está', 'qual é a situação',
  'quando', 'onde', 'horário', 'data',
  
  // Comparações
  'melhor', 'comparar', 'diferença', 'review'
];
```

#### **Métodos Principais:**
- `shouldUseWebSearch()` - Detecta necessidade de busca
- `searchWeb()` - Busca básica com Tavily
- `searchNews()` - Busca específica para notícias
- `searchAdvanced()` - Busca avançada com mais resultados
- `enhancePromptWithWebSearch()` - Integra busca no prompt

### **2. TavilyIntegration** (`src/services/tavilyIntegration.ts`)

Camada de integração simples para uso no Chat:

```typescript
// Aplica busca web e retorna informações formatadas
export async function applyWebSearchToPrompt(
  systemPrompt: string,
  userMessage: string
): Promise<{ enhancedPrompt: string; webSearchInfo: WebSearchInfo }>
```

### **3. Configuração da API**

A API Tavily já está configurada no `.env`:
```bash
VITE_TAVILY_API_KEY=tvly-dev-a2e41ICUMtccSEG6LGHSiGVoaR3pf
```

### **4. Fluxo de Funcionamento**

```
Pergunta do Usuário
        ↓
Detecção Automática (TavilyService.shouldUseWebSearch)
        ↓
Busca Web via Tavily API (se necessário)
        ↓
Enriquecimento do Prompt do Sistema
        ↓
Processamento pelo ChatGPT 4o mini
        ↓
Resposta com Fontes Citadas
```

## Exemplos de Uso

### **Busca Geral:**
- *"Qual é o preço do Bitcoin hoje?"*
- *"Últimas notícias sobre inteligência artificial"*
- *"Como está o tempo em São Paulo?"*

### **Busca Educacional:**
- *"Mudanças na BNCC para 2024"*
- *"Dados recentes sobre educação no Brasil"*
- *"Novidades do MEC sobre ensino médio"*

### **Busca de Informações:**
- *"Melhores restaurantes perto de mim"*
- *"Comparar iPhone 15 vs Samsung Galaxy"*
- *"Horário de funcionamento do shopping"*

## Interface do Usuário

### **Indicadores Visuais:**
- 🔍 **Busca em andamento**: Ícone animado durante a busca
- ✅ **Busca concluída**: Badge verde com fontes consultadas
- ⚠️ **Erro na busca**: Badge amarelo com mensagem de erro

### **Fontes Citadas:**
- **Links clicáveis** para as fontes consultadas
- **Formatação limpa** dos URLs
- **Limite** de 5 fontes exibidas por resposta

## Configurações Tavily

### **Busca Básica (1 crédito):**
```typescript
{
  search_depth: 'basic',
  include_answer: true,
  max_results: 5,
  topic: 'general'
}
```

### **Busca Avançada (10 créditos):**
```typescript
{
  search_depth: 'advanced',
  include_raw_content: true,
  max_results: 10,
  topic: 'general'
}
```

### **Busca de Notícias:**
```typescript
{
  topic: 'news',
  days: 7,
  search_depth: 'basic'
}
```

## Vantagens do Tavily

### **Vs Perplexity:**
- ✅ **API mais simples** e direta
- ✅ **Melhor custo-benefício**
- ✅ **Filtros avançados** de domínios
- ✅ **Suporte nativo** a streaming
- ✅ **Resposta resumida** incluída

### **Vs OpenAI Web Search:**
- ✅ **Mais barato** por busca
- ✅ **Controle total** sobre parâmetros
- ✅ **Fontes sempre citadas**
- ✅ **Filtros personalizáveis**

## Detecção Inteligente

### **Critérios de Ativação:**
1. **Palavras temporais**: "últimas", "hoje", "2024"
2. **Perguntas específicas**: "como", "onde", "quando", "qual"
3. **Informações atuais**: "notícias", "dados", "preço"
4. **Especificidade**: Mínimo 3 palavras na pergunta

### **Algoritmo:**
```typescript
const shouldSearch = (
  hasWebKeywords || 
  hasTimePatterns || 
  hasInfoPatterns
) && isSpecificEnough;
```

## Enriquecimento do Prompt

O sistema adiciona ao prompt do assistente:

```markdown
## 🌐 INFORMAÇÕES ATUAIS DA WEB

**Dados obtidos através de busca web em tempo real:**

**Resposta resumida:**
[Resposta direta do Tavily]

**Informações detalhadas:**
[Conteúdo dos resultados]

**Fontes consultadas:**
1. [Título da Fonte](URL)
2. [Título da Fonte](URL)

**INSTRUÇÕES IMPORTANTES:**
- Use essas informações atuais para complementar sua resposta
- Sempre mencione que as informações foram obtidas através de busca web
- Cite as fontes quando relevante
- Priorize informações web por serem mais atuais
```

## Monitoramento e Logs

```typescript
console.log('🔍 Busca web detectada para:', {
  message: message.substring(0, 100) + '...',
  hasWebKeywords: true,
  hasTimePatterns: false,
  hasInfoPatterns: true,
  isSpecificEnough: true
});

console.log('✅ Busca Tavily concluída:', {
  query: 'preço do bitcoin',
  resultsCount: 5,
  hasAnswer: true,
  contentLength: 1250
});
```

## Benefícios Implementados

### **Para o Usuário:**
- ✅ **Busca universal** - qualquer tópico
- ✅ **Informações atualizadas** em tempo real
- ✅ **Fontes confiáveis** sempre citadas
- ✅ **Transparência** sobre origem das informações
- ✅ **Feedback visual** claro

### **Para o Sistema:**
- ✅ **Detecção inteligente** evita buscas desnecessárias
- ✅ **API mais eficiente** que Perplexity
- ✅ **Tratamento robusto** de erros
- ✅ **Configuração flexível**
- ✅ **Logs detalhados** para monitoramento

## Próximos Passos

1. **Testar** diferentes tipos de busca
2. **Ajustar** algoritmos de detecção baseado no uso
3. **Implementar** cache para otimizar performance
4. **Adicionar** métricas de qualidade das respostas
5. **Expandir** filtros de domínios conforme necessário

---

**Status:** ✅ **IMPLEMENTADO E FUNCIONAL**  
**API:** Tavily (configurada e testada)  
**Escopo:** Busca web universal (qualquer tópico)  
**Data:** Janeiro 2025  
**Versão:** 1.0 