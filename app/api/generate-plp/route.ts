import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  compatibility: 'strict',
});

interface LearningPlanData {
  name: string;
  age: string;
  gender: string;
  nationality: string;
  grade: string;
  board: string;
  cognitiveParams: Record<string, string>;
  selectedSubject: string;
  knowledgeParams: Record<string, string>;
  goals: string;
  timeline: string;
  topic: string;
  otherInfo: string;
}

function validateData(data: any): data is LearningPlanData {
  const requiredFields = [
    "name",
    "age",
    "gender",
    "nationality",
    "grade",
    "board",
    "cognitiveParams",
    "selectedSubject",
    "knowledgeParams",
    "goals",
    "timeline",
    "topic",
    "otherInfo",
  ];

  for (const field of requiredFields) {
    if (!data[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  if (Object.keys(data.cognitiveParams).length === 0) {
    throw new Error('At least one cognitive parameter must be selected');
  }

  if (Object.keys(data.knowledgeParams).length === 0) {
    throw new Error('At least one knowledge parameter must be selected');
  }

  return true;
}

const LearningPlanSchema = z.object({
  summary: z.object({
    currentStatus: z.string(),
    expectedOutcome: z.string(),
    keyStrengths: z.array(z.string()),
    focusAreas: z.array(z.string())
  }),
  weeklyPlans: z.array(z.object({
    week: z.number(),
    focus: z.string(),
    expectedProgress: z.string(),
    activities: z.array(z.string()),
    targets: z.array(z.string()),
    resources: z.array(z.string()),
    parentInvolvement: z.string()
  })),
  recommendations: z.array(z.string()),
  assessmentStrategy: z.array(z.string())
});

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured");
    }

    const data = await req.json();
    
    if (!validateData(data)) {
      throw new Error("Invalid data format");
    }

    const { object: plan } = await generateObject({
      model: openai('gpt-4'),
      schema: LearningPlanSchema,
      schemaName: 'LearningPlan',
      schemaDescription: 'A personalized learning plan for a student',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educational consultant who creates personalized learning plans.'
        },
        {
          role: 'user',
          content: `Create a detailed, progressive learning plan for a student with the following details:

          Student Information:
          Name: ${data.name}
          Age: ${data.age}
          Gender: ${data.gender}
          Nationality: ${data.nationality}
          Grade: ${data.grade}
          Board: ${data.board}

          Cognitive Assessment:
          ${Object.entries(data.cognitiveParams)
            .map(([param, rating]) => `${param}: ${rating}/5`)
            .join('\n')}

          Subject Area: ${data.selectedSubject}
          Parameters Assessment:
          ${Object.entries(data.knowledgeParams)
            .map(([param, rating]) => `${param}: ${rating}/5`)
            .join('\n')}

          Goals: ${data.goals}
          Timeline: ${data.timeline}
          Topic: ${data.topic}
          Other Info: ${data.otherInfo}`
        }
      ]
    });

    return NextResponse.json(plan);
  } catch (error: any) {
    console.error('Error in generate-plp:', error);
    return NextResponse.json(
      { 
        error: error.message || "Failed to generate learning plan",
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      },
      { status: error.status || 500 }
    );
  }
}