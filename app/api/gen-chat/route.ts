import { anthropic } from '@ai-sdk/anthropic';
// import { openai } from '@ai-sdk/openai';
import { streamText, smoothStream, Message, CreateMessage } from 'ai';
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

function getSystemPrompt(messages: any[], userRole?: string, language: Language = 'english', teachingMode = false): string {
  // For teachers, only use teacher buddy prompt
  if (userRole === 'Teacher') {
    return TEACHER_BUDDY_PROMPT;
  }

  // If in teaching mode, use teaching mode prompt
  if (teachingMode) {
    return language === 'english' ? TEACHING_MODE_PROMPT : TEACHING_MODE_PROMPT_HINDI;
  }

  // For students, use existing subject-specific logic
  const subject = detectSubject(messages);
  const basePrompt = prompts[language][subject];
  
  if (language === 'english') {
    return `${basePrompt}

You can use various tools to enhance the learning experience:
- Generate interactive math problems
- Create quizzes
- Generate educational images
- Create concept visualizations
- Generate mind maps

Do not ever mention that you are using the tools to the user. Just start using them.

Always provide clear explanations and encourage active learning. Give short responses whenever possible.`;
  } else {
    return `${basePrompt}

आप सीखने के अनुभव को बढ़ाने के लिए विभिन्न उपकरणों का उपयोग कर सकते हैं:
- इंटरैक्टिव गणित समस्याएँ उत्पन्न करें
- क्विज़ बनाएँ
- शैक्षिक छवियाँ उत्पन्न करें
- अवधारणा विज़ुअलाइज़ेशन बनाएँ
- माइंड मैप उत्पन्न करें

कभी भी उपयोगकर्ता को यह न बताएं कि आप उपकरण का उपयोग कर रहे हैं। बस उनका उपयोग करना शुरू कर दें।

हमेशा स्पष्ट व्याख्या प्रदान करें और सक्रिय सीखने को प्रोत्साहित करें। संभव हो तो छोटे उत्तर दें।`;
  }
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
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return Response.json({ error: error?.message || 'User not found' }, { status: 401 });
    }

    // Get user role from metadata
    const userRole = user.user_metadata?.role;

    const { messages, id: threadId, language = 'english', teachingMode = false } = await request.json();

    // Add logging to debug language toggle
    console.log('Thread ID:', threadId);
    console.log('User ID:', user.id);
    console.log('Language selected:', language);

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

    const result = streamText({
      model: anthropic('claude-3-5-sonnet-20240620'),
      system: teachingMode 
        ? (language === 'english' ? TEACHING_MODE_PROMPT : TEACHING_MODE_PROMPT_HINDI)
        : getSystemPrompt(messages, userRole, language as Language),
      messages: messages as CreateMessage[],
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
      },
      onFinish: async ({ usage, finishReason }) => {
        // Handle potential stream errors in onFinish
        if (finishReason === 'error') {
          console.error('Stream finished with error:', { finishReason, usage });
          throw new Error('Stream error occurred');
        }
        
        if (usage) {
          await logTokenUsage(
            'Learning Buddy',
            'Claude 3.5 Sonnet',
            usage.promptTokens,
            usage.completionTokens,
            user.email || undefined
          ).catch(err => console.warn('Token logging failed:', err));
        }
      }
    });

    try {
      const response = result.toDataStreamResponse();
      return new Response(response.body, {
        status: response.status,
        headers: response.headers,
        statusText: response.statusText,
      });
    } catch (streamErr: any) {
      console.error('Stream conversion error:', streamErr);
      return Response.json({
        error: 'Stream error',
        details: streamErr.message,
        code: 'STREAM_ERROR'
      }, { status: 500 });
    }
  } catch (err: any) {
    console.error('Error in POST /api/gen-chat:', err);
    
    // Handle the specific error format from the example
    if (err.messageId && typeof err.messageId === 'string') {
      return Response.json({
        error: 'Message processing error',
        messageId: err.messageId,
        details: err.message || 'Error processing message',
        code: 'MESSAGE_ERROR'
      }, { status: 400 });
    }

    // Handle finish reason errors
    if (err.finishReason === 'error') {
      return Response.json({
        error: 'AI model error',
        details: 'The AI model encountered an error during processing',
        usage: err.usage || { promptTokens: 0, completionTokens: 0 },
        code: 'MODEL_ERROR',
        finishReason: err.finishReason
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