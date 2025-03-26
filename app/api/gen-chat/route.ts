import { anthropic } from '@ai-sdk/anthropic';
// import { openai } from '@ai-sdk/openai';
import { streamText, smoothStream, Message, CreateMessage, APICallError } from 'ai';
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

// Add this utility function at the top level
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

// Token usage logging and limits
const TOKEN_USAGE_LIMIT = 4000; // Set a reasonable limit

// System prompt cache to avoid regenerating for similar requests
const systemPromptCache = new Map<string, {prompt: string, tokens: number}>();

// Cache key generator for system prompts
function getSystemPromptCacheKey(subject: string, userRole: string, language: string, teachingMode: boolean): string {
  return `${subject}-${userRole}-${language}-${teachingMode}`;
}

export const runtime = 'edge';

type Subject = 'science' | 'math' | 'english' | 'generic';
type Language = 'english' | 'hindi';

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

interface UserDetails {
  name?: string;
  age?: number;
  grade?: number;
  subjects?: string[];
}

interface ThreadMessage extends Message {
  toolCalls?: Array<{
    id: string;
    tool: string;
    parameters: Record<string, any>;
    result?: any;
    state?: string;
  }>;
}

// Error interfaces
interface StreamFinishError {
  type: 'STREAM_FINISH_ERROR';
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  finishReason: string;
  timestamp: string;
}

// Type guards
function isStreamFinishError(error: unknown): error is Error {
  return error instanceof Error && error.message.includes('STREAM_FINISH_ERROR');
}

function isTypeError(error: unknown): error is TypeError {
  return error instanceof TypeError;
}

function isAPICallError(error: unknown): error is APICallError {
  return APICallError.isInstance(error);
}

// Cache student details to avoid repeated DB calls
const studentDetailsCache = new Map<string, any>();

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

// Optimize the system prompt to be more concise
function getSystemPrompt(
  messages: any[],
  userRole?: string,
  language: Language = 'english',
  teachingMode = false,
  studentDetails?: any,
  assignedAssessment?: { evaluation: any; lesson_plan: any }
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
    
    if (assignedAssessment?.evaluation) {
      // Only include the most critical assessment data
      const evalSummary = {
        score: assignedAssessment.evaluation.score,
        // Limit to just one improvement area to save tokens
        area: assignedAssessment.evaluation.improvementAreas?.[0] || ''
      };
      prompt += `\nAssessment: ${JSON.stringify(evalSummary)}`;
    }
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
    // Don't throw here, just log the error so the stream can continue
  }
}

// Add this interface with the existing interfaces
interface ScheduleData {
  day: number;
  topicHeading: string;
  schedule: {
    type: string;
    title: string;
    content: string;
    timeAllocation: number;
  };
  learningOutcomes: string[];
}

// Add a connection manager to track active connections
const activeConnections = new Map();

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
    

    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    

    if (error || !user) {
      return Response.json({ error: error?.message || 'User not found' }, { status: 401 });
    }

    const userName = user.user_metadata?.name; 

    // Get user role from metadata
    const userRole = user.user_metadata?.role;

    const { messages, id: threadId, language = 'english', teachingMode = false, lessonPlanId, scheduleData } = await request.json();

    // Check if the input is unreasonably large before processing
    const lastUserMessage = messages.find((m: any) => m.role === 'user')?.content || '';
    const inputTokenEstimate = estimateTokens(lastUserMessage);
    console.log(`Token estimate for user input: ${inputTokenEstimate}`);
    
    if (inputTokenEstimate > TOKEN_USAGE_LIMIT) {
      return Response.json({ 
        error: 'Input too large', 
        message: 'Your message is too long. Please provide a shorter question.' 
      }, { status: 413 });
    }

    // Fetch student details if role is Student
    let studentDetails = null;
    if (userRole === 'Student' && !studentDetailsCache.has(user.id)) {
      studentDetails = await getStudentDetails(supabase, user.id, userName);
    } else if (userRole === 'Student') {
      studentDetails = studentDetailsCache.get(user.id);
    }

    // Only fetch recent assessment if needed
    if (userRole === 'Student' && !studentDetails?.assignedAssessment) {
      const { data: assignedData } = await supabase
        .from('assigned_assessments')
        .select('evaluation, lesson_plan')
        .eq('student_email', user.email)
        .order('assigned_at', { ascending: false })
        .limit(1)
        .single();

      if (assignedData) {
        studentDetails.assignedAssessment = assignedData;
      }
    }

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

    // Create a clean copy of messages to avoid potential issues
    const cleanMessages = messages.map(m => ({
      role: m.role,
      content: m.content,
      ...(m.name ? { name: m.name } : {}),
      ...(m.toolCalls ? { toolCalls: m.toolCalls } : {}),
      ...(m.toolCallId ? { toolCallId: m.toolCallId } : {})
    }));

    // Setup for controlled stream termination
    let streamFinished = false;
    let streamError: Error | null = null;

    let systemPrompt = getSystemPrompt(
      cleanMessages, 
      userRole, 
      language as Language, 
      teachingMode, 
      studentDetails, 
      studentDetails?.assignedAssessment ?? undefined // Fixed: ensure null is converted to undefined
    );

    // Log the system prompt token usage for monitoring
    const systemPromptTokens = estimateTokens(systemPrompt);
    console.log(`System prompt tokens: ${systemPromptTokens}`);
    
    // Add safeguard against excessively large system prompts
    if (systemPromptTokens > TOKEN_USAGE_LIMIT) {
      console.warn(`System prompt exceeds token limit: ${systemPromptTokens} tokens`);
      // Use a simplified prompt instead
      systemPrompt = teachingMode ? 
        "You are a helpful teaching assistant. Respond concisely." : 
        "You are a learning buddy. Provide helpful but concise responses.";
    }

    const streamHandler = streamText({
      model: anthropic('claude-3-5-haiku-20241022'),
      system: systemPrompt,
      messages: cleanMessages as CreateMessage[],
      maxSteps: 5,
      tools,
      experimental_telemetry: { isEnabled: true },
      // Optimize token usage by limiting output length more aggressively
      temperature: (() => {        
        return teachingMode ? 0.3 : 0.5;
      })(),
      maxTokens: teachingMode ? 1000 : 400, // Reduced token limits to save tokens
      experimental_transform: smoothStream({
        delayInMs: 5,
        chunking: 'word',
      }),
      onStepFinish: async ({ text, toolCalls, toolResults }) => {
    
        const connectionInfo = activeConnections.get(requestId);
        if (connectionInfo) {
          connectionInfo.status = 'stepComplete';
          connectionInfo.lastActivity = Date.now();
        }
    
        if (!toolCalls?.length) return;
    
        try {
          const messageId = crypto.randomUUID();
    
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
        
          if (usage) {
            await logTokenUsage(
              'Learning Buddy',
              'Claude 3.5 Sonnet',
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
          setTimeout(() => {
            activeConnections.delete(requestId);
          }, 5000);
        }
      },
    });
    
    try {
      const response = streamHandler.toDataStreamResponse();
      
      if (!response.body) {
        throw new Error('No response stream available');
      }
      
      // Enhanced transform stream with better error handling
      const transformStream = new TransformStream({
        transform(chunk, controller) {
          try {
            // Update connection activity timestamp
            const connectionInfo = activeConnections.get(requestId);
            if (connectionInfo) {
              connectionInfo.lastActivity = Date.now();
            }

            if (chunk.type === 'error') {
              console.error('Stream chunk error:', chunk.error);
              
              // For any errors, try to handle them gracefully
              controller.enqueue({
                type: 'text',
                text: '\n\nI apologize, but I encountered an issue while processing your request. Please try again or rephrase your question.\n\n'
              });
              
              // Instead of calling controller.error(), we'll try to continue the stream
              return;
            }
            
            controller.enqueue(chunk);
          } catch (err) {
            console.error(`Request ${requestId}: Transform error:`, err);
            // Don't call controller.error() here either
            controller.enqueue({
              type: 'text',
              text: '\n\nSorry, there was an error processing part of this response.\n\n'
            });
          }
        },
        flush(controller) {
          // Make sure the stream ends gracefully
          try {
            controller.terminate();
          } catch (err) {
            console.error(`Request ${requestId}: Error terminating controller:`, err);
          } finally {
            // Ensure connection is cleaned up
            setTimeout(() => {
              activeConnections.delete(requestId);
            }, 1000);
          }
        }
      });

      const stream = response.body.pipeThrough(transformStream);

      // Create a response with the transformed stream
      return new Response(stream, {
        status: response.status,
        headers: {
          ...response.headers,
          'Connection': 'keep-alive',
          'Cache-Control': 'no-cache',
          'Content-Type': 'text/event-stream',
          'X-Request-ID': requestId // Add request ID to response headers
        },
        statusText: response.statusText,
      });
    } catch (streamErr: unknown) {
      console.error(`Request ${requestId}: Detailed stream error:`, {
        error: streamErr,
        message: streamErr instanceof Error ? streamErr.message : String(streamErr),
        type: streamErr instanceof Error ? streamErr.constructor.name : typeof streamErr,
        stack: streamErr instanceof Error ? streamErr.stack : undefined
      });

      // Clean up the controller if there was an error
      if (controller && !streamFinished) {
        try {
          controller.abort();
        } catch (abortErr) {
          console.error(`Request ${requestId}: Error aborting controller:`, abortErr);
        }
      }

      // Remove from active connections map
      activeConnections.delete(requestId);

      // Handle stream finish errors
      if (isStreamFinishError(streamErr)) {
        try {
          const errorMessage = streamErr.message;
          const jsonStartIndex = errorMessage.indexOf('{');
          if (jsonStartIndex >= 0) {
            const errorData = JSON.parse(errorMessage.substring(jsonStartIndex)) as StreamFinishError;
            return Response.json({
              error: 'AI Stream Error',
              details: 'The AI stream ended unexpectedly',
              code: 'STREAM_FINISH_ERROR',
              usage: errorData.usage || { promptTokens: 0, completionTokens: 0 },
              timestamp: errorData.timestamp || new Date().toISOString(),
              finishReason: errorData.finishReason || 'error',
              recoverable: true
            }, { status: 500 });
          }
        } catch (parseErr) {
          console.error('Error parsing stream finish error:', parseErr);
          // Fallback for parsing errors
          return Response.json({
            error: 'AI Stream Error',
            details: 'The AI stream ended unexpectedly (parsing error)',
            code: 'STREAM_FINISH_ERROR',
            message: streamErr.message,
            recoverable: true
          }, { status: 500 });
        }
      }

      // Classify stream errors
      if (isTypeError(streamErr)) {
        return Response.json({
          error: 'Stream processing error',
          details: streamErr.message,
          code: 'STREAM_TYPE_ERROR',
          recoverable: false
        }, { status: 500 });
      }
      
      if (isAPICallError(streamErr)) {
        return Response.json({
          error: 'AI API error during streaming',
          details: streamErr.message,
          code: 'STREAM_AI_ERROR',
          statusCode: streamErr.statusCode,
          recoverable: streamErr.isRetryable
        }, { status: streamErr.statusCode || 500 });
      }

      // Handle reported streamError specifically
      if (streamError) {
        return Response.json({
          error: 'AI Stream Error',
          details: 'The AI stream reported an error during processing',
          code: 'STREAM_REPORTED_ERROR',
          message: streamError as any,
          recoverable: true
        }, { status: 500 });
      }

      return Response.json({
        error: 'Stream error',
        details: streamErr instanceof Error ? (streamErr as any).message : String(streamErr), // modified line
        code: 'STREAM_ERROR',
        recoverable: true,
        message: 'Please try your request again.'
      }, { status: 500 });
    }
  } catch (err: any) {
    console.error(`Request ${requestId}: General error in POST /api/gen-chat:`, err);
    console.error('COMPREHENSIVE ERROR LOGGING:', {
      errorMessage: err.message,
      errorName: err.name,
      errorStack: err.stack,
      errorCode: err.code
    });
    
    // Clean up the controller if there was an error
    if (controller) {
      try {
        controller.abort();
      } catch (abortErr) {
        console.error(`Request ${requestId}: Error aborting controller:`, abortErr);
      }
    }
    
    // Remove from active connections map
    activeConnections.delete(requestId);
    
    // Enhanced error classification
    if (err instanceof TypeError) {
      return Response.json({
        error: 'Invalid request or parameters',
        details: err.message,
        code: 'TYPE_ERROR'
      }, { status: 400 });
    }

    // Handle AI API Call errors
    if (APICallError.isInstance(err)) {
      return Response.json({
        error: 'AI API Call Error',
        details: err.message,
        code: 'AI_API_ERROR',
        statusCode: err.statusCode,
        url: err.url,
        isRetryable: err.isRetryable,
        responseBody: err.responseBody,
      }, { status: err.statusCode || 500 });
    }

    // Handle message processing errors
    if (err.messageId && typeof err.messageId === 'string') {
      return Response.json({
        error: 'Message processing error',
        messageId: err.messageId,
        details: err.message || 'Error processing message',
        code: 'MESSAGE_ERROR'
      }, { status: 400 });
    }

    // Enhance finish reason error handling in the general catch block
    if (err.finishReason === 'error') {
      return Response.json({
        error: 'AI model error',
        details: 'The AI model encountered an error during processing',
        usage: err.usage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        code: 'MODEL_ERROR',
        finishReason: err.finishReason,
        recoverable: true
      }, { status: 500 });
    }

    // Handle connection reset errors
    if (err.code === 'ECONNRESET') {
      return Response.json({
        error: 'Connection reset',
        details: 'The connection was reset while streaming the response',
        code: 'ECONNRESET',
        recoverable: true
      }, { status: 500 });
    }

    // Default error response
    return Response.json({
      error: 'Server error',
      details: err.message || 'An unknown error occurred',
      code: 'SERVER_ERROR',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }, { status: 500 });
  }
}

// Add a cleanup function for stalled connections (can be called periodically)
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

// Optional: Set up periodic cleanup
if (typeof setInterval !== 'undefined') {
  // Only run in environments that support setInterval
  setInterval(cleanupStalledConnections, 30000); // Check every 30 seconds
}