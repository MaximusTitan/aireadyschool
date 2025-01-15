import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function generateIEP(studentInfo: {
  name: string;
  grade: string;
  country: string;
  syllabus: string;
  strengths: string;
  weaknesses: string;
}) {
  const prompt = `
    Create an Individualized Education Plan (IEP) for the following student:
    Name: ${studentInfo.name}
    Grade: ${studentInfo.grade}
    Country: ${studentInfo.country}
    Syllabus: ${studentInfo.syllabus}
    Strengths: ${studentInfo.strengths}
    Weaknesses: ${studentInfo.weaknesses}

    Please include the following sections:
    1. Student Information
    2. Present Levels of Performance
    3. Annual Goals
    4. Special Education and Related Services
    5. Accommodations and Modifications
    6. Assessment Information
    7. Transition Planning (if applicable)

    Provide detailed and specific information for each section, tailored to the student's needs.
  `;

  const { text } = await generateText({
    model: openai("gpt-4o"),
    prompt: prompt,
  });

  return text;
}

