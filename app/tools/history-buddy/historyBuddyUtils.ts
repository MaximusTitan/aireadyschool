import { supabase } from "@/lib/supabase";

// Interface for chat sessions
export interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: Date;
  chat_id?: string; // Add optional chat_id field
}

// Function to fetch available chat sessions
export async function fetchChatSessions() {
  try {
    const { data, error } = await supabase
      .from('history_buddy_chats')
      .select('*')
      .order('updated_at', { ascending: false });
      
    if (error) {
      console.error("Error fetching chat sessions:", error);
      throw error;
    }
    
    return data as ChatSession[];
  } catch (error) {
    console.error("Failed to fetch chat sessions:", error);
    return [];
  }
}

// Function to fetch messages for a specific chat session
export async function fetchChatMessages(chatId: string) {
  try {
    const { data, error } = await supabase
      .from('history_buddy_messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });
      
    if (error) {
      console.error("Error fetching chat messages:", error);
      throw error;
    }
    
    // Convert the data to match the Message interface
    const messages = data.map(msg => ({
      id: msg.id,
      content: msg.content,
      role: msg.role,
      createdAt: new Date(msg.created_at),
      chat_id: msg.chat_id
    })) as Message[];
    
    return messages;
  } catch (error) {
    console.error("Failed to fetch chat messages:", error);
    return [];
  }
}

export async function sendMessage(message: string, previousMessages: Message[] = []) {
  try {
    // Get the chat ID from previous messages if it exists
    let chat_id = null;
    
    // Find any message with a chat_id
    const messageWithChatId = previousMessages.find(msg => msg.chat_id);
    if (messageWithChatId) {
      chat_id = messageWithChatId.chat_id;
      console.log("Using existing chat_id:", chat_id);
    }
    
    const response = await fetch("/api/history-buddy/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        chat_id, // Pass the chat_id directly
        previousMessages: previousMessages.map(msg => ({
          role: msg.role,
          content: msg.content,
          chat_id: msg.chat_id // Pass chat_id if available
        })),
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("API response error:", errorData);
      throw new Error(`Failed to get response: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Store the chat_id if it was returned from the API
    if (data.chat_id) {
      console.log("Received chat_id from API:", data.chat_id);
      return { 
        reply: data.reply,
        chat_id: data.chat_id
      };
    }
    
    return { reply: data.reply };
  } catch (error) {
    console.error("Error in sendMessage function:", error);
    throw error;
  }
}

export const historyTopics = [
  "Ancient Egypt",
  "Ancient Greece",
  "Roman Empire",
  "Medieval Times",
  "Renaissance",
  "American Revolution",
  "World Wars",
  "Civil Rights Movement",
  "Famous Leaders",
  "Historical Inventions",
  "Important Monuments",
]; 