/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { type FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { useEffect, useRef, useState, memo } from "react";
import vegaEmbed from "vega-embed";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { ToolCall } from "../../multimodal-live-types";

const declaration: FunctionDeclaration = {
  name: "render_altair",
  description: "Displays an altair graph in json format.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      json_graph: {
        type: SchemaType.STRING,
        description:
          "JSON STRING representation of the graph to render. Must be a string, not a json object",
      },
    },
    required: ["json_graph"],
  },
};

interface AltairProps {
  talking: boolean;
}

export function Altair({ talking }: AltairProps) {
  const gifUrl = talking
    ? "https://wdfrtqeljulkoqnllxad.supabase.co/storage/v1/object/public/generated-videos/o-talking-small.gif"
    : "https://wdfrtqeljulkoqnllxad.supabase.co/storage/v1/object/public/generated-images/o-constant.gif";

  return (
    <div className="flex-1 flex items-center justify-center">
      <img src={gifUrl} alt="AI Assistant" className="max-w-full h-auto" />
    </div>
  );
}

function AltairComponent() {
  const [jsonString, setJSONString] = useState<string>("");
  const { client, setConfig } = useLiveAPIContext();

  useEffect(() => {
    setConfig({
      model: "models/gemini-2.0-flash-exp",
      generationConfig: {
        responseModalities: "audio",
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } },
        },
      },
      systemInstruction: {
        parts: [
          {
            text: 'You are my helpful assistant. Any time I ask you for a graph call the "render_altair" function I have provided you. Dont ask for additional information just make your best judgement.',
          },
        ],
      },
      tools: [
        // there is a free-tier quota for search
        { googleSearch: {} },
        { functionDeclarations: [declaration] },
      ],
    });
  }, [setConfig]);

  interface FunctionCallArgs {
    json_graph: string;
  }

  useEffect(() => {
    const onToolCall = (toolCall: ToolCall) => {
      console.log(`got toolcall”, toolCall`);
      const fc = toolCall.functionCalls.find(
        (fc) => fc.name === declaration.name
      );
      if (fc) {
        const str = (fc.args as FunctionCallArgs).json_graph;
        setJSONString(str);
      }
      // Convert any Set to Array before sending response
      if (toolCall.functionCalls.length) {
        const functionResponses = toolCall.functionCalls.map((fc) => ({
          response: { output: { success: true } },
          id: fc.id,
        }));
        const replacer = (key: string, value: unknown) => {
          if (value instanceof Set) return Array.from(value);
          return value;
        };
        setTimeout(
          () =>
            client.sendToolResponse(
              JSON.parse(JSON.stringify({ functionResponses }, replacer))
            ),
          200
        );
      }
    };
    client.on("toolcall", onToolCall);
    return () => {
      client.off("toolcall", onToolCall);
    };
  }, [client]);

  const embedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (embedRef.current && jsonString) {
      vegaEmbed(embedRef.current, JSON.parse(jsonString));
    }
  }, [embedRef, jsonString]);
  return (
    <div className="vega-embed bg-white p-4 rounded shadow" ref={embedRef} />
  );
}

// export const AltairComponent = memo(AltairComponent);
