'use server'

import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { groq } from '@ai-sdk/groq'
import { generateImage } from '../utils/flux'
import { Presentation, Slide, SlideLayout } from '../types/presentation'
import { nanoid } from 'nanoid'

const layouts: SlideLayout[] = [
  'titleSlide',
  'contentWithImage',
  'quoteSlide',
  'timelineSlide',
  'comparisonSlide',
  'statisticSlide',
  'bulletPoints'
]

async function generateImagesForSlide(slide: any, theme: string, generateImages: boolean = true): Promise<string> {
  if (!generateImages) {
    return `/placeholder.svg?text=${encodeURIComponent(slide.title)}`
  }

  const basePrompt = slide.title
  const stylePrompts = {
    modern: 'sleek, minimalist design with bold colors',
    playful: 'vibrant, cartoon-style illustrations with fun elements',
    nature: 'serene landscape photography or botanical illustrations',
    tech: 'futuristic, digital art style with glowing elements, Robotic',
    vintage: 'retro, nostalgic imagery with muted color palette'
  }

  const style = stylePrompts[theme as keyof typeof stylePrompts] || stylePrompts.modern

  try {
    const image = await generateImage(`${basePrompt}, ${style}`)
    return image
  } catch (error) {
    console.error('Error in generateImagesForSlide:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    } else {
      console.error('Unknown error type:', typeof error)
    }
    return `https://via.placeholder.com/1024x1024?text=${encodeURIComponent(basePrompt)}`
  }
}

async function generateWithModel(prompt: string, model: "gpt4" | "groq") {
  try {
    if (model === "gpt4") {
      return await generateText({
        model: openai('gpt-4'),
        prompt: prompt
      })
    } else {
      return await generateText({
        model: groq('mixtral-8x7b-32768'), // Changed to use Groq's free model
        prompt: prompt,
        temperature: 0.7,
        maxTokens: 4000
      })
    }
  } catch (error) {
    if (model === "gpt4") {
      console.warn("GPT-4 failed, falling back to Groq")
      return await generateText({
        model: groq('mixtral-8x7b-32768'), // Changed here too
        prompt: prompt,
        temperature: 0.7,
        maxTokens: 4000
      })
    }
    throw error
  }
}

export async function generatePresentation(prompt: string, theme: string, slideCount: number, learningObjective: string, gradeLevel: string, relevantTopic: string, includeQuiz: boolean, includeQuestions: boolean, includeFeedback: boolean, generateImages: boolean = true, model: "gpt4" | "groq" = "gpt4"): Promise<Presentation> {

  // Ensure slideCount is within the allowed range
  const validSlideCount = Math.max(2, Math.min(8, slideCount))

  try {
    const { text } = await generateWithModel(`Create an engaging and educational presentation about ${prompt} for students. Format the response as JSON with the following structure:
      {
        "slides": [
          {
            "title": "slide title",
            "content": "main content (2-3 sentences)",
            "bulletPoints": ["point 1", "point 2", "point 3"],
            "layout": "${layouts.join('" | "')}",
            "statistics": [
              { "value": "statistic value", "label": "statistic label" }
            ],
            "timeline": [
              { "year": "year", "event": "event description" }
            ],
            "comparison": {
              "left": { "title": "left title", "points": ["point 1", "point 2"] },
              "right": { "title": "right title", "points": ["point 1", "point 2"] }
            },
            "quote": { "text": "quote text", "author": "quote author" }
          }
        ]
      }
      Generate exactly ${validSlideCount} slides with diverse layouts and engaging, educational content suitable for students. Make sure to use different layouts for visual variety. The first slide should always be a titleSlide layout with a catchy title and brief introduction. Ensure each slide has substantial content, including the main content and relevant bullet points or other layout-specific information. Strictly adhere to the JSON format without any additional text or explanations outside the JSON structure.`, model)

    let content;
    try {
      // Remove any potential non-JSON content before and after the JSON structure
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in the response');
      }
      const jsonString = jsonMatch[0];
      content = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError)
      console.error('Raw AI response:', text)
      if (parseError instanceof Error) {
        throw new Error(`Invalid response format from AI: ${parseError.message}`)
      } else {
        throw new Error('Invalid response format from AI: Unknown error')
      }
    }

    if (!content?.slides?.length) {
      throw new Error('Invalid or empty slides data received from AI')
    }

    const slides: Slide[] = await Promise.all(
      content.slides.map(async (slide: any, index: number) => {
        
        try {
          const image = await generateImagesForSlide(slide, theme, generateImages)

          return {
            id: nanoid(),
            title: slide.title || `Slide ${index + 1}`,
            content: slide.content || '',
            bulletPoints: slide.bulletPoints || [],
            image: image,
            statistics: slide.statistics || [],
            timeline: slide.timeline || [],
            comparison: slide.comparison || { left: { points: [] }, right: { points: [] } },
            quote: slide.quote || { text: '', author: '' },
            layout: index === 0 ? 'titleSlide' : (slide.layout as SlideLayout),
            order: index,
            ...(index === 0 && {
              author: {
                name: "AI Presentation Generator",
                avatar: "/placeholder.svg?height=100&width=100",
                lastEdited: new Date().toLocaleDateString()
              }
            })
          }
        } catch (error) {
          console.error(`Error processing slide ${index + 1}:`, error)
          if (error instanceof Error) {
            console.error('Error message:', error.message)
            console.error('Error stack:', error.stack)
          } else {
            console.error('Unknown error type:', typeof error)
          }
          // Return a basic slide if processing fails
          return {
            id: nanoid(),
            title: slide.title || `Slide ${index + 1}`,
            content: slide.content || 'Content generation failed. Please try again.',
            image: `https://via.placeholder.com/1024x1024?text=${encodeURIComponent(slide.title || 'Slide Generation Failed')}`,
            layout: index === 0 ? 'titleSlide' : 'contentWithImage' as SlideLayout,
            order: index,
          }
        }
      })
    )

    // Process the generated slides
    const processedSlides = slides.map((slide: Slide, index: number) => {
      // Special handling for YouTube slides - ensure they use the presentation topic as the title
      if (slide.type === 'youtube' || slide.layout === 'videoSlide') {
        slide.title = prompt;
      }
      
      return {
        ...slide,
        id: `slide-${index + 1}`,
      };
    });

    return {
      id: nanoid(),
      topic: prompt,
      slides: processedSlides,
      theme,
      transition: 'fade', // Adding default transition
    }
  } catch (error) {
    console.error('Error in generatePresentation:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    } else {
      console.error('Unknown error type:', typeof error)
    }
    return {
      id: nanoid(),
      topic: prompt,
      slides: [{
        id: nanoid(),
        title: 'Error Generating Presentation',
        content: 'There was an error generating your presentation. Please try again.',
        image: `https://via.placeholder.com/1024x1024?text=${encodeURIComponent('Error')}`,
        layout: 'titleSlide',
        order: 0,
      }],
      theme,
      transition: 'fade', // Adding default transition
    }
    }
  }

export { generateImagesForSlide as regenerateImage }

