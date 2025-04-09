import { anthropic } from '@ai-sdk/anthropic';
import { streamText, smoothStream, CreateMessage } from 'ai';
import { tools } from '@/app/tools/gen-chat/utils/tools';
import { logTokenUsage } from '@/utils/logTokenUsage';
import { createClient } from "@/utils/supabase/server";
import {
  SCIENCE_TEACHER_PROMPT,
  MATH_TEACHER_PROMPT,
  ENGLISH_TEACHER_PROMPT,
  GENERIC_TEACHER_PROMPT,
  TEACHER_BUDDY_PROMPT,
  SCIENCE_TEACHER_PROMPT_HINDI,
  MATH_TEACHER_PROMPT_HINDI,
  ENGLISH_TEACHER_PROMPT_HINDI,
  GENERIC_TEACHER_PROMPT_HINDI,
  TEACHING_MODE_PROMPT,
  TEACHING_MODE_PROMPT_HINDI,
} from '@/app/utils/systemPrompt';

// Import token estimation utility
import { encodingForModel } from "js-tiktoken";

//-----------------------------------------------------
// TYPE DEFINITIONS
//-----------------------------------------------------

type Subject = 'science' | 'math' | 'english' | 'generic';
type Language = 'english' | 'hindi';

//-----------------------------------------------------
// CONFIGURATION AND CONSTANTS
//-----------------------------------------------------

// Token limits
const TOKEN_USAGE_LIMIT = 4000;

// System prompt cache to avoid regenerating for similar requests
const systemPromptCache = new Map<string, {prompt: string, tokens: number}>();

// Cache for student details to avoid repeated DB calls
const studentDetailsCache = new Map<string, any>();

// Mapping of prompts by language and subject
const prompts: Record<Language, Record<Subject, string>> = {
  english: {
    science: SCIENCE_TEACHER_PROMPT,
    math: MATH_TEACHER_PROMPT,
    english: ENGLISH_TEACHER_PROMPT,
    generic: GENERIC_TEACHER_PROMPT
  },
  hindi: {
    science: SCIENCE_TEACHER_PROMPT_HINDI,
    math: MATH_TEACHER_PROMPT_HINDI,
    english: ENGLISH_TEACHER_PROMPT_HINDI,
    generic: GENERIC_TEACHER_PROMPT_HINDI
  }
};

// Connection manager to track active connections
const activeConnections = new Map();

//-----------------------------------------------------
// UTILITY FUNCTIONS
//-----------------------------------------------------

/**
 * Estimates token count for a given text string
 */
function estimateTokens(text: string): number {
  try {
    // Claude uses cl100k_base encoding
    const encoding = encodingForModel("gpt-4");
    const tokens = encoding.encode(text);
    return tokens.length;
  } catch (error) {
    console.warn("Error estimating tokens:", error);
    // Fallback to character-based estimation (rough approximation)
    return Math.ceil(text.length / 4);
  }
}

/**
 * Generates a cache key for system prompts
 */
function getSystemPromptCacheKey(subject: string, userRole: string, language: string, teachingMode: boolean): string {
  return `${subject}-${userRole}-${language}-${teachingMode}`;
}

/**
 * Detects the subject based on the message content
 */
function detectSubject(messages: any[]): Subject {
  const lastUserMessage = messages
    .slice()
    .reverse()
    .find(m => m.role === 'user')?.content.toLowerCase() || '';

  if (lastUserMessage.includes('math') || lastUserMessage.includes('calculation')) {
    return 'math';
  }
  if (lastUserMessage.includes('science') || lastUserMessage.includes('experiment')) {
    return 'science';
  }
  if (lastUserMessage.includes('english') || lastUserMessage.includes('writing')) {
    return 'english';
  }
  return 'generic';
}

/**
 * Retrieves student details from database or cache
 */
async function getStudentDetails(supabase: any, userId: string, userName: string) {
  if (studentDetailsCache.has(userId)) {
    return studentDetailsCache.get(userId);
  }

  const { data, error } = await supabase
    .from('student_details')
    .select('grade, board, country')
    .eq('id', userId)
    .single();

  // Only include essential fields to reduce token usage
  const details = !error && data ? { 
    grade: data.grade,
    name: userName 
    // Removed non-essential fields to save tokens
  } : { name: userName };
  
  studentDetailsCache.set(userId, details);
  return details;
}

/**
 * Generates appropriate system prompt based on context
 */
function getSystemPrompt(
  messages: any[],
  userRole?: string,
  language: Language = 'english',
  teachingMode = false,
  studentDetails?: any,
): string {
  const subject = detectSubject(messages);
  
  // Check cache first
  const cacheKey = getSystemPromptCacheKey(subject, userRole || 'Student', language, teachingMode);
  if (systemPromptCache.has(cacheKey) && !studentDetails) {
    return systemPromptCache.get(cacheKey)!.prompt;
  }

  let prompt = prompts[language][subject];

  if (userRole === 'Teacher') {
    systemPromptCache.set(cacheKey, {
      prompt: TEACHER_BUDDY_PROMPT,
      tokens: estimateTokens(TEACHER_BUDDY_PROMPT)
    });
    return TEACHER_BUDDY_PROMPT;
  }

  if (teachingMode) {
    const teachingPrompt = language === 'english' ? TEACHING_MODE_PROMPT : TEACHING_MODE_PROMPT_HINDI;
    systemPromptCache.set(cacheKey, {
      prompt: teachingPrompt,
      tokens: estimateTokens(teachingPrompt)
    });
    return teachingPrompt;
  }

  if (userRole === 'Student' && studentDetails) {
    // Add only essential student info to reduce tokens
    prompt += `\nStudent: ${studentDetails.name || 'N/A'}, Grade: ${studentDetails.grade || 'N/A'}`;
  }
  
  // Cache the prompt if it doesn't contain personalized data
  if (!studentDetails) {
    systemPromptCache.set(cacheKey, {
      prompt: prompt,
      tokens: estimateTokens(prompt)
    });
  }
  
  return prompt;
}

/**
 * Saves tool outputs to the database
 */
async function saveToolOutputs(
  supabase: any,
  messageId: string,
  toolCalls: Array<{
    id: string;
    tool: string;
    parameters: Record<string, any>;
    result?: any;
    state?: string;
  }>
) {
  try {
    const outputs = toolCalls.map(call => {
      // Truncate large results to save tokens and database space
      const truncatedResult = call.result ? 
        (typeof call.result === 'string' && call.result.length > 1000 ? 
          call.result.substring(0, 1000) + '...[truncated]' : 
          call.result) : 
        undefined;
      
      return {
        message_id: messageId,
        tool_name: call.tool,
        tool_call_id: call.id,
        parameters: call.parameters,
        result: truncatedResult,
        state: call.state || 'pending'
      };
    });

    const { error } = await supabase
      .from('tool_outputs')
      .insert(outputs);

    if (error) {
      console.error('Error saving tool outputs:', error);
      throw error;
    }
  } catch (err) {
    console.error('Failed to save tool outputs:', err);
  }
}

/**
 * Periodic cleanup function for stalled connections
 */
function cleanupStalledConnections() {
  const now = Date.now();
  const timeout = 60000; // 60 seconds timeout
  
  activeConnections.forEach((connection, id) => {
    if (now - (connection.lastActivity || connection.timestamp) > timeout) {
      if (connection.controller) {
        try {
          connection.controller.abort();
        } catch (err) {
          console.error(`Error aborting controller for connection ${id}:`, err);
        }
      }
      activeConnections.delete(id);
    }
  });
}

//-----------------------------------------------------
// MAIN API HANDLER
//-----------------------------------------------------

export async function POST(request: Request) {
  // Generate a unique request ID for tracking this connection
  const requestId = crypto.randomUUID();
  let controller: AbortController | null = null;
  
  try {
    controller = new AbortController();
    const signal = controller.signal;
    
    // Track the connection in our map
    activeConnections.set(requestId, {
      controller,
      timestamp: Date.now(),
      status: 'processing'
    });
    
    // Initialize Supabase client and verify user
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return Response.json({ error: error?.message || 'User not found' }, { status: 401 });
    }

    const userName = user.user_metadata?.name;
    const userRole = user.user_metadata?.role;

    // Parse request body
    const { messages, id: threadId, language = 'english', teachingMode = false } = await request.json();

    // Check input size
    const lastUserMessage = messages.find((m: any) => m.role === 'user')?.content || '';
    const inputTokenEstimate = estimateTokens(lastUserMessage);
    console.log(`Token estimate for user input: ${inputTokenEstimate}`);
    
    if (inputTokenEstimate > TOKEN_USAGE_LIMIT) {
      return Response.json({ 
        error: 'Input too large', 
        message: 'Your message is too long. Please provide a shorter question.' 
      }, { status: 413 });
    }

    //-----------------------------------------------------
    // USER CONTEXT RETRIEVAL
    //-----------------------------------------------------
    
    // Fetch student details if needed
    let studentDetails = null;
    if (userRole === 'Student' && !studentDetailsCache.has(user.id)) {
      studentDetails = await getStudentDetails(supabase, user.id, userName);
    } else if (userRole === 'Student') {
      studentDetails = studentDetailsCache.get(user.id);
    }

    //-----------------------------------------------------
    // SECURITY VERIFICATION
    //-----------------------------------------------------
    
    // Verify thread belongs to user
    if (threadId) {
      const { data: thread, error: threadError } = await supabase
        .from('chat_threads')
        .select('user_id')
        .eq('id', threadId)
        .single();

      if (threadError) {
        return Response.json({ error: 'Thread not found' }, { status: 404 });
      }

      if (thread?.user_id !== user.id) {
        return Response.json({ 
          error: 'Unauthorized thread access',
          details: {
            threadUserId: thread?.user_id,
            currentUserId: user.id
          }
        }, { status: 403 });
      }
    }

    // Safety check for messages
    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json({ error: 'Invalid messages array' }, { status: 400 });
    }

    // Create clean copy of messages
    const cleanMessages = messages.map(m => ({
      role: m.role,
      content: m.content,
      ...(m.name ? { name: m.name } : {}),
      ...(m.toolCalls ? { toolCalls: m.toolCalls } : {}),
      ...(m.toolCallId ? { toolCallId: m.toolCallId } : {})
    }));

    //-----------------------------------------------------
    // AI STREAM SETUP
    //-----------------------------------------------------
    
    // Setup for controlled stream termination
    let streamFinished = false;
    let streamError: Error | null = null;

    // Generate system prompt
    let systemPrompt = getSystemPrompt(
      cleanMessages, 
      userRole, 
      language as Language, 
      teachingMode, 
      studentDetails, 
    );

    // Log token usage
    const systemPromptTokens = estimateTokens(systemPrompt);
    console.log(`System prompt tokens: ${systemPromptTokens}`);
    
    // Safeguard against large system prompts
    if (systemPromptTokens > TOKEN_USAGE_LIMIT) {
      console.warn(`System prompt exceeds token limit: ${systemPromptTokens} tokens`);
      // Use a simplified prompt instead
      systemPrompt = teachingMode ? 
        "You are a helpful teaching assistant. Respond concisely." : 
        "You are a learning buddy. Provide helpful but concise responses.";
    }

    //-----------------------------------------------------
    // STREAM HANDLER CONFIGURATION
    //-----------------------------------------------------
    
    const streamHandler = streamText({
      model: anthropic('claude-3-5-haiku-20241022'),
      system: systemPrompt,
      messages: cleanMessages as CreateMessage[],
      maxSteps: 5,
      tools,
      experimental_telemetry: { isEnabled: true },
      temperature: teachingMode ? 0.3 : 0.5,
      maxTokens: teachingMode ? 1000 : 400, // Reduced token limits to save tokens
      experimental_transform: smoothStream({
        delayInMs: 5,
        chunking: 'word',
      }),
      
      // Handle completion of each step in the AI's generation
      onStepFinish: async ({ text, toolCalls, toolResults }) => {
        const connectionInfo = activeConnections.get(requestId);
        if (connectionInfo) {
          connectionInfo.status = 'stepComplete';
          connectionInfo.lastActivity = Date.now();
        }
    
        if (!toolCalls?.length) return;
    
        try {
          const messageId = crypto.randomUUID();
    
          // Save the assistant's message
          const { error: messageError } = await supabase
            .from('chat_messages')
            .insert({
              id: messageId,
              thread_id: threadId,
              role: 'assistant',
              content: text
            });
    
          if (messageError) {
            console.error('Error saving message:', messageError);
            return;
          }
    
          // Record tool calls and their results
          const toolCallsWithResults = toolCalls.map(call => {
            const result = toolResults?.find(r => r.toolCallId === call.toolCallId);
            return {
              id: call.toolCallId,
              tool: call.toolName,
              parameters: call.args,
              result: result?.result || undefined,
              state: result ? 'result' : 'pending'
            };
          });
        
          await saveToolOutputs(supabase, messageId, toolCallsWithResults);
    
        } catch (err) {
          console.error('Error in onStepFinish:', err);
        }
      },
      
      // Handle stream completion
      onFinish: async ({ usage, finishReason }) => {
        streamFinished = true;
        
        const connectionInfo = activeConnections.get(requestId);
        if (connectionInfo) {
          connectionInfo.status = 'finished';
          connectionInfo.finishTime = Date.now();
        }
        
        try {
          if (finishReason === 'error') {
            console.error('Stream finished with error:', { finishReason, usage });
            streamError = new Error(`STREAM_FINISH_ERROR: ${JSON.stringify({ 
              type: 'STREAM_FINISH_ERROR', 
              finishReason, 
              usage: usage || { promptTokens: 0, completionTokens: 0 }, 
              timestamp: new Date().toISOString() 
            })}`);
          }
        
          // Log token usage metrics
          if (usage) {
            await logTokenUsage(
              'Learning Buddy',
              'Claude 3.5 Haiku',
              usage.promptTokens || 0,
              usage.completionTokens || 0,
              user.email || undefined
            ).catch(err => {
              console.warn('Token logging failed:', err);
            });
          }
        } catch (err) {
          console.error('Error in onFinish:', err);
        } finally {
          // Clean up connection after delay
          setTimeout(() => {
            activeConnections.delete(requestId);
          }, 5000);
        }
      },
    });
    
    //-----------------------------------------------------
    // STREAM HANDLING AND ERROR MANAGEMENT
    //-----------------------------------------------------
    
    try {
      const response = streamHandler.toDataStreamResponse();
      
      if (!response.body) {
        throw new Error('No response stream available');
      }
      
      // Transform stream with error handling
      const transformStream = new TransformStream({
        transform(chunk, controller) {
          try {
            // Update connection timestamp
            const connectionInfo = activeConnections.get(requestId);
            if (connectionInfo) {
              connectionInfo.lastActivity = Date.now();
            }

            if (chunk.type === 'error') {
              console.error('Stream chunk error:', chunk.error);
              
              // Handle errors gracefully
              controller.enqueue({
                type: 'text',
                text: '\n\nI apologize, but I encountered an issue while processing your request. Please try again or rephrase your question.\n\n'
              });
              return;
            }
            
            controller.enqueue(chunk);
          } catch (err) {
            console.error(`Request ${requestId}: Transform error:`, err);
            controller.enqueue({
              type: 'text',
              text: '\n\nSorry, there was an error processing part of this response.\n\n'
            });
          }
        },
        flush(controller) {
          // Ensure stream ends properly
          try {
            controller.terminate();
          } catch (err) {
            console.error(`Request ${requestId}: Error terminating controller:`, err);
          } finally {
            // Clean up connection
            setTimeout(() => {
              activeConnections.delete(requestId);
            }, 1000);
          }
        }
      });

      const stream = response.body.pipeThrough(transformStream);

      // Return the response with the transformed stream
      return new Response(stream, {
        status: response.status,
        headers: {
          ...response.headers,
          'Connection': 'keep-alive',
          'Cache-Control': 'no-cache',
          'Content-Type': 'text/event-stream',
          'X-Request-ID': requestId // Include request ID in headers
        },
        statusText: response.statusText,
      });
      
    //-----------------------------------------------------
    // STREAM ERROR HANDLING
    //-----------------------------------------------------
    
    } catch (streamErr: unknown) {
      console.error(`Request ${requestId}: Detailed stream error:`, {
        error: streamErr,
        message: streamErr instanceof Error ? streamErr.message : String(streamErr),
        type: streamErr instanceof Error ? streamErr.constructor.name : typeof streamErr,
        stack: streamErr instanceof Error ? streamErr.stack : undefined
      });

      // Remove from connections map
      activeConnections.delete(requestId);

      // Default stream error response
      return Response.json({
        error: 'Stream error',
        details: streamErr instanceof Error ? (streamErr as any).message : String(streamErr),
        code: 'STREAM_ERROR',
        recoverable: true,
        message: 'Please try your request again.'
      }, { status: 500 });
    }
    
  //-----------------------------------------------------
  // GENERAL ERROR HANDLING
  //-----------------------------------------------------
  
  } catch (err: any) {
    console.error(`Request ${requestId}: General error in POST /api/gen-chat:`, err);
    console.error('COMPREHENSIVE ERROR LOGGING:', {
      errorMessage: err.message,
      errorName: err.name,
      errorStack: err.stack,
      errorCode: err.code
    });
    
    // Clean up controller
    if (controller) {
      try {
        controller.abort();
      } catch (abortErr) {
        console.error(`Request ${requestId}: Error aborting controller:`, abortErr);
      }
    }
    
    // Remove from connections map
    activeConnections.delete(requestId);

    // Default error response
    return Response.json({
      error: 'Server error',
      details: err.message || 'An unknown error occurred',
      code: 'SERVER_ERROR',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }, { status: 500 });
  }
}

//-----------------------------------------------------
// SCHEDULED TASKS
//-----------------------------------------------------

// Set up periodic cleanup of stalled connections
if (typeof setInterval !== 'undefined') {
  // Only run in environments that support setInterval
  setInterval(cleanupStalledConnections, 30000); // Check every 30 seconds
}