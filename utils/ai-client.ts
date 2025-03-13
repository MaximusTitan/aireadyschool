type AIProvider = 'openai' | 'groq';
type MessageRole = 'system' | 'user' | 'assistant';

export interface Message {
  role: MessageRole;
  content: string;
}

interface AIClientOptions {
  provider?: AIProvider;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

// Default models for each provider
const DEFAULT_MODELS = {
  openai: 'gpt-4o',
  groq: 'mixtral-8x7b-32768'
};

// Add improved JSON extraction to handle problematic responses

export function extractJSON(text: string): any {
  // Try to find JSON content between triple backticks, single backticks, or standalone
  const jsonRegexes = [
    /```(?:json)?\s*([\s\S]*?)```/,  // Triple backticks with optional "json" tag
    /`([\s\S]*?)`/,                  // Single backticks
    /({[\s\S]*})/,                   // Just get content between braces
    /(^\s*\{[\s\S]*\}\s*$)/          // Full JSON response
  ];

  // Try each regex pattern to find JSON
  for (const regex of jsonRegexes) {
    const matches = text.match(regex);
    if (matches && matches[1]) {
      const content = matches[1].trim();
      try {
        return JSON.parse(content);
      } catch (e) {
        // Try to fix common JSON issues before giving up
        try {
          // Replace single quotes with double quotes for property names and string values
          const fixedJson = content
            .replace(/(\w+):\s*/g, '"$1": ') // Fix property names without quotes
            .replace(/'([^']*)'/g, '"$1"')   // Replace single quotes with double quotes
            .replace(/,(\s*[}\]])/g, '$1');  // Remove trailing commas

          return JSON.parse(fixedJson);
        } catch (e2) {
          console.error("Failed first JSON parse attempt, trying regex-based parsing");
          
          // If we still can't parse, try a more aggressive approach
          try {
            // Last resort: Try to rebuild the JSON structure manually
            // This gets complex, so we may need a dedicated JSON repair function
            return attemptJsonReconstruction(content);
          } catch (e3) {
            console.error("Failed to parse JSON after repair attempts");
            // Instead of throwing, we'll return a fallback structure
            console.log("Raw text received:", text);
            
            // Extract any panel-like information we can find
            return createFallbackFromText(text);
          }
        }
      }
    }
  }
  
  // If we couldn't find any JSON pattern, try to create a basic structure from text
  return createFallbackFromText(text);
}

// Helper function for last-resort JSON extraction
function attemptJsonReconstruction(text: string): any {
  // Try to identify key JSON components
  const titleMatch = text.match(/"title"\s*:\s*"([^"]+)"/);
  const title = titleMatch ? titleMatch[1] : "Untitled Comic";
  
  // Try to find panel data
  const panelMatches = text.match(/"scene"\s*:\s*"([^"]+)"/g);
  const dialogueMatches = text.match(/"dialogue"\s*:\s*"([^"]+)"/g);
  
  // Build panels array from what we can find
  const panels: any[] = [];
  
  // If we have scene descriptions, use them to build basic panels
  if (panelMatches && panelMatches.length > 0) {
    const scenes = panelMatches.map(match => {
      const content = match.match(/"scene"\s*:\s*"([^"]+)"/);
      return content ? content[1] : "";
    });
    
    const dialogues = dialogueMatches ? dialogueMatches.map(match => {
      const content = match.match(/"dialogue"\s*:\s*"([^"]+)"/);
      return content ? content[1] : "";
    }) : [];
    
    // Create panels from available data
    for (let i = 0; i < scenes.length; i++) {
      panels.push({
        scene: scenes[i],
        dialogue: i < dialogues.length ? dialogues[i] : "",
        emotion: "Mixed", // Default
        effects: [],
        cameraAngle: "Standard shot"
      });
    }
  }
  
  return {
    title,
    panels: panels.length > 0 ? panels : generateBasicFallbackPanels(title, 8)
  };
}

// Create basic fallback panels if no valid JSON found
function createFallbackFromText(text: string): any {
  // Extract any reasonable title
  const titleMatch = text.match(/title[":]\s*["']?([^"',\r\n]+)/i);
  const title = titleMatch ? titleMatch[1] : "Comic Story";
  
  console.log("Creating fallback structure with title:", title);
  
  // Generate basic set of panels
  return {
    title,
    panels: generateBasicFallbackPanels(title, 8),
    _note: "This is a reconstructed response due to JSON parsing issues"
  };
}

// Generate basic panels with sensible content
function generateBasicFallbackPanels(title: string, count: number): any[] {
  // Extract character names from title
  const characterMatches = title.match(/(\w+)\s+(?:vs\.?|versus)\s+(\w+)/i);
  const char1 = characterMatches ? characterMatches[1] : "Hero";
  const char2 = characterMatches ? characterMatches[2] : "Villain";
  
  const panels = [];
  
  // Story beats for a basic narrative
  const storyBeats = [
    { scene: `${char1} appears in a dramatic pose, ready for action`, dialogue: `"It's time to end this!"` },
    { scene: `${char2} reveals their presence with a menacing aura`, dialogue: `"You think you can stop me?"` },
    { scene: `${char1} and ${char2} face off in an intense standoff`, dialogue: `"This ends today, one way or another."` },
    { scene: `The battle begins with a powerful clash`, dialogue: `"Take this! [CRASH]"` },
    { scene: `${char2} seems to gain the upper hand momentarily`, dialogue: `"Is that all you've got?"` },
    { scene: `${char1} shows resilience and determination`, dialogue: `"I'm just getting started!"` },
    { scene: `A crucial moment in the battle as powers collide`, dialogue: `"You'll never defeat me! [BOOM]"` },
    { scene: `${char1} overcomes the challenge with a final decisive move`, dialogue: `"It's over!"` },
    { scene: `The aftermath of the battle, tensions subsiding`, dialogue: `"Next time will be different..."` },
    { scene: `A reflective moment as ${char1} contemplates the victory`, dialogue: `"Until we meet again."` },
  ];
  
  // Create the requested number of panels
  for (let i = 0; i < count; i++) {
    const beatIndex = Math.min(i, storyBeats.length - 1);
    panels.push({
      scene: storyBeats[beatIndex].scene,
      dialogue: storyBeats[beatIndex].dialogue,
      emotion: i < count / 2 ? "Intense" : "Resolute",
      effects: i % 2 === 0 ? ["CRASH", "BOOM"] : [],
      cameraAngle: i % 3 === 0 ? "Close-up" : i % 3 === 1 ? "Wide shot" : "Medium shot"
    });
  }
  
  return panels;
}

export async function callAI(
  messages: Message[], 
  options: AIClientOptions = {}
) {
  const provider = options.provider || 'groq'; // Default to Groq
  const maxTokens = options.maxTokens || 1000;
  const temperature = options.temperature || 0.7;
  const model = options.model || DEFAULT_MODELS[provider];

  let apiKey: string | undefined;
  let apiEndpoint: string;
  
  // Set API key and endpoint based on provider
  if (provider === 'openai') {
    apiKey = process.env.OPENAI_API_KEY;
    apiEndpoint = 'https://api.openai.com/v1/chat/completions';
  } else { // groq
    apiKey = process.env.GROQ_API_KEY;
    apiEndpoint = 'https://api.groq.com/openai/v1/chat/completions';
  }
  
  if (!apiKey) {
    throw new Error(`${provider.toUpperCase()}_API_KEY environment variable is not defined`);
  }
  
  console.log(`Using ${provider.toUpperCase()} with model ${model}`);
  
  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: maxTokens,
      temperature
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`${provider.toUpperCase()} API Error: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  return await response.json();
}
