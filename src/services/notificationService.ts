import { supabase } from '../lib/supabase';

export interface Notification {
    id: number;
    user_id: string;
    type: 'new_message' | string; // Tipos de notificação
    data: {
        conversa_id?: string;
        sender_name?: string;
        message_preview?: string;
        [key: string]: any;
    };
    is_read: boolean;
    created_at: string;
}

/**
 * Busca as notificações não lidas para o usuário.
 */
export const getUnreadNotifications = async (userId: string): Promise<Notification[]> => {
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('is_read', false)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Erro ao buscar notificações:', error);
        return [];
    }
    return data as Notification[];
};

/**
 * Marca uma notificação específica como lida.
 */
export const markNotificationAsRead = async (notificationId: number): Promise<boolean> => {
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

    if (error) {
        console.error('Erro ao marcar notificação como lida:', error);
        return false;
    }
    return true;
};

/**
 * Marca todas as notificações do usuário como lidas.
 */
export const markAllNotificationsAsRead = async (userId: string): Promise<boolean> => {
     const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

    if (error) {
        console.error('Erro ao marcar todas as notificações como lidas:', error);
        return false;
    }
    return true;
}

/**
 * Marca todas as notificações de uma conversa específica como lidas.
 */
export const markNotificationsForConversaAsRead = async (userId: string, conversaId: string): Promise<boolean> => {
    try {
        // Tentar usar a função RPC primeiro
        const { error: rpcError } = await supabase.rpc('mark_notifications_as_read_for_conversa', {
            p_user_id: userId,
            p_conversa_id: conversaId
        });

        if (!rpcError) {
            return true;
        }

        // Se a função RPC falhar, usar query direta
        console.log('RPC não disponível, usando query direta para marcar notificações como lidas');
        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false)
            .eq('type', 'new_message')
            .like('data', `%"conversa_id":"${conversaId}"%`);

        if (error) {
            console.error('Erro ao marcar notificações da conversa como lidas:', error);
            return false;
        }
        return true;
    } catch (error) {
        console.error('Erro geral ao marcar notificações da conversa como lidas:', error);
        return false;
    }
};