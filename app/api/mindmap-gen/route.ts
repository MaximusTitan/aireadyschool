import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

export async function POST(req: Request) {
  const { topic } = await req.json();

  // Validate that a topic is provided
  if (!topic?.trim()) {
    return Response.json({ error: "Topic is required." }, { status: 400 });
  }

  // Define the mind map structure and schema
  const mindMapSchema = z.object({
    mindMap: z.object({
      nodes: z.array(
        z.object({
          id: z.string(),
          label: z.string(),
        })
      ),
      links: z.array(
        z.object({
          source: z.string(),
          target: z.string(),
        })
      ),
    }),
  });

  try {
    const result = await generateObject({
      model: openai('gpt-4o', {
        structuredOutputs: true,
      }),
      schemaName: 'mindMap',
      schemaDescription: `Generate a mind map for the topic "${topic}" with nodes and links.`,
      schema: mindMapSchema,
      prompt: `Generate a detailed mind map for the topic "${topic}" with at least 10 nodes and relevant links. Make sure the output strictly follows this JSON structure:

{
  "mindMap": {
    "nodes": [
      { "id": "uniqueId", "label": "Node Label" },
      ...
    ],
    "links": [
      { "source": "parentNodeId", "target": "childNodeId" },
      ...
    ]
  }
}`,
    temperature: 0.7,
    maxTokens: 500,
  });

    return Response.json({ mindMap: result.object.mindMap });
  } catch (err) {
    return Response.json({ error: "Failed to generate mind map." }, { status: 500 });
  }
}
