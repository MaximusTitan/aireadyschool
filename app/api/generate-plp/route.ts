// app/api/generate-plan/route.ts
import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OpenAI API key not configured" },
      { status: 500 }
    );
  }

  try {
    const data = await req.json();
    
    // Validate required fields
    const requiredFields = ['name', 'age', 'grade', 'board', 'cognitiveParams', 'selectedSubject', 'knowledgeParams', 'goals', 'timeline'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const prompt = `
    Create a learning plan for a student with the following details:

    Student Information:
    Name: ${data.name}
    Age: ${data.age}
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

    Generate a structured learning plan with weekly targets and specific activities.
    Return the response in the following JSON format:
    {
      "weeklyPlans": [
        {
          "week": number,
          "focus": string,
          "activities": string[],
          "targets": string[]
        }
      ],
      "recommendations": string[],
      "assessmentStrategy": string[]
    }
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "You are an expert educational consultant who creates personalized learning plans."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content received from OpenAI');
    }
    return NextResponse.json(JSON.parse(content));
  } catch (error: any) {
    console.error('Error generating learning plan:', error);
    return NextResponse.json(
      { 
        error: "Failed to generate learning plan",
        details: error.message 
      },
      { status: 500 }
    );
  }
}