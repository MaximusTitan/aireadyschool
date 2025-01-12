import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { NextRequest } from 'next/server';

interface ChatRequest {
  message: string;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const TOOL_ROUTES = {
  presentation: '/tools/presentation',
  'lesson-planner': '/tools/lesson-planner',
  'comic-generator': '/tools/comic-generator',
  'chat-with-docs': '/tools/chat-with-docs',
  'image-generator': '/tools/image-generator',
  'presentation-generator': '/tools/presentation',
  'video-generator': '/tools/video-generator',
  'text-tools': '/tools/text-tools',
  'mcq-generator': '/tools/mcq-generator',
  'lesson-plan-creator': '/tools/lesson-planner',
  'youtube-assistant': '/tools/youtube-assistant',
  'audiobot': '/tools/audiobot',
  'personalized-lessons': '/tools/personalized-lessons',
  'research-assistant': '/tools/research-assistant',
  'study-planner': '/tools/study-planner',
  'evaluator': '/tools/evaluator',
  'project-helper': '/tools/project-helper',
  'individualized-education-planner': '/tools/individualized-education-planner',
  'marketing-content-generator': '/tools/marketing-content-generator',
  'report-generator': '/tools/report-generator',
  'school-intelligence': '/tools/school-intelligence',
  'lesson planner': '/tools/lesson-planner',
  'comic generator': '/tools/comic-generator',
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { message }: ChatRequest = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // First, check if the user is requesting a tool
    const toolRequest = message.toLowerCase().match(/open (presentation|lesson planner|comic generator|chat with docs|image generator|video generator|text tools|mcq generator|lesson plan creator|youtube assistant|audiobot|personalized lessons|research assistant|study planner|evaluator|project helper|individualized education planner|marketing content generator|report generator|school intelligence)/);
    
    if (toolRequest) {
      // If a tool is requested, use AI to confirm and categorize
      const toolCompletion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an assistant that categorizes tool requests. Based on the user's input, respond with ONLY ONE of the following:
            - PRESENTATION: if the request is to open or use a presentation tool
            - LESSON_PLANNER: if the request is to open or use a lesson planner tool
            - COMIC_GENERATOR: if the request is to open or use a comic generator tool
            - CHAT_WITH_DOCS: if the request is to open or use a chat with docs tool
            - IMAGE_GENERATOR: if the request is to open or use an image generator tool
            - VIDEO_GENERATOR: if the request is to open or use a video generator tool
            - TEXT_TOOLS: if the request is to open or use text tools
            - MCQ_GENERATOR: if the request is to open or use an MCQ generator tool
            - LESSON_PLAN_CREATOR: if the request is to open or use a lesson plan creator tool
            - YOUTUBE_ASSISTANT: if the request is to open or use a YouTube assistant tool
            - AUDIOBOT: if the request is to open or use an audiobot
            - PERSONALIZED_LESSONS: if the request is to open or use personalized lessons
            - RESEARCH_ASSISTANT: if the request is to open or use a research assistant tool
            - STUDY_PLANNER: if the request is to open or use a study planner tool
            - EVALUATOR: if the request is to open or use an evaluator tool
            - PROJECT_HELPER: if the request is to open or use a project helper tool
            - INDIVIDUALIZED_EDUCATION_PLANNER: if the request is to open or use an individualized education planner tool
            - MARKETING_CONTENT_GENERATOR: if the request is to open or use a marketing content generator tool
            - REPORT_GENERATOR: if the request is to open or use a report generator tool
            - SCHOOL_INTELLIGENCE: if the request is to open or use a school intelligence tool
            - NONE: if the request doesn't clearly match any of the above categories
            Respond with the category name only, no additional text.`
          },
          { role: 'user', content: message }
        ],
      });

      const toolCategory = toolCompletion.choices[0].message.content?.trim().toUpperCase();
      
      let redirectUrl = null;
      
      switch (toolCategory) {
        case 'PRESENTATION':
          redirectUrl = TOOL_ROUTES.presentation;
          break;
        case 'LESSON_PLANNER':
          redirectUrl = TOOL_ROUTES['lesson-planner'];
          break;
        case 'COMIC_GENERATOR':
          redirectUrl = TOOL_ROUTES['comic-generator'];
          break;
        case 'CHAT_WITH_DOCS':
          redirectUrl = TOOL_ROUTES['chat-with-docs'];
          break;
        case 'IMAGE_GENERATOR':
          redirectUrl = TOOL_ROUTES['image-generator'];
          break;
        case 'VIDEO_GENERATOR':
          redirectUrl = TOOL_ROUTES['video-generator'];
          break;
        case 'TEXT_TOOLS':
          redirectUrl = TOOL_ROUTES['text-tools'];
          break;
        case 'MCQ_GENERATOR':
          redirectUrl = TOOL_ROUTES['mcq-generator'];
          break;
        case 'LESSON_PLAN_CREATOR':
          redirectUrl = TOOL_ROUTES['lesson-plan-creator'];
          break;
        // ...handle other categories...
        default:
          // ...existing code...
          break;
      }

      if (redirectUrl) {
        // If a valid tool was requested, return redirect URL in JSON
        return NextResponse.json(
          { redirect: redirectUrl },
          { status: 200 }
        );
      }
      // If no valid tool was identified, fall through to regular chat
    }

    // Regular chat functionality
    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant. Keep your responses clear and concise, focusing on the most important information. Limit response to 100 words maximum'
        },
        { role: 'user', content: message }
      ],
    });

    return NextResponse.json({
      response: chatCompletion.choices[0].message.content ?? '',
    });

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error processing chat request' },
      { status: 500 }
    );
  }
}

