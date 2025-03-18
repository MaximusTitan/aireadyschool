import { NextResponse } from "next/server";
import { callAI, Message, extractJSON } from "@/utils/ai-client";
import { COMIC_FORMATS } from '@/types/comic';

interface CharacterDescription {
  name: string;
  appearance: {
    physique: string;
    face: string;
    hair: string;
    eyes: string;
    clothing: string;
    accessories: string;
    distinctiveFeatures: string;
  };
  personality: string;
}

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
    
    // First, generate detailed character descriptions
    const characterMessages: Message[] = [
      {
        role: "system",
        content: `You are a professional comic book character designer who creates visually distinctive, consistent characters. You focus on highly specific visual details that can be maintained across multiple panels.`
      },
      {
        role: "user",
        content: `For this comic prompt: "${prompt}"
        Create detailed character descriptions including:
        1. Names and roles
        2. Detailed physical appearance with specific, identifiable features (height, build, age)
        3. Very specific facial features (shape of face, distinctive nose/jaw/etc., expressions)
        4. Exact hair style and color with details (e.g., "wavy shoulder-length bright red hair with side-swept bangs")
        5. Specific clothing and accessories (exact colors, styles, patterns)
        6. 2-3 distinctive visual features that make this character instantly recognizable
        7. Personality traits that affect appearance (posture, expressions)

        Format as JSON with a mainCharacter object and an array of supportingCharacters objects.
        Use extremely specific visual descriptions that an image generator can maintain consistency with.
        Focus on VISUAL details only - no backstory or non-visual information.`
      }
    ];

    const characterData = await callAI(characterMessages, {
      provider,
      maxTokens: 1000,
      temperature: 0.7
    });

    const characterDescriptions = extractJSON(characterData.choices[0].message.content);
    
    // Before generating the comic panels, create a narrative arc outline for coherence
    const outlineMessages: Message[] = [
      {
        role: "system",
        content: `You are a professional comic book writer who creates coherent narrative arcs with clear beginning, middle, and end. Create complete narrative outlines that maintain coherence across all panels.`
      },
      {
        role: "user",
        content: `For this comic prompt: "${prompt}"
        Using exactly ${requestedPanels-1} panels (not counting title), create a brief narrative outline that:
        1. Has a clear beginning, middle, and end
        2. Maintains logical progression between each panel
        3. Has a satisfying conclusion
        4. Uses these characters: ${JSON.stringify(characterDescriptions)}
        
        Format as a simple array of panel descriptions, one for each panel (${requestedPanels-1} total).
        Each description should be 1-2 sentences only describing what happens in that panel.
        The goal is to create a coherent story flow that will guide the detailed panel creation.`
      }
    ];

    const outlineData = await callAI(outlineMessages, {
      provider,
      maxTokens: 1000,
      temperature: 0.7
    });
    
    // Extract the narrative outline
    const narrativeOutlineText = outlineData.choices[0].message.content;
    let narrativeOutline: string[] = [];
    
    try {
      // Try to parse as JSON first
      narrativeOutline = JSON.parse(narrativeOutlineText);
    } catch (error) {
      // If not valid JSON, try to extract lines as an outline
      interface NarrativeOutlineResponse {
        split: (pattern: RegExp) => string[];
      }

      narrativeOutline = (narrativeOutlineText as NarrativeOutlineResponse)
        .split(/\r?\n/)
        .filter((line: string): boolean => line.trim().length > 0)
        .map((line: string): string => line.replace(/^\d+\.\s*/, '').trim())
        .slice(0, requestedPanels-1);
    }
    
    // Now generate the full panels with the narrative outline as context
    const messages: Message[] = [
      {
        role: "system",
        content: `You are a professional comic book writer specializing in ${format} format comics.
        IMPORTANT RULES:
        1. Create EXACTLY ${requestedPanels-1} story panels (plus title panel). This is non-negotiable.
        2. Each panel must have TWO distinct dialogue lines (minimum 10 words total per panel).
        3. Dialogue must advance the story and reveal character personality.
        4. Follow the narrative outline exactly to maintain story coherence.
        5. Make the visual descriptions highly detailed and focused on action and composition.
        6. Use these exact character descriptions for visual consistency:
        ${JSON.stringify(characterDescriptions)}`
      },
      {
        role: "user",
        content: `Create a comic with EXACTLY ${requestedPanels-1} story panels based on: "${prompt}"

It's CRITICAL that you follow this narrative outline exactly to maintain story coherence:
${narrativeOutline.map((outline, i) => `Panel ${i+1}: ${outline}`).join('\n')}

Each panel MUST include:
{
  "scene": {
    "description": "Detailed visual description focusing on character positions, actions, and environment",
    "camera": "Specific camera angle and framing that enhances storytelling",
    "lighting": "Mood-enhancing lighting details",
    "characters": "Exact positions, expressions, and interactions"
  },
  "dialogue": {
    "line1": "First line of dialogue (speaker: content)",
    "line2": "Second line of dialogue (different speaker: content)"
  },
  "effects": ["Sound effects", "Visual effects"]
}

Return a JSON object with:
1. "title": Creative comic title based on the prompt
2. "panels": Array of EXACTLY ${requestedPanels-1} panel objects following the structure above

VERIFY you have exactly ${requestedPanels-1} panels before returning.`
      }
    ];

    const data = await callAI(messages, { 
      provider,
      model: provider === 'groq' ? 'llama-3.3-70b-versatile' : undefined,
      maxTokens: 3000, // Increased token count for longer responses
      temperature: 0.7
    });

    let result = data.choices?.[0]?.message?.content?.trim();

    if (!result) {
      throw new Error("Empty response from AI API.");
    }
    
    // Extract JSON and handle any formatting issues
    let jsonResponse;
    try {
      jsonResponse = extractJSON(result);
      
      // Validate panel count
      if (!jsonResponse.panels || !Array.isArray(jsonResponse.panels)) {
        throw new Error("Invalid panels array in response");
      }
      
      // Extract title - use prompt as fallback
      const actualTitle = jsonResponse.title || actualPrompt;
      const fullDescription = actualPrompt;
      
      // Process panels to ensure clear separation between scene descriptions and dialogues
      // and guarantee exactly two lines of dialogue per panel
      let processedPanels = jsonResponse.panels.map((panel: any) => {
        // Handle both object-based and string-based dialogue formats
        let dialogueLines = [];
        
        if (typeof panel.dialogue === 'object') {
          // Handle dialogue as object with line1/line2 properties
          if (panel.dialogue.line1) dialogueLines.push(panel.dialogue.line1);
          if (panel.dialogue.line2) dialogueLines.push(panel.dialogue.line2);
        } else if (typeof panel.dialogue === 'string') {
          // Split string dialogue into lines
          dialogueLines = panel.dialogue.split(/\n|\\n/).filter((line: string) => line.trim().length > 0);
        }
        
        // Ensure we have exactly two dialogue lines
        while (dialogueLines.length < 2) {
          // Generate appropriate placeholder based on scene context
          const sceneParts = typeof panel.scene === 'object' ? 
            `${panel.scene.description || ''} ${panel.scene.characters || ''}` : 
            panel.scene || '';
            
          // Extract potential character names from scene (capitalized words)
          const potentialNames = sceneParts.match(/\b[A-Z][a-z]+\b/g) || ['Character'];
          const characterName = potentialNames[dialogueLines.length % potentialNames.length];
          
          // Create contextual dialogue
          dialogueLines.push(`${characterName}: "${generateContextualDialogue(sceneParts, dialogueLines.length)}"`);
        }
        
        // If we have more than 2 lines, keep only the first 2
        if (dialogueLines.length > 2) {
          dialogueLines = dialogueLines.slice(0, 2);
        }
        
        // Format scene description
        const scene = typeof panel.scene === 'object' ?
          `${panel.scene.camera || ''} ${panel.scene.description || ''} 
           Characters: ${panel.scene.characters || ''}
           Lighting: ${panel.scene.lighting || ''}` :
          panel.scene || '';
          
        // Create final dialogue text with line breaks
        const dialogue = dialogueLines.join('\n');
        
        return { 
          scene: scene.trim(), 
          dialogue: dialogue.trim() 
        };
      });
      
      // Final validation of panel count
      const targetPanelCount = requestedPanels - 1; // -1 because title is separate
      
      console.log(`API: Processed ${processedPanels.length} panels, target is ${targetPanelCount}`);
      
      // Adjust panel count if needed
      if (processedPanels.length < targetPanelCount) {
        console.log(`API: Adding ${targetPanelCount - processedPanels.length} panels to reach ${targetPanelCount}`);
        
        // Extract characters for context
        const existingChars = extractCharactersFromPanels(processedPanels);
        const mainChar = characterDescriptions?.mainCharacter?.name || existingChars[0] || 'Hero';
        
        // Generate panels to reach target count based on narrative arc position
        while (processedPanels.length < targetPanelCount) {
          const panelNum = processedPanels.length + 1;
          const progress = panelNum / targetPanelCount;
          
          // Insert scene based on narrative position
          let sceneDescription;
          let dialogueText;
          
          // Use the narrative outline if available, otherwise generate
          if (panelNum <= narrativeOutline.length) {
            sceneDescription = `Scene following narrative: ${narrativeOutline[panelNum-1]}
            Characters maintain consistent appearance with ${mainChar} as the focus.`;
            dialogueText = generateDialogueFromNarrative(narrativeOutline[panelNum-1], existingChars);
          } else {
            sceneDescription = generateContextualScene(existingChars, progress, panelNum);
            dialogueText = `${mainChar}: "We need to continue with our mission!"\nSupporting character: "I'm right behind you, ${mainChar}!"`;
          }
          
          processedPanels.push({
            scene: sceneDescription,
            dialogue: dialogueText
          });
        }
      } else if (processedPanels.length > targetPanelCount) {
        console.log(`API: Truncating from ${processedPanels.length} to ${targetPanelCount}`);
        // Truncate to the exact panel count
        processedPanels = processedPanels.slice(0, targetPanelCount);
      }
      
      console.log(`API: Final panel count: ${processedPanels.length} scenes + 1 title = ${processedPanels.length + 1} total`);
      
      // Verify no empty or duplicate dialogues
      processedPanels = ensureUniqueDialogues(processedPanels);

      // Ensure the scene descriptions are focused on visual elements only
      processedPanels = processedPanels.map((panel: any, index: number) => {
        // Enhanced scene cleaning: remove dialogue quotes but keep visual descriptions
        const cleanScene = panel.scene
          .replace(/["'].*?["']/g, '[dialogue]') // Replace quoted text with [dialogue] placeholder
          .replace(/\[[^\]]*\]/g, '')            // Remove text in brackets
          .replace(/(\w+:)/g, '')                // Remove "Character:" dialogue indicators
          .replace(/\s+/g, ' ')                  // Normalize whitespace
          .trim();
        
        // Add visual consistency reminder to every scene
        const enhancedScene = `${cleanScene}
        Characters must have the exact same appearance as previously established.`.trim();
        
        return {
          ...panel,
          scene: enhancedScene || `Scene for panel ${index + 1}`
        };
      });

      // Construct final response with properly formed arrays
      const scenesArray = [actualTitle, ...processedPanels.map((p: any) => p.scene)];
      const dialoguesArray = [fullDescription, ...processedPanels.map((p: any) => p.dialogue)];

      // Log the final dialogues that will be displayed
      console.log("Final dialogues to display:", dialoguesArray);

      return NextResponse.json({ 
        prompts: scenesArray,
        dialogues: dialoguesArray,
        title: actualTitle,
        description: fullDescription,
        totalPanels: processedPanels.length,
        requestedPanels: requestedPanels,
        characterDescriptions // Pass character descriptions to image generator
      }, { status: 200 });
      
    } catch (error) {
      console.error("Content generation error:", error);
      return generateDetailedFallback(prompt, requestedPanels, characterDescriptions);
    }
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}

// Improved helper functions

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
    
    // Also extract names from dialogue prefixes (Character: "text")
    const dialoguePrefixes = text.match(/([A-Z][a-z]+):/g);
    if (dialoguePrefixes) {
      dialoguePrefixes.forEach(prefix => {
        const name = prefix.slice(0, -1); // Remove the colon
        characters.add(name);
      });
    }
  });
  
  return Array.from(characters);
}

function generateContextualScene(characters: string[], progress: number, panelNum: number): string {
  const char1 = characters[0] || 'Hero';
  const char2 = characters.length > 1 ? characters[1] : 'Ally';
  
  // Create scene description based on narrative progress
  if (progress < 0.25) {
    return `${char1} stands determined, surveying the situation before them as ${char2} approaches from the side. The environment shows early signs of the conflict to come.`;
  } else if (progress < 0.5) {
    return `The confrontation intensifies as ${char1} and ${char2} face opposition together. Dynamic action shot with dramatic lighting highlighting their expressions.`;
  } else if (progress < 0.75) {
    return `A moment of crisis as ${char1} makes a difficult decision while ${char2} reacts with concern. The environment shows the consequences of their previous actions.`;
  } else if (progress < 0.9) {
    return `${char1} reveals their true strength or strategy with ${char2} watching in amazement. The scene is dramatically lit to emphasize this turning point.`;
  } else {
    return `The resolution unfolds as ${char1} and ${char2} stand together in the aftermath. Their expressions show the impact of their journey and victory.`;
  }
}

function generateContextualDialogue(sceneText: string, lineIndex: number): string {
  // Extract keywords from scene to make dialogue more relevant
  const keywords = sceneText
    .replace(/[^\w\s]/g, '')
    .split(' ')
    .filter(word => word.length > 4);
  
  // Pick a couple of random keywords if available
  const keyword1 = keywords.length > 0 ? keywords[Math.floor(Math.random() * keywords.length)] : 'mission';
  const keyword2 = keywords.length > 1 ? keywords[Math.floor(Math.random() * keywords.length)] : 'situation';
  
  // Dialogue options based on line index
  if (lineIndex === 0) {
    return `We need to handle this ${keyword1} before it's too late!`;
  } else {
    return `I've never seen this kind of ${keyword2} before. We should be careful.`;
  }
}

function generateDialogueFromNarrative(narrativePoint: string, characters: string[]): string {
  const mainChar = characters[0] || 'Hero';
  const secondChar = characters.length > 1 ? characters[1] : 'Ally';
  
  // Extract key verbs and nouns from narrative
  const words = narrativePoint.split(' ');
  const verbs = words.filter(word => word.endsWith('s') || word.endsWith('ing'));
  const verb = verbs.length > 0 ? verbs[0].toLowerCase() : 'continuing';
  
  // Generate dialogue based on narrative content
  const line1 = `${mainChar}: "This is our chance to ${verb.replace(/ing$/, '')} before it's too late!"`;
  const line2 = `${secondChar}: "I'll follow your lead on this, ${mainChar}. We've come too far to turn back now."`;
  
  return `${line1}\n${line2}`;
}

// Ensure dialogues are unique, meaningful and always have two lines
function ensureUniqueDialogues(panels: any[]): any[] {
  const usedDialogues = new Set<string>();
  
  return panels.map((panel, index) => {
    let dialogue = panel.dialogue;
    
    // If dialogue is empty, generate a new one
    if (!dialogue || dialogue.trim().length === 0) {
      // Extract characters from the scene
      const sceneWords = panel.scene.split(' ');
      const potentialNames: string[] = sceneWords.filter((word: string): boolean => /^[A-Z][a-z]+$/.test(word));
      const character1 = potentialNames[0] || 'Character';
      const character2 = potentialNames[1] || 'Ally';
      
      // Generate context-appropriate dialogue
      dialogue = `${character1}: "We need to act quickly before it's too late!"\n${character2}: "I'm with you all the way, ${character1}. Let's do this!"`;
    }
    
    // Ensure dialogue has at least two lines
    const dialogueLines: string[] = dialogue.split(/\n|\\n/).filter((line: string): boolean => line.trim().length > 0);
    
    if (dialogueLines.length < 2) {
      // If only one line, add a response
      const existingLine = dialogueLines[0] || '';
      
      // Try to extract speaker from existing line
      const speaker = existingLine.match(/^([A-Z][a-z]+):/)?.[1] || 'Character';
      const responseChar = speaker === 'Character' ? 'Ally' : 'Character';
      
      // Add response line
      dialogueLines.push(`${responseChar}: "I understand, ${speaker}. We'll figure this out together."`);
    }
    
    // Join dialogue lines
    const updatedDialogue = dialogueLines.slice(0, 2).join('\n');
    
    // Register the dialogue as used
    usedDialogues.add(updatedDialogue);
    
    return { ...panel, dialogue: updatedDialogue };
  });
}

// Generate an improved fallback with better variety
function generateDetailedFallback(prompt: string, requestedPanels: number, characterDescriptions: any) {
  // Extract characters from the descriptions or the prompt
  let mainCharacter: string;
  let supportingCharacter: string;
  
  if (characterDescriptions?.mainCharacter?.name) {
    mainCharacter = characterDescriptions.mainCharacter.name;
    
    if (characterDescriptions?.supportingCharacters?.length > 0) {
      supportingCharacter = characterDescriptions.supportingCharacters[0].name;
    } else {
      supportingCharacter = 'Ally';
    }
  } else {
    // Extract from prompt
    const characters = prompt.split(/vs|\band\b|,/).map((c: string) => c.trim());
    mainCharacter = characters[0] || 'Hero';
    supportingCharacter = characters[1] || 'Ally';
  }
  
  const title = `${prompt} - Epic Adventure`;
  
  // Initialize arrays for scenes and dialogues
  const scenes = [title]; // First element is the title
  const dialogues = [prompt]; // First dialogue is the description
  
  // Define a comprehensive story arc with distinct scenes and meaningful dialogues
  const storyBeats = [
    {
      scene: `${mainCharacter} appears in a dramatic pose, their distinctive features clearly visible as they survey their surroundings. ${supportingCharacter} stands slightly behind, watching with anticipation.`,
      dialogue: `${mainCharacter}: "The time has finally come to face our destiny."\n${supportingCharacter}: "I've waited for this moment, though I must admit I'm nervous about what lies ahead."`
    },
    {
      scene: `${mainCharacter} discovers an important clue or item, their expression showing determination. The environment is detailed with meaningful objects that relate to their quest.`,
      dialogue: `${mainCharacter}: "This changes everything we thought we knew about the mission."\n${supportingCharacter}: "How could we have missed something so obvious? We need to rethink our approach."`
    },
    {
      scene: `${mainCharacter} and ${supportingCharacter} face their first obstacle, shown from a dynamic angle that emphasizes the challenge. Their body language shows teamwork and determination.`,
      dialogue: `${mainCharacter}: "Stay close and follow my lead. We'll need to work together to overcome this."\n${supportingCharacter}: "I've got your back, just like always. Nothing can stop us when we work as a team."`
    },
    {
      scene: `A moment of conflict as ${mainCharacter} and ${supportingCharacter} disagree on the next step. Their faces show emotion and the environment reflects the tension between them.`,
      dialogue: `${mainCharacter}: "That's too dangerous! There has to be another way forward."\n${supportingCharacter}: "Sometimes the most dangerous path is the only one that leads to success. We have to try."`
    },
    {
      scene: `${mainCharacter} faces a moment of doubt or vulnerability, shown in close-up with detailed expression. ${supportingCharacter} offers support with their body language.`,
      dialogue: `${mainCharacter}: "What if we've come all this way for nothing? What if I'm not strong enough?"\n${supportingCharacter}: "You've never given up before, and I won't let you start now. Remember why we started this journey."`
    },
    {
      scene: `The environment becomes more threatening as ${mainCharacter} and ${supportingCharacter} press forward, their determination visible in their posture and expressions. Dramatic lighting highlights the danger.`,
      dialogue: `${mainCharacter}: "The path ahead is more treacherous than I anticipated. Stay alert for any sign of danger."\n${supportingCharacter}: "I sense something watching us from the shadows. We're not alone here."`
    },
    {
      scene: `${mainCharacter} discovers their inner strength or unique ability, shown with dramatic visual effects. ${supportingCharacter} watches in awe from the side.`,
      dialogue: `${mainCharacter}: "I understand now! This is what I was meant to do all along!"\n${supportingCharacter}: "Incredible! I always knew you had it in you, ${mainCharacter}!"`
    },
    {
      scene: `The climactic confrontation where ${mainCharacter} and ${supportingCharacter} face their greatest challenge, shown from a wide angle to capture the scale of the scene.`,
      dialogue: `${mainCharacter}: "This ends now! Everything we've worked for comes down to this moment!"\n${supportingCharacter}: "Together, there's nothing we can't overcome. Let's finish this!"`
    },
    {
      scene: `A moment of triumph as ${mainCharacter} and ${supportingCharacter} succeed in their quest. Their expressions show relief and joy, with the environment reflecting the positive change.`,
      dialogue: `${mainCharacter}: "We did it. Against all odds, we actually did it."\n${supportingCharacter}: "I never doubted you for a second, ${mainCharacter}. This is just the beginning."`
    },
    {
      scene: `${mainCharacter} and ${supportingCharacter} look toward the future, their expressions showing hope and anticipation. The final panel suggests new adventures ahead.`,
      dialogue: `${mainCharacter}: "This chapter may be over, but our story is far from finished."\n${supportingCharacter}: "Wherever the path leads next, we'll face it together."`
    },
    {
      scene: `An epilogue showing ${mainCharacter} reflecting on their journey, with subtle hints of future challenges. ${supportingCharacter} appears in the background, preparing for what comes next.`,
      dialogue: `${mainCharacter}: "Every ending is just a new beginning in disguise."\n${supportingCharacter}: "And we'll be ready for whatever comes our way next time."`
    },
    {
      scene: `A final wide shot showing ${mainCharacter} and ${supportingCharacter} walking side by side into their next adventure, their distinctive visual features clearly visible from behind.`,
      dialogue: `${mainCharacter}: "The horizon always holds new challenges for those brave enough to seek them."\n${supportingCharacter}: "And new friendships to forge along the way. Lead on, ${mainCharacter}."`
    }
  ];
  
  // Ensure we have enough beats for the requested panels
  while (storyBeats.length < requestedPanels - 1) {
    // Generate additional beats for longer stories
    const existingScenes = storyBeats.map(beat => beat.scene);
    const existingDialogues = storyBeats.map(beat => beat.dialogue);
    
    storyBeats.push({
      scene: `${mainCharacter} and ${supportingCharacter} continue their journey through new terrain, their expressions showing determination despite the growing challenges. The environment features unique elements that hint at the expanding scope of their adventure.`,
      dialogue: `${mainCharacter}: "Each step forward reveals new mysteries I never anticipated."\n${supportingCharacter}: "That's what makes this journey worthwhile, ${mainCharacter}. The unknown becomes known."`
    });
    
    // Add another variant if we still need more
    if (storyBeats.length < requestedPanels - 1) {
      storyBeats.push({
        scene: `A unexpected ally appears to assist ${mainCharacter} and ${supportingCharacter} at a crucial moment. The scene shows all three characters from a dynamic angle that emphasizes their unique visual characteristics.`,
        dialogue: `New Ally: "I've been watching your progress for some time. Perhaps I can be of assistance."\n${mainCharacter}: "We could use all the help we can get for what lies ahead."`
      });
    }
  }
  
  // Add the scenes and dialogues for each panel
  const targetPanels = requestedPanels - 1; // -1 for title
  for (let i = 0; i < targetPanels; i++) {
    if (i < storyBeats.length) {
      scenes.push(storyBeats[i].scene);
      dialogues.push(storyBeats[i].dialogue);
    } else {
      // Fallback for extra panels beyond our story beats (shouldn't happen with our while loop above)
      scenes.push(`${mainCharacter} and ${supportingCharacter} continue their epic quest, facing new challenges together.`);
      dialogues.push(`${mainCharacter}: "We must press on despite the obstacles."\n${supportingCharacter}: "I'm with you all the way, ${mainCharacter}."`);
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
    characterDescriptions: characterDescriptions,
    error: "Using detailed fallback content with compelling narrative arc"
  }, { status: 200 });
}