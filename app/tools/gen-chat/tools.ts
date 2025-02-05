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
    // Generate appropriate questions based on subject and difficulty
    let question, options, correctAnswer, explanation;

    switch (subject.toLowerCase()) {
      case 'science':
        if (difficulty === 'easy') {
          const questions = [
            {
              q: "What is the closest planet to the Sun?",
              o: ["Venus", "Mars", "Mercury", "Earth"],
              a: "Mercury",
              e: "Mercury is the first planet from the Sun, making it the closest!"
            },
            {
              q: "What is the state of matter that has no fixed shape?",
              o: ["Solid", "Liquid", "Gas", "Plasma"],
              a: "Liquid",
              e: "Liquids flow and take the shape of their container!"
            }
          ];
          ({ q: question, o: options, a: correctAnswer, e: explanation } = 
            questions[Math.floor(Math.random() * questions.length)]);
        } else {
          const questions = [
            {
              q: "Which of these is NOT a greenhouse gas?",
              o: ["Carbon dioxide", "Nitrogen", "Methane", "Water vapor"],
              a: "Nitrogen",
              e: "While nitrogen is abundant in our atmosphere, it's not a greenhouse gas!"
            },
            {
              q: "What is the process by which plants convert light into energy?",
              o: ["Photosynthesis", "Respiration", "Fermentation", "Digestion"],
              a: "Photosynthesis",
              e: "Photosynthesis uses sunlight to convert CO2 and water into glucose and oxygen!"
            }
          ];
          ({ q: question, o: options, a: correctAnswer, e: explanation } = 
            questions[Math.floor(Math.random() * questions.length)]);
        }
        break;

      case 'history':
        if (difficulty === 'easy') {
          const questions = [
            {
              q: "Who was the first President of the United States?",
              o: ["Thomas Jefferson", "George Washington", "John Adams", "Benjamin Franklin"],
              a: "George Washington",
              e: "George Washington served as the first U.S. President from 1789 to 1797!"
            },
            {
              q: "Which civilization built the pyramids of Giza?",
              o: ["Romans", "Greeks", "Egyptians", "Persians"],
              a: "Egyptians",
              e: "The ancient Egyptians built the pyramids as tombs for their pharaohs!"
            }
          ];
          ({ q: question, o: options, a: correctAnswer, e: explanation } = 
            questions[Math.floor(Math.random() * questions.length)]);
        } else {
          const questions = [
            {
              q: "In which year did the Berlin Wall fall?",
              o: ["1987", "1989", "1991", "1993"],
              a: "1989",
              e: "The Berlin Wall fell on November 9, 1989, marking the end of divided Berlin!"
            },
            {
              q: "Who wrote 'The Art of War'?",
              o: ["Confucius", "Sun Tzu", "Lao Tzu", "Buddha"],
              a: "Sun Tzu",
              e: "Sun Tzu wrote this influential military treatise around 500 BCE!"
            }
          ];
          ({ q: question, o: options, a: correctAnswer, e: explanation } = 
            questions[Math.floor(Math.random() * questions.length)]);
        }
        break;

      default:
        question = "What is the capital of France?";
        options = ["London", "Paris", "Berlin", "Madrid"];
        correctAnswer = "Paris";
        explanation = "Paris has been the capital of France since 508 CE!";
    }

    return {
      topic: subject,
      question,
      options,
      correctAnswer,
      explanation,
      difficulty
    };
  },
});

export const imageGeneratorTool = createTool({
  description: 'Generate an educational image',
  parameters: z.object({
    prompt: z.string().describe('The image generation prompt'),
    style: z.string().describe('Style of the image: realistic_image, digital_illustration, or vector_illustration'),
    imageSize: z.string().describe('Size of the image: square_hd, landscape_4_3, or portrait_hd'),
    numInferenceSteps: z.number().default(1).describe('Number of inference steps'),
    numImages: z.number().default(1).describe('Number of images to generate'),
    enableSafetyChecker: z.boolean().default(true).describe('Enable safety checker'),
  }),
  execute: async function ({ prompt, style, imageSize, numInferenceSteps, numImages, enableSafetyChecker }) {
    return {
      prompt,
      style,
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

export const tools = {
  generateMathProblem: mathProblemTool,
  evaluateAnswer: evaluateAnswerTool,
  generateQuiz: quizTool,
  generateImage: imageGeneratorTool,
  conceptVisualizer: conceptVisualizer,
};