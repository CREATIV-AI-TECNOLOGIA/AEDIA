-- Migração para criar o sistema de comunicação interna
-- Criado em: 2025-01-29

-- Tabela principal para as conversas
CREATE TABLE IF NOT EXISTS comunicacao_conversas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome_conversa VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para participantes das conversas
CREATE TABLE IF NOT EXISTS comunicacao_participantes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversa_id UUID NOT NULL REFERENCES comunicacao_conversas(id) ON DELETE CASCADE,
    usuario_id UUID NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(conversa_id, usuario_id)
);

-- Tabela para as mensagens
CREATE TABLE IF NOT EXISTS comunicacao_mensagens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversa_id UUID NOT NULL REFERENCES comunicacao_conversas(id) ON DELETE CASCADE,
    remetente_id UUID NOT NULL,
    conteudo TEXT NOT NULL,
    visualizado_em TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela auxiliar para busca de usuários
CREATE TABLE IF NOT EXISTS chat_users (
    user_id UUID PRIMARY KEY,
    nome TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_comunicacao_participantes_conversa_id ON comunicacao_participantes(conversa_id);
CREATE INDEX IF NOT EXISTS idx_comunicacao_participantes_usuario_id ON comunicacao_participantes(usuario_id);
CREATE INDEX IF NOT EXISTS idx_comunicacao_mensagens_conversa_id ON comunicacao_mensagens(conversa_id);
CREATE INDEX IF NOT EXISTS idx_comunicacao_mensagens_created_at ON comunicacao_mensagens(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_users_nome ON chat_users(nome);

-- RLS (Row Level Security)
ALTER TABLE comunicacao_conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE comunicacao_participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comunicacao_mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_users ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para comunicacao_conversas
CREATE POLICY "Usuários podem ver conversas onde participam" ON comunicacao_conversas
    FOR SELECT USING (
        id IN (
            SELECT conversa_id FROM comunicacao_participantes 
            WHERE usuario_id = auth.uid() AND is_deleted = FALSE
        )
    );

CREATE POLICY "Usuários podem criar conversas" ON comunicacao_conversas
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar conversas onde participam" ON comunicacao_conversas
    FOR UPDATE USING (
        id IN (
            SELECT conversa_id FROM comunicacao_participantes 
            WHERE usuario_id = auth.uid() AND is_deleted = FALSE
        )
    );

-- Políticas RLS para comunicacao_participantes
CREATE POLICY "Usuários podem ver participantes de suas conversas" ON comunicacao_participantes
    FOR SELECT USING (
        conversa_id IN (
            SELECT conversa_id FROM comunicacao_participantes 
            WHERE usuario_id = auth.uid() AND is_deleted = FALSE
        )
    );

CREATE POLICY "Usuários podem inserir participantes" ON comunicacao_participantes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar sua participação" ON comunicacao_participantes
    FOR UPDATE USING (usuario_id = auth.uid());

-- Políticas RLS para comunicacao_mensagens
CREATE POLICY "Usuários podem ver mensagens de suas conversas" ON comunicacao_mensagens
    FOR SELECT USING (
        conversa_id IN (
            SELECT conversa_id FROM comunicacao_participantes 
            WHERE usuario_id = auth.uid() AND is_deleted = FALSE
        )
    );

CREATE POLICY "Usuários podem enviar mensagens" ON comunicacao_mensagens
    FOR INSERT WITH CHECK (
        remetente_id = auth.uid() AND
        conversa_id IN (
            SELECT conversa_id FROM comunicacao_participantes 
            WHERE usuario_id = auth.uid() AND is_deleted = FALSE
        )
    );

CREATE POLICY "Usuários podem atualizar suas mensagens" ON comunicacao_mensagens
    FOR UPDATE USING (remetente_id = auth.uid());

-- Políticas RLS para chat_users
CREATE POLICY "Chat users podem ser vistos por todos" ON chat_users
    FOR SELECT USING (true);

CREATE POLICY "Chat users podem ser inseridos" ON chat_users
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Chat users podem ser atualizados" ON chat_users
    FOR UPDATE USING (true);

-- Trigger para atualizar updated_at na conversa
CREATE OR REPLACE FUNCTION update_conversa_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE comunicacao_conversas 
    SET updated_at = NOW() 
    WHERE id = NEW.conversa_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversa_on_message
    AFTER INSERT ON comunicacao_mensagens
    FOR EACH ROW
    EXECUTE FUNCTION update_conversa_updated_at();

-- Função para sincronizar dados de usuários
CREATE OR REPLACE FUNCTION sync_chat_user()
RETURNS TRIGGER AS $$
DECLARE
    user_name TEXT;
    user_avatar TEXT;
    user_role TEXT;
BEGIN
    -- Buscar dados do professor
    SELECT nome INTO user_name FROM professores WHERE user_id = NEW.id;
    
    -- Se não é professor, buscar dados da diretora
    IF user_name IS NULL THEN
        SELECT nome INTO user_name FROM diretoras WHERE user_id = NEW.id;
        user_role := 'diretora';
    ELSE
        user_role := 'professor';
    END IF;
    
    -- Se não encontrou em nenhuma tabela, usar dados do metadata
    IF user_name IS NULL THEN
        user_name := NEW.raw_user_meta_data->>'full_name';
        user_role := 'usuario';
    END IF;
    
    user_avatar := NEW.raw_user_meta_data->>'avatar_url';
    
    -- Inserir ou atualizar na tabela chat_users
    INSERT INTO chat_users (user_id, nome, avatar_url, role)
    VALUES (NEW.id, user_name, user_avatar, user_role)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        nome = EXCLUDED.nome,
        avatar_url = EXCLUDED.avatar_url,
        role = EXCLUDED.role,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para sincronizar usuários automaticamente (se a tabela auth.users existir)
-- CREATE TRIGGER sync_chat_user_trigger
--     AFTER INSERT OR UPDATE ON auth.users
--     FOR EACH ROW
--     EXECUTE FUNCTION sync_chat_user();

-- Comentários para documentação
COMMENT ON TABLE comunicacao_conversas IS 'Conversas do sistema de comunicação interna';
COMMENT ON TABLE comunicacao_participantes IS 'Participantes das conversas';
COMMENT ON TABLE comunicacao_mensagens IS 'Mensagens das conversas';
COMMENT ON TABLE chat_users IS 'Dados dos usuários para o sistema de chat';