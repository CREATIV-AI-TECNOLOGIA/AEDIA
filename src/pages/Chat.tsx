import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Loader2, Settings, Brain, Copy, Trash2, History, X, Plus, BarChart3, Zap, TrendingDown, Activity, Globe } from 'lucide-react';
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
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    
    // Se é o primeiro caractere ou após um ponto/quebra de linha, capitalizar
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

  const handleSubmit = async () => {
    if (!inputValue.trim() || isLoading || !user?.id || !professorId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setIsThinking(true);
    
    // --- LÓGICA DE DETECÇÃO AUTOMÁTICA DE BUSCA WEB ---
    const searchKeywords = ['pesquise', 'pesquisar', 'notícias', 'cotação', 'valor do', 'preço de', 'em tempo real', 'qual é', 'quem é', 'o que é'];
    const lowerCaseInput = inputValue.toLowerCase();
    const autoEnableWebSearch = searchKeywords.some(keyword => lowerCaseInput.includes(keyword));
    const finalWebSearchEnabled = webSearchEnabled || autoEnableWebSearch;
    
    if (finalWebSearchEnabled) {
      setIsSearchingWeb(true);
      console.log(`🌐 Busca web ativada (Automático: ${autoEnableWebSearch}, Manual: ${webSearchEnabled})`);
    }
    // --------------------------------------------------

    try {
      let conversationId = currentConversationId;
      if (!conversationId) {
        const title = inputValue.slice(0, 50) + (inputValue.length > 50 ? '...' : '');
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
      
      console.log('🚀 Usando sistema otimizado de custos com professorId:', professorId);
      console.log('🔄 Otimização habilitada:', optimizationEnabled);
      
      // CHAMADA DIRETA AO aiService, agora com a lógica de busca automática
      const streamResponse = await aiService.generateResponseWithContextStream(
        inputValue,
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

      // Criar mensagem vazia para o assistente que será preenchida via streaming
      const assistantMessageId = (Date.now() + 1).toString();
      let assistantText = '';
      // Se a busca web foi usada e há summary, use o summary do Tavily como resposta principal
      if (streamResponse.webSearch?.used && streamResponse.webSearch?.summary) {
        assistantText = streamResponse.webSearch.summary;
      }
      const assistantMessage: Message = {
        id: assistantMessageId,
        text: assistantText, // já inicia com o summary se houver
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

      // Capturar dados de otimização
      if (streamResponse.optimization) {
        setLastOptimization(streamResponse.optimization);
      }

      // Processar o stream
      const reader = streamResponse.stream.getReader();
      let fullContent = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log('✅ Streaming concluído no frontend');
            setStreamingMessageId(null);
            setIsThinking(false);
            setIsSearchingWeb(false); // Parar indicador de busca web
            break;
          }

          fullContent += value;
          
          // Atualizar a mensagem em tempo real
          setMessages(prev => prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, text: assistantText ? assistantText : fullContent }
              : msg
          ));

          // Scroll automático durante o streaming
          setTimeout(() => scrollToBottom(), 50);
        }

        // Salvar resposta completa da IA no banco
        await chatService.addMessage({
          conversation_id: conversationId,
          sender: 'assistant',
          content: fullContent,
          model: streamResponse.model,
          persona: streamResponse.persona
        });

        // Recarregar tokens da sessão após a resposta
        setTimeout(() => loadSessionTokens(), 1000);

        // Manter foco no input após resposta da IA
        setTimeout(() => {
          if (chatInputRef.current) {
            chatInputRef.current.focus();
          }
        }, 500);

      } catch (error) {
        console.error('❌ Erro durante streaming:', error);
        setStreamingMessageId(null);
        setIsThinking(false);
        setIsSearchingWeb(false); // Parar indicador de busca web
        
        // Atualizar mensagem com erro
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, text: `Erro durante streaming: ${error instanceof Error ? error.message : 'Erro desconhecido'}` }
            : msg
        ));
      } finally {
        reader.releaseLock();
      }

    } catch (error) {
      console.error('❌ Erro ao gerar resposta:', error);
      setIsThinking(false); // Esconder animação em caso de erro geral
      setIsSearchingWeb(false); // Parar indicador de busca web
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `Desculpe, ocorreu um erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        sender: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
      
      // Manter foco no input mesmo em caso de erro
      setTimeout(() => {
        if (chatInputRef.current) {
          chatInputRef.current.focus();
        }
      }, 300);
    } finally {
      setIsLoading(false);
      setIsThinking(false); // Garantir que a animação seja removida no final
      setIsSearchingWeb(false); // Parar indicador de busca web
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
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
      <div className="min-h-screen bg-slate-50">
        <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-8">
        {/* Card único que engloba todo o conteúdo do chat */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 shadow-lg border-2 border-slate-200/70 ring-1 ring-white/50 hover:shadow-xl transition-all duration-300 min-h-[calc(100vh-8rem)] flex flex-col relative">
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
            <div className="max-w-2xl w-full text-center">
              <h1 className="text-4xl font-normal text-gray-800 mb-2">
                Bem vindo professor William!
              </h1>
              <p className="text-lg text-gray-600 mb-6">
                Como posso te ajudar hoje?
              </p>
              
              {/* Caixa de Input Integrada */}
              <div className="relative bg-white rounded-2xl border-2 border-gray-300 hover:border-gray-400 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 w-full shadow-lg">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Envie uma mensagem"
                  disabled={isLoading}
                  className="w-full p-4 pr-20 resize-none border-0 bg-transparent focus:outline-none text-gray-800 placeholder-gray-400 h-[60px]"
                  style={{ scrollbarWidth: 'none' }}
                />
                
                {/* Botões dentro da caixa de texto */}
                <div className="absolute right-2 bottom-2 flex items-center space-x-2">
                  {/* Botão de Configurações */}
                  <button
                    onClick={() => setShowPersonaConfig(!showPersonaConfig)}
                    className="p-2 text-black hover:text-yellow-500 hover:bg-yellow-50 rounded-xl transition-all duration-200"
                    title="Configurações"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  
                  
                  {/* Botão de Voz */}
                  <button
                    onClick={isListening ? stopListening : startListening}
                    className={`p-2 rounded-xl transition-all duration-200 ${
                      isListening
                        ? 'text-red-600 bg-red-100 hover:bg-red-200'
                        : 'text-black hover:text-yellow-500 hover:bg-yellow-50'
                    }`}
                    title={isListening ? 'Parar gravação' : 'Gravação de voz'}
                  >
                    {isListening ? (
                      <MicOff className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </button>
                  
                  {/* Botão de Pesquisa Web (Globo) */}
                  <button
                    onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                    className={`p-2 rounded-xl transition-all duration-200 ${
                      webSearchEnabled
                        ? 'text-white bg-blue-600 hover:bg-blue-700'
                        : 'text-black hover:text-yellow-500 hover:bg-yellow-50'
                    }`}
                    title={`Pesquisa na Web: ${webSearchEnabled ? 'Ativada' : 'Desativada'}`}
                  >
                    <Globe className="w-4 h-4" />
                  </button>
                  
                  {/* Botão de Enviar */}
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading || !inputValue.trim()}
                    className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
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
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Área de mensagens */}
            <div className="flex-1 overflow-y-auto chat-scroll bg-white">
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

                {/* Indicador de Busca Web */}
                {isSearchingWeb && !streamingMessageId && (
                  <div className="flex justify-center message-enter">
                    <WebSearchIndicator isSearching={true} />
                  </div>
                )}

                {/* Animação de Pensando */}
                {isThinking && !isSearchingWeb && !streamingMessageId && (
                  <div className="flex items-start gap-4 message-enter">
                    {/* Avatar da IA */}
                    <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-blue-600 shadow-lg ring-2 ring-blue-100">
                      <Brain className="w-6 h-6 text-white" />
                    </div>

                    {/* Mensagem de pensando */}
                    <div className="flex-1 max-w-3xl text-left">
                      {/* Nome */}
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-sm font-semibold text-gray-800">
                          {activePersona?.name || 'Assistente'}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          Digitando...
                        </span>
                      </div>

                      {/* Animação de bolinhas */}
                      <div className="mr-8">
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Caixa de Input Fixa na parte inferior */}
            <div className="bg-white p-6">
              <div>
                <div className="relative bg-white rounded-2xl border-2 border-gray-200 transition-all duration-200 shadow-lg">
                  <textarea
                    ref={chatInputRef}
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Digite sua mensagem..."
                    disabled={isLoading}
                    className="w-full p-5 pr-24 resize-none border-0 bg-transparent focus:outline-none text-gray-800 placeholder-gray-500 min-h-[64px] max-h-32 text-base"
                    style={{ scrollbarWidth: 'none' }}
                  />
                  
                  {/* Botões dentro da caixa de texto */}
                  <div className="absolute right-3 bottom-3 flex items-center space-x-2">
                    {/* Botão X para limpar texto - só aparece quando há texto */}
                    {inputValue.trim().length > 0 && (
                      <button
                        onClick={() => setInputValue('')}
                        className="p-2.5 text-black hover:text-yellow-500 hover:bg-yellow-50 rounded-xl transition-all duration-200"
                        title="Limpar texto"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    
                    {/* Botão de Configurações */}
                    <button
                      onClick={() => setShowPersonaConfig(!showPersonaConfig)}
                      className="p-2.5 text-black hover:text-yellow-500 hover:bg-yellow-50 rounded-xl transition-all duration-200"
                      title="Configurações"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    
                    
                    {/* Botão de Voz */}
                    <button
                      onClick={isListening ? stopListening : startListening}
                      className={`p-2.5 rounded-xl transition-all duration-200 ${
                        isListening
                          ? 'text-red-600 bg-red-100 hover:bg-red-200'
                          : 'text-black hover:text-yellow-500 hover:bg-yellow-50'
                      }`}
                      title={isListening ? 'Parar gravação' : 'Gravação de voz'}
                    >
                      {isListening ? (
                        <MicOff className="w-4 h-4" />
                      ) : (
                        <Mic className="w-4 h-4" />
                      )}
                    </button>
                    
                    {/* Botão de Pesquisa Web (Globo) */}
                    <button
                      onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                      className={`p-2.5 rounded-xl transition-all duration-200 ${
                        webSearchEnabled
                          ? 'text-white bg-blue-600 hover:bg-blue-700'
                          : 'text-black hover:text-yellow-500 hover:bg-yellow-50'
                      }`}
                      title={`Pesquisa na Web: ${webSearchEnabled ? 'Ativada' : 'Desativada'}`}
                    >
                      <Globe className="w-4 h-4" />
                    </button>
                    
                    {/* Botão de Enviar */}
                    <button
                      onClick={handleSubmit}
                      disabled={isLoading || !inputValue.trim()}
                      className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Painel Lateral de Histórico */}
      {showHistoryPanel && (
        <div className="w-80 card-standard border-l border-gray-200 flex flex-col ml-4">
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
      )}

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