import { anthropic } from '@ai-sdk/anthropic';
// import { openai } from '@ai-sdk/openai';
import { streamText, smoothStream, Message, CreateMessage } from 'ai';
import { tools } from '@/app/tools/gen-chat/tools';
import { logTokenUsage } from '@/utils/logTokenUsage';
import { createClient } from "@/utils/supabase/server";
import {
  SCIENCE_TEACHER_PROMPT,
  MATH_TEACHER_PROMPT,
  ENGLISH_TEACHER_PROMPT,
  GENERIC_TEACHER_PROMPT
} from '@/app/utils/systemPrompt';

export const runtime = 'edge';

if (!process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY) {
  throw new Error('Missing DEEPGRAM_API_KEY environment variable');
}

type Subject = 'science' | 'math' | 'english' | 'generic';

const prompts: Record<Subject, string> = {
  science: SCIENCE_TEACHER_PROMPT,
  math: MATH_TEACHER_PROMPT,
  english: ENGLISH_TEACHER_PROMPT,
  generic: GENERIC_TEACHER_PROMPT
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

function getSystemPrompt(messages: any[]): string {
  const subject = detectSubject(messages);
  const basePrompt = prompts[subject];
  
  // Get user details from messages if available
  const userDetailsMessage = messages.find(m => 
    m.toolCalls?.some((t: any) => t.tool === 'collectUserDetails' && t.state === 'result')
  );
  
  let userDetails: UserDetails = {};
  if (userDetailsMessage) {
    const toolCall = userDetailsMessage.toolCalls.find((t: any) => t.tool === 'collectUserDetails');
    userDetails = toolCall.result;
  }

  // Add user details to prompt if available
  const userDetailsPrompt = userDetails.age ? `
Student Profile:
- Name: ${userDetails.name}
- Age: ${userDetails.age}
- Grade: ${userDetails.grade}
- Interests: ${userDetails.subjects?.join(', ')}

Adapt your teaching style according to this student's profile.
` : `
I haven't collected the student's details yet. Start by asking about:
- Name of the student
- Age and grade level
- Subjects they're interested in
Use the collectUserDetails tool to store this information.
`;

  return `${basePrompt}
${userDetailsPrompt}

You can use various tools to enhance the learning experience:
- Generate interactive math problems
- Create quizzes
- Generate educational images
- Create concept visualizations
- Generate mind maps

Always provide clear explanations and encourage active learning.`;
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

    const { messages, id: threadId } = await request.json();

    // Add logging to debug thread access
    console.log('Thread ID:', threadId);
    console.log('User ID:', user.id);

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
      // model: openai('gpt-4o'),
      model: anthropic('claude-3-5-sonnet-20240620'),
      system: getSystemPrompt(messages),
      messages: messages as CreateMessage[],
      maxSteps: 5,
      tools,
      temperature: 0.5,
      maxTokens: 500,
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
      onFinish: async ({ usage }) => {
        if (usage) {
          await logTokenUsage(
            'Learning Buddy',
            'GPT-4o',
            usage.promptTokens,
            usage.completionTokens,
            user.email || undefined
          );
        }
      }
    });

    return result.toDataStreamResponse();
  } catch (err: any) {
    console.error('Error in POST /api/gen-chat:', err);
    return Response.json({ error: err.message || 'An unknown error occurred.' }, { status: 500 });
  }
}