import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { NextResponse } from 'next/server';

// Define the Zod schema for the evaluation summary
const EvaluationSchema = z.object({
  STUDENT_METADATA: z.object({
    studentId: z.string(),
    grade: z.string(),
    board: z.string(),
    assessmentId: z.string(),
    dateOfAssessment: z.string(),
  }),
  PERFORMANCE_METRICS: z.object({
    overallScore: z.number(),
    correctAnswers: z.number(),
    incorrectAnswers: z.number(),
    performanceRating: z.enum(['Excellent', 'Good', 'Needs Improvement', 'Poor']),
  }),
  TOPIC_ANALYSIS: z.object({
    mainTopics: z.array(z.object({
      name: z.string(),
      subtopics: z.array(z.string()),
      strongUnderstandingTopics: z.array(z.string()),
      weakUnderstandingTopics: z.array(z.string()),
    })),
  }),
  CONCEPT_UNDERSTANDING: z.object({
    conceptUnderstandingLevels: z.record(z.string(), z.number()).nullable(),
    knowledgeGaps: z.array(z.string()).nullable(),
  }).strict(),
});

export async function POST(request: Request) {
  try {
    const { evaluation } = await request.json();

    if (!evaluation) {
      return NextResponse.json(
        { error: 'Evaluation data is required' },
        { status: 400 }
      );
    }

    // Use generateObject with the defined schema
    const result = await generateObject({
      model: openai('gpt-4o', {
        structuredOutputs: true,
      }),
      schemaName: 'StudentEvaluation',
      schemaDescription: 'Detailed analysis of student evaluation data',
      schema: EvaluationSchema,
      prompt: `Analyze this evaluation data and provide a detailed summary in the specified structured format. 
      
      Key instructions:
      - Extract essential metadata and performance metrics
      - Conduct in-depth topic and concept analysis
      - Focus on identifying strengths and knowledge gaps
      - Ensure all sections are filled with appropriate data
      
      Evaluation data: ${JSON.stringify(evaluation)}`,
    });

    // Return the structured evaluation summary
    return NextResponse.json({ 
      summarizedEvaluation: result.object 
    });
  } catch (error: any) {
    console.error('Error in summarize_evaluation API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to summarize evaluation' },
      { status: 500 }
    );
  }
}