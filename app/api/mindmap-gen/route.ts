import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';

export async function POST(req: Request) {
  const { topic } = await req.json();

  // Validate that a topic is provided
  if (!topic?.trim()) {
    return Response.json({ error: "Topic is required." }, { status: 400 });
  }

  // Updated prompt to output a JSON object with nodes and links
  const prompt = `You are an expert mind map generator. Create a mind map for the topic "${topic}" and output your result strictly as a JSON object with the keys "nodes" and "links".
Format:
{
  "nodes": [
    { "id": "uniqueId", "label": "Node Label" },
    ...
  ],
  "links": [
    { "source": "parentNodeId", "target": "childNodeId" },
    ...
  ]
}
Ensure the JSON is valid and does not include any extra text.`;

  try {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: prompt,
      temperature: 0.7,
      maxTokens: 500,
    });

    let mindMap;
    try {
      mindMap = JSON.parse(text.trim());
      // Validate the structure
      if (!mindMap.nodes || !Array.isArray(mindMap.nodes) || mindMap.nodes.length === 0) {
        throw new Error('Invalid mind map structure');
      }
    } catch (error) {
      // Fallback with a basic structure
      mindMap = {
        nodes: [{ id: 'root', label: topic }],
        links: []
      };
    }

    return Response.json({ mindMap });
  } catch (err) {
    return Response.json({ error: "Failed to generate mind map." }, { status: 500 });
  }
}
