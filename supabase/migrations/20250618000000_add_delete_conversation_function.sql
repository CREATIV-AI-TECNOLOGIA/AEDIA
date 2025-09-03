-- Função para deletar uma conversa de forma segura
-- Apenas participantes da conversa podem deletá-la.

CREATE OR REPLACE FUNCTION public.delete_conversation_securely(p_conversa_id uuid, p_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com os privilégios do criador da função (necessário para deletar)
AS $$
DECLARE
    is_participant boolean;
BEGIN
    -- 1. Verificar se o usuário que está pedindo a exclusão é um participante da conversa
    SELECT EXISTS (
        SELECT 1
        FROM public.comunicacao_participantes
        WHERE conversa_id = p_conversa_id AND participante_id = p_user_id
    ) INTO is_participant;

    -- 2. Se for um participante, proceder com a exclusão
    IF is_participant THEN
        -- A exclusão em `comunicacao_conversas` deve apagar em cascata
        -- os registros em `comunicacao_participantes` e `comunicacao_mensagens`
        -- se as chaves estrangeiras foram criadas com `ON DELETE CASCADE`.
        DELETE FROM public.comunicacao_conversas WHERE id = p_conversa_id;
        
        -- Verificar se a linha foi realmente deletada
        IF FOUND THEN
            RETURN 'Conversa deletada com sucesso.';
        ELSE
            RETURN 'Conversa não encontrada.';
        END IF;
    ELSE
        -- 3. Se não for participante, negar a operação
        RAISE EXCEPTION 'Permissão negada. Usuário não é participante da conversa.';
    END IF;
END;
$$; 