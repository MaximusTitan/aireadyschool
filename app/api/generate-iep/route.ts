import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { name, grade, country, board, strengths, weaknesses, disabilities, additionalNotes } = data;

    // Construct the prompt
    const prompt = `
      Create a detailed Individualized Education Plan (IEP) for the following student:
      Name: ${name}
      Grade: ${grade}
      Country: ${country}
      Board: ${board}
      Strengths: ${strengths}
      Weaknesses: ${weaknesses}
      Disabilities: ${disabilities}
      Additional Notes: ${additionalNotes}

      Provide the IEP in the following JSON format:

      {
        "studentInformation": {
          "name": "${name}",
          "grade": "${grade}",
          "country": "${country}",
          "board": "${board}"
        },
        "personalContext": {
          "disabilities": ["${disabilities}"],
          "additionalNotes": "${additionalNotes}"
        },
        "presentLevelsOfPerformance": {
          "academic": "",
          "social": "",
          "behavioral": ""
        },
        "annualGoals": [
          {
            "goal": "",
            "objectives": [
              "Objective 1",
              "Objective 2"
            ]
          }
        ],
        "specialEducationServices": [
          {
            "service": "",
            "frequency": ""
          }
        ],
        "accommodationsAndModifications": [
          "Accommodation 1",
          "Modification 1"
        ],
        "assessmentInformation": {
          "methods": [],
          "schedule": ""
        },
        "progressMonitoringPlan": {
          "methods": [],
          "frequency": ""
        }
      }

      Ensure all sections are filled with specific, actionable, and measurable content tailored to the student's needs. Respond only with the JSON structure, no additional text.
    `;

    // Updated OpenAI API call
    const { text } = await generateText({
       model:openai.chat('gpt-4o'),      
       messages: [
        {
          role: 'system',
          content: 'You are a special education expert who creates detailed Individualized Education Plans (IEPs). Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt.trim(),
        },
      ],
      temperature: 0.7,
    });

    // Update response handling to use the new text property
    let iep;
    try {
      const cleanedResponse = text.replace(/^\`\`\`json\s*|\s*\`\`\`$/g, "").trim();
      iep = JSON.parse(cleanedResponse);

      // Validate the parsed response
      if (!iep || typeof iep !== "object" || !iep.studentInformation || !iep.annualGoals) {
        throw new Error("The generated IEP has an invalid structure.");
      }
    } catch (error) {
      console.error("Error parsing IEP:", error);
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse generated IEP. The AI response was not in the expected format.",
          details: error instanceof Error ? error.message : "Unknown parsing error",
          rawResponse: text
        }),
        { status: 500 }
      );
    }

    // Return IEP
    return new Response(JSON.stringify({ iep }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to generate IEP' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

