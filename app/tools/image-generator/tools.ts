import { tool as createTool } from 'ai';
import { z } from 'zod';

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

export const tools = {
  generateImage: imageGeneratorTool,
};