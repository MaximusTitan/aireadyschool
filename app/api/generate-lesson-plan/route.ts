import { getSupabaseClient } from "@/utils/supabase";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing OPENAI_API_KEY environment variable");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const supabase = getSupabaseClient();
  try {
    const { subject, chapterTopic, grade, board, classDuration, numberOfDays, learningObjectives } = req.body;

    console.log("Generating lesson plan for:", {
      subject,
      chapterTopic,
      grade,
      board,
      classDuration,
      numberOfDays,
      learningObjectives,
    });

    console.log("Sending request to OpenAI API");
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are a professional curriculum developer. Create detailed lesson plans following this exact JSON structure...`
          },
          {
            role: "user",
            content: `Create a complete ${numberOfDays}-day lesson plan for teaching ${subject} - ${chapterTopic} for grade ${grade} (${board} board). Each class is ${classDuration} minutes long.\n\nLearning objectives: ${learningObjectives || "To be determined based on the topic"}\n\nInclude all days in the plan. Return ONLY a complete, valid JSON object with no comments or additional text.`
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`OpenAI API request failed with status ${response.status}: ${errorBody}`);
      return res.status(response.status).json({ error: "Failed to generate lesson plan", details: errorBody });
    }

    const data = await response.json();
    if (!data.choices || !data.choices[0]?.message?.content) {
      return res.status(500).json({ error: "Invalid response from OpenAI API" });
    }

    let generatedPlan;
    try {
      generatedPlan = JSON.parse(data.choices[0].message.content.trim());
    } catch (parseError) {
      return res.status(500).json({ error: "Failed to parse lesson plan", details: parseError });
    }

    console.log("Storing lesson plan in Supabase");
    const { data: insertedData, error: insertError } = await supabase
      .from("lesson_plans")
      .insert({
        subject,
        chapter_topic: chapterTopic,
        grade,
        board,
        class_duration: Number.parseInt(classDuration),
        number_of_days: numberOfDays,
        learning_objectives: learningObjectives,
        plan_data: generatedPlan,
      })
      .select();

    if (insertError) {
      return res.status(500).json({ error: "Failed to save lesson plan", details: insertError });
    }

    return res.status(200).json(insertedData[0]);
  } catch (error) {
    return res.status(500).json({ error: "Error generating lesson plan", details: error });
  }
}


