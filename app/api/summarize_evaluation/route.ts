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
    evaluationType: z.string(), // Generic field for any test type information available
  }),
  PERFORMANCE_METRICS: z.object({
    overallScore: z.number(),
    correctAnswers: z.number(),
    incorrectAnswers: z.number(),
    performanceRating: z.enum(['Excellent', 'Good', 'Needs Improvement', 'Poor']),
    percentile: z.number(),
    attemptsDistribution: z.object({
      easyQuestions: z.number(),
      mediumQuestions: z.number(),
      hardQuestions: z.number(),
    }),
    accuracyByDifficulty: z.object({
      easy: z.number(),
      medium: z.number(),
      hard: z.number(),
    }),
  }),
  TOPIC_ANALYSIS: z.object({
    mainTopics: z.array(z.object({
      name: z.string(),
      subtopics: z.array(z.string()),
      strongUnderstandingTopics: z.array(z.string()),
      weakUnderstandingTopics: z.array(z.string()),
      topicScore: z.number(),
      confidenceLevel: z.number(),
      masteryLevel: z.enum(['Mastered', 'Proficient', 'Developing', 'Beginning']),
      subtopicPerformance: z.array(z.object({
        name: z.string(),
        score: z.number(),
        questionsAttempted: z.number(),
        questionsCorrect: z.number(),
        averageResponseTime: z.number(),
        difficultyRating: z.number(),
        confidenceRating: z.number(),
        mistakePatterns: z.array(z.string()),
      })),
    })),
    // overallTopicDistribution: z.record(z.string(), z.number()),
  }),
  CONCEPT_UNDERSTANDING: z.object({
    conceptUnderstandingLevels: z.record(z.string(), z.number()).nullable(),
    knowledgeGaps: z.array(z.string()).nullable(),
    strengthAreas: z.array(z.string()),
    recommendedFocusAreas: z.array(z.string()),
    conceptHierarchy: z.array(z.object({
      primaryConcept: z.string(),
      relatedConcepts: z.array(z.string()),
      understandingScore: z.number(), // 0-100
    })),
    // applicationAbility: z.record(z.string(), z.number()), // Concept to application ability score
  }).strict(),
  LEARNING_STYLE_INDICATORS: z.object({
    preferredQuestionTypes: z.array(z.string()),
    learningPaceMetrics: z.object({
      fastLearningAreas: z.array(z.string()),
      challengeAreas: z.array(z.string()),
    }),
    // engagementPatterns: z.record(z.string(), z.number()), // Pattern name to strength score
  }),
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