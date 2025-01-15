'use server'

import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
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

async function generateImagesForSlide(slide: any, theme: string): Promise<string> {
  console.log('Generating image for slide:', slide.title)
  
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
    console.log('Generating image for layout:', slide.layout)
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

export async function generatePresentation(prompt: string, theme: string, slideCount: number): Promise<Presentation> {
  console.log('Starting presentation generation for prompt:', prompt, 'theme:', theme, 'slideCount:', slideCount)
  
  try {
    console.log('Generating text content with OpenAI...')
    const { text } = await generateText({
      model: openai('gpt-4o'),
      prompt: `Create an engaging and educational presentation about ${prompt} for students. Format the response as JSON with the following structure:
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
      Generate ${slideCount} slides with diverse layouts and engaging, educational content suitable for students. Make sure to use different layouts for visual variety. The first slide should always be a titleSlide layout. Ensure each slide has substantial content, including the main content and relevant bullet points or other layout-specific information. Strictly adhere to the JSON format without any additional text or explanations outside the JSON structure.`,
    })

    console.log('Parsing AI response...')
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
        throw new Error('Invalid response format from AI: Unknown error.')
      }
    }

    if (!content?.slides?.length) {
      throw new Error('Invalid or empty slides data received from AI')
    }

    console.log('Generating slides with images...')
    const slides: Slide[] = await Promise.all(
      content.slides.map(async (slide: any, index: number) => {
        console.log(`Processing slide ${index + 1}:`, slide.title)
        
        try {
          const image = await generateImagesForSlide(slide, theme)

          return {
            id: nanoid(),
            title: slide.title || `Slide ${index + 1}`,
            content: slide.content || '',
            bulletPoints: slide.bulletPoints || [],
            image: image,
            statistics: slide.statistics || [],
            timeline: slide.timeline || [],
            comparison: slide.comparison || { left: { title: 'Left Title', points: [] }, right: { title: 'Right Title', points: [] } }, // Added titles
            quote: slide.quote || { text: '', author: '' },
            layout: slide.layout as SlideLayout,
            order: index,
            ...(slide.layout === 'titleSlide' && {
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
            layout: 'contentWithImage' as SlideLayout,
            order: index,
          }
        }
      })
    )

    console.log('Presentation generation completed successfully')
    return {
      id: nanoid(),
      slides,
      theme,
    }
  } catch (error) {
    console.error('Error in generatePresentation:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    } else {
      console.error('Unknown error type:', typeof error)
    }
    // Return a basic presentation with an error slide
    return {
      id: nanoid(),
      slides: [{
        id: nanoid(),
        title: 'Error Generating Presentation',
        content: 'There was an error generating your presentation. Please try again.',
        image: `https://via.placeholder.com/1024x1024?text=${encodeURIComponent('Error')}`,
        layout: 'contentWithImage',
        order: 0,
      }],
      theme,
    }
  }
}

export const regenerateImage = generateImage // Export regenerateImage

