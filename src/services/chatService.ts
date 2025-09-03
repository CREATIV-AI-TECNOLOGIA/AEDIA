import { supabase } from '../lib/supabase';

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender: 'user' | 'assistant';
  content: string;
  model?: string;
  persona?: string;
  created_at: string;
}

export interface ChatConversation {
  id: string;
  professor_id: number;
  title: string;
  created_at: string;
  updated_at: string;
  messages?: ChatMessage[];
  message_count?: number;
}

export interface CreateConversationData {
  professor_id: number;
  title: string;
}

export interface CreateMessageData {
  conversation_id: string;
  sender: 'user' | 'assistant';
  content: string;
  model?: string;
  persona?: string;
}

class ChatService {
  /**
   * Busca todas as conversas de um professor
   */
  async getConversations(professorId: number): Promise<ChatConversation[]> {
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select(`
          id,
          professor_id,
          title,
          created_at,
          updated_at,
          chat_messages(count)
        `)
        .eq('professor_id', professorId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ Erro ao buscar conversas:', error);
        throw new Error(`Erro ao buscar conversas: ${error.message}`);
      }

      // Transformar os dados para incluir message_count
      const conversations = data?.map(conv => ({
        ...conv,
        message_count: conv.chat_messages?.[0]?.count || 0,
        chat_messages: undefined // Remove o campo auxiliar
      })) || [];

      return conversations;
    } catch (error) {
      console.error('❌ Erro no serviço de chat:', error);
      throw error;
    }
  }

  /**
   * Busca uma conversa específica com suas mensagens
   */
  async getConversationWithMessages(conversationId: string): Promise<ChatConversation | null> {
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select(`
          id,
          professor_id,
          title,
          created_at,
          updated_at,
          chat_messages(
            id,
            conversation_id,
            sender,
            content,
            model,
            persona,
            created_at
          )
        `)
        .eq('id', conversationId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Conversa não encontrada
        }
        console.error('❌ Erro ao buscar conversa:', error);
        throw new Error(`Erro ao buscar conversa: ${error.message}`);
      }

      // Ordenar mensagens por data de criação
      if (data.chat_messages) {
        data.chat_messages.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      }

      return {
        ...data,
        messages: data.chat_messages || []
      };
    } catch (error) {
      console.error('❌ Erro no serviço de chat:', error);
      throw error;
    }
  }

  /**
   * Cria uma nova conversa
   */
  async createConversation(data: CreateConversationData): Promise<ChatConversation> {
    try {
      const { data: conversation, error } = await supabase
        .from('chat_conversations')
        .insert({
          professor_id: data.professor_id,
          title: data.title
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao criar conversa:', error);
        throw new Error(`Erro ao criar conversa: ${error.message}`);
      }

      return conversation;
    } catch (error) {
      console.error('❌ Erro no serviço de chat:', error);
      throw error;
    }
  }

  /**
   * Adiciona uma mensagem a uma conversa
   */
  async addMessage(data: CreateMessageData): Promise<ChatMessage> {
    try {
      const { data: message, error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: data.conversation_id,
          sender: data.sender,
          content: data.content,
          model: data.model,
          persona: data.persona
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao adicionar mensagem:', error);
        throw new Error(`Erro ao adicionar mensagem: ${error.message}`);
      }

      return message;
    } catch (error) {
      console.error('❌ Erro no serviço de chat:', error);
      throw error;
    }
  }

  /**
   * Deleta uma conversa e todas suas mensagens
   */
  async deleteConversation(conversationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_conversations')
        .delete()
        .eq('id', conversationId);

      if (error) {
        console.error('❌ Erro ao deletar conversa:', error);
        throw new Error(`Erro ao deletar conversa: ${error.message}`);
      }
    } catch (error) {
      console.error('❌ Erro no serviço de chat:', error);
      throw error;
    }
  }

  /**
   * Atualiza o título de uma conversa
   */
  async updateConversationTitle(conversationId: string, title: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_conversations')
        .update({ title })
        .eq('id', conversationId);

      if (error) {
        console.error('❌ Erro ao atualizar título da conversa:', error);
        throw new Error(`Erro ao atualizar título: ${error.message}`);
      }
    } catch (error) {
      console.error('❌ Erro no serviço de chat:', error);
      throw error;
    }
  }

  /**
   * Migra dados do localStorage para o banco de dados
   */
  async migrateFromLocalStorage(professorId: number, userId: string): Promise<void> {
    try {
      const localStorageKey = `chat_histories_${userId}`;
      const localData = localStorage.getItem(localStorageKey);
      
      if (!localData) {
        console.log('📝 Nenhum dado no localStorage para migrar');
        return;
      }

      const localHistories = JSON.parse(localData);
      console.log(`📝 Migrando ${localHistories.length} conversas do localStorage...`);

      for (const history of localHistories) {
        try {
          // Criar a conversa
          const conversation = await this.createConversation({
            professor_id: professorId,
            title: history.title
          });

          // Adicionar todas as mensagens
          for (const message of history.messages) {
            await this.addMessage({
              conversation_id: conversation.id,
              sender: message.sender,
              content: message.text,
              model: message.model,
              persona: message.persona
            });
          }

          console.log(`✅ Conversa "${history.title}" migrada com sucesso`);
        } catch (error) {
          console.error(`❌ Erro ao migrar conversa "${history.title}":`, error);
        }
      }

      // Limpar localStorage após migração bem-sucedida
      localStorage.removeItem(localStorageKey);
      console.log('✅ Migração concluída e localStorage limpo');
    } catch (error) {
      console.error('❌ Erro na migração:', error);
      throw error;
    }
  }

  /**
   * Verifica se há dados no localStorage para migrar
   */
  hasLocalStorageData(userId: string): boolean {
    const localStorageKey = `chat_histories_${userId}`;
    const localData = localStorage.getItem(localStorageKey);
    return localData !== null && JSON.parse(localData).length > 0;
  }

  /**
   * Busca mensagens de uma conversa (paginado)
   */
  async getMessages(conversationId: string, limit: number = 50, offset: number = 0): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('❌ Erro ao buscar mensagens:', error);
        throw new Error(`Erro ao buscar mensagens: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('❌ Erro no serviço de chat:', error);
      throw error;
    }
  }

  /**
   * Conta o total de conversas de um professor
   */
  async getConversationCount(professorId: number): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('chat_conversations')
        .select('*', { count: 'exact', head: true })
        .eq('professor_id', professorId);

      if (error) {
        console.error('❌ Erro ao contar conversas:', error);
        throw new Error(`Erro ao contar conversas: ${error.message}`);
      }

      return count || 0;
    } catch (error) {
      console.error('❌ Erro no serviço de chat:', error);
      throw error;
    }
  }
}

export const chatService = new ChatService(); 