import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { getUnreadNotifications, markNotificationAsRead, markNotificationsForConversaAsRead, Notification } from '../services/notificationService';

export const useNotifications = (userId: string | undefined) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = useCallback(async () => {
        if (!userId) return;
        
        try {
            const data = await getUnreadNotifications(userId);
            setNotifications(data);
        } catch (error) {
            console.error('Erro ao buscar notificações:', error);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const markAsRead = useCallback(async (notificationId: number) => {
        const success = await markNotificationAsRead(notificationId);
        if (success) {
            setNotifications(prev => prev.filter(n => n.id !== notificationId));
        }
        return success;
    }, []);

    const markConversationAsRead = useCallback(async (conversaId: string) => {
        if (!userId) return false;
        
        const success = await markNotificationsForConversaAsRead(userId, conversaId);
        if (success) {
            // Atualizar o estado local imediatamente
            setNotifications(prev => 
                prev.filter(n => 
                    !(n.type === 'new_message' && n.data.conversa_id === conversaId)
                )
            );
        }
        return success;
    }, [userId]);

    // Efeito para buscar notificações iniciais
    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Efeito para escutar mudanças em tempo real
    useEffect(() => {
        if (!userId) return;

        const channel = supabase
            .channel(`notifications:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    console.log('Mudança em notificações:', payload);
                    
                    if (payload.eventType === 'INSERT') {
                        // Nova notificação
                        const newNotification = payload.new as Notification;
                        if (!newNotification.is_read) {
                            setNotifications(prev => [newNotification, ...prev]);
                        }
                    } else if (payload.eventType === 'UPDATE') {
                        // Notificação atualizada
                        const updatedNotification = payload.new as Notification;
                        if (updatedNotification.is_read) {
                            // Se foi marcada como lida, remover da lista
                            setNotifications(prev => prev.filter(n => n.id !== updatedNotification.id));
                        }
                    } else if (payload.eventType === 'DELETE') {
                        // Notificação deletada
                        const deletedNotification = payload.old as Notification;
                        setNotifications(prev => prev.filter(n => n.id !== deletedNotification.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId]);

    return {
        notifications,
        loading,
        fetchNotifications,
        markAsRead,
        markConversationAsRead,
    };
}; 