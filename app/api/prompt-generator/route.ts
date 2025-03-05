import { NextResponse } from "next/server";
import { callAI, Message, extractJSON } from "@/utils/ai-client";
import { COMIC_FORMATS } from '@/types/comic';

export async function POST(request: Request) {
  try {
    const { prompt, provider = 'groq', numPanels = 8 } = await request.json(); // Default to 8 panels
    
    // Determine comic format based on panel count
    const format = numPanels <= 4 ? 'short' 
                : numPanels <= 8 ? 'standard'
                : 'detailed';
    
    const comicStructure = COMIC_FORMATS[format];
    
    // Clean up title if it starts with "Create a..."
    const cleanPrompt = prompt.replace(/^Create a.*titled\s*"([^"]+)".*$/i, '$1').trim();
    const actualPrompt = cleanPrompt || prompt;
    
    const messages: Message[] = [
      {
        role: "system",
        content: `You are a comic book writer specializing in ${format} format comics with ${comicStructure.detailLevel} detail level.
        Create exactly ${numPanels} panels following the provided structure.
        Maximum dialogue length per panel: ${comicStructure.dialogueLength} words.`
      },
      {
        role: "user",
        content: `Create a ${numPanels}-panel comic based on: "${prompt}"

Story Structure (adapt to ${numPanels} panels):
${comicStructure.structure.slice(0, numPanels).map((s, i) => `${i + 1}. ${s}`).join('\n')}

Each panel must include:
{
  "scene": "Detailed visual description (${comicStructure.detailLevel} detail)",
  "dialogue": "Character dialogue (max ${comicStructure.dialogueLength} words)",
  "emotion": "Character's emotional state",
  "effects": ["Sound effects", "Action words"],
  "cameraAngle": "Shot type and perspective"
}

Return a JSON object with title and panels array.
Ensure dialogue matches the emotional intensity of each scene.`
      }
    ];

    const data = await callAI(messages, { 
      provider: 'groq',
      model: 'mixtral-8x7b-32768',
      maxTokens: 1500,
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
      const targetPanelCount = Number(numPanels) - 1; // -1 because title is separate
      let processedPanels = jsonResponse.panels.map((panel: any) => ({
        scene: `${panel.cameraAngle || ''} ${panel.scene}`,
        dialogue: panel.effects?.length 
          ? `${panel.dialogue} [${panel.effects.join(' ')}]`
          : panel.dialogue
      }));
      
      // If we have too many or too few panels, adjust
      if (processedPanels.length < targetPanelCount) {
        // Add generic panels
        while (processedPanels.length < targetPanelCount) {
          const panelNum = processedPanels.length + 1;
          processedPanels.push({
            scene: `Continuing the story - panel ${panelNum}`,
            dialogue: `"The adventure continues!"`
          });
        }
      } else if (processedPanels.length > targetPanelCount) {
        // Truncate to the exact panel count
        processedPanels = processedPanels.slice(0, targetPanelCount);
      }

      return NextResponse.json({ 
        prompts: [actualTitle, ...processedPanels.map((p: { scene: any; }) => p.scene)],
        dialogues: [fullDescription, ...processedPanels.map((p: { dialogue: any; }) => p.dialogue)],
        title: actualTitle,
        description: fullDescription,
        totalPanels: processedPanels.length
      }, { status: 200 });
      
    } catch (error) {
      console.error("Content generation error:", error);
      
      // Enhanced fallback that uses prompt characters
      const characters = prompt.split(/vs|\band\b|,/).map((c: string) => c.trim());
      const title = `${prompt} - Epic Confrontation`;
      
      // More relevant fallback scenes and dialogues
      const scenes = [title];
      const dialogues = [title];
      
      const genericScenes = [
        `${characters[0]} and ${characters[1]} face each other in an epic standoff`,
        `${characters[0]} launches an attack while ${characters[1]} prepares to counter`,
        `${characters[1]} retaliates with full force as ${characters[0]} stands ready`,
        `The battle between ${characters[0]} and ${characters[1]} intensifies`,
        `${characters[0]} and ${characters[1]} reach the climactic moment`,
        `The dust settles as ${characters[0]} and ${characters[1]} realize the truth`,
      ];

      const genericDialogues = [
        `"This ends now, ${characters[1]}!"`,
        `"You don't understand what's at stake, ${characters[0]}!"`,
        `"I won't hold back anymore!"`,
        `"There must be another way!"`,
        `"Together we could be unstoppable!"`,
        `"Perhaps we were both wrong..."`,
      ];

      // Adjust panels for fallback too
      const targetPanels = Number(numPanels);
      
      // Add scenes and dialogues based on requested panel count
      for (let i = 1; i < targetPanels; i++) {
        scenes.push(genericScenes[i % genericScenes.length]);
        dialogues.push(genericDialogues[i % genericDialogues.length]);
      }

      return NextResponse.json({ 
        prompts: scenes,
        dialogues: dialogues,
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
