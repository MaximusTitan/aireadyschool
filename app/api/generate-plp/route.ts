import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Destructure all expected fields
    const {
      name, grade, board, country,
      strengths, weaknesses,
      disabilities, additionalNotes,
      age, gender, nationality,
      topic, otherInformation, goal,
      cognitiveParameters,
      knowledgeParameters,
    } = data;

    // Format cognitive and knowledge parameters for the prompt
    const cognitiveParamsString = Object.entries(cognitiveParameters)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');

    const knowledgeParamsString = Object.entries(knowledgeParameters)
      .map(([subject, params]) => 
        `${subject}:\n${Object.entries(params as Record<string, unknown>)
          .map(([key, value]) => `  ${key}: ${value}`)
          .join('\n')}`
      )
      .join('\n');

    // Construct the prompt with all parameters
    const prompt = `
      Create a detailed Personalzied Learning Plan (PLP) for the following student:
      Name: ${name}
      Age: ${age}
      Grade: ${grade}
      Board: ${board}
      Gender: ${gender}
      Nationality: ${nationality}
      Country: ${country}
      Strengths: ${strengths}
      Weaknesses: ${weaknesses}
      Disabilities: ${disabilities}
      Additional Notes: ${additionalNotes}
      Topic: ${topic}
      Other Information: ${otherInformation}
      Goal: ${goal}
      
      Cognitive Parameters:
      ${cognitiveParamsString}

      Knowledge Parameters:
      ${knowledgeParamsString}

      Present Levels of Performance:
      - Academic: Provide current academic performance levels.
      - Social: Provide current social interaction and behavior.
      - Behavioral: Provide current behavioral observations.

      Provide the Personalzied Learning Plan (PLP) in the following JSON format:
      
      {
        "studentInformation": {
          "name": "${name}",
          "grade": "${grade}",
          "country": "${country}",
          "board": "${board}"
        },
        "presentLevelsOfPerformance": {
          "academic": "Provide academic performance details.",
          "social": "Provide social interaction details.",
          "behavioral": "Provide behavioral observations."
        },
        "subjectSpecificInformation": {
          "general": {
            "age": "${age}",
            "grade": "${grade}",
            "gender": "${gender}",
            "nationality": "${nationality}",
            "board": "${board}"
          },
          "cognitiveParameters": {
            ${Object.entries(cognitiveParameters)
              .map(([key, value]) => `"${key}": ${value}`)
              .join(',\n')}
          },
          "knowledgeParameters": {
            ${Object.entries(knowledgeParameters)
              .map(([subject, params]) => 
                `"${subject}": {\n${Object.entries(params as Record<string, unknown>)
                  .map(([key, value]) => `  "${key}": ${value}`)
                  .join(',\n')}\n}`
              )
              .join(',\n')}
          },
          "topic": "${topic}",
          "otherInformation": "${otherInformation}",
          "goal": "${goal}"
        },
        "specialEducationServices": [
          {
            "service": "Speech Therapy",
            "frequency": "Twice a week"
          },
          {
            "service": "Occupational Therapy",
            "frequency": "Weekly"
          }
        ]
      }

      Ensure all sections are filled with specific, actionable, and measurable content tailored to the student's needs. Respond only with the JSON structure, no additional text.
    `;

    // Updated OpenAI API call
    const { text } = await generateText({
      model: openai.chat('gpt-4o'),      
      messages: [
        {
          role: 'system',
          content: 'You are a special education expert who creates detailed Personalzied Learning Plans (PLP). Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt.trim(),
        },
      ],
      temperature: 0.7,
    });

    // Update response handling to use the new text property
    let plp;
    try {
      const cleanedResponse = text.replace(/^\`\`\`json\s*|\s*\`\`\`$/g, "").trim();
      plp = JSON.parse(cleanedResponse);

      // Validate the parsed response
      if (!plp || typeof plp !== "object" || !plp.studentInformation || !plp.subjectSpecificInformation) {
        throw new Error("The generated PLP has an invalid structure.");
      }
    } catch (error) {
      console.error("Error parsing PLP:", error);
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse generated PLP. The AI response was not in the expected format.",
          details: error instanceof Error ? error.message : "Unknown parsing error",
          rawResponse: text
        }),
        { status: 500 }
      );
    }

    // Return PLP
    return new Response(JSON.stringify({ plp }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to generate PLP' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
