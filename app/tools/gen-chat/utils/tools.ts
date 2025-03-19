import { tool as createTool } from 'ai';
import { z } from 'zod';

export const mathProblemTool = createTool({
  description: 'Generate a dynamic math problem',
  parameters: z.object({
    level: z.string().describe('The difficulty level: easy, medium, or hard'),
    topic: z.string().describe('Math topic like addition, multiplication, etc.'),
  }),
  execute: async function ({ level, topic }) {
    let question, answer, hint;
    
    // Generate dynamic math problems based on level and topic
    if (topic === 'addition') {
      if (level === 'easy') {
        const num1 = Math.floor(Math.random() * 10);
        const num2 = Math.floor(Math.random() * 10);
        question = `What is ${num1} + ${num2}?`;
        answer = num1 + num2;
        hint = "Try counting with your fingers!";
      } else if (level === 'medium') {
        const num1 = Math.floor(Math.random() * 50);
        const num2 = Math.floor(Math.random() * 50);
        question = `What is ${num1} + ${num2}?`;
        answer = num1 + num2;
        hint = "Break it down into tens and ones!";
      }
    } else if (topic === 'multiplication') {
      if (level === 'easy') {
        const num1 = Math.floor(Math.random() * 10);
        const num2 = Math.floor(Math.random() * 10);
        question = `What is ${num1} × ${num2}?`;
        answer = num1 * num2;
        hint = "Try adding the number multiple times!";
      } else if (level === 'medium') {
        const num1 = Math.floor(Math.random() * 12);
        const num2 = Math.floor(Math.random() * 12);
        question = `What is ${num1} × ${num2}?`;
        answer = num1 * num2;
        hint = "Break it down into smaller multiplications!";
      }
    } else if (topic === 'subtraction') {
      if (level === 'easy') {
        const num2 = Math.floor(Math.random() * 10);
        const num1 = num2 + Math.floor(Math.random() * 10); // Ensure positive result
        question = `What is ${num1} - ${num2}?`;
        answer = num1 - num2;
        hint = "Count backwards!";
      } else if (level === 'medium') {
        const num2 = Math.floor(Math.random() * 50);
        const num1 = num2 + Math.floor(Math.random() * 50); // Ensure positive result
        question = `What is ${num1} - ${num2}?`;
        answer = num1 - num2;
        hint = "Break it down into tens and ones!";
      }
    }
    
    if (!question || answer === undefined) {
      question = "What is 2 + 2?";
      answer = 4;
      hint = "Use your fingers to count!";
    }
    
    return { question, hint, answer, level, topic };
  },
});

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

export const tools = {
  generateMathProblem: mathProblemTool,
  evaluateAnswer: evaluateAnswerTool,
  generateQuiz: quizTool,
  generateImage: imageGeneratorTool,
  conceptVisualizer: conceptVisualizer,
  generateMindMap: mindMapTool,
  evaluateQuizAnswer: quizAnswerEvaluationTool,
  generateVideo: videoGeneratorTool,
};