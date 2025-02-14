import { anthropic } from '@ai-sdk/anthropic';
import { streamText, smoothStream } from 'ai';
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

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { messages } = await request.json();

  const result = streamText({
    model: anthropic('claude-3-5-sonnet-20240620'),
    system: getSystemPrompt(messages),
    messages,
    maxSteps: 5,
    tools,
    temperature: 0.5,
    maxTokens: 500,
    experimental_transform: smoothStream({
      delayInMs: 5,
      chunking: 'word',
    }),
    onFinish: async ({ usage }) => {
      if (usage) {
        await logTokenUsage(
          'Learning Buddy',
          'GPT-4o',
          usage.promptTokens,
          usage.completionTokens,
          user?.email
        );
      }
    }
  });

  return result.toDataStreamResponse();
}