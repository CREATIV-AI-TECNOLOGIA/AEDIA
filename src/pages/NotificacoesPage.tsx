import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ListaConversas from '../components/chat/ListaConversas';
import JanelaConversa from '../components/chat/JanelaConversa';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useEscola } from '../context/EscolaContext';
import { RealtimePresenceState } from '@supabase/supabase-js';
import { findOrCreateConversation, deleteEmptyConversation, isConversationEmpty } from '../services/chatInternoService';
import './ChatInternoPage.css';

const NotificacoesPage: React.FC = () => {
    const { user } = useAuth();
    const { escolaAtiva } = useEscola();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    const [conversaAtivaId, setConversaAtivaId] = useState<string | null>(null);
    const [onlineUsers, setOnlineUsers] = useState<RealtimePresenceState>({});
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isChangingConversation, setIsChangingConversation] = useState(false);
    
    const [refreshKey, setRefreshKey] = useState(0);
    const triggerRefresh = useCallback(() => setRefreshKey(prev => prev + 1), []);

    // Refs para evitar re-criação de canais
    const channelRef = useRef<any>(null);
    const subscriptionRef = useRef<any>(null);

    // Função para deletar conversa vazia anterior
    const deleteEmptyPreviousConversation = useCallback(async (conversaId: string) => {
        try {
            const isEmpty = await isConversationEmpty(conversaId);
            if (isEmpty) {
                console.log(`Deletando conversa vazia: ${conversaId}`);
                await deleteEmptyConversation(conversaId);
                triggerRefresh();
            }
        } catch (error) {
            console.error('Erro ao deletar conversa vazia:', error);
        }
    }, [triggerRefresh]);

    // Detectar mudanças de tamanho da tela
    useEffect(() => {
        const handleResize = () => {
            const newIsMobile = window.innerWidth <= 768;
            setIsMobile(prev => prev !== newIsMobile ? newIsMobile : prev);
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Inicialização e configuração de presença
    useEffect(() => {
        if (!user?.id || !escolaAtiva?.id) return;

        const initializeChat = async () => {
            try {
                // Configurar presença online
                const channel = supabase.channel('online-users', {
                    config: {
                        presence: {
                            key: user.id,
                        },
                    },
                });

                channel
                    .on('presence', { event: 'sync' }, () => {
                        const newState = channel.presenceState();
                        setOnlineUsers(newState);
                    })
                    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                        setOnlineUsers(prev => ({ ...prev, [key]: newPresences }));
                    })
                    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                        setOnlineUsers(prev => {
                            const newState = { ...prev };
                            delete newState[key];
                            return newState;
                        });
                    });

                await channel.subscribe(async (status) => {
                    if (status === 'SUBSCRIBED') {
                        await channel.track({
                            user_id: user.id,
                            online_at: new Date().toISOString(),
                        });
                    }
                });

                channelRef.current = channel;
                setIsInitialized(true);
            } catch (error) {
                console.error('Erro ao inicializar chat:', error);
                setIsInitialized(true);
            }
        };

        initializeChat();

        return () => {
            if (channelRef.current) {
                channelRef.current.unsubscribe();
            }
        };
    }, [user?.id, escolaAtiva?.id]);

    // Gerenciar conversa ativa via URL
    useEffect(() => {
        const conversaId = searchParams.get('conversa');
        if (conversaId && conversaId !== conversaAtivaId) {
            setConversaAtivaId(conversaId);
        }
    }, [searchParams, conversaAtivaId]);

    // Handlers
    const handleSelectConversa = useCallback(async (conversaId: string, otherUserId: string) => {
        if (conversaId === conversaAtivaId) return;

        setIsChangingConversation(true);
        
        try {
            // Deletar conversa vazia anterior se existir
            if (conversaAtivaId) {
                await deleteEmptyPreviousConversation(conversaAtivaId);
            }

            // Encontrar ou criar nova conversa
            const novaConversaId = await findOrCreateConversation(user!.id, otherUserId, escolaAtiva!.id);
            
            setConversaAtivaId(novaConversaId);
            setSearchParams({ conversa: novaConversaId });
            
            if (isMobile) {
                setSidebarCollapsed(true);
            }
        } catch (error) {
            console.error('Erro ao selecionar conversa:', error);
        } finally {
            setIsChangingConversation(false);
        }
    }, [conversaAtivaId, user, escolaAtiva, isMobile, setSearchParams, deleteEmptyPreviousConversation]);

    const handleCloseConversa = useCallback(() => {
        setConversaAtivaId(null);
        setSearchParams({});
        if (isMobile) {
            setSidebarCollapsed(false);
        }
    }, [isMobile, setSearchParams]);

    const handleDeleteSuccess = useCallback(() => {
        triggerRefresh();
        if (conversaAtivaId) {
            handleCloseConversa();
        }
    }, [conversaAtivaId, handleCloseConversa, triggerRefresh]);

    // Props estáveis para ListaConversas
    const listaConversasProps = useMemo(() => ({
        onSelectConversa: handleSelectConversa,
        onlineUsers,
        refreshKey,
        escolaId: escolaAtiva?.id,
        conversaAtivaId,
        onDeleteSuccess: handleDeleteSuccess,
    }), [handleSelectConversa, onlineUsers, refreshKey, escolaAtiva?.id, conversaAtivaId, handleDeleteSuccess]);

    // Props estáveis para JanelaConversa
    const janelaConversaProps = useMemo(() => ({
        conversaId: conversaAtivaId,
        onlineUsers,
        onClose: handleCloseConversa,
    }), [conversaAtivaId, onlineUsers, handleCloseConversa]);

    // Loading state
    if (!isInitialized && user?.id) {
        return (
            <div className="chat-container">
                <div className="chat-main-content">
                    <div className="chat-welcome">
                        <div className="welcome-content">
                            <h2>Carregando...</h2>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`chat-container ${isMobile ? 'mobile' : ''}`}>
            <div className="chat-main-content">
                {/* Sidebar */}
                <aside className={`chat-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
                    <ListaConversas {...listaConversasProps} />
                    
                    {/* Overlay para mobile */}
                    {isMobile && !sidebarCollapsed && (
                        <div className="sidebar-overlay" onClick={() => setSidebarCollapsed(true)}></div>
                    )}
                </aside>

                {/* Área principal do chat */}
                <main className="chat-main-area">
                    {conversaAtivaId ? (
                        <div style={{ position: 'relative', height: '100%' }}>
                            <JanelaConversa 
                                key={`conversa-${conversaAtivaId}`}
                                {...janelaConversaProps} 
                            />
                            {isChangingConversation && (
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 1000
                                }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ 
                                            width: '24px', 
                                            height: '24px', 
                                            border: '3px solid #f3f3f3',
                                            borderTop: '3px solid #075e54',
                                            borderRadius: '50%',
                                            animation: 'spin 1s linear infinite',
                                            margin: '0 auto 8px'
                                        }}></div>
                                        <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Carregando conversa...</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="chat-welcome">
                            <div className="welcome-content">
                                <h2>Chat</h2>
                                <p>Selecione um contato na barra lateral para começar a conversar</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default NotificacoesPage;