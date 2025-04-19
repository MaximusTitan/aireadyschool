import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(req: Request) {
  try {
    const { inputs, generateScenes, story } = await req.json();
    
    if (generateScenes) {
      const numScenes = Math.floor(parseInt(inputs.storyDuration) / 5);
      
      const scenesPrompt = `Break down this story into exactly ${numScenes} scenes. Format each scene EXACTLY as shown:

Scene 1: [Main action in 5 seconds] | Visual: [camera angle, lighting, setting] | Focus: [key elements]
Scene 2: [Main action in 5 seconds] | Visual: [camera angle, lighting, setting] | Focus: [key elements]

Story: ${story}

Requirements:
- Create exactly ${numScenes} scenes
- Each scene must be 5 seconds long
- Each scene must follow the exact format shown above
- Start each scene with "Scene [number]:"
- Use "|" to separate sections
- Include all three sections: main action, Visual, and Focus
- Make each action clearly visualizable in 5 seconds
- Number scenes sequentially (1 to ${numScenes})`;

      console.log("Sending prompt to GPT:", scenesPrompt);

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ 
          role: "user", 
          content: scenesPrompt 
        }],
        temperature: 0.7,
        max_tokens: 1500
      });

      const sceneText = completion.choices[0].message.content ?? '';
      console.log("Received scene text:", sceneText);

      const scenes = parseScenes(sceneText.trim());

      if (scenes.length === 0) {
        console.error("Scene parsing failed. Raw text:", sceneText);
        throw new Error('Scene parsing failed - no scenes detected');
      }

      if (scenes.length < numScenes) {
        console.error(`Only ${scenes.length} scenes generated. Raw text:`, sceneText);
        throw new Error(`Insufficient scenes generated (${scenes.length}/${numScenes})`);
      }

      return NextResponse.json({
        success: true,
        scenes,
        numScenes,
        debug: {
          rawSceneText: sceneText,
          parsedSceneCount: scenes.length
        }
      });
    } else {
      // Enhanced story generation with better formatting
      const storyPrompt = `Create an engaging narrative story based on these elements:

Title: "${inputs.storyTitle}"
Genre: ${inputs.storyGenre}
Main Characters: ${inputs.mainCharacters}
Setting: ${inputs.storyLocation}
Opening Scene: ${inputs.openingScene}

Requirements:
- Write a compelling short story with proper narrative structure
- Use multiple paragraphs with clear breaks between scenes
- Include descriptive language and sensory details
- Start with a strong opening paragraph that sets the scene
- Include character dialogue with proper formatting
- Use transitional phrases between scenes
- Create atmospheric descriptions
- End with a satisfying conclusion
- Format with proper spacing between paragraphs
- Use varied sentence structures
- Include emotional elements
- Show character development
- Write in an immersive, literary style

Style Guidelines:
- Start new paragraphs for new scenes/speakers
- Use quotation marks for dialogue
- Add line breaks between major scene changes
- Include internal character thoughts where appropriate
- Balance description with action
- Use strong verbs and vivid adjectives

Length: Approximately 400-500 words
Format: Literary prose with proper paragraph structure`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: storyPrompt }],
        temperature: 0.8,
        max_tokens: 1500
      });

      const refinedStory = completion.choices[0].message.content;

      // Format the story with proper spacing
      const formattedStory = formatStory(refinedStory || '');

      return NextResponse.json({
        success: true,
        refinedStory: formattedStory,
        intendedDuration: inputs.storyDuration,
        numScenes: Math.floor(parseInt(inputs.storyDuration) / 5)
      });
    }
  } catch (error) {
    console.error('Error in video-story-generator:', error);
    return NextResponse.json({
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { 
      status: 500 
    });
  }
}

function parseScenes(sceneText: string) {
  const scenes = [];
  const sceneRegex = /Scene\s*(\d+)\s*:\s*([^|]+?)\s*\|\s*Visual:\s*([^|]+?)\s*\|\s*Focus:\s*([^\n]+)/gi;
  let match;

  while ((match = sceneRegex.exec(sceneText)) !== null) {
    const sceneNumber = match[1];
    const description = match[2].trim();
    const visualDetails = match[3].trim();
    const focusElements = match[4].trim();

    const imagePrompt = `Professional cinematic illustration of: ${description}. Scene details: ${visualDetails}. Key focus: ${focusElements}. Style: high-quality cinematic frame, detailed composition, dramatic lighting, professional photography quality, 8K resolution, movie still aesthetic`;

    scenes.push({
      id: `scene-${sceneNumber}`,
      number: parseInt(sceneNumber),
      text: description,
      visualDetails,
      focusElements,
      imagePrompt,
      imageUrl: ''
    });
  }

  return scenes.sort((a, b) => a.number - b.number);
}

function formatStory(story: string) {
  return story
    .trim()
    // Ensure proper spacing around dialogue
    .replace(/([.!?])"(\s*)([A-Z])/g, '$1"\n\n$3')
    // Add spacing between scene breaks
    .replace(/\n{3,}/g, '\n\n')
    // Ensure proper paragraph spacing
    .split('\n\n')
    .filter(paragraph => paragraph.trim())
    .join('\n\n')
    // Add extra spacing around scene transitions
    .replace(/([.!?])\s*(Meanwhile|Later|Suddenly|After|Before|The next|That evening|That morning|Days later)/g, '$1\n\n$2')
    // Format dialogue paragraphs
    .replace(/(".*?[.!?]")\s*/g, '$1\n')
    // Clean up any remaining multiple spaces
    .replace(/\s{2,}/g, ' ');
}