import { tool as createTool } from 'ai';
import { z } from 'zod';

export const evaluateAnswerTool = createTool({
  description: 'Evaluate a student answer and provide feedback',
  parameters: z.object({
    studentAnswer: z.number().describe('The answer provided by the student'),
    correctAnswer: z.number().describe('The correct answer'),
    question: z.string().describe('The original question'),
    topic: z.string().describe('The topic of the question'),
    level: z.string().describe('The difficulty level'),
  }),
  execute: async function ({ studentAnswer, correctAnswer, question, topic, level }) {
    const isCorrect = studentAnswer === correctAnswer;
    return {
      isCorrect,
      question,
      studentAnswer,
      correctAnswer,
      topic,
      level,
    };
  },
});

export const quizTool = createTool({
  description: 'Generate a quiz question',
  parameters: z.object({
    subject: z.string().describe('The subject area'),
    difficulty: z.enum(['easy', 'medium', 'hard']).describe('The difficulty level'),
    topic: z.string().optional().describe('Specific topic within the subject'),
  }),
  execute: async function ({ subject, difficulty, topic }) {
    return {
      subject,
      difficulty,
      topic,
      pending: true
    };
  },
});

export const imageGeneratorTool = createTool({
  description: 'Generate an educational image',
  parameters: z.object({
    prompt: z.string().describe('The image generation prompt'),
    imageSize: z.string().describe('Size of the image: square_hd, landscape_4_3, or portrait_hd'),
    numInferenceSteps: z.number().default(1).describe('Number of inference steps'),
    numImages: z.number().default(1).describe('Number of images to generate'),
    enableSafetyChecker: z.boolean().default(true).describe('Enable safety checker'),
  }),
  execute: async function ({ prompt, imageSize, numInferenceSteps, numImages, enableSafetyChecker }) {
    return {
      prompt,
      imageSize,
      numInferenceSteps,
      numImages,
      enableSafetyChecker,
      pending: true
    };
  },
});

export const conceptVisualizer = createTool({
  description: "Generate an interactive, kid-friendly simulation for a concept in a given subject",
  parameters: z.object({
    subject: z.string().describe("The subject area of the concept"),
    concept: z.string().describe("The specific concept to visualize"),
  }),
  execute: async ({ subject, concept }) => {
    return {
      subject,
      concept,
      pending: true,
    };
  },
})

export const mindMapTool = createTool({
  description: 'Generate a mind map for a given topic',
  parameters: z.object({
    topic: z.string().describe('The topic to create a mind map for'),
  }),
  execute: async function ({ topic }) {
    return { topic, pending: true };
  },
});

export const quizAnswerEvaluationTool = createTool({
  description: 'Evaluate a quiz answer and provide detailed feedback',
  parameters: z.object({
    selectedAnswer: z.object({
      id: z.string(),
      text: z.string(),
      isCorrect: z.boolean(),
    }),
    question: z.string(),
    allOptions: z.array(z.object({
      id: z.string(),
      text: z.string(),
      isCorrect: z.boolean(),
    })),
    subject: z.string(),
    difficulty: z.string(),
    explanation: z.string(),
    isCorrect: z.boolean(),
  }),
  execute: async function(params) {
    return {
      ...params,
      feedback: params.isCorrect 
        ? `Correct! ${params.explanation}`
        : `Not quite. ${params.explanation} Let's try another question about ${params.subject}!`
    };
  },
});

export const videoGeneratorTool = createTool({
  description: 'Generate a video from text or image',
  parameters: z.object({
    prompt: z.string().describe('Description of the desired animation'),
    imageUrl: z.string().optional().describe('Optional base image URL to animate'),
  }),
  execute: async function ({ prompt, imageUrl }) {
    return {
      prompt,
      imageUrl,
      pending: true,
    };
  },
});

export const assessmentGeneratorTool = createTool({
  description: 'Generate an educational assessment',
  parameters: z.object({
    subject: z.string().describe('The subject area'),
    topic: z.string().describe('The specific topic'),
    assessmentType: z.enum(['mcq', 'truefalse', 'shortanswer']).describe('Type of assessment'),
    difficulty: z.enum(['easy', 'medium', 'hard']).describe('The difficulty level'),
    questionCount: z.number().min(1).max(10).default(5).describe('Number of questions'),
    learningOutcomes: z.array(z.string()).describe('Learning outcomes to test'),
  }),
  execute: async function(params) {
    return {
      ...params,
      pending: true,
    };
  },
});

export const tools = {
  evaluateAnswer: evaluateAnswerTool,
  generateQuiz: quizTool,
  generateImage: imageGeneratorTool,
  conceptVisualizer: conceptVisualizer,
  generateMindMap: mindMapTool,
  evaluateQuizAnswer: quizAnswerEvaluationTool,
  generateVideo: videoGeneratorTool,
  generateAssessment: assessmentGeneratorTool,
};