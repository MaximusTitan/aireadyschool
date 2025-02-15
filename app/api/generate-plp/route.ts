import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
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

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured");
    }

    const data = await req.json();
    
    if (!validateData(data)) {
      throw new Error("Invalid data format");
    }

    const prompt = `
    You must respond ONLY with a valid JSON object, no other text.
    Create a detailed, progressive learning plan for a student with the following details:

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
    Other Info: ${data.otherInfo}

    Generate a structured learning plan and return it as a JSON object with this exact structure:
    {
      "summary": {
        "currentStatus": string,
        "expectedOutcome": string,
        "keyStrengths": string[],
        "focusAreas": string[]
      },
      "weeklyPlans": [
        {
          "week": number,
          "focus": string,
          "expectedProgress": string,
          "activities": string[],
          "targets": string[],
          "resources": string[],
          "parentInvolvement": string
        }
      ],
      "recommendations": string[],
      "assessmentStrategy": string[]
    }

    Remember to respond ONLY with the JSON object, no additional text or explanations.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert educational consultant who creates personalized learning plans. You must respond only with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }).catch((error) => {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to generate learning plan: OpenAI API error');
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    let parsedContent;
    try {
      // Remove any potential non-JSON text from the beginning and end of the content
      const jsonString = content.trim().replace(/^[^{]*/, '').replace(/[^}]*$/, '');
      parsedContent = JSON.parse(jsonString);
    } catch (error) {
      console.error('JSON parsing error:', error, 'Content:', content);
      throw new Error('Failed to parse OpenAI response');
    }

    // Validate response structure
    const requiredKeys = ['summary', 'weeklyPlans', 'recommendations', 'assessmentStrategy'];
    for (const key of requiredKeys) {
      if (!parsedContent[key]) {
        throw new Error(`Invalid response format: missing ${key}`);
      }
    }

    return NextResponse.json(parsedContent);
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