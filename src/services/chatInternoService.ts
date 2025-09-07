import { supabase } from '../lib/supabase';

export interface ChatUser {
  user_id: string;
  nome: string;
  avatar_url: string;
  role: string;
  descricao?: string;
  conversa_id?: string;
  last_message_content?: string;
  last_message_at?: string;
  unread_count?: number;
}

export interface Conversa {
  id: string;
  nome_conversa?: string;
  outro_participante?: {
    nome: string;
    avatar_url?: string;
  };
  ultima_mensagem?: {
    conteudo: string;
    created_at: string;
  };
}

export interface Mensagem {
  id: number | string;
  conversa_id: string;
  remetente_id: string;
  conteudo: string;
  created_at: string;
  visualizado_em: string | null;
  status?: 'enviando' | 'enviado' | 'falhou';
}

/**
 * Busca as conversas existentes em que o usuário participa (apenas as não deletadas).
 * Usa a função RPC que já filtra conversas marcadas como deletadas pelo usuário.
 */
export const getConversas = async (userId: string): Promise<ChatUser[]> => {
  console.log('🔍 Buscando conversas para usuário:', userId);
  
  try {
    // Esta RPC busca conversas ativas (não deletadas) e informações do outro participante
    const { data, error } = await supabase.rpc('get_conversations_with_unread_count', {
      p_user_id: userId,
    });

    if (error) {
      console.log('🔄 Erro na função RPC, tentando abordagem alternativa:', error);
      return await getConversasFallback(userId);
    }

    const conversations = (data || []).map((item: any) => ({
      user_id: item.other_participant_id,
      nome: item.other_participant_nome,
      avatar_url: item.other_participant_avatar_url,
      role: item.other_participant_role || '',
      conversa_id: item.conversa_id,
      last_message_content: item.last_message_content,
      last_message_at: item.last_message_at,
      unread_count: item.unread_count || 0,
    }));

    return conversations;
  } catch (error) {
    console.error('❌ Erro ao buscar conversas:', error);
    return await getConversasFallback(userId);
  }
};

/**
 * Fallback para buscar conversas quando a função RPC não estiver disponível
 */
const getConversasFallback = async (userId: string): Promise<ChatUser[]> => {
  try {
    // Buscar participações do usuário
    const { data: participacoes, error: participacoesError } = await supabase
      .from('comunicacao_participantes')
      .select(`
        conversa_id,
        comunicacao_conversas!inner (
          id,
          nome_conversa,
          created_at
        )
      `)
      .eq('usuario_id', userId)
      .eq('is_deleted', false);

    if (participacoesError) {
      console.error('❌ Erro ao buscar participações:', participacoesError);
      return [];
    }

    const conversas: ChatUser[] = [];

    for (const participacao of participacoes || []) {
      // Buscar o outro participante
      const { data: outroParticipante, error: outroParticipanteError } = await supabase
        .from('comunicacao_participantes')
        .select('usuario_id')
        .eq('conversa_id', participacao.conversa_id)
        .neq('usuario_id', userId)
        .eq('is_deleted', false)
        .single();

      if (!outroParticipanteError && outroParticipante) {
        // Buscar dados do usuário na tabela chat_users
        const { data: chatUser, error: chatUserError } = await supabase
          .from('chat_users')
          .select('user_id, nome, avatar_url, role')
          .eq('user_id', outroParticipante.usuario_id)
          .single();

        if (!chatUserError && chatUser) {
          conversas.push({
            user_id: chatUser.user_id,
            nome: chatUser.nome,
            avatar_url: chatUser.avatar_url,
            role: chatUser.role,
            conversa_id: participacao.conversa_id,
            last_message_content: 'Conversa criada',
            last_message_at: participacao.comunicacao_conversas.created_at,
            unread_count: 0,
          });
        }
      }
    }

    return conversas;
  } catch (error) {
    console.error('❌ Erro no fallback:', error);
    return [];
  }
};

/**
 * Busca usuários (professores/gestores) de uma escola para iniciar nova conversa.
 */
export const buscarUsuarios = async (
  termoBusca: string,
  currentUserId: string,
  escolaId: number
): Promise<ChatUser[]> => {
  if (!termoBusca || termoBusca.trim() === '' || !escolaId) {
    return [];
  }

  const { data, error } = await supabase.rpc('search_school_users', {
    p_escola_id: escolaId,
    p_search_term: termoBusca,
    p_current_user_id: currentUserId,
  });

  if (error) {
    console.error("Erro ao buscar usuários (RPC search_school_users):", error);
    return [];
  }

  // Filtra o usuário atual da lista de resultados e mapeia para a interface ChatUser
  const usuariosEncontrados = (data || [])
    .filter((user: any) => user.user_id !== currentUserId)
    .map((user: any) => ({
      user_id: user.user_id,
      nome: user.nome,
      avatar_url: user.avatar_url,
      role: user.role,
    }));
    
  return usuariosEncontrados;
};

/**
 * Cria ou encontra uma conversa e adiciona participantes.
 */
export const findOrCreateConversation = async (
  creatorId: string,
  otherParticipantId: string
): Promise<{ id: string }> => {
  console.log('🔍 Buscando ou criando conversa entre:', creatorId, 'e', otherParticipantId);
  
  try {
    const { data, error } = await supabase.rpc('find_or_create_conversation_simple', {
      p_user1_id: creatorId,
      p_user2_id: otherParticipantId,
    });

    if (error) {
      console.log('🔄 Erro na função RPC, criando conversa mock:', error);
      return await findOrCreateConversationFallback(creatorId, otherParticipantId);
    }
    
    return { id: data };
  } catch (error) {
    console.error('❌ Erro ao buscar ou criar conversa:', error);
    return await findOrCreateConversationFallback(creatorId, otherParticipantId);
  }
};

/**
 * Fallback para criar conversa quando a função RPC não estiver disponível
 */
const findOrCreateConversationFallback = async (
  creatorId: string,
  otherParticipantId: string
): Promise<{ id: string }> => {
  try {
    console.log('💥 Erro geral ao buscar/criar conversa:', 'RPC não disponível');
    
    // Por enquanto, retornamos um erro para que o usuário saiba que precisa configurar o banco
    throw new Error('Sistema de chat não configurado. Por favor, execute as migrações do banco de dados.');
  } catch (error) {
    console.error('💥 Erro geral ao buscar/criar conversa:', error);
    throw error;
  }
};

/**
 * Busca as mensagens de uma conversa.
 */
export const getMensagens = async (conversaId: string): Promise<Mensagem[]> => {
  const { data, error } = await supabase.rpc('get_messages_for_conversation', {
    p_conversa_id: conversaId,
  });

  if (error) {
    console.warn('Supabase find message error:', error.message);
    return [];
  }
  return data as Mensagem[];
};

/**
 * Envia uma mensagem para uma conversa usando a função RPC segura.
 */
export const enviarMensagem = async (conversaId: string, conteudo: string): Promise<Omit<Mensagem, 'status'>> => {
    const { data, error } = await supabase.rpc('send_message', {
        p_conversa_id: conversaId,
        p_conteudo: conteudo
    });

    if (error) {
        console.error('Erro ao enviar mensagem no serviço (RPC):', error);
        throw error;
    }

    // A função RPC retorna um array, pegamos o primeiro elemento
    if (!data || !Array.isArray(data) || data.length === 0) {
        console.error('Resposta inválida da função send_message:', data);
        throw new Error('Resposta inválida do servidor');
    }

    const mensagem = data[0];
    console.log('📨 Mensagem processada no serviço:', mensagem);

    return mensagem as Omit<Mensagem, 'status'>;
};

export const getParticipantDetails = async (conversaId: string, currentUserId: string): Promise<ChatUser | null> => {
  const { data, error } = await supabase.rpc('get_participant_details', {
    p_conversa_id: conversaId,
    p_current_user_id: currentUserId,
  });

  if (error) {
    console.error('Error fetching participant details:', error);
    return null;
  }

  return data as ChatUser | null;
};

export const marcarMensagensComoLidas = async (conversaId: string, leitorId: string) => {
    const { error } = await supabase.rpc('mark_messages_as_read', {
        p_conversa_id: conversaId,
        p_reader_id: leitorId,
    });
    if (error) {
        console.error('Erro ao marcar mensagens como lidas:', error);
    }
};

export const assinarMudancasMensagens = (
  conversaId: string, 
  callback: (payload: any) => void
) => {
  const channel = supabase.channel(`conversa_${conversaId}`)
    .on(
      'postgres_changes',
      { 
        event: '*',
        schema: 'public', 
        table: 'comunicacao_mensagens',
        filter: `conversa_id=eq.${conversaId}`
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();
  
  return () => supabase.removeChannel(channel);
}

/**
 * Deleta uma conversa apenas para o usuário atual (soft delete).
 * A conversa permanece visível para o outro participante.
 * NOTA: Esta função marca is_deleted = true em vez de remover o registro.
 */
export const deleteConversa = async (conversaId: string, userId: string) => {
    console.log('🗑️ Iniciando exclusão de conversa:', { conversaId, userId });
    
    try {
        // Usa função RPC para marcar a conversa como deletada de forma segura
        const { data, error } = await supabase.rpc('soft_delete_conversation_for_user', {
            p_conversa_id: conversaId
        });

        if (error) {
            console.error('❌ Erro na função RPC de exclusão:', error);
            throw error;
        }
        
        console.log('✅ Conversa marcada como deletada:', data);
        return data as boolean;
    } catch (error) {
        console.error('❌ Erro ao marcar conversa como deletada para o usuário:', error);
        throw error;
    }
};

/**
 * Restaura uma conversa deletada para o usuário atual.
 * Útil se o usuário quiser voltar a ver uma conversa que havia "deletado".
 */
export const restoreConversa = async (conversaId: string, userId: string) => {
    // Usa função RPC para restaurar a conversa de forma segura
    const { data, error } = await supabase.rpc('restore_conversation_for_user', {
        p_conversa_id: conversaId
    });

    if (error) {
        console.error('Erro ao restaurar conversa para o usuário:', error);
        throw error;
    }
    
    return data as boolean;
};

/**
 * Busca conversas que foram deletadas pelo usuário (soft delete).
 * Útil para implementar uma funcionalidade de "lixeira" ou "conversas arquivadas".
 */
export const getConversasDeletadas = async (userId: string): Promise<ChatUser[]> => {
    const { data, error } = await supabase
        .from('comunicacao_participantes')
        .select(`
            conversa_id,
            comunicacao_conversas!comunicacao_participantes_conversa_id_fkey (
                id,
                created_at
            )
        `)
        .eq('usuario_id', userId)
        .eq('is_deleted', true);

    if (error) {
        console.error('Erro ao buscar conversas deletadas:', error);
        return [];
    }

    // Para cada conversa deletada, buscar informações do outro participante
    const conversasDeletadas: ChatUser[] = [];
    
    for (const item of data || []) {
        // Buscar o outro participante da conversa
        const { data: otherParticipant, error: participantError } = await supabase
            .from('comunicacao_participantes')
            .select(`
                usuario_id,
                chat_users!comunicacao_participantes_usuario_id_fkey (
                    user_id,
                    nome,
                    avatar_url,
                    role
                )
            `)
            .eq('conversa_id', item.conversa_id)
            .neq('usuario_id', userId)
            .single();

        if (!participantError && otherParticipant?.chat_users && !Array.isArray(otherParticipant.chat_users)) {
            const chatUser = otherParticipant.chat_users as any;
            const conversation = Array.isArray(item.comunicacao_conversas) ? item.comunicacao_conversas[0] : item.comunicacao_conversas;
            
            conversasDeletadas.push({
                user_id: chatUser.user_id,
                nome: chatUser.nome,
                avatar_url: chatUser.avatar_url,
                role: chatUser.role,
                conversa_id: item.conversa_id,
                last_message_content: 'Conversa arquivada',
                last_message_at: conversation?.created_at,
                unread_count: 0,
            });
        }
    }

    return conversasDeletadas;
};

/**
 * Deleta uma conversa vazia (sem mensagens) permanentemente.
 * Esta função só deve ser usada para conversas que nunca tiveram mensagens.
 */
export const deleteEmptyConversation = async (conversaId: string): Promise<boolean> => {
  try {
    console.log('🗑️ Tentando deletar conversa vazia:', conversaId);
    
    // Primeiro verifica se a conversa realmente não tem mensagens
    const { data: messages, error: messagesError } = await supabase
      .from('comunicacao_mensagens')
      .select('id')
      .eq('conversa_id', conversaId)
      .limit(1);

    if (messagesError) {
      console.error('❌ Erro ao verificar mensagens da conversa:', messagesError);
      return false;
    }

    // Se tem mensagens, não deleta
    if (messages && messages.length > 0) {
      console.log('📝 Conversa tem mensagens, não será deletada:', conversaId);
      return false;
    }

    console.log('✅ Conversa está vazia, deletando:', conversaId);

    // Remove os participantes da conversa
    const { error: participantError } = await supabase
      .from('comunicacao_participantes')
      .delete()
      .eq('conversa_id', conversaId);

    if (participantError) {
      console.error('❌ Erro ao remover participantes:', participantError);
      return false;
    }

    // Remove a conversa
    const { error: conversaError } = await supabase
      .from('comunicacao_conversas')
      .delete()
      .eq('id', conversaId);

    if (conversaError) {
      console.error('❌ Erro ao remover conversa:', conversaError);
      return false;
    }

    console.log('🎉 Conversa vazia deletada com sucesso:', conversaId);
    return true;
  } catch (error) {
    console.error('❌ Erro ao deletar conversa vazia:', error);
    return false;
  }
};

/**
 * Verifica se uma conversa está vazia (sem mensagens).
 */
export const isConversationEmpty = async (conversaId: string): Promise<boolean> => {
  try {
    console.log('🔍 Verificando se conversa está vazia:', conversaId);
    
    const { data, error } = await supabase
      .from('comunicacao_mensagens')
      .select('id')
      .eq('conversa_id', conversaId)
      .limit(1);

    if (error) {
      console.error('❌ Erro ao verificar se conversa está vazia:', error);
      return false;
    }

    const isEmpty = !data || data.length === 0;
    console.log(isEmpty ? '✅ Conversa está vazia' : '📝 Conversa tem mensagens', conversaId);
    
    return isEmpty;
  } catch (error) {
    console.error('❌ Erro ao verificar conversa vazia:', error);
    return false;
  }
};
