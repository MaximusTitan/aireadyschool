import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { name, grade, country, syllabus, strengths, weaknesses } = data;

    const prompt = `
      Create a detailed Individualized Education Plan (IEP) for the following student:
      Name: ${name}
      Grade: ${grade}
      Country: ${country}
      Syllabus: ${syllabus}
      Strengths: ${strengths}
      Weaknesses: ${weaknesses}

      Please include the following sections:
      1. Student Information
      2. Present Levels of Performance
      3. Annual Goals
      4. Special Education and Related Services
      5. Accommodations and Modifications
      6. Assessment Information
      7. Progress Monitoring Plan

      For each section, provide specific, actionable, and measurable content tailored to the student's needs.
    `;

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: prompt,
    });

    return new Response(JSON.stringify({ content: text }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to generate IEP' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

