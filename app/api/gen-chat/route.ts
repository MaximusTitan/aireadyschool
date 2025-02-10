import { openai } from '@ai-sdk/openai';
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

function getSystemPrompt(messages: any[]): string {
  const subject = detectSubject(messages);
  const basePrompt = prompts[subject];

  return `${basePrompt}

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
    model: openai('gpt-4o'),
    system: getSystemPrompt(messages),
    messages,
    maxSteps: 5,
    tools,
    maxTokens: 1000,
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