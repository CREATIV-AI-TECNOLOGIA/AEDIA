import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMensagens, enviarMensagem, assinarMudancasMensagens, marcarMensagensComoLidas, getParticipantDetails, Mensagem, ChatUser } from '../../services/chatInternoService';
import Avatar from '../ui/Avatar';
import { Send, Check, CheckCheck, Clock, AlertCircle, Loader, Smile } from 'lucide-react';
import { RealtimePostgresChangesPayload, RealtimePresenceState } from '@supabase/supabase-js';
import { capitalizeSentences } from '../../utils/textUtils';
import { useNotifications } from '../../hooks/useNotifications';
import './JanelaConversaModern.css';

interface JanelaConversaProps {
    conversaId: string | null;
    onlineUsers: RealtimePresenceState;
    onClose?: () => void;
}

// Constantes de segurança e validação
const MESSAGE_LIMITS = {
    MIN_LENGTH: 1,
    MAX_LENGTH: 1000,
    MAX_LINES: 10
};

const RATE_LIMIT = {
    MAX_MESSAGES: 10,
    TIME_WINDOW: 60000 // 1 minuto
};

// Armazenar histórico de mensagens para rate limiting
const messageHistory = new Map<string, number[]>();

// Lista de emojis organizados por categoria
const EMOJI_CATEGORIES = {
    'Rostos': ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐'],
    'Gestos': ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌', '🤲', '🤝', '🙏', '✍️', '💪', '🦵', '🦶'],
    'Corações': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
    'Objetos': ['📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '⏰', '🕰️', '⏱️', '⏲️', '⏰', '📡'],
    'Natureza': ['🌍', '🌎', '🌏', '🌐', '🗺️', '🗾', '🧭', '🏔️', '⛰️', '🌋', '🗻', '🏕️', '🏖️', '🏜️', '🏝️', '🏞️', '🏟️', '🏛️', '🏗️', '🧱', '🏘️', '🏚️', '🏠', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦', '🏨', '🏩', '🏪', '🏫', '🏬', '🏭', '🏯', '🏰', '🗼', '🗽', '⛪', '🕌', '🛕', '🕍', '⛩️', '🕋'],
    'Comida': ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🌽', '🥕', '🧄', '🧅', '🥔', '🍠', '🥐', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍟', '🍕']
};

const getSeparatorLabel = (dateStr: string) => {
    try {
        const date = new Date(dateStr);
        
        // Verificar se a data é válida
        if (isNaN(date.getTime())) {
            console.warn('Data inválida recebida para separador:', dateStr);
            return 'Data inválida';
        }
        
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Hoje';
        }
        if (date.toDateString() === yesterday.toDateString()) {
            return 'Ontem';
        }
        return date.toLocaleDateString('pt-BR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    } catch (error) {
        console.error('Erro ao processar data do separador:', dateStr, error);
        return 'Data inválida';
    }
};

// Função de sanitização básica
const sanitizeMessage = (content: string): string => {
    return content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
        .replace(/<[^>]*>/g, '') // Remove tags HTML
        .trim();
};

// Validação de mensagem
const validateMessage = (content: string): { isValid: boolean; error?: string } => {
    const sanitized = sanitizeMessage(content);
    
    if (sanitized.length < MESSAGE_LIMITS.MIN_LENGTH) {
        return { isValid: false, error: 'Mensagem muito curta' };
    }
    
    if (sanitized.length > MESSAGE_LIMITS.MAX_LENGTH) {
        return { isValid: false, error: `Mensagem muito longa (máximo ${MESSAGE_LIMITS.MAX_LENGTH} caracteres)` };
    }
    
    if (sanitized.split('\n').length > MESSAGE_LIMITS.MAX_LINES) {
        return { isValid: false, error: `Muitas linhas (máximo ${MESSAGE_LIMITS.MAX_LINES})` };
    }
    
    return { isValid: true };
};

// Rate limiting
const checkRateLimit = (userId: string): boolean => {
    const now = Date.now();
    const userHistory = messageHistory.get(userId) || [];
    
    // Remove mensagens antigas (fora da janela de tempo)
    const recentMessages = userHistory.filter(timestamp => now - timestamp < RATE_LIMIT.TIME_WINDOW);
    
    if (recentMessages.length >= RATE_LIMIT.MAX_MESSAGES) {
        return false; // Rate limit atingido
    }
    
    // Atualiza o histórico
    recentMessages.push(now);
    messageHistory.set(userId, recentMessages);
    
    return true;
};

const JanelaConversa: React.FC<JanelaConversaProps> = React.memo(({ conversaId, onlineUsers, onClose }) => {
    const { user, professorData } = useAuth();
    const [mensagens, setMensagens] = useState<Mensagem[]>([]);
    const [novaMensagem, setNovaMensagem] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [otherParticipant, setOtherParticipant] = useState<ChatUser | null>(null);
    const [isTyping, setIsTyping] = useState(false);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [selectedEmojiCategory, setSelectedEmojiCategory] = useState('Rostos');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
    const [hasNewMessages, setHasNewMessages] = useState(false);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const previousMessageCountRef = useRef(0);
    
    // Hook para gerenciar notificações
    const { markConversationAsRead } = useNotifications(user?.id);

    const scrollToBottom = (behavior: 'smooth' | 'instant' = 'smooth') => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ 
                behavior,
                block: 'end',
            });
        }
    };

    const checkIfUserIsAtBottom = () => {
        if (!messagesContainerRef.current) return true;
        
        const container = messagesContainerRef.current;
        const threshold = 100; // Tolerância em pixels
        return container.scrollHeight - container.scrollTop - container.clientHeight <= threshold;
    };

    useEffect(() => {
        if (!conversaId || !user) return;

        // Limpa o estado ao trocar de conversa para evitar "flash" de conteúdo antigo
        setMensagens([]);
        setOtherParticipant(null);
        setError(null);
        previousMessageCountRef.current = 0;

        const fetchInitialData = async () => {
            setIsInitialLoading(true);
            setShouldAutoScroll(true);
            try {
                const [msgs, participantData] = await Promise.all([
                    getMensagens(conversaId),
                    getParticipantDetails(conversaId, user.id)
                ]);
                
                setMensagens(msgs || []);

                const participant = Array.isArray(participantData) ? participantData[0] : participantData;
                setOtherParticipant(participant);
                
                await marcarMensagensComoLidas(conversaId, user.id);
                markConversationAsRead(conversaId);
            } catch (e) {
                console.error("Erro ao carregar a conversa:", e);
                setError("Erro ao carregar a conversa.");
            } finally {
                setIsInitialLoading(false);
            }
        };

        fetchInitialData();
        
        const subscription = assinarMudancasMensagens(conversaId, async () => {
            const wasAtBottom = checkIfUserIsAtBottom();
            setShouldAutoScroll(wasAtBottom);
            
            const data = await getMensagens(conversaId);
            setMensagens(data || []);
            
            if (document.visibilityState === 'visible') {
                await marcarMensagensComoLidas(conversaId, user.id);
                markConversationAsRead(conversaId);
            }
        });

        const handleVisibilityChange = async () => {
            if (document.visibilityState === 'visible' && conversaId && user) {
                await marcarMensagensComoLidas(conversaId, user.id);
                markConversationAsRead(conversaId);
                setTimeout(() => scrollToBottom('smooth'), 200);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            subscription();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [conversaId, user, markConversationAsRead]);

    // Efeito principal de scroll, usando useLayoutEffect para sincronia com o DOM
    useLayoutEffect(() => {
        if (mensagens.length === 0) return;

        // Condição para o scroll inicial: acontece quando o ref de contagem ainda é 0
        const isInitialScroll = previousMessageCountRef.current === 0;

        if (isInitialScroll) {
            // Rola para o final instantaneamente após um pequeno delay para garantir a renderização
            setTimeout(() => {
                scrollToBottom('instant');
            }, 100); 
        } else {
            const currentMessageCount = mensagens.length;
            const previousMessageCount = previousMessageCountRef.current;

            if (currentMessageCount > previousMessageCount) {
                const hasMyMessage = mensagens[mensagens.length - 1].remetente_id === user?.id;
                
                if (hasMyMessage || shouldAutoScroll) {
                    setTimeout(() => scrollToBottom('smooth'), 50);
                    setHasNewMessages(false);
                } else {
                    setHasNewMessages(true);
                }
            }
        }
        
        // Atualiza a contagem para a próxima renderização
        previousMessageCountRef.current = mensagens.length;
    }, [mensagens, shouldAutoScroll, user?.id]);

    // Detectar quando o usuário faz scroll manual
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const isAtBottom = checkIfUserIsAtBottom();
            setShouldAutoScroll(isAtBottom);
            if (isAtBottom) {
                setHasNewMessages(false);
            }
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    // Efeito para marcar notificações como lidas quando há mudanças nas mensagens
    useEffect(() => {
        if (conversaId && user && mensagens.length > 0) {
            markConversationAsRead(conversaId);
        }
    }, [mensagens, conversaId, user, markConversationAsRead]);

    // Validação em tempo real
    useEffect(() => {
        if (novaMensagem) {
            const validation = validateMessage(novaMensagem);
            setValidationError(validation.isValid ? null : validation.error || null);
        } else {
            setValidationError(null);
        }
    }, [novaMensagem]);

    // Debug do avatar no cabeçalho (log detalhado)
    useEffect(() => {
        if (otherParticipant) {
            console.log('🔍 DEBUG Avatar Cabeçalho:', JSON.stringify(otherParticipant, null, 2));
        }
    }, [otherParticipant]);

    // Fechar o seletor de emoji quando clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
        };

        if (showEmojiPicker) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showEmojiPicker]);

    const handleEnviarMensagem = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        // Validações de segurança
        if (!user || !conversaId) {
            console.log('📝 Envio cancelado: usuário ou conversa não disponível');
            return;
        }

        const sanitizedContent = sanitizeMessage(novaMensagem);
        const validation = validateMessage(sanitizedContent);
        
        if (!validation.isValid) {
            setValidationError(validation.error || 'Mensagem inválida');
            return;
        }

        // Rate limiting
        if (!checkRateLimit(user.id)) {
            setValidationError('Muitas mensagens enviadas. Aguarde um momento.');
            return;
        }

        const tempId = `temp_${Date.now()}`;
        
        console.log('📤 Iniciando envio de mensagem:', {
            conversaId,
            userId: user.id,
            contentLength: sanitizedContent.length
        });
        
        const optimisticMessage: Mensagem = {
            id: tempId,
            conversa_id: conversaId,
            remetente_id: user.id,
            conteudo: sanitizedContent,
            created_at: new Date().toISOString(),
            visualizado_em: null,
            status: 'enviando',
        };

        setMensagens(prev => [...prev, optimisticMessage]);
        setNovaMensagem('');
        setValidationError(null);
        setSendingMessage(true);

        try {
            console.log('🔄 Chamando enviarMensagem...');
            const mensagemEnviada = await enviarMensagem(conversaId, sanitizedContent);
            console.log('✅ Mensagem enviada com sucesso:', mensagemEnviada);
            
            setMensagens(prev => prev.map(m =>
                m.id === tempId ? { ...mensagemEnviada, status: 'enviado' } : m
            ));
        } catch (error) {
            console.error("❌ Erro ao enviar mensagem:", error);
            setMensagens(prev => prev.map(m =>
                m.id === tempId ? { ...optimisticMessage, status: 'falhou' } : m
            ));
            setValidationError('Erro ao enviar mensagem. Tente novamente.');
        } finally {
            setSendingMessage(false);
        }
    };

    // Função para inserir emoji no texto
    const insertEmoji = (emoji: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentText = novaMensagem;
        
        const newText = currentText.substring(0, start) + emoji + currentText.substring(end);
        setNovaMensagem(newText);
        
        // Manter o foco no textarea e posicionar o cursor após o emoji
        setTimeout(() => {
            textarea.focus();
            const newCursorPosition = start + emoji.length;
            textarea.setSelectionRange(newCursorPosition, newCursorPosition);
        }, 0);
    };

    if (!otherParticipant) {
         return (
            <div className="flex-1 flex items-center justify-center">
                <div className="flex items-center space-x-2">
                    <Loader className="w-5 h-5 animate-spin text-indigo-600" />
                    <p>Carregando conversa...</p>
                </div>
            </div>
         );
    }

    const isParticipantOnline = Object.keys(onlineUsers).includes(otherParticipant.user_id);
    const charactersLeft = MESSAGE_LIMITS.MAX_LENGTH - novaMensagem.length;
    const isNearLimit = charactersLeft < 100;

    const messagesWithSeparators = mensagens.reduce<(Mensagem | { type: 'date', date: string, id: string })[]>((acc, msg, index) => {
        try {
            const msgDate = new Date(msg.created_at);
            const prevMsg = index > 0 ? mensagens[index - 1] : null;
            const prevMsgDate = prevMsg ? new Date(prevMsg.created_at) : null;

            // Verificar se as datas são válidas
            if (isNaN(msgDate.getTime())) {
                console.warn('Data inválida na mensagem:', msg.created_at);
                acc.push(msg);
                return acc;
            }

            // Comparar apenas as datas (ano, mês, dia) ignorando horário
            const msgDateString = msgDate.toISOString().split('T')[0];
            const prevMsgDateString = prevMsgDate && !isNaN(prevMsgDate.getTime()) 
                ? prevMsgDate.toISOString().split('T')[0] 
                : null;

            if (msgDateString !== prevMsgDateString) {
                acc.push({ type: 'date', date: msg.created_at, id: `date-${msgDateString}` });
            }
            acc.push(msg);
            return acc;
        } catch (error) {
            console.error('Erro ao processar data da mensagem:', msg.created_at, error);
            acc.push(msg);
            return acc;
        }
    }, []);

    const renderMessage = (item: Mensagem | { type: 'date', date: string, id: string }, index: number) => {
        if ('type' in item && item.type === 'date') {
            return (
                <div key={item.id} className="text-center my-4">
                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">{getSeparatorLabel(item.date)}</span>
                </div>
            );
        }

        const msg = item as Mensagem;
        const isRemetente = msg.remetente_id === user?.id;
        
        // Log apenas quando necessário (em desenvolvimento)
        if (process.env.NODE_ENV === 'development' && Math.random() < 0.1) {
            console.log('📝 Mensagem renderizada (sample):', {
                isRemetente,
                msgId: msg.id,
                createdAt: msg.created_at
            });
        }

        const renderStatus = () => {
            if (!isRemetente) return null;

            if (msg.status === 'falhou') {
                return <AlertCircle className="w-4 h-4 text-red-500 ml-1" />;
            }
            if (msg.status === 'enviando') {
                return <Loader className="w-4 h-4 text-gray-400 ml-1 animate-spin" />;
            }
            if (msg.visualizado_em) {
                return <CheckCheck className="w-4 h-4 text-blue-500 ml-1" />;
            }
            // Se foi enviado mas não visualizado
            return <Check className="w-4 h-4 text-gray-400 ml-1" />;
        };

        // Função para formatar data de forma segura
        const formatMessageTime = (dateString: string) => {
            try {
                const date = new Date(dateString);
                if (isNaN(date.getTime())) {
                    console.warn('Data inválida recebida:', dateString);
                    return 'Agora';
                }
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } catch (error) {
                console.warn('Erro ao formatar data:', dateString, error);
                return 'Agora';
            }
        };

        return (
            <div
                key={`message-${msg.id}-${index}`}
                className={`flex items-end ${isRemetente ? 'justify-end' : 'justify-start'} mb-2 animate-fadeIn`}
                style={{ marginBottom: 6 }}
            >
                <div
                    className={`chat-message-bubble ${isRemetente ? 'sent' : 'received'} ${
                        msg.status === 'falhou' ? 'border-red-200 bg-red-50' : ''
                    }`}
                >
                    <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>{msg.conteudo}</p>
                    <div className="chat-message-time">
                        {formatMessageTime(msg.created_at)}
                        {renderStatus()}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="chat-modern-bg">
            <header className="chat-modern-header">
                {otherParticipant && (
                    <>
                        <div className="chat-header-avatar">
                            <Avatar 
                                src={otherParticipant.avatar_url || (otherParticipant as any).foto || (otherParticipant as any).avatar || ''} 
                                alt={otherParticipant.nome} 
                                name={otherParticipant.nome} 
                                size="md" 
                            />
                            {isParticipantOnline && (
                                <div className="online-indicator-dot"></div>
                            )}
                        </div>
                        <div className="chat-header-info">
                            <span className="chat-header-nome">{otherParticipant.nome}</span>
                            <div className="flex items-center space-x-2">
                                <span className="chat-header-role-badge">
                                    {otherParticipant.role === 'diretora' ? 'Diretor' : 
                                     otherParticipant.role === 'professor' ? 'Professor' : 
                                     otherParticipant.role || 'Usuário'}
                                </span>
                                {isParticipantOnline && (
                                    <span className="text-xs text-white opacity-80">Online</span>
                                )}
                            </div>
                        </div>
                    </>
                )}
                {onClose && (
                    <button className="chat-header-close" onClick={onClose} aria-label="Fechar conversa">×</button>
                )}
            </header>
            
            {/* Indicador de desenvolvimento */}
            {otherParticipant?.user_id?.startsWith('mock-') && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mx-4 mt-2 rounded">
                    <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                        <p className="text-sm text-yellow-800">
                            <strong>Modo Desenvolvimento:</strong> Esta é uma conversa de teste. As mensagens são salvas localmente até que o banco de dados seja configurado.
                        </p>
                    </div>
                </div>
            )}
            <div className="chat-messages-area">
                {error && <div className="text-red-500 text-center">{error}</div>}
                
                {isInitialLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="flex items-center space-x-2">
                            <Loader className="w-5 h-5 animate-spin text-indigo-600" />
                            <p>Carregando mensagens...</p>
                        </div>
                    </div>
                ) : mensagens.length === 0 && !error ? (
                     <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <p className="text-gray-500 mb-2">Nenhuma mensagem ainda</p>
                            <p className="text-sm text-gray-400">Envie a primeira mensagem para iniciar a conversa!</p>
                        </div>
                    </div>
                ) : (
                    messagesWithSeparators.map((item, index) => renderMessage(item, index))
                )}
                <div ref={messagesEndRef} />
            </div>
            
            <div className="chat-input-container">
                {/* Seletor de Emojis */}
                {showEmojiPicker && (
                    <div ref={emojiPickerRef} className="emoji-picker">
                        <div className="emoji-categories">
                            {Object.keys(EMOJI_CATEGORIES).map((category) => (
                                <button
                                    key={category}
                                    className={`emoji-category-button ${selectedEmojiCategory === category ? 'active' : ''}`}
                                    onClick={() => setSelectedEmojiCategory(category)}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>
                        <div className="emoji-grid">
                            {EMOJI_CATEGORIES[selectedEmojiCategory as keyof typeof EMOJI_CATEGORIES].map((emoji, index) => (
                                <button
                                    key={`${emoji}-${index}`}
                                    className="emoji-button"
                                    onClick={() => {
                                        insertEmoji(emoji);
                                        setShowEmojiPicker(false);
                                    }}
                                    title={emoji}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <form onSubmit={handleEnviarMensagem} className="chat-input-form">
                    {/* Botão de Emoji */}
                    <button 
                        type="button" 
                        className={`chat-action-button ${showEmojiPicker ? 'active' : ''}`}
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        title="Adicionar emoji"
                    >
                        <Smile className="w-5 h-5" />
                    </button>
                    {/* Botão de Anexo */}
                    <button type="button" className="chat-action-button" title="Anexar arquivo">
                        <i className="fa-solid fa-paperclip"></i>
                    </button>
                    
                    <textarea
                        ref={textareaRef}
                        rows={1}
                        value={novaMensagem}
                        onChange={(e) => setNovaMensagem(capitalizeSentences(e.target.value))}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleEnviarMensagem();
                            }
                        }}
                        placeholder="Digite uma mensagem..."
                        className="chat-input"
                        disabled={sendingMessage}
                        maxLength={MESSAGE_LIMITS.MAX_LENGTH}
                    />

                    <button 
                        type="submit" 
                        className="chat-send-button" 
                        disabled={!novaMensagem.trim() || !!validationError || sendingMessage}
                        title={sendingMessage ? 'Enviando...' : 'Enviar mensagem'}
                    >
                        {sendingMessage ? (
                            <Loader className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
});

export default JanelaConversa; 