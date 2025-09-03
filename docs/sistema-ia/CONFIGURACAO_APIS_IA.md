# Configuração da API ChatGPT - Sistema Educacional

## 🎯 **VISÃO GERAL**

O sistema utiliza **ChatGPT 4o mini** com contexto personalizado completo para assistência educacional avançada.

- 🤖 **ChatGPT 4o mini**: IA otimizada para educação com contexto personalizado

## 🔧 **CONFIGURAÇÃO DA CHAVE DE API**

### **1. Arquivo .env**

O arquivo `.env` na raiz do projeto deve conter:

```bash
# Supabase (já configurado)
VITE_SUPABASE_URL=https://kdjpvjvptqikgqjtjmcp.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_supabase

# OpenAI API (CONFIGURAR)
VITE_OPENAI_API_KEY=sua_chave_openai_aqui
```

### **2. Obter Chave da API OpenAI**

#### **Passo a Passo:**

1. **Acesse:** https://platform.openai.com/api-keys
2. **Faça login** ou crie uma conta OpenAI
3. **Clique em "Create new secret key"**
4. **Copie a chave** (formato: `sk-...`)
5. **Substitua** `sua_chave_openai_aqui` no arquivo `.env`
6. **Reinicie o servidor:** `npm run dev`

#### **Exemplo de chave válida:**
```bash
VITE_OPENAI_API_KEY=sk-proj-1234567890abcdef...
```

## 🚀 **FUNCIONALIDADES IMPLEMENTADAS**

### **1. Contexto Personalizado Completo**

O ChatGPT 4o mini recebe contexto rico e personalizado:

```typescript
// Contexto enviado para a API
{
  professor: {
    nome: "William",
    especialidades: ["Matemática", "Física"],
    experiencia_anos: 5
  },
  educacional: {
    turmas: 2,
    total_alunos: 8,
    planos_aula_recentes: 5,
    avaliacoes_recentes: 2
  },
  sessao: {
    periodo_letivo: "1º Semestre 2025",
    escola: "Colégio São Bento"
  }
}
```

### **2. Métodos Especializados**

#### **Para Planos de Aula:**
```typescript
await aiService.generatePlanoAula(
  "Equações do 2º Grau",
  "Matemática", 
  "9º Ano",
  aiContext
);
```

#### **Para Avaliações:**
```typescript
await aiService.generateAvaliacao(
  "Movimento Uniforme",
  "Física",
  "1º Ano",
  "Prova",
  aiContext
);
```

### **3. Interface Simplificada**

- Chat direto com ChatGPT 4o mini
- Contexto personalizado automático
- Histórico de conversas
- Painel de contexto detalhado

## 📊 **CARACTERÍSTICAS DO CHATGPT 4o MINI**

| Característica | ChatGPT 4o mini |
|----------------|-----------------|
| **Modelo** | gpt-4o-mini |
| **Contexto Personalizado** | ✅ Sim |
| **Planos de Aula** | ✅ Excelente |
| **Avaliações** | ✅ Excelente |
| **Velocidade** | 🟢 Muito Rápida |
| **Custo** | 💰 Baixo |
| **Qualidade** | 🟢 Alta |
| **Limite de Tokens** | 4000 (system) + 2000 (user) |

## 🎯 **CASOS DE USO IDEAIS**

### **Use ChatGPT 4o mini para:**
- ✅ Criação de planos de aula detalhados
- ✅ Elaboração de avaliações personalizadas
- ✅ Atividades práticas adaptadas
- ✅ Exercícios por nível de dificuldade
- ✅ Análise pedagógica profunda
- ✅ Sugestões metodológicas
- ✅ Adaptação para necessidades especiais
- ✅ Feedback educacional personalizado

## 🔍 **LOGS DE DEBUG**

### **Verificação da Chave:**
```
🔑 Verificando chave da API: Configurada
🤖 Gerando resposta com ChatGPT 4o mini...
📤 Enviando para OpenAI: {model: 'gpt-4o-mini', messagesCount: 2}
✅ Resposta da OpenAI recebida
```

### **Contexto Personalizado:**
```
🔍 Prompts preparados para ChatGPT: {systemLength: 2847, userLength: 156}
🧠 Contexto da IA construído com sucesso
```

## ⚠️ **SOLUÇÃO DE PROBLEMAS**

### **Erro: "Chave da API OpenAI não configurada"**

**Solução:**
1. Verifique se o arquivo `.env` existe na raiz
2. Confirme se a linha `VITE_OPENAI_API_KEY=` está presente
3. Substitua `sua_chave_openai_aqui` pela chave real
4. Reinicie o servidor: `npm run dev`

### **Erro: "Resposta inválida da API"**

**Possíveis causas:**
- Chave inválida ou expirada
- Cota da API esgotada
- Problema de conectividade

**Solução:**
1. Verifique a validade da chave
2. Confirme o saldo da conta OpenAI
3. Teste com uma pergunta simples

### **Erro: "Rate limit exceeded"**

**Solução:**
- Aguarde alguns minutos
- Verifique os limites da sua conta OpenAI
- Considere upgrade do plano se necessário

## 🎉 **STATUS ATUAL**

### ✅ **Funcionando:**
- Sistema de contexto personalizado
- ChatGPT 4o mini integrado
- Interface simplificada
- Logs detalhados
- Métodos especializados

### ⚠️ **Pendente:**
- Configuração da chave OpenAI (pelo usuário)
- Testes completos
- Integração com outras páginas

## 🚀 **PRÓXIMOS PASSOS**

1. **Configurar chave OpenAI** ✅
2. **Testar o sistema completo** 
3. **Integrar com páginas de planos de aula**
4. **Integrar com páginas de avaliações**
5. **Adicionar templates personalizados**
6. **Implementar histórico persistente**

## 💡 **DICAS DE USO**

### **Para melhores resultados:**
- Seja específico nas perguntas
- Mencione a série/ano dos alunos
- Inclua o contexto da disciplina
- Use o painel de contexto para verificar informações

### **Exemplos de prompts eficazes:**
- "Crie um plano de aula sobre frações para o 5º ano"
- "Elabore uma avaliação de história sobre o Brasil colonial"
- "Sugira atividades práticas para ensinar geometria"
- "Como adaptar esta aula para alunos com dificuldades?"

---

**O sistema está otimizado para ChatGPT 4o mini com contexto educacional completo!** 🎯 