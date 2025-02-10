import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/client";

export const runtime = "edge";

type ContentType =
  | "guided-notes"
  | "exemplar"
  | "depth-of-knowledge"
  | "faqs"
  | "worksheets"
  | "case-studies"
  | "scenario-activities"
  | "glossary";

const imageRequiredTypes: ContentType[] = [
  "guided-notes",
  "case-studies",
  "scenario-activities",
];

function getSystemPrompt(
  contentType: ContentType,
  topic: string,
  subject: string,
  grade: string,
  board: string,
): string {
  const basePrompt = `You are an academic content generator focusing on the
    topic ${topic} for ${subject} at grade ${grade} level, following the ${board}
    curriculum. `;
  const titleInstruction = `Start your response with a simple 3-5 word title -
    No quotations in the title please!! related to ${topic}, specifying ${subject},
    followed by "---". `;

  switch (contentType) {
    case "guided-notes":
      return (
        basePrompt +
        titleInstruction +
        `\\n- A paragraphed introduction without mentioning the word "introduction"
        - \\n One or more content paragraphs without any heading including causes, major events, and impact
        - \\n A concluding paragraph, again, without any heading or title
      Ensure the content is factual and avoid hallucination.`
      );
    case "exemplar":
      return (
        basePrompt +
        titleInstruction +
        ` Provide a typical exam question and an exemplar response about ${topic} on ${subject} at ${grade}.
        Ensure that the answer is in accordance to the ${board} standard board and is awarded a perfect score.`
      );
    case "depth-of-knowledge":
      return (
        basePrompt +
        titleInstruction +
        ` Provide 2 Depth of Knowledge short-answer questions and answers on ${topic} on ${subject} for a ${grade} grade student
        for each of 4 DOK levels. Each level should have a title describing the cognitive process required.
        Here's a more detailed template:
        DOK Level 1: Recall and Reproduction \\n
        Title: [Insert title, e.g. "Remembering Key Terms"] \\n
         * Question 1 (insert question here) \\n
         * Answer 1 (add a summarized response) \\n
         * Question 2 (insert question here) \\n
         * Answer 2 (add a summarized response) \\n

        DOK Level 2: Skills and Concepts \\n
        Title: [Insert Title, e.g. "Applying Basic Concepts"] \\n
          * Question 1 (insert question here) \\n
          * Answer 1 (add a summarized response) \\n
          * Question 2 (insert question here) \\n
          * Answer 2 (add a summarized response) \\n

        DOK Level 3: Strategic Thinking \\n
        Title: [Insert Title, e.g. "Analyzing Relationships"] \\n
          * Question 1 (insert question here) \\n
          * Answer 1 (add a summarized response) \\n
          * Question 2 (insert question here) \\n
          * Answer 2 (add a summarized response) \\n

        DOK Level 4: Extended Thinking \\n
        Title: [Insert Title, e.g. "Evaluating Complex Systems"] \\n
          * Question 1 (insert question here) \\n
          * Answer 1 (add a summarized response) \\n
          * Question 2 (insert question here) \\n
          * Answer 2 (add a summarized response) \\n
        `
      );
    case "faqs":
      return (
        basePrompt +
        titleInstruction +
        ` Please provide 4 Frequently asked questions (FAQs) on ${topic} in ${subject} subject
          for a ${grade} grade student studying in the ${board} board.
          Each FAQ should include a question and a concise answer
          Here's a template:
          FAQ 1: \\n
          Question: (insert question here) \\n
          Answer: (add a summarized response) \\n

          FAQ 2: \\n
          Question: (insert question here) \\n
          Answer: (add a summarized response) \\n

          FAQ 3: \\n
          Question: (insert question here) \\n
          Answer: (add a summarized response) \\n

          FAQ 4: \\n
          Question: (insert question here) \\n
          Answer: (add a summarized response) \\n`
      );
    case "worksheets":
      return (
        basePrompt +
        titleInstruction +
        ` Please provide a worksheet on ${topic} on ${subject} for a ${grade} grade student
          studying for the ${board} board with the following specifications:

        *Section 1: Multiple Choice Questions (4 questions)* \\n

        1. Question: [Insert question 1] \\n
        A) [Option A] \\n
        B) [Option B] \\n
        C) [Option C] \\n
        D) [Option D] \\n

        2. Question: [Insert question 2] \\n
        A) [Option A] \\n
        B) [Option B] \\n
        C) [Option C] \\n
        D) [Option D] \\n

        3. Question: [Insert question 3] \\n
        A) [Option A] \\n
        B) [Option B] \\n
        C) [Option C] \\n
        D) [Option D] \\n

        4. Question: [Insert question 4] \\n
        A) [Option A] \\n
        B) [Option B] \\n
        C) [Option C] \\n
        D) [Option D] \\n

        *Section 2: Short Answer Questions (2 questions)* \\n

        1. Question: [Insert question 1] \\n
        Answer: ______________________________________________________

        2. Question: [Insert question 2] \\n
        Answer: ______________________________________________________

        *Section 3: Essay Question (1 question)* \\n

        1. Question: [Insert question] \\n
        Answer: ______________________________________________________`
      );

    case "case-studies":
      return (
        basePrompt +
        titleInstruction +
        `Please provide a case study on ${topic} regarding ${subject} for a ${grade} grade student with the following specifications:

        *Case Study:* Please add a title here

        *Background:* [Insert brief background information on the case study]

        *Problem/Challenge:* [Insert problem or challenge faced by the organization/individual]

        *Key Issues:* [Insert key issues related to the problem/challenge]

        *Questions:*

        1. [Insert question 1] \\n
        2. [Insert question 2] \\n
        3. [Insert question 3] \\n

        *Additional Information:* [Insert any additional information relevant to the case study]

        *Teaching Notes/Answers:* [Insert teaching notes or answers to the questions]"

        Please avoid haluciantions on this one. Cases should be real and thorough.`
      );
    case "scenario-activities":
      return (
        basePrompt +
        titleInstruction +
        `Please provide a scenario-activity on ${topic} on ${subject} for a ${grade} grade student studying in ${board} with the following specifications:

        _Scenario:_ [Insert title]

        _Background:_ [Insert brief background information on the scenario]

        _Scenario Description:_ [Insert description of the scenario]

        _Task/Challenge:_ [Insert task or challenge that participants must address]

        _Questions/Discussion Points:_

        1. [Insert question 1]
        2. [Insert question 2]
        3. [Insert question 3]

        _Debriefing Questions:_ [Insert questions to facilitate debriefing and reflection]

        _Learning Objectives:_ [Insert learning objectives for the scenario-activity]

        _Instructions for Facilitators:_ [Insert instructions for facilitators, if applicable]`
      );
    case "glossary":
      return (
        basePrompt +
        titleInstruction +
        `Please provide a glossary on ${topic} on ${subject} relevant to a ${grade} grade sudent with the following specifications:

        _Glossary:_ [Insert title]

        _Definitions:_

        1. [Term 1]: [Insert definition]
        2. [Term 2]: [Insert definition]
        3. [Term 3]: [Insert definition]
        ...
        [N. [Term N]: [Insert definition]]

        _Format:_

        - Alphabetical order
        - Definition format: [Term]: [Definition]
        - Optional: include pronunciation, acronym expansion, or other relevant information

        _Length:_ [Insert approximate number of terms, e.g. 10-20 terms]

        _Style:_ [Insert style guidelines, e.g. formal, informal, technical]`
      );
    default:
      return (
        basePrompt +
        titleInstruction +
        `Please provide a glossary on ${topic} on ${subject} relevant to a ${grade} grade sudent with the following specifications:

        _Glossary:_ [Insert title]

        _Definitions:_

        1. [Term 1]: [Insert definition]
        2. [Term 2]: [Insert definition]
        3. [Term 3]: [Insert definition]
        ...
        [N. [Term N]: [Insert definition]]

        _Format:_

        - Alphabetical order
        - Definition format: [Term]: [Definition]
        - Optional: include pronunciation, acronym expansion, or other relevant information

        _Length:_ [Insert approximate number of terms, e.g. 10-20 terms]

        _Style:_ [Insert style guidelines, e.g. formal, informal, technical]`
      );
  }
}

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OpenAI API key not found" },
      { status: 500 },
    );
  }
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { topic, subject, grade, board, contentType } = await req.json();

    if (!topic || !subject || !grade || !board || !contentType) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 },
      );
    }

    const systemPrompt = getSystemPrompt(
      contentType as ContentType,
      topic,
      subject,
      grade,
      board,
    );

    const response = streamText({
      model: openai("gpt-4"),
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Generate ${contentType} content for the topic: ${topic}`,
        },
      ],
    });

    let fullResponse = "";
    for await (const chunk of response.textStream) {
      fullResponse += chunk;
    }

    const [title, content] = fullResponse.split("---").map((s) => s.trim());

    if (!title || !content) {
      throw new Error("Failed to generate content in the expected format");
    }

    let imageUrl = null;

    // Image content storage only if contentType requires image
    if (imageRequiredTypes.includes(contentType as ContentType)) {
      const imageResponse = await fetch("/api/generate-fal-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: title }),
      });
      if (!imageResponse.ok) {
        throw new Error("Failed to generate image");
      }
      const imageData = await imageResponse.json();
      imageUrl = imageData.supabaseImageUrl;

      // Save the content to supabase
      const { data, error } = await supabase
        .from("lesson_content")
        .insert({
          user_email: user.email,
          title,
          topic,
          subject,
          grade,
          board,
          content_type: contentType,
          text_content: content,
          image_url: imageUrl,
        })
        .select();
      if (error) {
        console.error("Error saving to Supabase:", error);
        throw new Error("Failed to save content to database");
      }

      return NextResponse.json({
        title: title,
        result: content,
        imageUrl: imageUrl,
      });
    }
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
