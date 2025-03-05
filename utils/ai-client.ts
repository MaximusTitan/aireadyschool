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

// Helper function to extract JSON from markdown text
export function extractJSON(text: string): any {
  // Remove any potential markdown or text wrapping
  const cleaned = text.replace(/```json\s*|\s*```/g, '').trim();
  
  try {
    // First try direct JSON parse
    return JSON.parse(cleaned);
  } catch (e) {
    // If that fails, try to find JSON object
    const matches = cleaned.match(/\{[\s\S]*\}/);
    if (matches) {
      try {
        return JSON.parse(matches[0]);
      } catch (e2) {
        // If both attempts fail, try to sanitize the content
        const sanitized = cleaned
          .replace(/[\u201C\u201D]/g, '"') // Replace smart quotes
          .replace(/[\u2018\u2019]/g, "'") // Replace smart single quotes
          .replace(/\n/g, ' ')            // Remove newlines
          .replace(/\s+/g, ' ')           // Normalize spaces
          .trim();
        
        // One final attempt with sanitized content
        try {
          return JSON.parse(sanitized);
        } catch (e3) {
          console.error("Failed to parse JSON after sanitization:", sanitized);
          throw new Error("Could not parse response as JSON");
        }
      }
    }
    throw new Error("No valid JSON found in response");
  }
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
