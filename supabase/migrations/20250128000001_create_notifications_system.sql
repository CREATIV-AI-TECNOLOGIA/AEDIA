-- Migração para sistema de notificações
-- Criado em: 2025-01-28

-- Tabela para notificações
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- RLS (Row Level Security) para segurança
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para notifications
CREATE POLICY "Usuários podem ver suas próprias notificações" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Sistema pode criar notificações" ON notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar suas próprias notificações" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Usuários podem deletar suas próprias notificações" ON notifications
    FOR DELETE USING (user_id = auth.uid());

-- Função para marcar notificações de uma conversa como lidas
CREATE OR REPLACE FUNCTION mark_notifications_as_read_for_conversa(
    p_user_id UUID,
    p_conversa_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE notifications 
    SET is_read = true 
    WHERE user_id = p_user_id 
    AND is_read = false
    AND type = 'new_message'
    AND data->>'conversa_id' = p_conversa_id;
END;
$$;

-- Função para criar notificação de nova mensagem
CREATE OR REPLACE FUNCTION create_message_notification(
    p_recipient_id UUID,
    p_sender_name TEXT,
    p_conversa_id TEXT,
    p_message_preview TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO notifications (user_id, type, data)
    VALUES (
        p_recipient_id,
        'new_message',
        jsonb_build_object(
            'conversa_id', p_conversa_id,
            'sender_name', p_sender_name,
            'message_preview', p_message_preview
        )
    );
END;
$$;

-- Trigger para criar notificações automaticamente quando uma mensagem é enviada
CREATE OR REPLACE FUNCTION trigger_create_message_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    recipient_id UUID;
    sender_name TEXT;
    sender_id UUID;
BEGIN
    -- Obter o ID do usuário que vai receber a notificação (o outro participante da conversa)
    SELECT CASE 
        WHEN cp1.user_id = NEW.remetente_id THEN cp2.user_id
        ELSE cp1.user_id
    END INTO recipient_id
    FROM comunicacao_participantes cp1
    JOIN comunicacao_participantes cp2 ON cp1.conversa_id = cp2.conversa_id
    WHERE cp1.conversa_id = NEW.conversa_id
    AND cp1.user_id != cp2.user_id
    AND (cp1.user_id = NEW.remetente_id OR cp2.user_id = NEW.remetente_id)
    LIMIT 1;

    -- Obter o nome do remetente
    SELECT p.nome INTO sender_name
    FROM professores p
    WHERE p.user_id = NEW.remetente_id;

    -- Se não encontrou nos professores, tentar em auth.users
    IF sender_name IS NULL THEN
        SELECT COALESCE(
            raw_user_meta_data->>'nome',
            raw_user_meta_data->>'full_name',
            email
        ) INTO sender_name
        FROM auth.users
        WHERE id = NEW.remetente_id;
    END IF;

    -- Criar a notificação se encontrou o destinatário
    IF recipient_id IS NOT NULL AND sender_name IS NOT NULL THEN
        PERFORM create_message_notification(
            recipient_id,
            sender_name,
            NEW.conversa_id,
            LEFT(NEW.conteudo, 100)
        );
    END IF;

    RETURN NEW;
END;
$$;

-- Aplicar o trigger na tabela de mensagens
DROP TRIGGER IF EXISTS trigger_message_notification ON comunicacao_mensagens;
CREATE TRIGGER trigger_message_notification
    AFTER INSERT ON comunicacao_mensagens
    FOR EACH ROW
    EXECUTE FUNCTION trigger_create_message_notification();

-- Comentários para documentação
COMMENT ON TABLE notifications IS 'Sistema de notificações para usuários';
COMMENT ON COLUMN notifications.type IS 'Tipo da notificação (new_message, etc.)';
COMMENT ON COLUMN notifications.data IS 'Dados específicos da notificação em formato JSON';
COMMENT ON COLUMN notifications.is_read IS 'Indica se a notificação foi lida pelo usuário'; 