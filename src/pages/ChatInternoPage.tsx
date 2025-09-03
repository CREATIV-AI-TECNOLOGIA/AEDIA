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

const ChatInternoPage = () => {
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

    // Detectar mudanças de tamanho da tela - otimizado
    useEffect(() => {
        const handleResize = () => {
            const newIsMobile = window.innerWidth <= 768;
            setIsMobile(prev => prev !== newIsMobile ? newIsMobile : prev);
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Inicialização do chat - separado para evitar re-execuções
    useEffect(() => {
        if (!user?.id || isInitialized) return;

        const initializeChat = async () => {
            try {
                // Verificar URL params apenas uma vez
                const conversaIdFromUrl = searchParams.get('conversaId');
                if (conversaIdFromUrl && conversaIdFromUrl !== conversaAtivaId) {
                    setConversaAtivaId(conversaIdFromUrl);
                }

                // Criar canal de presença
                if (!channelRef.current) {
                    channelRef.current = supabase.channel('online-users', {
                        config: {
                            presence: {
                                key: user.id,
                            },
                        },
                    });

                    channelRef.current.on('presence', { event: 'sync' }, () => {
                        const state = channelRef.current.presenceState();
                        setOnlineUsers(state);
                    });

                    await channelRef.current.subscribe(async (status: string) => {
                        if (status === 'SUBSCRIBED') {
                            await channelRef.current.track({ online_at: new Date().toISOString() });
                        }
                    });
                }

                // Criar subscription de mensagens
                if (!subscriptionRef.current) {
                    subscriptionRef.current = supabase.channel('comunicacao_mensagens_changes')
                        .on('postgres_changes', { event: '*', schema: 'public', table: 'comunicacao_mensagens' },
                            (payload) => {
                                triggerRefresh();
                            }
                        ).subscribe();
                }

                setIsInitialized(true);
            } catch (error) {
                console.error('Erro ao inicializar chat:', error);
            }
        };

        initializeChat();

        // Cleanup apenas quando o componente for desmontado
        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
            if (subscriptionRef.current) {
                supabase.removeChannel(subscriptionRef.current);
                subscriptionRef.current = null;
            }
            setIsInitialized(false);
        };
    }, [user?.id]); // Só depende do user.id

    const handleSelectConversa = useCallback(async (conversaId: string, otherUserId: string) => {
        if (!user) return;

        console.log('🔄 Selecionando conversa:', conversaId, 'Conversa atual:', conversaAtivaId);

        // Se há uma conversa ativa diferente da nova selecionada, verificar se está vazia e deletar
        if (conversaAtivaId && conversaAtivaId !== conversaId) {
            console.log('🔍 Verificando se conversa atual está vazia antes de trocar:', conversaAtivaId);
            await deleteEmptyPreviousConversation(conversaAtivaId);
        }

        let novaConversaId = conversaId;

        if (conversaId) {
            // Só atualiza se for uma conversa diferente
            if (conversaAtivaId !== conversaId) {
                setIsChangingConversation(true);
                setConversaAtivaId(conversaId);
                setTimeout(() => setIsChangingConversation(false), 300);
            }
        } else {
            try {
                setIsChangingConversation(true);
                const newConversation = await findOrCreateConversation(user.id, otherUserId);
                novaConversaId = newConversation.id;
                console.log('✅ Nova conversa criada:', novaConversaId);
                setConversaAtivaId(novaConversaId);
                setTimeout(() => setIsChangingConversation(false), 300);
                triggerRefresh();
            } catch (error) {
                console.error("Erro ao iniciar nova conversa a partir da lista", error);
                return;
            }
        }
        
        // No mobile, colapsar sidebar quando selecionar conversa
        if (isMobile) {
            setSidebarCollapsed(true);
        }
        
        if (searchParams.get('conversaId')) {
            setSearchParams({}, { replace: true });
        }
        
        // Não precisa de triggerRefresh aqui - o JanelaConversa se atualiza automaticamente
    }, [user, conversaAtivaId, deleteEmptyPreviousConversation, isMobile, searchParams, setSearchParams, triggerRefresh]);

    const handleCloseConversa = useCallback(async () => {
        // Verificar se a conversa atual está vazia antes de fechar
        if (conversaAtivaId) {
            await deleteEmptyPreviousConversation(conversaAtivaId);
        }
        
        setConversaAtivaId(null);
        
        // No mobile, mostrar sidebar novamente
        if (isMobile) {
            setSidebarCollapsed(false);
        }
    }, [conversaAtivaId, deleteEmptyPreviousConversation, isMobile]);

    const handleDeleteSuccess = useCallback(() => {
        setConversaAtivaId(null);
        triggerRefresh();
    }, [triggerRefresh]);

    const toggleSidebar = useCallback(() => {
        setSidebarCollapsed(prev => !prev);
    }, []);

    // Memoizar props para evitar re-renderizações
    const listaConversasProps = useMemo(() => ({
        onSelectConversa: handleSelectConversa,
        onlineUsers,
        refreshKey,
        escolaId: escolaAtiva?.id,
        conversaAtivaId,
        onDeleteSuccess: handleDeleteSuccess,
    }), [handleSelectConversa, onlineUsers, refreshKey, escolaAtiva?.id, conversaAtivaId, handleDeleteSuccess]);

    // Props estáveis para JanelaConversa - sem refreshKey para evitar remontagem
    const janelaConversaProps = useMemo(() => ({
        conversaId: conversaAtivaId,
        onlineUsers,
        onClose: handleCloseConversa,
    }), [conversaAtivaId, onlineUsers, handleCloseConversa]);

    // Loading state para evitar flash
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
                                <h2>Selecione uma conversa</h2>
                                <p>Escolha um contato na barra lateral para começar a conversar</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default ChatInternoPage;