"use server"

import { generateContent } from "../lib/openai";
import { generateImage } from "../lib/flux";
import { thumbnailStyles } from './styles';

export async function generateWithAI(mainTitle: string) {
  console.log("Generating AI suggestions for title:", mainTitle);
  
  try {
    const systemPrompt = `You are a YouTube thumbnail expert. Analyze the title and suggest the most effective thumbnail style and elements for maximum CTR. Consider the content type, target audience, and emotional impact.`;
    
    const userPrompt = `For the YouTube video titled "${mainTitle}", create a thumbnail specification.
    Analyze the title and select the most appropriate style from these options:
    ${thumbnailStyles.map(style => `- ${style.label}: ${style.description}`).join('\n')}
    
    Return a JSON object with these fields:
    {
      "main_title": "string - detailed title layout",
      "main_image": "string - main subject description",
      "background_elements": "string - background details",
      "color_scheme": "string - color palette",
      "sub_title": "string - secondary text",
      "visual_focus": "string - focal point details",
      "selected_style": "string - one of: ${thumbnailStyles.map(s => s.value).join(', ')}",
      "ratio_size": "string - aspect ratio"
    }
    
    Ensure the style choice matches the video's content and target audience.`;

    const response = await generateContent(userPrompt, systemPrompt);
    console.log("AI Response:", response);

    if (!response.success) {
      throw new Error(response.error || "Failed to generate AI suggestions");
    }

    const parsed = JSON.parse(response.content);
    return {
      main_title: parsed.main_title || mainTitle,
      main_image: parsed.main_image || "",
      background_elements: parsed.background_elements || "",
      color_scheme: parsed.color_scheme || "",
      sub_title: parsed.sub_title || "",
      visual_focus: parsed.visual_focus || "",
      ratio_size: parsed.ratio_size || "16:9",
      style: parsed.selected_style || "photorealistic"
    };
  } catch (error) {
    console.error("Error in generateWithAI:", error);
    throw error;
  }
}

export async function generateThumbnail(options: {
  main_title: string;
  main_image: string;
  background_elements: string;
  color_scheme: string;
  sub_title: string;
  visual_focus: string;
  ratio_size: "16:9" | "9:16" | "5:2";
  logo: File | null;
  style: string;
}) {
  console.log("Generating thumbnail with options:", options);

  try {
    const selectedStyle = thumbnailStyles.find(s => s.value === options.style) || thumbnailStyles[0];
    
    const enhancementPrompt = `
      Create a professional YouTube thumbnail using ${selectedStyle.label} style.
      
      ${selectedStyle.prompt}
      
      Specific Requirements:
      Title Layout: ${options.main_title}
      Main Subject: ${options.main_image}
      Background: ${options.background_elements}
      Colors: ${options.color_scheme}
      Secondary Text: ${options.sub_title}
      Focus & Mood: ${options.visual_focus}
      
      Additional Enhancement Requirements:
      - Ensure maximum readability of text
      - Optimize visual hierarchy for thumbnail size
      - Create clear focal points
      - Use high contrast for visibility
      - Maintain professional quality
      - Follow YouTube best practices
      
      Make it extremely eye-catching and optimized for CTR.`;

    const result = await generateImage({
      prompt: enhancementPrompt,
      style: selectedStyle.falStyle,
      ratio: options.ratio_size
    });

    return { imageUrl: result.imageUrl };
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    throw error;
  }
}

// Helper function to get character description
function getCharacterDescription(character: { type: string; description: string; expression: string }) {
  if (character.type === "custom") {
    return character.description;
  }

  const characterTypes = {
    teacher: "Professional educator wearing smart casual attire",
    student: "Young enthusiastic student in modern clothing",
    scientist: "Distinguished expert with professional appearance",
    mentor: "Approachable mentor figure with warm presence",
    coach: "Dynamic educational coach with confident posture",
  };

  return characterTypes[character.type as keyof typeof characterTypes] || "";
}
