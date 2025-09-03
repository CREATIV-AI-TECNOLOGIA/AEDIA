import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { getConversas, buscarUsuarios, deleteConversa, ChatUser } from '../../services/chatInternoService';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar'; 
import { RealtimePresenceState } from '@supabase/supabase-js';
import styles from './ListaConversas.module.css';
import Input from '../ui/Input';
import { useDebounce } from '../../hooks/useDebounce';
import ConfirmationModal from '../ConfirmationModal';
import { FaTrash, FaSearch } from 'react-icons/fa';

interface ListaConversasProps {
    onSelectConversa: (conversaId: string, otherUserId: string) => void;
    onlineUsers: RealtimePresenceState;
    refreshKey: number;
    escolaId?: number;
    conversaAtivaId?: string | null;
    onDeleteSuccess?: () => void;
}

const ListaConversas: React.FC<ListaConversasProps> = ({ onSelectConversa, onlineUsers, refreshKey, escolaId, conversaAtivaId, onDeleteSuccess }) => {
    const { user } = useAuth();
    const [conversas, setConversas] = useState<ChatUser[]>([]);
    const [loading, setLoading] = useState(true);

    const [termoBusca, setTermoBusca] = useState('');
    const [resultadosBusca, setResultadosBusca] = useState<ChatUser[]>([]);
    const [loadingBusca, setLoadingBusca] = useState(false);
    
    const debouncedBusca = useDebounce(termoBusca, 300);
    const searchContainerRef = useRef<HTMLDivElement>(null);

    // Estado para o modal de exclusão
    const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
    const [conversaToDelete, setConversaToDelete] = useState<ChatUser | null>(null);

    // Efeito para buscar conversas existentes
    useEffect(() => {
        const fetchConversas = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const data = await getConversas(user.id);
                setConversas(data);
            } catch (error) {
                console.error('Erro ao carregar conversas:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchConversas();
    }, [user, refreshKey]);
    
    // Zera unread_count localmente de forma robusta, resolvendo a race condition
    useEffect(() => {
        if (conversaAtivaId && conversas.length > 0) {
            const conversaAtiva = conversas.find(c => c.conversa_id === conversaAtivaId);
            // Apenas atualiza se a conversa existir e o contador for maior que zero, para evitar loops
            if (conversaAtiva && (conversaAtiva.unread_count ?? 0) > 0) {
                setConversas(prev => prev.map(c => 
                    c.conversa_id === conversaAtivaId 
                        ? { ...c, unread_count: 0 } 
                        : c
                ));
            }
        }
    }, [conversaAtivaId, conversas]);

    // Efeito para buscar usuários na search bar
    useEffect(() => {
        // A busca só é acionada se todos os parâmetros necessários existirem
        if (debouncedBusca && user && escolaId) {
            setLoadingBusca(true);
            buscarUsuarios(debouncedBusca, user.id, escolaId)
                .then(data => {
                    setResultadosBusca(data);
                })
                .catch(error => {
                    console.error("Erro na busca de usuários:", error);
                    setResultadosBusca([]); // Limpa os resultados em caso de erro
                })
                .finally(() => {
                    setLoadingBusca(false);
                });
        } else {
            setResultadosBusca([]);
        }
    }, [debouncedBusca, user, escolaId]);

    // Efeito para remover conversas sem mensagens quando a conversa ativa muda
    useEffect(() => {
        if (!conversaAtivaId && conversas.length > 0) {
            // Quando nenhuma conversa está ativa, remove conversas sem mensagens após um delay
            const timer = setTimeout(() => {
                const conversasComMensagens = conversas.filter(c => c.last_message_at);
                if (conversasComMensagens.length !== conversas.length) {
                    setConversas(conversasComMensagens);
                }
            }, 5000); // 5 segundos após fechar o chat

            return () => clearTimeout(timer);
        }
    }, [conversaAtivaId, conversas]);

    // Efeito para fechar resultados de busca ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setTermoBusca('');
                setResultadosBusca([]);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSelectUserFromSearch = (selectedUser: ChatUser) => {
        const conversaExistente = conversas.find(c => c.user_id === selectedUser.user_id);
        onSelectConversa(conversaExistente?.conversa_id || '', selectedUser.user_id);
        setTermoBusca('');
        setResultadosBusca([]);
    };

    // Funções para controlar a exclusão
    const openDeleteModal = (conversa: ChatUser) => {
        setConversaToDelete(conversa);
        setDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setConversaToDelete(null);
        setDeleteModalOpen(false);
    };

    const handleConfirmDelete = async () => {
        if (!conversaToDelete || !conversaToDelete.conversa_id) return;
        
        // Mostra loading durante a exclusão
        setLoading(true);
        
        try {
            if (user) {
                await deleteConversa(conversaToDelete.conversa_id, user.id);
                
                // Recarrega as conversas do servidor para garantir que a lista esteja atualizada
                const data = await getConversas(user.id);
                setConversas(data);
                
                console.log('✅ Conversa removida com sucesso');
            }
            if (onDeleteSuccess) {
                onDeleteSuccess();
            }
        } catch (error) {
            console.error("❌ Erro ao deletar a conversa:", error);
            // Recarrega as conversas mesmo em caso de erro para garantir consistência
            if (user) {
                try {
                    const data = await getConversas(user.id);
                    setConversas(data);
                } catch (reloadError) {
                    console.error("❌ Erro ao recarregar conversas:", reloadError);
                }
            }
        } finally {
            setLoading(false);
            closeDeleteModal();
        }
    };

    const sortedConversas = useMemo(() => {
        return [...conversas].sort((a, b) => {
            const aIsOnline = Object.keys(onlineUsers).includes(a.user_id);
            const bIsOnline = Object.keys(onlineUsers).includes(b.user_id);

            if ((a.unread_count ?? 0) > 0 && (b.unread_count ?? 0) === 0) return -1;
            if ((a.unread_count ?? 0) === 0 && (b.unread_count ?? 0) > 0) return 1;

            if (aIsOnline && !bIsOnline) return -1;
            if (!aIsOnline && bIsOnline) return 1;
            
            if (a.last_message_at && b.last_message_at) {
                return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
            }

            return a.nome.localeCompare(b.nome);
        });
    }, [conversas, onlineUsers]);
    
    return (
        <div className={styles.container}>
            <div className={styles.listHeader}>
                <div className={styles.searchContainer} ref={searchContainerRef}>
                    <FaSearch className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Pesquisar ou iniciar conversa"
                        value={termoBusca}
                        onChange={(e) => setTermoBusca(e.target.value)}
                        className={styles.searchInput}
                    />
                    {(loadingBusca || resultadosBusca.length > 0) && (
                        <div className={styles.searchResults}>
                            {loadingBusca && <div className={styles.searchItem}>Buscando...</div>}
                            {!loadingBusca && resultadosBusca.length === 0 && termoBusca && (
                                <div className={styles.searchItem}>Nenhum usuário encontrado</div>
                            )}
                            {!loadingBusca && resultadosBusca.map((u) => (
                                <div key={u.user_id} className={styles.searchItem} onClick={() => handleSelectUserFromSearch(u)}>
                                    <Avatar src={u.avatar_url} alt={u.nome} name={u.nome} size="sm" />
                                    <div className={styles.searchItemInfo}>
                                        <span className={styles.nome}>{u.nome}</span>
                                        <span className={styles.role}>{u.role}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            
            {!(resultadosBusca.length > 0 || loadingBusca) && (
                <>
                    {loading ? (
                        <div className={styles.loading}>Carregando conversas...</div>
                    ) : (
                        <>
                            {sortedConversas.length > 0 ? (
                                <>
                                    <h3 className={styles.title}>Conversas</h3>
                                    <ul className={styles.lista}>
                                        {sortedConversas.map((conversa) => {
                                            const isOnline = Object.keys(onlineUsers).includes(conversa.user_id);
                                            return (
                                                <li
                                                    key={conversa.conversa_id}
                                                    className={styles.conversaItem}
                                                >
                                                    <div className={styles.conversaClickableArea} onClick={() => onSelectConversa(conversa.conversa_id!, conversa.user_id)}>
                                                        <div className={styles.avatarContainer}>
                                                            <Avatar
                                                                src={conversa.avatar_url}
                                                                alt={conversa.nome}
                                                                name={conversa.nome}
                                                            />
                                                            <span className={`${styles.statusIndicator} ${isOnline ? styles.online : styles.offline}`}></span>
                                                        </div>
                                                        <div className={styles.conversaInfo}>
                                                            <span className={styles.nome}>{conversa.nome}</span>
                                                            <p className={styles.lastMessage}>{conversa.last_message_content || 'Nenhuma mensagem ainda.'}</p>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className={styles.actionsContainer}>
                                                        {(conversa.unread_count ?? 0) > 0 && (
                                                            <div className={styles.unreadBadge}>
                                                                {conversa.unread_count}
                                                            </div>
                                                        )}
                                                        <button 
                                                            className={styles.deleteButton} 
                                                            onClick={(e) => {
                                                                e.stopPropagation(); // Impede que o clique selecione a conversa
                                                                openDeleteModal(conversa);
                                                            }}
                                                            aria-label="Deletar conversa"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </>
                            ) : (
                                <div className={styles.noConversas}>
                                    Inicie uma conversa
                                </div>
                            )}
                        </>
                    )}
                </>
            )}

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={closeDeleteModal}
                onConfirm={handleConfirmDelete}
                title="Remover Conversa"
                message={`Tem certeza de que deseja remover a conversa com ${conversaToDelete?.nome}? A conversa será removida apenas para você - ${conversaToDelete?.nome} ainda poderá ver as mensagens.`}
            />
        </div>
    );
};

export default ListaConversas; 