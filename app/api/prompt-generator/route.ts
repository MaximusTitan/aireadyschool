import { NextResponse } from "next/server";
import { callAI, Message, extractJSON } from "@/utils/ai-client";
import { COMIC_FORMATS } from '@/types/comic';

export async function POST(request: Request) {
  try {
    const { prompt, provider = 'groq', numPanels = 8, enforceCount = true } = await request.json();
    
    // Validate panel count
    const requestedPanels = Number(numPanels);
    if (isNaN(requestedPanels) || requestedPanels <= 0) {
      return NextResponse.json(
        { error: "Invalid panel count provided" },
        { status: 400 }
      );
    }
    
    console.log(`API: Generating ${requestedPanels} panels (${requestedPanels-1} scenes plus title) using ${provider}`);
    
    // Determine comic format based on panel count
    const format = requestedPanels <= 4 ? 'short' 
                : requestedPanels <= 8 ? 'standard'
                : 'detailed';
    
    const comicStructure = COMIC_FORMATS[format];
    
    // Clean up title if it starts with "Create a..."
    const cleanPrompt = prompt.replace(/^Create a.*titled\s*"([^"]+)".*$/i, '$1').trim();
    const actualPrompt = cleanPrompt || prompt;
    
    const messages: Message[] = [
      {
        role: "system",
        content: `You are a comic book writer specializing in ${format} format comics with ${comicStructure.detailLevel} detail level.
        IMPORTANT: Create EXACTLY ${requestedPanels-1} panels (not including title). This is a strict requirement.
        Maximum dialogue length per panel: ${comicStructure.dialogueLength} words.`
      },
      {
        role: "user",
        content: `Create a comic with EXACTLY ${requestedPanels-1} story panels based on: "${prompt}"

It's CRITICAL that you create EXACTLY ${requestedPanels-1} story panels, no more, no less.

Story Structure (for all ${requestedPanels-1} panels):
${comicStructure.structure.slice(0, requestedPanels-1).map((s, i) => `${i + 1}. ${s}`).join('\n')}

Each panel must include:
{
  "scene": "Detailed visual description (${comicStructure.detailLevel} detail)",
  "dialogue": "Character dialogue (max ${comicStructure.dialogueLength} words)",
  "emotion": "Character's emotional state",
  "effects": ["Sound effects", "Action words"],
  "cameraAngle": "Shot type and perspective"
}

Return a JSON object with:
1. "title": Comic title
2. "panels": Array of EXACTLY ${requestedPanels-1} panel objects

VERIFY you have exactly ${requestedPanels-1} panels before returning.`
      }
    ];

    const data = await callAI(messages, { 
      provider: 'groq',
      model: 'mixtral-8x7b-32768',
      maxTokens: 2000, // Increased token count for longer responses
      temperature: 0.7
    });

    const result = data.choices?.[0]?.message?.content?.trim();

    if (!result) {
      throw new Error("Empty response from AI API.");
    }
    
    console.log("AI response for prompt generation:", result);

    // Extract and validate JSON
    try {
      const jsonResponse = extractJSON(result);
      
      // Validate panel count
      if (!jsonResponse.panels || !Array.isArray(jsonResponse.panels)) {
        throw new Error("Invalid panels array in response");
      }
      
      // Extract title - use prompt as fallback
      const actualTitle = jsonResponse.title || actualPrompt;
      const fullDescription = actualPrompt;
      
      // Make sure we have the exact number of panels
      const targetPanelCount = requestedPanels - 1; // -1 because title is separate
      
      // Process panels to ensure clear separation between scene descriptions and dialogues
      let processedPanels = jsonResponse.panels.map((panel: any) => {
        // Make sure dialogue is a string
        const dialogue = typeof panel.dialogue === 'string' ? panel.dialogue : '';
        
        // Process effects if they exist
        const effectsText = panel.effects && Array.isArray(panel.effects) && panel.effects.length > 0
          ? ` [${panel.effects.join(' ')}]`
          : '';
          
        // Create a clean scene description without dialogue elements
        // Focus only on visual elements for image generation
        const scene = `${panel.cameraAngle || ''} ${panel.scene}`.trim();
        
        return {
          // Pure visual scene description for image generation
          scene: scene,
          // Full dialogue with sound effects for speech bubbles
          dialogue: dialogue ? dialogue + effectsText : dialogue
        };
      });
      
      console.log(`API: Processed ${processedPanels.length} panels, target is ${targetPanelCount}`);
      
      // If we have too many or too few panels, adjust
      if (processedPanels.length < targetPanelCount) {
        console.log(`API: Adding ${targetPanelCount - processedPanels.length} panels to reach ${targetPanelCount}`);
        // Generate additional panels based on existing content
        const existingChars = extractCharactersFromPanels(processedPanels);
        
        while (processedPanels.length < targetPanelCount) {
          const panelNum = processedPanels.length + 1;
          const progress = panelNum / targetPanelCount;
          
          // Generate contextually appropriate panel
          processedPanels.push({
            scene: generateContextualScene(existingChars, progress, panelNum),
            dialogue: generateContextualDialogue(existingChars, progress, panelNum)
          });
        }
      } else if (processedPanels.length > targetPanelCount) {
        console.log(`API: Truncating from ${processedPanels.length} to ${targetPanelCount} panels`);
        // Truncate to the exact panel count
        processedPanels = processedPanels.slice(0, targetPanelCount);
      }
      
      console.log(`API: Final panel count: ${processedPanels.length} scenes + 1 title = ${processedPanels.length + 1} total`);
      
      // Verify no empty or duplicate dialogues
      processedPanels = ensureUniqueDialogues(processedPanels);

      // Ensure the scene descriptions are focused on visual elements only
      processedPanels = processedPanels.map((panel: { scene: string; }, index: number) => {
        // Remove any dialogue quotes or sound effect indicators from scene
        const cleanScene = panel.scene
          .replace(/["'].*?["']/g, '') // Remove quoted text
          .replace(/\[.*?\]/g, '')     // Remove text in brackets
          .trim();
        
        return {
          ...panel,
          scene: cleanScene || `Scene for panel ${index + 1}`
        };
      });

      // Construct final response with properly formed arrays
      const scenesArray = [actualTitle, ...processedPanels.map((p: { scene: any }) => p.scene)];
      const dialoguesArray = [fullDescription, ...processedPanels.map((p: { dialogue: any }) => p.dialogue)];

      // Log the final dialogues that will be displayed
      console.log("Final dialogues to display:", dialoguesArray);

      return NextResponse.json({ 
        prompts: scenesArray,
        dialogues: dialoguesArray,
        title: actualTitle,
        description: fullDescription,
        totalPanels: processedPanels.length,
        requestedPanels: requestedPanels
      }, { status: 200 });
      
    } catch (error) {
      console.error("Content generation error:", error);
      
      // Enhanced fallback that generates exact number of panels
      const characters = prompt.split(/vs|\band\b|,/).map((c: string) => c.trim());
      const title = `${prompt} - Epic Confrontation`;
      
      // More relevant fallback scenes and dialogues
      const scenes = [title];
      const dialogues = [title];
      
      // Create generic scenes that can scale to any number
      const generateGenericScene = (idx: number) => {
        const totalPanels = requestedPanels - 1;
        const progress = idx / totalPanels;
        
        // Define dynamic scene based on story progress
        if (progress < 0.2) {
          return `${characters[0]} and ${characters[1]} meet for the first time in a tense standoff`;
        } else if (progress < 0.4) {
          return `${characters[0]} makes the first move while ${characters[1]} prepares to counter`;
        } else if (progress < 0.6) {
          return `The battle between ${characters[0]} and ${characters[1]} intensifies with spectacular attacks`;
        } else if (progress < 0.8) {
          return `${characters[1]} seems to gain the upper hand as ${characters[0]} is pushed to the limit`;
        } else if (progress < 0.9) {
          return `${characters[0]} reveals a hidden strength or strategy that changes the tide of battle`;
        } else {
          return `The conflict between ${characters[0]} and ${characters[1]} reaches its dramatic conclusion`;
        }
      };
      
      const generateGenericDialogue = (idx: number) => {
        const totalPanels = requestedPanels - 1;
        const progress = idx / totalPanels;
        
        // Define dynamic dialogue based on story progress
        if (progress < 0.2) {
          return `"We meet at last, ${characters[1]}. This ends here!"`;
        } else if (progress < 0.4) {
          return `"You have no idea what you're dealing with, ${characters[0]}!"`;
        } else if (progress < 0.6) {
          return `"Is that all you've got? [WHAM! CRASH!]"`;
        } else if (progress < 0.8) {
          return `"I won't... give up... that easily! [WHOOSH!]"`;
        } else if (progress < 0.9) {
          return `"This is my true power! [KABOOM!]"`;
        } else {
          return `"Perhaps we're not so different after all..."`;
        }
      };

      // Create exactly the requested number of panels
      const targetPanels = requestedPanels - 1;
      
      console.log(`API FALLBACK: Generating ${targetPanels} generic panels`);
      
      // Add scenes and dialogues based on requested panel count
      for (let i = 0; i < targetPanels; i++) {
        scenes.push(generateGenericScene(i));
        dialogues.push(generateGenericDialogue(i));
      }
      
      console.log(`API FALLBACK: Generated ${scenes.length-1} scenes + 1 title = ${scenes.length} total`);

      return NextResponse.json({ 
        prompts: scenes,
        dialogues: dialogues,
        title: title,
        description: prompt,
        totalPanels: targetPanels,
        requestedPanels: requestedPanels,
        error: "Using character-specific fallback content"
      }, { status: 200 });
    }
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}

// Helper functions for panel generation

function extractCharactersFromPanels(panels: any[]): string[] {
  // Extract character names mentioned in panels
  const characters: Set<string> = new Set();
  
  panels.forEach(panel => {
    const text = panel.scene + ' ' + panel.dialogue;
    
    // Look for names (capitalized words)
    const nameMatches = text.match(/\b[A-Z][a-z]+\b/g);
    if (nameMatches) {
      nameMatches.forEach(name => {
        // Filter out common words that might be capitalized
        if (!['The', 'A', 'An', 'In', 'On', 'At', 'With'].includes(name)) {
          characters.add(name);
        }
      });
    }
  });
  
  return Array.from(characters);
}

function generateContextualScene(characters: string[], progress: number, panelNum: number): string {
  const char1 = characters[0] || 'Hero';
  const char2 = characters[1] || 'Villain';
  
  // Create scene description based on narrative progress
  if (progress < 0.25) {
    return `${char1} advances with determination, preparing to face ${char2}`;
  } else if (progress < 0.5) {
    return `The battle intensifies as ${char1} and ${char2} exchange powerful blows`;
  } else if (progress < 0.75) {
    return `${char2} reveals a hidden ability, putting ${char1} on the defensive`;
  } else if (progress < 0.9) {
    return `${char1} gathers strength for one final, decisive attack against ${char2}`;
  } else {
    return `The dust settles, showing the aftermath of the epic confrontation between ${char1} and ${char2}`;
  }
}

function generateContextualDialogue(characters: string[], progress: number, panelNum: number): string {
  const char1 = characters[0] || 'Hero';
  const char2 = characters[1] || 'Villain';
  
  // Create unique dialogue based on narrative progress
  if (progress < 0.25) {
    return `"This ends now, ${char2}!"`;
  } else if (progress < 0.5) {
    return `"You'll never defeat me, ${char1}! [CRASH]"`;
  } else if (progress < 0.75) {
    return `"Is this... all you've got? I expected more..."`;
  } else if (progress < 0.9) {
    return `"I won't let you win! This is for everyone you've hurt!"`;
  } else {
    return `"Next time we meet, things will be different..."`;
  }
}

// Ensure dialogues are unique and not empty
function ensureUniqueDialogues(panels: any[]): any[] {
  const usedDialogues = new Set<string>();
  
  return panels.map((panel, index) => {
    let dialogue = panel.dialogue;
    
    // If dialogue is empty or already used, generate a new one
    if (!dialogue || usedDialogues.has(dialogue)) {
      // Simple placeholder dialogue with panel number to ensure uniqueness
      dialogue = `"Panel ${index + 1} dialogue"`;
      
      // Try to make it more relevant to the scene
      const sceneWords = panel.scene.split(' ');
      if (sceneWords.length > 3) {
        // Extract potential subject and action from scene
        const subject: string = sceneWords.find((word: string) => /^[A-Z]/.test(word)) || '';
        const action: string = sceneWords.find((word: string) => word.endsWith('s') || word.endsWith('ing')) || '';
        
        if (subject && action) {
          dialogue = `"${subject} continues ${action.toLowerCase()}..."`;
        }
      }
    }
    
    // Register the dialogue as used
    usedDialogues.add(dialogue);
    return { ...panel, dialogue };
  });
}

// Generate an improved fallback with better variety
function generateImprovedFallback(prompt: string, requestedPanels: number) {
  // Extract characters from the prompt
  const characters = prompt.split(/vs|\band\b|,/).map((c: string) => c.trim());
  const title = `${prompt} - Epic Confrontation`;
  
  // Initialize arrays for scenes and dialogues
  const scenes = [title]; // First element is the title
  const dialogues = [prompt]; // First dialogue is the description
  
  // Generate unique scenes and dialogues for each panel
  const char1 = characters[0] || 'Hero';
  const char2 = characters[1] || 'Villain';
  
  // Define a variety of scenes and dialogues for better storytelling
  const storyBeats = [
    {
      scene: `${char1} appears in a dramatic entrance, surveying the area`,
      dialogue: `"I've been waiting for this moment, ${char2}..."`
    },
    {
      scene: `${char2} emerges from the shadows, a sinister smile forming`,
      dialogue: `"Finally, we meet face to face, ${char1}."`
    },
    {
      scene: `${char1} and ${char2} circle each other, tension building in the air`,
      dialogue: `"Only one of us will walk away from this."`
    },
    {
      scene: `${char1} makes the first move, launching a surprise attack`,
      dialogue: `"Enough talk! [WHAM]"`
    },
    {
      scene: `${char2} counters with unexpected force, sending ${char1} backward`,
      dialogue: `"Is that really all you can do? Pathetic."`
    },
    {
      scene: `${char1} regains composure, analyzing ${char2}'s weaknesses`,
      dialogue: `"I'm just getting started!"`
    },
    {
      scene: `The environment shakes as their powers collide dramatically`,
      dialogue: `"You'll never defeat me! [KABOOM]"`
    },
    {
      scene: `${char1} reveals a hidden technique, catching ${char2} off guard`,
      dialogue: `"I've been saving this just for you!"`
    },
    {
      scene: `${char2} stumbles back, clearly wounded but still defiant`,
      dialogue: `"Impossible... how did you...?"`
    },
    {
      scene: `${char1} prepares for a final, decisive blow against ${char2}`,
      dialogue: `"This ends now!"`
    },
    {
      scene: `The dust settles, revealing the outcome of their intense battle`,
      dialogue: `"It's over."`
    },
    {
      scene: `${char1} and ${char2} gain a newfound respect for each other's abilities`,
      dialogue: `"Until we meet again..."`
    }
  ];
  
  // Ensure we have enough beats for the requested panels
  while (storyBeats.length < requestedPanels - 1) {
    // Add additional beats by mixing existing ones with variations
    storyBeats.push({
      scene: `${char1} and ${char2} continue their epic confrontation with renewed vigor`,
      dialogue: `"This isn't over yet!"`
    });
  }
  
  // Add the scenes and dialogues for each panel
  const targetPanels = requestedPanels - 1; // -1 for title
  for (let i = 0; i < targetPanels; i++) {
    if (i < storyBeats.length) {
      scenes.push(storyBeats[i].scene);
      dialogues.push(storyBeats[i].dialogue);
    } else {
      // Fallback for extra panels beyond our story beats
      scenes.push(`The battle between ${char1} and ${char2} continues`);
      dialogues.push(`"You won't win!"`);
    }
  }
  
  console.log(`FALLBACK: Generated ${scenes.length-1} unique scenes + 1 title = ${scenes.length} total`);
  
  return NextResponse.json({
    prompts: scenes,
    dialogues: dialogues,
    title: title,
    description: prompt,
    totalPanels: targetPanels,
    requestedPanels: requestedPanels,
    error: "Using improved fallback content with unique dialogues"
  }, { status: 200 });
}
