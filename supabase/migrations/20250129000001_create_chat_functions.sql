-- Funções RPC para o sistema de comunicação interna
-- Criado em: 2025-01-29

-- Função para buscar conversas com contagem de mensagens não lidas
CREATE OR REPLACE FUNCTION get_conversations_with_unread_count(p_user_id UUID)
RETURNS TABLE(
    conversa_id UUID,
    other_participant_id UUID,
    other_participant_nome TEXT,
    other_participant_avatar_url TEXT,
    other_participant_role TEXT,
    last_message_content TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE,
    unread_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH user_conversations AS (
        SELECT cp.conversa_id
        FROM comunicacao_participantes cp
        WHERE cp.usuario_id = p_user_id 
        AND cp.is_deleted = FALSE
    ),
    other_participants AS (
        SELECT 
            uc.conversa_id,
            cp.usuario_id as other_user_id
        FROM user_conversations uc
        JOIN comunicacao_participantes cp ON uc.conversa_id = cp.conversa_id
        WHERE cp.usuario_id != p_user_id
        AND cp.is_deleted = FALSE
    ),
    last_messages AS (
        SELECT DISTINCT ON (m.conversa_id)
            m.conversa_id,
            m.conteudo as last_content,
            m.created_at as last_at
        FROM comunicacao_mensagens m
        JOIN user_conversations uc ON m.conversa_id = uc.conversa_id
        ORDER BY m.conversa_id, m.created_at DESC
    ),
    unread_counts AS (
        SELECT 
            m.conversa_id,
            COUNT(*) as unread_count
        FROM comunicacao_mensagens m
        JOIN user_conversations uc ON m.conversa_id = uc.conversa_id
        WHERE m.remetente_id != p_user_id
        AND m.visualizado_em IS NULL
        GROUP BY m.conversa_id
    )
    SELECT 
        op.conversa_id,
        op.other_user_id as other_participant_id,
        cu.nome as other_participant_nome,
        cu.avatar_url as other_participant_avatar_url,
        cu.role as other_participant_role,
        lm.last_content as last_message_content,
        lm.last_at as last_message_at,
        COALESCE(uc_count.unread_count, 0) as unread_count
    FROM other_participants op
    LEFT JOIN chat_users cu ON op.other_user_id = cu.user_id
    LEFT JOIN last_messages lm ON op.conversa_id = lm.conversa_id
    LEFT JOIN unread_counts uc_count ON op.conversa_id = uc_count.conversa_id
    ORDER BY lm.last_at DESC NULLS LAST;
END;
$$;

-- Função para buscar ou criar uma conversa simples entre dois usuários
CREATE OR REPLACE FUNCTION find_or_create_conversation_simple(
    p_user1_id UUID,
    p_user2_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_conversa_id UUID;
BEGIN
    -- Primeiro, tentar encontrar uma conversa existente entre os dois usuários
    SELECT cc.id INTO v_conversa_id
    FROM comunicacao_conversas cc
    WHERE cc.id IN (
        SELECT cp1.conversa_id
        FROM comunicacao_participantes cp1
        JOIN comunicacao_participantes cp2 ON cp1.conversa_id = cp2.conversa_id
        WHERE cp1.usuario_id = p_user1_id 
        AND cp2.usuario_id = p_user2_id
        AND cp1.is_deleted = FALSE
        AND cp2.is_deleted = FALSE
    )
    LIMIT 1;
    
    -- Se não encontrou, criar uma nova conversa
    IF v_conversa_id IS NULL THEN
        INSERT INTO comunicacao_conversas (id, created_at, updated_at)
        VALUES (gen_random_uuid(), NOW(), NOW())
        RETURNING id INTO v_conversa_id;
        
        -- Adicionar os dois participantes
        INSERT INTO comunicacao_participantes (conversa_id, usuario_id, joined_at)
        VALUES 
            (v_conversa_id, p_user1_id, NOW()),
            (v_conversa_id, p_user2_id, NOW());
    END IF;
    
    RETURN v_conversa_id;
END;
$$;

-- Função para buscar mensagens de uma conversa
CREATE OR REPLACE FUNCTION get_messages_for_conversation(p_conversa_id UUID)
RETURNS TABLE(
    id UUID,
    conversa_id UUID,
    remetente_id UUID,
    conteudo TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    visualizado_em TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verificar se o usuário atual participa da conversa
    IF NOT EXISTS (
        SELECT 1 FROM comunicacao_participantes 
        WHERE conversa_id = p_conversa_id 
        AND usuario_id = auth.uid()
        AND is_deleted = FALSE
    ) THEN
        RAISE EXCEPTION 'Usuário não tem permissão para ver mensagens desta conversa';
    END IF;
    
    RETURN QUERY
    SELECT 
        m.id,
        m.conversa_id,
        m.remetente_id,
        m.conteudo,
        m.created_at,
        m.visualizado_em
    FROM comunicacao_mensagens m
    WHERE m.conversa_id = p_conversa_id
    ORDER BY m.created_at ASC;
END;
$$;

-- Função para enviar uma mensagem
CREATE OR REPLACE FUNCTION send_message(
    p_conversa_id UUID,
    p_conteudo TEXT
)
RETURNS TABLE(
    id UUID,
    conversa_id UUID,
    remetente_id UUID,
    conteudo TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    visualizado_em TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_message_id UUID;
BEGIN
    -- Verificar se o usuário atual participa da conversa
    IF NOT EXISTS (
        SELECT 1 FROM comunicacao_participantes 
        WHERE conversa_id = p_conversa_id 
        AND usuario_id = auth.uid()
        AND is_deleted = FALSE
    ) THEN
        RAISE EXCEPTION 'Usuário não tem permissão para enviar mensagens nesta conversa';
    END IF;
    
    -- Inserir a mensagem
    INSERT INTO comunicacao_mensagens (conversa_id, remetente_id, conteudo, created_at)
    VALUES (p_conversa_id, auth.uid(), p_conteudo, NOW())
    RETURNING id INTO v_message_id;
    
    -- Atualizar timestamp da conversa
    UPDATE comunicacao_conversas 
    SET updated_at = NOW() 
    WHERE id = p_conversa_id;
    
    -- Retornar a mensagem criada
    RETURN QUERY
    SELECT 
        m.id,
        m.conversa_id,
        m.remetente_id,
        m.conteudo,
        m.created_at,
        m.visualizado_em
    FROM comunicacao_mensagens m
    WHERE m.id = v_message_id;
END;
$$;

-- Função para obter detalhes do participante
CREATE OR REPLACE FUNCTION get_participant_details(
    p_conversa_id UUID,
    p_current_user_id UUID
)
RETURNS TABLE(
    user_id UUID,
    nome TEXT,
    avatar_url TEXT,
    role TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cu.user_id,
        cu.nome,
        cu.avatar_url,
        cu.role
    FROM comunicacao_participantes cp
    JOIN chat_users cu ON cp.usuario_id = cu.user_id
    WHERE cp.conversa_id = p_conversa_id
    AND cp.usuario_id != p_current_user_id
    AND cp.is_deleted = FALSE
    LIMIT 1;
END;
$$;

-- Função para marcar mensagens como lidas
CREATE OR REPLACE FUNCTION mark_messages_as_read(
    p_conversa_id UUID,
    p_reader_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verificar se o usuário participa da conversa
    IF NOT EXISTS (
        SELECT 1 FROM comunicacao_participantes 
        WHERE conversa_id = p_conversa_id 
        AND usuario_id = p_reader_id
        AND is_deleted = FALSE
    ) THEN
        RAISE EXCEPTION 'Usuário não tem permissão para marcar mensagens desta conversa como lidas';
    END IF;
    
    -- Marcar como lidas todas as mensagens não enviadas pelo usuário atual
    UPDATE comunicacao_mensagens 
    SET visualizado_em = NOW()
    WHERE conversa_id = p_conversa_id
    AND remetente_id != p_reader_id
    AND visualizado_em IS NULL;
END;
$$;

-- Função para soft delete de conversa para um usuário
CREATE OR REPLACE FUNCTION soft_delete_conversation_for_user(p_conversa_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE comunicacao_participantes 
    SET is_deleted = TRUE
    WHERE conversa_id = p_conversa_id 
    AND usuario_id = auth.uid();
    
    RETURN FOUND;
END;
$$;

-- Função para restaurar conversa para um usuário
CREATE OR REPLACE FUNCTION restore_conversation_for_user(p_conversa_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE comunicacao_participantes 
    SET is_deleted = FALSE
    WHERE conversa_id = p_conversa_id 
    AND usuario_id = auth.uid();
    
    RETURN FOUND;
END;
$$;

-- Função para popular a tabela chat_users com dados existentes
CREATE OR REPLACE FUNCTION populate_chat_users()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Inserir professores
    INSERT INTO chat_users (user_id, nome, avatar_url, role)
    SELECT 
        p.user_id,
        p.nome,
        au.raw_user_meta_data->>'avatar_url' as avatar_url,
        'professor' as role
    FROM professores p
    LEFT JOIN auth.users au ON p.user_id = au.id
    ON CONFLICT (user_id) DO UPDATE SET
        nome = EXCLUDED.nome,
        avatar_url = EXCLUDED.avatar_url,
        role = EXCLUDED.role,
        updated_at = NOW();
    
    -- Inserir diretoras
    INSERT INTO chat_users (user_id, nome, avatar_url, role)
    SELECT 
        d.user_id,
        d.nome,
        au.raw_user_meta_data->>'avatar_url' as avatar_url,
        'diretora' as role
    FROM diretoras d
    LEFT JOIN auth.users au ON d.user_id = au.id
    ON CONFLICT (user_id) DO UPDATE SET
        nome = EXCLUDED.nome,
        avatar_url = EXCLUDED.avatar_url,
        role = EXCLUDED.role,
        updated_at = NOW();
END;
$$;