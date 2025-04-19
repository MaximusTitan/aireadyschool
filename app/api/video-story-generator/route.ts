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
      // Initial story generation with proper narrative structure
      const storyPrompt = `Create an engaging narrative story based on these elements:

Title: "${inputs.storyTitle}"
Genre: ${inputs.storyGenre}
Main Characters: ${inputs.mainCharacters}
Setting: ${inputs.storyLocation}
Opening Scene: ${inputs.openingScene}

Requirements:
- Write a complete, flowing narrative
- Use proper paragraphs and story structure
- Include character development
- Create vivid descriptions
- Maintain dramatic tension
- Make it engaging and immersive
- Focus on storytelling, not technical directions
- Avoid screenplay format or scene markers
- Don't mention camera angles or visual directions
- Write it as a short story that could be read independently

Length: Approximately 300-400 words
Style: Professional creative writing`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: storyPrompt }],
        temperature: 0.8,
        max_tokens: 1000
      });

      const refinedStory = completion.choices[0].message.content;

      return NextResponse.json({
        success: true,
        refinedStory,
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