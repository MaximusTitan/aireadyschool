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
    difficulty: z.string().describe('The difficulty level'),
  }),
  execute: async function ({ subject, difficulty }) {
    return {
      topic: subject,
      question: "What is the capital of France?",
      options: ["London", "Paris", "Berlin", "Madrid"],
      correctAnswer: "Paris",
      explanation: "Paris has been the capital of France since 508 CE!",
    };
  },
});

export const tools = {
  generateMathProblem: mathProblemTool,
  evaluateAnswer: evaluateAnswerTool,
  generateQuiz: quizTool,
};