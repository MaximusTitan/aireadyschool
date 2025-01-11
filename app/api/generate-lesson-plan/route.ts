import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { subject, grade, topic, duration, specificFocus } = await req.json();

    // Validate input
    if (!subject || !grade || !topic || !duration) {
      throw new Error("Missing required fields: subject, grade, topic, or duration.");
    }

    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      throw new Error("NEXT_PUBLIC_GEMINI_API_KEY is not set in environment variables.");
    }

    // Construct the prompt
    const prompt = `Create a structured lesson plan for a ${duration}-minute lesson on "${topic}" in ${subject} for grade ${grade}. ${
      specificFocus ? `The lesson should focus on ${specificFocus}.` : ""
    }

    Provide the plan in the following JSON format:

    {
      "topic": "${topic}",
      "objective": "Main learning objective",
      "duration": "${duration} minutes",
      "gradeLevel": "${grade}",
      "subject": "${subject}",
      "sections": [
        {
          "name": "Introduction",
          "duration": "5-10 minutes",
          "description": "Detailed description of the introduction",
          "keyPoints": [
            "Key point 1",
            "Key point 2"
          ]
        },
        {
          "name": "Main Content",
          "duration": "20-30 minutes",
          "description": "Detailed description of the main content",
          "keyPoints": [
            "Key point 1",
            "Key point 2",
            "Key point 3"
          ]
        },
        {
          "name": "Activity",
          "duration": "15-20 minutes",
          "description": "Detailed description of the main activity",
          "activities": [
            {
              "name": "Activity name",
              "duration": "Duration in minutes",
              "instructions": "Detailed instructions"
            }
          ],
          "steps": [
            "Step 1",
            "Step 2",
            "Step 3"
          ]
        },
        {
          "name": "Assessment",
          "duration": "5-10 minutes",
          "methods": [
            "Assessment method 1",
            "Assessment method 2"
          ]
        },
        {
          "name": "Conclusion",
          "duration": "5 minutes",
          "keyPoints": [
            "Summary point 1",
            "Summary point 2"
          ]
        }
      ],
      "resources": [
        "Resource 1",
        "Resource 2",
        "Resource 3"
      ]
    }

    Ensure all content is directly related to ${topic} and appropriate for grade ${grade}. Do not include any additional text or formatting outside of the JSON structure.`;

    // Call the AI model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);

    if (!result?.response?.text) {
      throw new Error("Failed to receive a response from the AI model.");
    }

    const responseText = result.response.text();

    // Attempt to parse the AI response
    let lessonPlan;
    try {
      // Remove any potential markdown code block syntax and leading/trailing whitespace
      const cleanedResponse = responseText.replace(/^```json\s*|\s*```$/g, "").trim();
      
      // Attempt to parse the JSON
      lessonPlan = JSON.parse(cleanedResponse);

      // Validate the parsed response
      if (!lessonPlan || typeof lessonPlan !== "object" || !lessonPlan.topic || !lessonPlan.sections) {
        throw new Error("The generated lesson plan has an invalid structure.");
      }
    } catch (error) {
      console.error("Error parsing lesson plan:", error);
      console.error("Raw response:", responseText);
      return NextResponse.json(
        { 
          error: "Failed to parse generated lesson plan. The AI response was not in the expected format.",
          details: error instanceof Error ? error.message : "Unknown parsing error",
          rawResponse: responseText
        },
        { status: 500 }
      );
    }

    // Return lesson plan
    return NextResponse.json({ lessonPlan });
  } catch (error) {
    console.error("Error generating lesson plan:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "An unexpected error occurred", 
        details: error instanceof Error ? error.stack : undefined 
      },
      { status: 500 }
    );
  }
}

