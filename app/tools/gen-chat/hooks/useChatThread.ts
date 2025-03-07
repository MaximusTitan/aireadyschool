import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Message, CreateMessage } from 'ai';
import { ChatMessage, ToolCall, ToolState } from '@/types/chat';

interface ThreadData {
  thread: {
    id: string;
    title: string;
    created_at: string;
  };
  messages: Array<{
    id: string;
    role: string;
    content: string;
    created_at: string;
    toolCalls: ToolCall[];
  }>;
}

export function useChatThread(initialThreadId?: string) {
  const supabase = createClient();
  const [currentThreadId, setCurrentThreadId] = useState<string | undefined>(initialThreadId);
  const [currentMessages, setCurrentMessages] = useState<ChatMessage[]>([]);
  const [title, setTitle] = useState<string>('New Chat');
  const [threads, setThreads] = useState<Array<{id: string; title: string; created_at: string}>>([]);
  const [isOwner, setIsOwner] = useState<boolean>(true); // Add this state variable

  const clearMessages = useCallback(() => {
    setCurrentMessages([]);
  }, []);

  const createThread = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('chat_threads')
        .insert([{
          title: 'New Chat',
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      // Set the thread ID first
      setCurrentThreadId(data.id);
      
      // Wait for state to update
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Update other states
      setTitle('New Chat');
      setCurrentMessages([]);
      await loadThreads();
      
      return data.id;
    } catch (error) {
      console.error('Failed to create thread:', error);
      throw error;
    }
  };

  const saveMessage = async (message: ChatMessage, threadId?: string) => {
    const activeThreadId = threadId || currentThreadId;
    
    if (!activeThreadId) {
      throw new Error('No active thread');
    }

    try {
      // Verify thread exists first
      const { data: threadExists } = await supabase
        .from('chat_threads')
        .select('id')
        .eq('id', activeThreadId)
        .single();

      if (!threadExists) {
        throw new Error('Thread no longer exists');
      }

      // Then proceed with message save
      // First, insert the message
      const { data: messageData, error: messageError } = await supabase
        .from('chat_messages')
        .insert([{
          thread_id: activeThreadId,
          role: message.role,
          content: message.content
        }])
        .select()
        .single();

      if (messageError) throw messageError;

      // Then, if there are tool calls, insert them
      if (message.toolCalls?.length) {
        const toolOutputs = message.toolCalls.map(tool => ({
          message_id: messageData.id,
          tool_name: tool.tool,
          tool_call_id: tool.id,
          parameters: tool.parameters,
          result: tool.result || null,
          state: (tool.state || 'pending') as ToolState
        }));

        const { error: toolError } = await supabase
          .from('tool_outputs')
          .insert(toolOutputs);

        if (toolError) {
          console.error('Failed to save tool outputs:', toolError);
          throw toolError;
        }
      }

      return messageData;
    } catch (error: any) {
      console.error('Failed to save message:', error.message || error);
      // Rethrow with more specific error
      if (error.message?.includes('foreign key constraint')) {
        throw new Error('Thread no longer exists');
      }
      throw error;
    }
  };

  const updateTitle = async (newTitle: string) => {
    if (!currentThreadId) return;

    const { error } = await supabase
      .from('chat_threads')
      .update({ title: newTitle })
      .eq('id', currentThreadId);

    if (error) throw error;
    setTitle(newTitle);
    await loadThreads(); // Refresh thread list
  };

  const loadThread = async (threadId: string) => {
    if (!threadId) return null;

    try {
      // Check if user owns thread
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: threadOwnership } = await supabase
          .from('chat_threads')
          .select('user_id')
          .eq('id', threadId)
          .single();
        
        setIsOwner(threadOwnership?.user_id === user.id);
      } else {
        setIsOwner(false);
      }

      // Load messages with their tool outputs
      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select(`
          id,
          thread_id,
          role,
          content,
          created_at,
          tool_outputs (*)
        `)
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      // Transform to ChatMessage format and ensure id is always present
      const formattedMessages: ChatMessage[] = messagesData.map((msg) => ({
        id: msg.id,
        role: msg.role as Message['role'],
        content: msg.content,
        createdAt: new Date(msg.created_at),
        fromHistory: true, 
        toolCalls: msg.tool_outputs?.length ? msg.tool_outputs.map((tool: any) => ({
          id: tool.tool_call_id,
          tool: tool.tool_name,
          parameters: tool.parameters,
          result: tool.result,
          state: tool.state,
        })) : undefined
      }));

      setCurrentThreadId(threadId);
      setCurrentMessages(formattedMessages);

      // Load thread details for title
      const { data: threadData } = await supabase
        .from('chat_threads')
        .select('title')
        .eq('id', threadId)
        .single();

      if (threadData) {
        setTitle(threadData.title);
      }

      return formattedMessages;
    } catch (error) {
      console.error('Error loading thread:', error);
      throw error;
    }
  };

  const loadThreads = useCallback(async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('User not authenticated');
      return;
    }

    const { data, error } = await supabase
      .from('chat_threads')
      .select('id, title, created_at')
      .eq('user_id', user.id) // Filter by user_id
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading threads:', error);
      return;
    }
    
    setThreads(data || []);
  }, [supabase]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  // Initialize with the provided thread ID
  useEffect(() => {
    if (initialThreadId && initialThreadId !== currentThreadId) {
      setCurrentThreadId(initialThreadId);
      loadThread(initialThreadId).catch(console.error);
    }
  }, [initialThreadId]);

  const deleteThread = async (threadId: string) => {
    try {
      // Clear current thread state if deleting active thread
      if (threadId === currentThreadId) {
        setCurrentThreadId(undefined);
        setCurrentMessages([]);
        setTitle('New Chat');
      }

      const { error } = await supabase
        .from('chat_threads')
        .delete()
        .eq('id', threadId);

      if (error) throw error;
      await loadThreads();
    } catch (error) {
      console.error('Failed to delete thread:', error);
      throw error;
    }
  };

  const startNewThread = async () => {
    clearMessages(); // Clear messages before creating new thread
    const newThreadId = await createThread();
    setCurrentThreadId(newThreadId);
    return newThreadId;
  };

  return {
    threadId: currentThreadId,
    title,
    threads,
    currentMessages,
    createThread,
    saveMessage,
    updateTitle,
    loadThread,
    deleteThread,
    startNewThread,
    clearMessages, // Export the clearMessages function
    setCurrentMessages, // Add this line
    isOwner // Add this to the returned values
  };
}
