-- Migração para sistema de chat com histórico de conversas
-- Criado em: 2025-01-27

-- Tabela para histórico de conversas/chats
CREATE TABLE IF NOT EXISTS chat_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    professor_id INTEGER NOT NULL REFERENCES professores(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Tabela para mensagens individuais do chat
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    sender VARCHAR(20) NOT NULL CHECK (sender IN ('user', 'assistant')),
    content TEXT NOT NULL,
    model VARCHAR(100),
    persona VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_chat_conversations_professor_id ON chat_conversations(professor_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_updated_at ON chat_conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- RLS (Row Level Security) para segurança
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para chat_conversations
CREATE POLICY "Professores podem ver suas próprias conversas" ON chat_conversations
    FOR SELECT USING (
        professor_id IN (
            SELECT id FROM professores WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Professores podem criar suas próprias conversas" ON chat_conversations
    FOR INSERT WITH CHECK (
        professor_id IN (
            SELECT id FROM professores WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Professores podem atualizar suas próprias conversas" ON chat_conversations
    FOR UPDATE USING (
        professor_id IN (
            SELECT id FROM professores WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Professores podem deletar suas próprias conversas" ON chat_conversations
    FOR DELETE USING (
        professor_id IN (
            SELECT id FROM professores WHERE user_id = auth.uid()
        )
    );

-- Políticas RLS para chat_messages
CREATE POLICY "Professores podem ver mensagens de suas conversas" ON chat_messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT id FROM chat_conversations 
            WHERE professor_id IN (
                SELECT id FROM professores WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Professores podem criar mensagens em suas conversas" ON chat_messages
    FOR INSERT WITH CHECK (
        conversation_id IN (
            SELECT id FROM chat_conversations 
            WHERE professor_id IN (
                SELECT id FROM professores WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Professores podem atualizar mensagens de suas conversas" ON chat_messages
    FOR UPDATE USING (
        conversation_id IN (
            SELECT id FROM chat_conversations 
            WHERE professor_id IN (
                SELECT id FROM professores WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Professores podem deletar mensagens de suas conversas" ON chat_messages
    FOR DELETE USING (
        conversation_id IN (
            SELECT id FROM chat_conversations 
            WHERE professor_id IN (
                SELECT id FROM professores WHERE user_id = auth.uid()
            )
        )
    );

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_chat_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_chat_conversation_updated_at
    BEFORE UPDATE ON chat_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_conversation_updated_at();

-- Trigger para atualizar updated_at da conversa quando uma mensagem é adicionada
CREATE OR REPLACE FUNCTION update_conversation_on_message_change()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_conversations 
    SET updated_at = NOW() 
    WHERE id = COALESCE(NEW.conversation_id, OLD.conversation_id);
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_on_message_insert
    AFTER INSERT ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_on_message_change();

CREATE TRIGGER trigger_update_conversation_on_message_update
    AFTER UPDATE ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_on_message_change();

CREATE TRIGGER trigger_update_conversation_on_message_delete
    AFTER DELETE ON chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_on_message_change();

-- Comentários para documentação
COMMENT ON TABLE chat_conversations IS 'Histórico de conversas do chat entre professores e assistente IA';
COMMENT ON TABLE chat_messages IS 'Mensagens individuais das conversas do chat';
COMMENT ON COLUMN chat_conversations.title IS 'Título da conversa (geralmente baseado na primeira mensagem)';
COMMENT ON COLUMN chat_messages.sender IS 'Quem enviou a mensagem: user (professor) ou assistant (IA)';
COMMENT ON COLUMN chat_messages.content IS 'Conteúdo da mensagem';
COMMENT ON COLUMN chat_messages.model IS 'Modelo de IA usado para gerar a resposta (apenas para mensagens do assistant)';
COMMENT ON COLUMN chat_messages.persona IS 'Persona ativa durante a conversa (apenas para mensagens do assistant)'; 