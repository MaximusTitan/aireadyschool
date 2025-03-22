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

export const runtime = 'edge';

if (!process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY) {
  throw new Error('Missing DEEPGRAM_API_KEY environment variable');
}

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

// Updated getSystemPrompt to receive an optional studentDetails parameter
function getSystemPrompt(
  messages: any[],
  userRole?: string,
  language: Language = 'english',
  teachingMode = false,
  studentDetails?: any,
  assignedAssessment?: { evaluation: any; lesson_plan: any }
): string {
  let promptString = '';
  // For teachers, only use teacher buddy prompt
  if (userRole === 'Teacher') {
    promptString = TEACHER_BUDDY_PROMPT;
  }
  // If in teaching mode, use teaching mode prompt
  else if (teachingMode) {
    promptString = language === 'english' ? TEACHING_MODE_PROMPT : TEACHING_MODE_PROMPT_HINDI;
  }
  // For students, use subject context and student details if available
  else if (userRole === 'Student' && studentDetails) {
    const subject = detectSubject(messages);
    const basePrompt = prompts[language][subject];
    const detailsContext = `
Student Details:
Always greet student with their name and provide personalized learning experience.
- Name: ${studentDetails.name || 'N/A'}
- Grade: ${studentDetails.grade || 'N/A'}
- Board: ${studentDetails.board || 'N/A'}
- Country: ${studentDetails.country || 'N/A'}`;
    promptString = language === 'english'
      ? `${basePrompt}
${detailsContext}

You can use various tools to enhance the learning experience:
- Create quizzes
- Generate educational images
- Create concept visualizations
- Generate mind maps

Do not ever mention that you are using the tools to the user. Just start using them. After explaining the concept, you should ask the student to take an assessment to reinforce their learning.

Always provide clear explanations and encourage active learning. Give short responses whenever possible.`
      : `${basePrompt}
${detailsContext}

आप सीखने के अनुभव को बढ़ाने के लिए विभिन्न उपकरणों का उपयोग कर सकते हैं:
- इंटरैक्टिव गणित समस्याएँ उत्पन्न करें
- क्विज़ बनाएँ
- शैक्षिक छवियाँ उत्पन्न करें
- अवधारणा विज़ुअलाइज़ेशन बनाएँ
- माइंड मैप उत्पन्न करें

कभी भी उपयोगकर्ता को यह न बताएं कि आप उपकरण का उपयोग कर रहे हैं। बस उनका उपयोग करना शुरू कर दें। अवधारित कोण के बाद, आपको छात्र से अभ्यास लेने के लिए कहना चाहिए ताकि उनके सीखने को मजबूत किया जा सके।

हमेशा स्पष्ट व्याख्या प्रदान करें और सक्रिय सीखने को प्रोत्साहित करें। संभव हो तो छोटे उत्तर दें।`;
  }
  // Default prompt for other cases:
  else {
    const subject = detectSubject(messages);
    const basePrompt = prompts[language][subject];
    promptString = language === 'english'
      ? `${basePrompt}

You can use various tools to enhance the learning experience:
- Create quizzes
- Generate educational images
- Create concept visualizations
- Generate mind maps

Do not ever mention that you are using the tools to the user. Just start using them.

Always provide clear explanations and encourage active learning. Give short responses whenever possible.`
      : `${basePrompt}

आप सीखने के अनुभव को बढ़ाने के लिए विभिन्न उपकरणों का उपयोग कर सकते हैं:
- इंटरैक्टिव गणित समस्याएँ उत्पन्न करें
- क्विज़ बनाएँ
- शैक्षिक छवियाँ उत्पन्न करें
- अवधारणा विज़ुअलाइज़ेशन बनाएँ
- माइंड मैप उत्पन्न करें

कभी भी उपयोगकर्ता को यह न बताएं कि आप उपकरण का उपयोग कर रहे हैं। बस उनका उपयोग करना शुरू कर दें।

हमेशा स्पष्ट व्याख्या प्रदान करें और सक्रिय सीखने को प्रोत्साहित करें। संभव हो तो छोटे उत्तर दें।`;
  }

  // Append assigned assessment context if exists for Student users
  if (userRole === 'Student' && assignedAssessment) {

    const assessmentContext = language === 'english'
      ? `

Additional Context to continue the lesson:
Evaluation: ${JSON.stringify(assignedAssessment.evaluation)}
Lesson Plan: ${JSON.stringify(assignedAssessment.lesson_plan)}`
      : `

अतिरिक्त संदर्भ पाठ जारी रखने के लिए:
Evaluation: ${JSON.stringify(assignedAssessment.evaluation)}
Lesson Plan: ${JSON.stringify(assignedAssessment.lesson_plan)}`;
    promptString += assessmentContext;
  }

  return promptString;
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
    const outputs = toolCalls.map(call => ({
      message_id: messageId,
      tool_name: call.tool,
      tool_call_id: call.id,
      parameters: call.parameters,
      result: call.result,
      state: call.state || 'pending'
    }));

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

export async function POST(request: Request) {
  let controller: AbortController | null = null;
  
  try {
    controller = new AbortController();
    const signal = controller.signal;
    
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return Response.json({ error: error?.message || 'User not found' }, { status: 401 });
    }

    const userName = user.user_metadata?.name; 

    // Get user role from metadata
    const userRole = user.user_metadata?.role;

    const { messages, id: threadId, language = 'english', teachingMode = false } = await request.json();

    // Add logging to debug language toggle
    console.log('Thread ID:', threadId);
    console.log('User ID:', user.id);
    console.log('Language selected:', language);

    // Fetch student details if role is Student
    let studentDetails = null;
    if (userRole === 'Student') {
      const { data, error: detailsError } = await supabase
        .from('student_details')
        .select('grade, board, country')
        .eq('id', user.id)
        .single();
      if (!detailsError && data) {
        studentDetails = { ...data, name: userName };
        console.log('Student details found:', studentDetails);
      } else {
        studentDetails = { name: userName }; 
      }

      const { data: assignedData, error: assignedError } = await supabase
        .from('assigned_assessments')
        .select('evaluation, lesson_plan')
        .eq('student_email', user.email)
        .order('assigned_at', { ascending: false })
        .limit(1)
        .single();
      let assignedAssessment = null;
      if (!assignedError && assignedData) {
        assignedAssessment = assignedData;
      }
      studentDetails = { ...studentDetails, assignedAssessment };
    }

    // Verify thread belongs to user
    if (threadId) {
      const { data: thread, error: threadError } = await supabase
        .from('chat_threads')
        .select('user_id')
        .eq('id', threadId)
        .single();

      console.log('Thread data:', thread);
      console.log('Thread error:', threadError);

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

    const streamHandler = streamText({
      model: anthropic('claude-3-7-sonnet-20250219'),
      system: teachingMode 
        ? (language === 'english' ? TEACHING_MODE_PROMPT : TEACHING_MODE_PROMPT_HINDI)
        : getSystemPrompt(
            cleanMessages, 
            userRole, 
            language as Language, 
            teachingMode, 
            studentDetails, 
            studentDetails?.assignedAssessment ?? undefined // Fixed: ensure null is converted to undefined
          ),
      messages: cleanMessages as CreateMessage[],
      maxSteps: 5,
      tools,
      // Adjust temperature and max tokens for teaching mode
      temperature: teachingMode ? 0.3 : 0.5,
      maxTokens: teachingMode ? 1500 : 500,
      experimental_transform: smoothStream({
        delayInMs: 5,
        chunking: 'word',
      }),
      onStepFinish: async ({ text, toolCalls, toolResults }) => {
        if (!toolCalls?.length) return;

        try {
          // Generate a message ID for this step
          const messageId = crypto.randomUUID();

          // Save the message first
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

          // Map tool results to their corresponding calls
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

          // Save tool outputs
          await saveToolOutputs(supabase, messageId, toolCallsWithResults);
        } catch (err) {
          console.error('Error in onStepFinish:', err);
          // Don't throw here to avoid breaking the stream
        }
      },
      // Replace the onFinish handler with this improved version:
      onFinish: async ({ usage, finishReason }) => {
        streamFinished = true;
        
        try {
          // Handle error finish reason
          if (finishReason === 'error') {
            console.error('Stream finished with error:', { finishReason, usage });
            streamError = new Error(`STREAM_FINISH_ERROR: ${JSON.stringify({ 
              type: 'STREAM_FINISH_ERROR', 
              finishReason, 
              usage: usage || { promptTokens: 0, completionTokens: 0 }, 
              timestamp: new Date().toISOString() 
            })}`);
            // Don't throw here, just record the error
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
          // Don't rethrow, just log
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
            console.error('Transform error:', err);
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
            console.error('Error terminating controller:', err);
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
        },
        statusText: response.statusText,
      });
    } catch (streamErr: unknown) {
      console.error('Detailed stream error:', {
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
          console.error('Error aborting controller:', abortErr);
        }
      }

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
    console.error('General error in POST /api/gen-chat:', err);
    
    // Clean up the controller if there was an error
    if (controller) {
      try {
        controller.abort();
      } catch (abortErr) {
        console.error('Error aborting controller:', abortErr);
      }
    }
    
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