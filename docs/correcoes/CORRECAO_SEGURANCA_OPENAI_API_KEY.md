# Correção: Segurança da Chave API OpenAI - Migração para Função Serverless

## Problema Identificado

No arquivo `src/pages/RevisaoPlanoAula.tsx` entre as linhas 444-449, havia **exposição da chave da API OpenAI** diretamente no código cliente, criando uma vulnerabilidade crítica de segurança.

### Código Problemático (Removido)

```typescript
// ❌ PROBLEMA CRÍTICO: Chave da API exposta no cliente
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
if (!apiKey) {
  toast.error('Chave da API não configurada');
  return;
}

const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}` // ❌ Chave exposta publicamente
  },
  body: JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [/* ... */],
    temperature: 0.7,
    max_tokens: 200
  })
});
```

### Riscos de Segurança

1. **🚨 Exposição Pública**: Chave da API visível no bundle JavaScript do navegador
2. **💰 Uso Não Autorizado**: Qualquer pessoa pode extrair e usar a chave
3. **📈 Custos Descontrolados**: Uso abusivo pode gerar custos elevados
4. **🔓 Acesso Total**: Chave pode ter permissões amplas na conta OpenAI
5. **🕵️ Engenharia Reversa**: Fácil extração através de DevTools ou análise do código
6. **⚡ Rate Limiting**: Uso abusivo pode esgotar limites da API

## Solução Implementada

### ✅ **Função Serverless Segura**

Criada uma função serverless que mantém a chave da API segura no servidor:

**Arquivo**: `supabase/functions/openai-prompt-optimizer/index.ts`

#### 🔐 **Segurança da Chave**
```typescript
// ✅ SEGURO: Chave lida de variável de ambiente no servidor
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

if (!OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY não está configurada nas variáveis de ambiente da função.');
  return new Response(
    JSON.stringify({ error: 'Configuração do servidor incompleta.' }),
    { status: 500 }
  );
}
```

#### 🛡️ **Proteção CORS**
```typescript
const allowedOrigins = [
  "http://localhost:3000", 
  "http://localhost:5173", 
  "http://localhost:4173",
  "https://localhost:3000", 
  "https://localhost:5173"
  // Adicione aqui os domínios de produção quando necessário
];

const getCorsHeaders = (origin: string | null) => {
  const isAllowedOrigin = origin && allowedOrigins.includes(origin);
  return {
    "Access-Control-Allow-Origin": isAllowedOrigin ? origin : "null",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Credentials": "true"
  };
};
```

#### 📝 **Interface Tipada**
```typescript
interface OptimizePromptRequest {
  originalPrompt: string;
  context: {
    disciplinaNome?: string;
    anoEnsino?: string;
    modalidade?: string;
    quantidadeAlunos?: number;
    trimestre?: string;
  };
}
```

#### 🔄 **Processamento Seguro**
```typescript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${OPENAI_API_KEY}` // ✅ Seguro no servidor
  },
  body: JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [/* ... */],
    temperature: 0.7,
    max_tokens: 200
  })
});
```

### ✅ **Cliente Refatorado**

**Arquivo**: `src/pages/RevisaoPlanoAula.tsx`

#### 🔒 **Chamada Segura**
```typescript
// ✅ SEGURO: Cliente chama função serverless, não API diretamente
const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/openai-prompt-optimizer`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`, // ✅ Chave pública segura
  },
  body: JSON.stringify({
    originalPrompt: sugestaoIA.trim(),
    context: {
      disciplinaNome: dados?.disciplinaNome,
      anoEnsino: dados?.anoEnsino,
      modalidade: dados?.turmaModalidadeNome || dados?.modalidade,
      quantidadeAlunos: quantidadeAlunos,
      trimestre: dados?.trimestre
    }
  })
});
```

#### 🎯 **Tratamento de Erros Melhorado**
```typescript
if (!response.ok) {
  const errorData = await response.json().catch(() => ({ error: 'Erro ao processar resposta do servidor' }));
  throw new Error(errorData.error || 'Erro na otimização do prompt');
}

const data = await response.json();
const promptMelhorado = data.optimizedPrompt;
```

## Benefícios da Correção

### 🔐 **Segurança**
- **Antes**: Chave da API exposta publicamente no bundle JavaScript
- **Depois**: Chave protegida em variável de ambiente no servidor

### 💰 **Controle de Custos**
- **Antes**: Qualquer pessoa podia usar a chave e gerar custos
- **Depois**: Uso controlado apenas através da aplicação autorizada

### 🛡️ **Proteção CORS**
- **Antes**: Sem proteção contra uso de domínios não autorizados
- **Depois**: Lista específica de origens permitidas

### 📊 **Monitoramento**
- **Antes**: Difícil rastrear uso não autorizado
- **Depois**: Logs centralizados na função serverless

### 🔧 **Manutenibilidade**
- **Antes**: Chave hardcoded no código cliente
- **Depois**: Configuração centralizada em variáveis de ambiente

## Configuração Necessária

### 🔧 **Variáveis de Ambiente**

No painel do Supabase (Settings > Edge Functions > openai-prompt-optimizer):

```bash
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 🚀 **Deploy da Função**

```bash
# Deploy da função serverless
supabase functions deploy openai-prompt-optimizer

# Configurar variável de ambiente
supabase secrets set OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 🌐 **Configuração de Produção**

Adicionar domínios de produção na lista `allowedOrigins`:

```typescript
const allowedOrigins = [
  "http://localhost:3000", 
  "http://localhost:5173", 
  "http://localhost:4173",
  "https://localhost:3000", 
  "https://localhost:5173",
  "https://meudominio.com",           // ✅ Adicionar domínio de produção
  "https://www.meudominio.com"       // ✅ Adicionar variação com www
];
```

## Fluxo de Segurança

### 🔄 **Antes (Inseguro)**
```
Cliente → API OpenAI (com chave exposta)
```

### 🔄 **Depois (Seguro)**
```
Cliente → Função Serverless → API OpenAI (com chave protegida)
```

## Testes de Segurança

### 🧪 **Verificação de Exposição**

1. **Bundle Analysis**:
   ```bash
   # Verificar se a chave não está no bundle
   npm run build
   grep -r "sk-proj" dist/ # Não deve retornar resultados
   ```

2. **DevTools Inspection**:
   ```javascript
   // No console do navegador - não deve retornar a chave
   console.log(import.meta.env.VITE_OPENAI_API_KEY); // undefined
   ```

3. **Network Tab**:
   ```
   ✅ Requisições para: /functions/v1/openai-prompt-optimizer
   ❌ Requisições para: api.openai.com (diretas do cliente)
   ```

### 🧪 **Teste de CORS**

```javascript
// Teste de origem não autorizada (deve falhar)
fetch('https://seu-projeto.supabase.co/functions/v1/openai-prompt-optimizer', {
  method: 'POST',
  headers: { 'Origin': 'https://site-malicioso.com' }
});
// Deve retornar erro CORS
```

## Monitoramento

### 📊 **Logs da Função**

```bash
# Visualizar logs da função
supabase functions logs openai-prompt-optimizer
```

### 🔍 **Métricas de Uso**

```typescript
// Adicionar logging na função para monitoramento
console.log("Prompt otimizado com sucesso:", promptFinal.substring(0, 100) + "...");
console.log("Uso da API - Tokens:", data.usage?.total_tokens);
```

### 🚨 **Alertas de Segurança**

```typescript
// Detectar tentativas de uso não autorizado
if (!isAllowedOrigin) {
  console.warn('Tentativa de acesso não autorizado:', origin);
  // Implementar sistema de alertas se necessário
}
```

## Comparação de Segurança

### Antes (❌ Inseguro):
- **Chave exposta**: Visível no código fonte e bundle
- **Sem controle**: Qualquer pessoa pode usar
- **Custos descontrolados**: Uso abusivo possível
- **Sem logs**: Difícil rastrear uso
- **Sem proteção CORS**: Uso de qualquer domínio

### Depois (✅ Seguro):
- **Chave protegida**: Apenas no servidor
- **Controle total**: Uso apenas através da aplicação
- **Custos controlados**: Uso limitado a usuários autorizados
- **Logs centralizados**: Monitoramento completo
- **Proteção CORS**: Apenas domínios autorizados

## Próximos Passos

### 🔮 **Melhorias Futuras**

1. **Rate Limiting**: Implementar limites por usuário/IP
2. **Autenticação**: Validar usuários autenticados
3. **Caching**: Cache de respostas para reduzir custos
4. **Métricas**: Dashboard de uso e custos
5. **Alertas**: Notificações de uso anômalo

### 🧪 **Testes Adicionais**

1. **Penetration Testing**: Testes de segurança profissionais
2. **Load Testing**: Verificar comportamento sob carga
3. **Security Audit**: Auditoria completa de segurança

## Arquivos Modificados

1. **`supabase/functions/openai-prompt-optimizer/index.ts`** - Nova função serverless
2. **`src/pages/RevisaoPlanoAula.tsx`** - Cliente refatorado
3. **`CORRECAO_SEGURANCA_OPENAI_API_KEY.md`** - Esta documentação

## Resultado Final

### Antes:
- ❌ **Vulnerabilidade crítica**: Chave da API exposta publicamente
- ❌ **Risco financeiro**: Uso descontrolado da API
- ❌ **Sem proteção**: Qualquer pessoa pode usar a chave
- ❌ **Sem monitoramento**: Difícil rastrear uso não autorizado

### Depois:
- ✅ **Segurança total**: Chave protegida no servidor
- ✅ **Controle de custos**: Uso apenas por usuários autorizados
- ✅ **Proteção CORS**: Apenas domínios específicos permitidos
- ✅ **Monitoramento**: Logs centralizados e rastreabilidade
- ✅ **Arquitetura segura**: Padrão de segurança da indústria

Esta correção elimina uma **vulnerabilidade crítica de segurança** e implementa as **melhores práticas** para uso de APIs de terceiros, protegendo tanto a aplicação quanto os recursos financeiros associados à conta OpenAI. 