import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Brain, Copy, Trash2, History, X, Plus, BarChart3, Zap, TrendingDown, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { useAuth } from '../context/AuthContext';
import { aiContextService, AIContext } from '../services/aiContextService';
import { supabase } from '../lib/supabase';
import { aiService } from '../services/aiService';
import { aiPersonaService } from '../services/aiPersonaService';
import { AIPersonaConfig } from '../types/aiPersona';
import { chatService, ChatConversation } from '../services/chatService';
import { tokenService, TokenUsage } from '../services/tokenService';
import { conversationMemory } from '../services/conversationMemory';
import { useExchangeRate } from '../hooks/useExchangeRate';
import PersonaManager from '../components/PersonaManager';
import { costOptimizedChatService, CostOptimizedResponse } from '../services/costOptimizedChatService';

import TokenUsagePanel from '../components/TokenUsagePanel';
import { PromptInputBox } from '@/components/ui/ai-prompt-box';
import EnvDebug from '../components/EnvDebug';

import WebSearchIndicator from '../components/WebSearchIndicator';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  model?: string;
  persona?: string;
  webSearch?: {
    used: boolean;
    sources?: string[];
    error?: string;
  };

}

const Chat: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [, setAiContext] = useState<AIContext | null>(null);
  const [contextLoading, setContextLoading] = useState(true);
  const [activePersona, setActivePersona] = useState<AIPersonaConfig | null>(null);
  const [showPersonaConfig, setShowPersonaConfig] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [chatHistories, setChatHistories] = useState<ChatConversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [professorId, setProfessorId] = useState<number | null>(null);
  const [migrationChecked, setMigrationChecked] = useState(false);
  const [showTokenUsage, setShowTokenUsage] = useState(false);
  const [sessionUsage, setSessionUsage] = useState<TokenUsage[]>([]);
  const [optimizationMode, setOptimizationMode] = useState<'economy' | 'balanced' | 'quality'>('balanced');
  const [optimizationEnabled, setOptimizationEnabled] = useState(true);
  const [lastOptimization, setLastOptimization] = useState<any>(null);
  const [streamingEnabled, setStreamingEnabled] = useState(true);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [isSearchingWeb, setIsSearchingWeb] = useState(false);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const { exchangeRate } = useExchangeRate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadAIContext();
    loadOptimizationSettings();
    
    // Limpeza automática de resumos antigos (silenciosa)
    conversationMemory.cleanOldSummaries(90); // Manter últimos 90 dias
    
    // Log das estatísticas de memória (apenas no console)
    const memoryStats = conversationMemory.getMemoryStats();
    if (memoryStats.totalConversations > 0) {
      console.log(`🧠 Sistema de Memória ativo: ${memoryStats.totalConversations} conversas, ${memoryStats.totalTopics} tópicos únicos`);
    }
  }, [user]);

  // Carregar personas quando professorId estiver disponível
  useEffect(() => {
    if (professorId) {
      loadPersonas();
    }
  }, [professorId]);

  useEffect(() => {
    if (professorId && !migrationChecked) {
      checkAndMigrateLocalStorage();
      setMigrationChecked(true);
    }
  }, [professorId, migrationChecked]);

  useEffect(() => {
    if (professorId) {
      loadChatHistories();
      loadSessionTokens();
    }
  }, [professorId]);

  const loadSessionTokens = () => {
    if (!professorId) return;
    
    // Carregar tokens da sessão atual
    const allTokens = tokenService.getUsageData(professorId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Filtrar tokens de hoje
    const todayTokens = allTokens.filter(token => {
      const tokenDate = new Date(token.timestamp);
      tokenDate.setHours(0, 0, 0, 0);
      return tokenDate.getTime() === today.getTime();
    });
    
    setSessionUsage(todayTokens);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  // Foco automático inicial na caixa de texto
  useEffect(() => {
    const timer = setTimeout(() => {
      if (messages.length === 0 && inputRef.current) {
        inputRef.current.focus();
      } else if (messages.length > 0 && chatInputRef.current) {
        chatInputRef.current.focus();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Foco automático na caixa de input quando a página carrega ou quando muda de estado
  useEffect(() => {
    const focusInput = () => {
      if (messages.length === 0 && inputRef.current) {
        inputRef.current.focus();
      } else if (messages.length > 0 && chatInputRef.current) {
        chatInputRef.current.focus();
      }
    };

    // Foco imediato
    focusInput();

    // Foco com delay para garantir que o DOM foi renderizado
    const timeoutId = setTimeout(focusInput, 100);

    return () => clearTimeout(timeoutId);
  }, [messages.length]);

  // Foco automático quando retorna para a página (visibilitychange)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Página ficou visível novamente
        setTimeout(() => {
          if (messages.length === 0 && inputRef.current) {
            inputRef.current.focus();
          } else if (messages.length > 0 && chatInputRef.current) {
            chatInputRef.current.focus();
          }
        }, 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [messages.length]);

  // Função para capitalizar a primeira letra
  const capitalizeFirstLetter = (text: string) => {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  // Handler para input com capitalização automática
  const applyInputValue = (value: string) => {
    if (value.length === 1 || (value.length > 1 && /[.\n]\s*$/.test(value.slice(0, -1)))) {
      setInputValue(capitalizeFirstLetter(value));
    } else {
      setInputValue(value);
    }
  };

  // Salvar estado da conversa no localStorage
  useEffect(() => {
    if (messages.length > 0 && professorId && currentConversationId) {
      const conversationState = {
        messages,
        currentConversationId,
        inputValue,
        timestamp: Date.now()
      };
      localStorage.setItem(`chat_state_${professorId}`, JSON.stringify(conversationState));
    }
  }, [messages, professorId, currentConversationId, inputValue]);

  // Restaurar estado da conversa ao carregar
  useEffect(() => {
    if (professorId && messages.length === 0) {
      const savedState = localStorage.getItem(`chat_state_${professorId}`);
      if (savedState) {
        try {
          const state = JSON.parse(savedState);
          // Verificar se o estado não é muito antigo (máximo 24 horas)
          const isRecent = Date.now() - state.timestamp < 24 * 60 * 60 * 1000;
          
          if (isRecent && state.messages && state.currentConversationId) {
            // Converter timestamps de string para Date
            const messagesWithDates = state.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }));
            
            setMessages(messagesWithDates);
            setCurrentConversationId(state.currentConversationId);
            if (state.inputValue) {
              setInputValue(state.inputValue);
            }
            console.log('🔄 Estado da conversa restaurado');
          }
        } catch (error) {
          console.error('❌ Erro ao restaurar estado da conversa:', error);
          localStorage.removeItem(`chat_state_${professorId}`);
        }
      }
    }
  }, [professorId]);

  const loadAIContext = async () => {
    if (!user?.id) return;
    
    try {
      setContextLoading(true);
      // Buscar o professor real no banco de dados usando o user_id
      const { data: professorReal, error: professorError } = await supabase
        .from('professores')
        .select('id, nome, email, telefone, user_id, escola_id')
        .eq('user_id', user.id)
        .single();

      if (professorError || !professorReal) {
        console.error('❌ Professor não encontrado:', professorError);
        throw new Error('Professor não encontrado no banco de dados');
      }

      const context = await aiContextService.buildCompleteContext(professorReal);
      setAiContext(context);
      
      // Definir professor_id do banco de dados
      setProfessorId(professorReal.id);
    } catch (error) {
      console.error('❌ Erro ao carregar contexto:', error);
    } finally {
      setContextLoading(false);
    }
  };

  const loadPersonas = async () => {
    if (!professorId) return;
    
    console.log('🔄 Carregando personas para professor:', professorId);
    
    try {
      const active = await aiPersonaService.getActivePersona(professorId.toString());
      console.log('✅ Persona carregada:', active ? active.name : 'Nenhuma');
      setActivePersona(active);
    } catch (error) {
      console.error('❌ Erro ao carregar personas:', error);
    }
  };

  const loadOptimizationSettings = () => {
    const savedMode = localStorage.getItem('optimization_mode') as 'economy' | 'balanced' | 'quality';
    const savedEnabled = localStorage.getItem('optimization_enabled') !== 'false';
    
    if (savedMode && ['economy', 'balanced', 'quality'].includes(savedMode)) {
      setOptimizationMode(savedMode);
    }
    setOptimizationEnabled(savedEnabled);
  };

  const checkAndMigrateLocalStorage = async () => {
    if (!professorId || !user?.id) return;

    try {
      // Verificar se há dados no localStorage para migrar
      if (chatService.hasLocalStorageData(user.id)) {
        console.log('📝 Dados encontrados no localStorage, iniciando migração...');
        await chatService.migrateFromLocalStorage(professorId, user.id);
        console.log('✅ Migração concluída');
        
        // Recarregar histórico após migração
        await loadChatHistories();
      }
    } catch (error) {
      console.error('❌ Erro na migração:', error);
    }
  };

  const loadChatHistories = async () => {
    if (!professorId) return;
    
    try {
      const conversations = await chatService.getConversations(professorId);
      setChatHistories(conversations);
    } catch (error) {
      console.error('❌ Erro ao carregar histórico:', error);
    }
  };

  const loadConversation = async (conversation: ChatConversation) => {
    try {
      const fullConversation = await chatService.getConversationWithMessages(conversation.id);
      if (fullConversation && fullConversation.messages) {
        // Converter mensagens do banco para o formato do componente
        const convertedMessages: Message[] = fullConversation.messages.map(msg => ({
          id: msg.id,
          text: msg.content,
          sender: msg.sender,
          timestamp: new Date(msg.created_at),
          model: msg.model,
          persona: msg.persona
        }));
        
        setMessages(convertedMessages);
        setCurrentConversationId(conversation.id);
        setShowHistoryPanel(false);
        
        // Limpar estado salvo anterior e salvar novo estado
        if (professorId) {
          localStorage.removeItem(`chat_state_${professorId}`);
          const conversationState = {
            messages: convertedMessages,
            currentConversationId: conversation.id,
            inputValue: '',
            timestamp: Date.now()
          };
          localStorage.setItem(`chat_state_${professorId}`, JSON.stringify(conversationState));
        }
        
        // Focar no input após carregar conversa
        setTimeout(() => {
          if (convertedMessages.length > 0 && chatInputRef.current) {
            chatInputRef.current.focus();
          } else if (convertedMessages.length === 0 && inputRef.current) {
            inputRef.current.focus();
          }
        }, 100);
        
        // Salvar resumo da conversa carregada (silenciosamente)
        if (convertedMessages.length >= 2) {
          const memoryMessages = convertedMessages.map(msg => ({
            content: msg.text,
            sender: msg.sender
          }));
          
          await conversationMemory.saveConversationSummary(
            conversation.id,
            conversation.title,
            memoryMessages
          );
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar conversa:', error);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      await chatService.deleteConversation(conversationId);
      
      // Atualizar lista local
      setChatHistories(prev => prev.filter(h => h.id !== conversationId));
      
      // Se a conversa deletada era a atual, limpar
      if (currentConversationId === conversationId) {
        setMessages([]);
        setCurrentConversationId(null);
      }
    } catch (error) {
      console.error('❌ Erro ao deletar conversa:', error);
    }
  };

  const clearAllHistory = async () => {
    if (!professorId) return;
    
    const confirmed = window.confirm(
      '⚠️ Tem certeza que deseja apagar TODO o histórico de conversas?\n\nEsta ação não pode ser desfeita!'
    );
    
    if (!confirmed) return;
    
    try {
      // Deletar todas as conversas do banco
      for (const conversation of chatHistories) {
        await chatService.deleteConversation(conversation.id);
      }
      
      // Limpar estado local
      setChatHistories([]);
      setMessages([]);
      setCurrentConversationId(null);
      
      // Limpar localStorage
      localStorage.removeItem(`chat_state_${professorId}`);
      
      console.log('✅ Todo o histórico foi apagado com sucesso');
      alert('✅ Todo o histórico foi apagado com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro ao limpar histórico:', error);
      alert('❌ Erro ao limpar histórico. Tente novamente.');
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setInputValue('');
    setShowHistoryPanel(false);
    
    // Limpar estado salvo
    if (professorId) {
      localStorage.removeItem(`chat_state_${professorId}`);
    }
    
    // Focar no input após limpar
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (overrideMessage?: string) => {
    const messageText = (overrideMessage ?? inputValue).trim();
    if (!messageText || isLoading || !user?.id || !professorId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setIsThinking(true);

    const searchKeywords = ['pesquise', 'pesquisar', 'not�cias', 'cota��o', 'valor do', 'pre�o de', 'em tempo real', 'qual �', 'quem �', 'o que �'];
    const lowerCaseInput = messageText.toLowerCase();
    const autoEnableWebSearch = searchKeywords.some(keyword => lowerCaseInput.includes(keyword));
    const finalWebSearchEnabled = webSearchEnabled || autoEnableWebSearch;

    if (finalWebSearchEnabled) {
      setIsSearchingWeb(true);
      console.log(`??? Busca web ativada (Autom�tico: ${autoEnableWebSearch}, Manual: ${webSearchEnabled})`);
    }

    try {
      let conversationId = currentConversationId;
      if (!conversationId) {
        const title = messageText.slice(0, 50) + (messageText.length > 50 ? '...' : '');
        const newConversation = await chatService.createConversation({
          professor_id: professorId,
          title
        });
        conversationId = newConversation.id;
        setCurrentConversationId(conversationId);
        await loadChatHistories();
      }

      await chatService.addMessage({
        conversation_id: conversationId,
        sender: 'user',
        content: userMessage.text,
      });

      const conversationHistory = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.text
      }));

      console.log('?? Usando sistema otimizado de custos com professorId:', professorId);
      console.log('?? Otimiza��o habilitada:', optimizationEnabled);

      const streamResponse = await aiService.generateResponseWithContextStream(
        messageText,
        professorId.toString(),
        conversationHistory,
        {
          provider: 'openai',
          enableOptimization: optimizationEnabled,
          optimizationMode: optimizationMode,
          webSearchEnabled: finalWebSearchEnabled
        },
        conversationId
      );

      const assistantMessageId = (Date.now() + 1).toString();
      let assistantText = '';
      if (streamResponse.webSearch?.used && streamResponse.webSearch?.summary) {
        assistantText = streamResponse.webSearch.summary;
      }
      const assistantMessage: Message = {
        id: assistantMessageId,
        text: assistantText,
        sender: 'assistant',
        timestamp: new Date(),
        model: streamResponse.model,
        persona: streamResponse.persona,
        webSearch: {
          used: streamResponse.webSearch?.used || false,
          sources: streamResponse.webSearch?.sources || [],
          error: streamResponse.webSearch?.error
        }
      };

      setMessages(prev => [...prev, assistantMessage]);
      setStreamingMessageId(assistantMessageId);
      setIsThinking(false);
      setIsSearchingWeb(false);

      if (streamResponse.optimization) {
        setLastOptimization(streamResponse.optimization);
      }

      const reader = streamResponse.stream.getReader();
      let fullContent = '';

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            console.log('? Streaming conclu�do no frontend');
            setStreamingMessageId(null);
            setIsThinking(false);
            setIsSearchingWeb(false);
            break;
          }

          fullContent += value;

          setMessages(prev => prev.map(msg =>
            msg.id === assistantMessageId
              ? { ...msg, text: assistantText ? assistantText : fullContent }
              : msg
          ));

          setTimeout(() => scrollToBottom(), 50);
        }

        await chatService.addMessage({
          conversation_id: conversationId,
          sender: 'assistant',
          content: fullContent,
          model: streamResponse.model,
          persona: streamResponse.persona
        });

        setTimeout(() => loadSessionTokens(), 1000);

        setTimeout(() => {
          if (chatInputRef.current) {
            chatInputRef.current.focus();
          }
        }, 500);

      } catch (error) {
        console.error('?? Erro durante streaming:', error);
        setStreamingMessageId(null);
        setIsThinking(false);
        setIsSearchingWeb(false);

        setMessages(prev => prev.map(msg =>
          msg.id === assistantMessageId
            ? { ...msg, text: `Erro durante streaming: ${error instanceof Error ? error.message : 'Erro desconhecido'}` }
            : msg
        ));
      } finally {
        reader.releaseLock();
      }

    } catch (error) {
      console.error('?? Erro ao gerar resposta:', error);
      setIsThinking(false);
      setIsSearchingWeb(false);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `Desculpe, ocorreu um erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        sender: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);

      setTimeout(() => {
        if (chatInputRef.current) {
          chatInputRef.current.focus();
        }
      }, 300);
    } finally {
      setIsLoading(false);
      setIsThinking(false);
      setIsSearchingWeb(false);
    }
  };

  const handlePromptSend = (message: string) => {
    handleSubmit(message);
  };

  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'pt-BR';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log('🎤 Transcrição original:', transcript);
        
        // Adicionar pontuação automática
        try {
          const punctuatedTranscript = await aiService.addPunctuationToTranscript(transcript);
          setInputValue(punctuatedTranscript);
        } catch (error) {
          console.warn('⚠️ Erro na pontuação automática, usando texto original:', error);
          setInputValue(transcript);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Erro no reconhecimento de voz:', event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } else {
      alert('Reconhecimento de voz não suportado neste navegador.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const copyMessage = (text: string, messageId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(messageId);
    setTimeout(() => setCopiedMessageId(null), 2000); // Remove a notificação após 2 segundos
  };

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      return '--:--';
    }
    return dateObj.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      return '--/--/--';
    }
    return dateObj.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
  };

  if (contextLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-600" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-slate-50 overflow-y-scroll">
        <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-8 min-h-[calc(100vh-8rem)] flex flex-col relative">
          {/* Botões no canto superior direito */}
          <div className="absolute top-4 right-4 z-20 flex items-center space-x-2">
          <button
            onClick={startNewConversation}
            className="p-2 bg-white border border-yellow-200 text-black hover:text-yellow-600 hover:bg-yellow-50 hover:border-yellow-400 rounded-xl shadow-sm transition-all duration-200 hover:shadow-md"
            title="Nova conversa"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate('/tokens')}
            className="hidden p-2 bg-white border border-yellow-200 text-black hover:text-yellow-600 hover:bg-yellow-50 hover:border-yellow-400 rounded-xl shadow-sm transition-all duration-200 hover:shadow-md"
            title="Monitoramento detalhado de tokens"
          >
            <Activity className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowHistoryPanel(!showHistoryPanel)}
            className="p-2 bg-white border border-yellow-200 text-black hover:text-yellow-600 hover:bg-yellow-50 hover:border-yellow-400 rounded-xl shadow-sm transition-all duration-200 hover:shadow-md"
            title="Histórico de conversas"
          >
            <History className="w-5 h-5" />
          </button>
        </div>

        {/* Área de Mensagens */}
        {messages.length === 0 ? (
          <div className="h-full flex flex-col justify-start items-center px-4 pt-20">
            <div className="max-w-3xl w-full text-center mx-auto">
              <h1 className="text-5xl md:text-6xl font-normal text-gray-800 mb-3">
                Bem vindo professor!
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-8">
                Como posso te ajudar hoje?
              </p>
              
              {/* Caixa de Input Integrada */}
              <div className="w-full flex justify-center">
                <PromptInputBox
                  value={inputValue}
                  onValueChange={applyInputValue}
                  onSend={handlePromptSend}
                  isLoading={isLoading}
                  placeholder="Envie uma mensagem"
                  onSettingsClick={() => setShowPersonaConfig(!showPersonaConfig)}
                  webSearchEnabled={webSearchEnabled}
                  onWebSearchToggle={() => setWebSearchEnabled(!webSearchEnabled)}
                  isListening={isListening}
                  onStartListening={startListening}
                  onStopListening={stopListening}
                  inputRef={inputRef}
                />
              </div>

              {/* Indicador de Persona Ativa */}
              {activePersona && (
                <div className="mt-3 text-center">
                  <span className="text-xs text-gray-500">
                    Conversando com {activePersona.name}
                  </span>
                </div>
              )}


            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden max-w-3xl w-full mx-auto mt-16">
             {/* Área de mensagens */}
            <div className="flex-1 overflow-y-auto chat-scroll">
               <div className="px-6 py-8 space-y-8">
                 {messages.map((message) => (
                   <div
                     key={message.id}
                     className={`flex items-start gap-4 message-enter message-hover ${
                       message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                     }`}
                   >
                    {/* Avatar - só para IA */}
                    {message.sender === 'assistant' && (
                      <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-blue-600 shadow-lg ring-2 ring-blue-100">
                        <Brain className="w-6 h-6 text-white" />
                      </div>
                    )}

                    {/* Mensagem */}
                    <div className={`flex-1 ${
                      message.sender === 'user' ? 'text-right' : 'text-left'
                    }`}>
                      {/* Nome e timestamp */}
                      <div className={`flex items-center gap-3 mb-3 ${
                        message.sender === 'user' ? 'justify-end' : 'justify-start'
                      }`}>
                        <span className="text-sm font-semibold text-gray-800">
                          {message.sender === 'user' ? 'Você' : (activePersona?.name || 'Assistente')}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>

                      {/* Conteúdo da mensagem */}
                      <div className={`flex items-end gap-2 ${
                          message.sender === 'user' ? 'justify-end' : ''
                        }`}>
                        <div className={`prose max-w-none chat-markdown prose-gray ${
                          message.sender === 'user' ? 'text-right' : ''
                        }`}>
                           {message.sender === 'user' ? (
                             <p className="m-0 whitespace-pre-wrap text-gray-800">{message.text}</p>
                           ) : (
                             <>
                               <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
                                 {message.text && message.text.trim() !== '' ? message.text : 'Nenhuma resposta textual encontrada para esta busca web.'}
                               </ReactMarkdown>
                             </>
                           )}
                         </div>

                         {/* Botão de copiar - inline com o texto */}
                         <div className="relative flex-shrink-0">
                            <button
                              onClick={() => copyMessage(message.text, message.id)}
                              className="p-1.5 rounded-lg bg-yellow-100 text-yellow-700 hover:bg-yellow-200 hover:text-yellow-800 transition-all duration-200 border border-yellow-200"
                              title="Copiar mensagem"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            
                            {/* Notificação de copiado */}
                            {copiedMessageId === message.id && (
                              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded shadow-lg animate-fade-in">
                                Copiado!
                              </div>
                            )}
                          </div>
                      </div>

                      {/* Indicador de Busca Web (apenas para assistente) - Abaixo da resposta */}
                      {message.sender === 'assistant' && message.webSearch && (
                        <WebSearchIndicator webSearch={{...message.webSearch, sources: message.webSearch.sources || []}} />
                      )}
                    </div>
                  </div>
                ))}

                {/* Removidos: Indicador de Busca Web e Animação de Pensando */}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Caixa de Input Fixa na parte inferior */}
            <div className="p-6 bg-white rounded-b-2xl">
              <PromptInputBox
                value={inputValue}
                onValueChange={applyInputValue}
                onSend={handlePromptSend}
                isLoading={isLoading}
                placeholder="Digite sua mensagem..."
                onSettingsClick={() => setShowPersonaConfig(!showPersonaConfig)}
                webSearchEnabled={webSearchEnabled}
                onWebSearchToggle={() => setWebSearchEnabled(!webSearchEnabled)}
                isListening={isListening}
                onStartListening={startListening}
                onStopListening={stopListening}
                inputRef={chatInputRef}
              />
            </div>
          </div>
        )}

      {/* Painel Lateral de Histórico com Animação */}
      <div className={`fixed right-0 top-16 w-80 bg-white shadow-2xl border-l border-gray-200 z-50 transform transition-transform duration-300 ease-in-out ${
        showHistoryPanel ? 'translate-x-0' : 'translate-x-full'
      } flex flex-col h-[calc(100vh-4rem)]`}>
        {/* Header do painel */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-800">
              Histórico ({chatHistories.length})
            </h3>
            <button
              onClick={() => setShowHistoryPanel(false)}
              className="p-2 text-black hover:text-yellow-500 hover:bg-yellow-50 rounded-xl transition-all duration-200"
              title="Fechar"
            >
              <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Linha de botões de ação */}
            {chatHistories.length > 0 && (
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    console.log('🗑️ Botão limpar histórico clicado, conversas:', chatHistories.length);
                    clearAllHistory();
                  }}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                  title="Apagar todo o histórico"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Limpar tudo</span>
                </button>
              </div>
            )}
          </div>

          {/* Lista de históricos */}
          <div className="flex-1 overflow-y-auto">
            {chatHistories.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum histórico ainda</p>
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {chatHistories.map((history) => (
                  <div
                    key={history.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 group ${
                      currentConversationId === history.id
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-gray-50 border-gray-200 hover:bg-yellow-50 hover:border-yellow-200'
                    }`}
                    onClick={() => loadConversation(history)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-800 truncate">
                          {history.title}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(new Date(history.updated_at))} • {history.message_count || 0} mensagens
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(history.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all duration-200"
                        title="Apagar conversa"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

          {/* Token Usage Panel */}
          {professorId && (
            <TokenUsagePanel
              isOpen={showTokenUsage}
              onClose={() => setShowTokenUsage(false)}
              professorId={professorId}
              sessionUsage={sessionUsage}
            />
          )}
          {/* PersonaManager Modal */}
          <PersonaManager
            professorId={professorId?.toString() || ''}
            activePersona={activePersona}
            onPersonaChange={(persona) => {
              setActivePersona(persona);
              loadPersonas();
            }}
            isOpen={showPersonaConfig}
            onClose={() => setShowPersonaConfig(false)}
          />
        </div>
      </div>
    </>
  );
};

export default Chat;
