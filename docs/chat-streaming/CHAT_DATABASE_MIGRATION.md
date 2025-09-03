# Migração do Sistema de Chat para Banco de Dados

## 📋 Resumo

Este documento descreve a implementação completa da migração do sistema de histórico de conversas do chat do `localStorage` para o banco de dados Supabase, proporcionando persistência, sincronização e melhor gerenciamento dos dados.

## 🗄️ Estrutura do Banco de Dados

### Tabelas Criadas

#### 1. `chat_conversations`
Armazena o histórico de conversas entre professores e o assistente IA.

```sql
CREATE TABLE chat_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    professor_id INTEGER NOT NULL REFERENCES professores(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

**Campos:**
- `id`: Identificador único da conversa
- `professor_id`: Referência ao professor proprietário
- `title`: Título da conversa (baseado na primeira mensagem)
- `created_at`: Data de criação
- `updated_at`: Data da última atualização

#### 2. `chat_messages`
Armazena as mensagens individuais de cada conversa.

```sql
CREATE TABLE chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    sender VARCHAR(20) NOT NULL CHECK (sender IN ('user', 'assistant')),
    content TEXT NOT NULL,
    model VARCHAR(100),
    persona VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

**Campos:**
- `id`: Identificador único da mensagem
- `conversation_id`: Referência à conversa
- `sender`: Quem enviou ('user' ou 'assistant')
- `content`: Conteúdo da mensagem
- `model`: Modelo de IA usado (apenas para assistant)
- `persona`: Persona ativa (apenas para assistant)
- `created_at`: Data de criação

### Índices para Performance

```sql
CREATE INDEX idx_chat_conversations_professor_id ON chat_conversations(professor_id);
CREATE INDEX idx_chat_conversations_updated_at ON chat_conversations(updated_at DESC);
CREATE INDEX idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);
```

### Segurança (RLS)

Implementado Row Level Security para garantir que professores só acessem suas próprias conversas:

- **Políticas de SELECT**: Professores só veem suas conversas
- **Políticas de INSERT**: Professores só criam conversas para si
- **Políticas de UPDATE/DELETE**: Professores só modificam suas conversas

### Triggers Automáticos

1. **Auto-update de timestamps**: Atualiza `updated_at` automaticamente
2. **Sincronização de conversas**: Atualiza `updated_at` da conversa quando mensagens são modificadas

## 🔧 Implementação

### 1. Serviço de Chat (`src/services/chatService.ts`)

Novo serviço completo para gerenciar o chat no banco de dados:

#### Principais Métodos:

- `getConversations(professorId)`: Lista todas as conversas
- `getConversationWithMessages(conversationId)`: Busca conversa com mensagens
- `createConversation(data)`: Cria nova conversa
- `addMessage(data)`: Adiciona mensagem à conversa
- `deleteConversation(conversationId)`: Remove conversa
- `updateConversationTitle(conversationId, title)`: Atualiza título
- `migrateFromLocalStorage(professorId, userId)`: Migra dados do localStorage
- `hasLocalStorageData(userId)`: Verifica se há dados para migrar

#### Interfaces TypeScript:

```typescript
interface ChatMessage {
  id: string;
  conversation_id: string;
  sender: 'user' | 'assistant';
  content: string;
  model?: string;
  persona?: string;
  created_at: string;
}

interface ChatConversation {
  id: string;
  professor_id: number;
  title: string;
  created_at: string;
  updated_at: string;
  messages?: ChatMessage[];
  message_count?: number;
}
```

### 2. Atualização do Componente Chat (`src/pages/Chat.tsx`)

#### Principais Mudanças:

1. **Substituição do localStorage**: Todas as operações agora usam o banco
2. **Migração automática**: Detecta e migra dados do localStorage na primeira execução
3. **Sincronização em tempo real**: Mensagens são salvas imediatamente no banco
4. **Melhor gerenciamento de estado**: Estados separados para conversas e mensagens

#### Fluxo de Funcionamento:

1. **Carregamento inicial**: Verifica migração e carrega conversas
2. **Nova mensagem**: Cria conversa (se necessário) e salva mensagem
3. **Resposta da IA**: Salva resposta e atualiza lista de conversas
4. **Navegação**: Carrega conversas do banco com mensagens

### 3. Integração com AI Context Service

Atualizado `src/services/aiContextService.ts` para usar o novo serviço:

```typescript
private async getHistoricoConversas(professorId: number): Promise<number> {
  try {
    const { chatService } = await import('./chatService');
    return await chatService.getConversationCount(professorId);
  } catch (error) {
    console.error('❌ Erro ao buscar histórico de conversas:', error);
    return 0;
  }
}
```

## 🔄 Processo de Migração

### Migração Automática

O sistema detecta automaticamente dados no localStorage e os migra:

1. **Detecção**: Verifica `localStorage` na primeira execução
2. **Conversão**: Converte formato antigo para novo
3. **Criação**: Cria conversas e mensagens no banco
4. **Limpeza**: Remove dados do localStorage após sucesso
5. **Logs**: Registra progresso e erros

### Formato de Dados

**Antes (localStorage):**
```javascript
{
  id: "timestamp",
  title: "Título da conversa",
  messages: [
    {
      id: "timestamp",
      text: "Conteúdo",
      sender: "user|assistant",
      timestamp: Date,
      model?: "modelo",
      persona?: "persona"
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

**Depois (Banco de dados):**
```sql
-- chat_conversations
id: UUID
professor_id: INTEGER
title: VARCHAR(255)
created_at: TIMESTAMPTZ
updated_at: TIMESTAMPTZ

-- chat_messages
id: UUID
conversation_id: UUID
sender: VARCHAR(20)
content: TEXT
model: VARCHAR(100)
persona: VARCHAR(100)
created_at: TIMESTAMPTZ
```

## ✅ Benefícios da Migração

### 1. **Persistência Confiável**
- Dados não se perdem ao limpar navegador
- Backup automático no banco de dados
- Recuperação em caso de falhas

### 2. **Sincronização Multi-dispositivo**
- Acesso às conversas de qualquer dispositivo
- Histórico sempre atualizado
- Experiência consistente

### 3. **Performance Melhorada**
- Carregamento paginado de mensagens
- Índices otimizados para consultas
- Menos uso de memória local

### 4. **Segurança Aprimorada**
- Row Level Security (RLS)
- Controle de acesso por professor
- Auditoria de modificações

### 5. **Escalabilidade**
- Suporte a milhares de conversas
- Consultas eficientes
- Crescimento sustentável

## 🔍 Monitoramento e Logs

### Logs de Migração
```
📝 Dados encontrados no localStorage, iniciando migração...
📝 Migrando 5 conversas do localStorage...
✅ Conversa "Como criar plano de aula..." migrada com sucesso
✅ Conversa "Atividades para 3º ano..." migrada com sucesso
✅ Migração concluída e localStorage limpo
```

### Logs de Operação
```
✅ Conversa criada: ID abc123...
✅ Mensagem adicionada à conversa abc123...
✅ Lista de conversas atualizada
❌ Erro ao buscar conversas: [detalhes do erro]
```

## 🧪 Testes e Validação

### Cenários Testados

1. **Migração de dados existentes**
   - ✅ Conversas migradas corretamente
   - ✅ Mensagens preservadas
   - ✅ Timestamps mantidos
   - ✅ localStorage limpo após migração

2. **Criação de novas conversas**
   - ✅ Conversa criada automaticamente
   - ✅ Título gerado da primeira mensagem
   - ✅ Mensagens salvas em tempo real

3. **Navegação entre conversas**
   - ✅ Lista atualizada dinamicamente
   - ✅ Carregamento rápido de mensagens
   - ✅ Ordenação por data de atualização

4. **Exclusão de conversas**
   - ✅ Conversa removida do banco
   - ✅ Mensagens deletadas em cascata
   - ✅ Interface atualizada

## 🚀 Próximos Passos

### Melhorias Futuras

1. **Busca em Conversas**
   - Implementar busca por conteúdo
   - Filtros por data e persona
   - Busca semântica com IA

2. **Exportação de Dados**
   - Export para PDF/Word
   - Backup de conversas
   - Compartilhamento seletivo

3. **Analytics de Uso**
   - Métricas de conversas
   - Padrões de uso
   - Insights de IA

4. **Colaboração**
   - Conversas compartilhadas
   - Comentários em mensagens
   - Histórico de revisões

## 📝 Arquivos Modificados

### Novos Arquivos
- `supabase/migrations/20250127000001_create_chat_system.sql`
- `src/services/chatService.ts`
- `CHAT_DATABASE_MIGRATION.md`

### Arquivos Modificados
- `src/pages/Chat.tsx` - Integração com banco de dados
- `src/services/aiContextService.ts` - Uso do novo serviço

## 🔧 Comandos de Manutenção

### Verificar Status das Tabelas
```sql
SELECT 
  schemaname,
  tablename,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables 
WHERE tablename LIKE 'chat_%';
```

### Estatísticas de Uso
```sql
SELECT 
  COUNT(*) as total_conversations,
  COUNT(DISTINCT professor_id) as unique_professors,
  AVG(message_count) as avg_messages_per_conversation
FROM (
  SELECT 
    cc.professor_id,
    COUNT(cm.id) as message_count
  FROM chat_conversations cc
  LEFT JOIN chat_messages cm ON cc.id = cm.conversation_id
  GROUP BY cc.id, cc.professor_id
) stats;
```

### Limpeza de Dados Antigos (se necessário)
```sql
-- Remover conversas sem mensagens (mais de 30 dias)
DELETE FROM chat_conversations 
WHERE id NOT IN (
  SELECT DISTINCT conversation_id 
  FROM chat_messages
) 
AND created_at < NOW() - INTERVAL '30 days';
```

---

## 📞 Suporte

Para dúvidas ou problemas relacionados ao sistema de chat:

1. Verificar logs no console do navegador
2. Consultar documentação do Supabase
3. Revisar políticas RLS se houver problemas de acesso
4. Verificar conexão com banco de dados

**Status**: ✅ **Implementação Concluída e Testada** 