"use client";

import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
} from "reactflow";
import Image from "next/image";
import "reactflow/dist/style.css";
import { useState, useEffect } from "react";

// Custom Image Node
const ImageNode = ({ data }: { data: any }) => {
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);

  return (
    <div className="group p-6 border-2 border-purple-100 rounded-xl bg-white shadow-lg hover:shadow-xl transition-all">
      <div className="relative w-[512px] h-[512px] overflow-hidden rounded-lg bg-gray-50">
        {isImageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-2">
              <svg
                className="animate-spin h-8 w-8 text-purple-500"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span className="text-sm text-gray-500">Loading image...</span>
            </div>
          </div>
        )}
        <Image
          src={data.imageUrl}
          alt={data.prompt}
          fill
          className={`object-contain transition-all duration-300 cursor-zoom-in
            ${isImageLoading ? "opacity-0" : "opacity-100"}
            ${isZoomed ? "scale-150" : "scale-100 hover:scale-105"}`}
          sizes="(max-width: 512px) 100vw, 512px"
          onLoad={() => setIsImageLoading(false)}
          onClick={() => setIsZoomed(!isZoomed)}
        />
        {!isImageLoading && (
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-black/50 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
              512 × 512
            </div>
          </div>
        )}
      </div>
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            <span>Generated Image</span>
          </div>
          <time>{new Date().toLocaleTimeString()}</time>
        </div>
        <div className="relative group/prompt">
          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 line-clamp-2 hover:line-clamp-none transition-all cursor-help">
            {data.prompt}
          </p>
          <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-gray-50 to-transparent group-hover/prompt:hidden"></div>
        </div>
      </div>
    </div>
  );
};

// Custom Text Node
const TextNode = ({ data }: { data: any }) => {
  return (
    <div className="p-6 border-2 border-emerald-100 rounded-xl bg-white shadow-lg hover:shadow-xl transition-shadow max-w-[400px]">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
        <h3 className="text-sm font-medium text-emerald-700">AI Response</h3>
      </div>
      <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-[15px]">
        {data.label}
      </div>
    </div>
  );
};

// Custom Input Node
const InputNode = ({ data }: { data: any }) => {
  return (
    <div className="p-6 border-2 border-blue-100 rounded-xl bg-white shadow-lg min-w-[350px] hover:border-blue-200 transition-colors">
      <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
        AI Assistant
      </h3>
      <div className="mb-4">
        <select
          value={data.mode}
          onChange={(e) => data.setMode(e.target.value)}
          className="w-full p-3 border-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors focus:outline-none focus:border-blue-500"
        >
          <option value="text">Generate Text</option>
          <option value="image">Generate Image</option>
        </select>
      </div>
      <form onSubmit={data.onSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          value={data.inputValue}
          onChange={(e) => data.setInputValue(e.target.value)}
          className="border-2 p-4 rounded-lg focus:outline-none focus:border-blue-500 transition-colors bg-gray-50"
          placeholder={
            data.mode === "text"
              ? "Ask me anything..."
              : "Describe the image you want to create..."
          }
        />
        <button
          type="submit"
          className={`bg-blue-500 text-white p-4 rounded-lg font-medium transition-all
            ${
              !data.inputValue || data.isLoading
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-blue-600 active:scale-98 hover:shadow-md"
            }`}
          disabled={!data.inputValue || data.isLoading}
        >
          {data.isLoading ? (
            <span className="flex items-center justify-center gap-3">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Generating...
            </span>
          ) : (
            `Create ${data.mode === "text" ? "Response" : "Image"}`
          )}
        </button>
      </form>
    </div>
  );
};

const nodeTypes = {
  inputNode: InputNode,
  imageNode: ImageNode,
  textNode: TextNode,
};

const initialNodes: Node[] = [
  {
    id: "1",
    position: { x: 100, y: 100 },
    data: { label: "Input Node" },
    type: "inputNode",
  },
];

export default function CanvasPage() {
  const [inputValue, setInputValue] = useState("");
  const [mode, setMode] = useState<"text" | "image">("text");
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (nodes.length > 1) {
      const timer = setTimeout(() => {
        document
          .querySelector(".react-flow__controls-fitview")
          ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [nodes.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue || isLoading) return;

    setIsLoading(true);
    const newNodeId = Date.now().toString();
    const randomYOffset = Math.random() * 200 - 100;

    try {
      if (mode === "text") {
        const response = await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topic: inputValue }),
        });
        const data = await response.json();

        const newNode: Node = {
          id: newNodeId,
          position: { x: 600, y: 100 + randomYOffset },
          data: { label: data.answer },
          type: "textNode",
        };

        addNodeAndEdge(newNode);
      } else {
        const response = await fetch("/api/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: inputValue,
            image_size: "square_hd",
            num_inference_steps: 1,
            num_images: 1,
            enable_safety_checker: true,
          }),
        });
        const data = await response.json();

        const newNode: Node = {
          id: newNodeId,
          position: { x: 600, y: 100 + randomYOffset },
          data: {
            imageUrl: data.images[0].url,
            prompt: data.prompt,
          },
          type: "imageNode",
        };

        addNodeAndEdge(newNode);
      }

      setInputValue("");
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addNodeAndEdge = (newNode: Node) => {
    const newEdge: Edge = {
      id: `e1-${newNode.id}`,
      source: "1",
      target: newNode.id,
      type: "smoothstep",
      animated: true,
      style: { stroke: "#94a3b8", strokeWidth: 2 },
    };

    setNodes((prevNodes) => [...prevNodes, newNode]);
    setEdges((prevEdges) => [...prevEdges, newEdge]);
  };

  const nodesWithUpdatedData = nodes.map((node) => {
    if (node.id === "1") {
      return {
        ...node,
        data: {
          ...node.data,
          inputValue,
          setInputValue,
          onSubmit: handleSubmit,
          isLoading,
          mode,
          setMode,
        },
      };
    }
    return node;
  });

  return (
    <div style={{ width: "100vw", height: "100vh" }} className="bg-gray-50">
      <ReactFlow
        nodes={nodesWithUpdatedData}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        defaultEdgeOptions={{
          type: "smoothstep",
          animated: true,
          style: { stroke: "#94a3b8", strokeWidth: 2 },
        }}
        connectOnClick={false}
      >
        <Background gap={12} size={1} color="#e2e8f0" />
        <Controls showInteractive={false} />
        <MiniMap className="bg-white rounded-lg border-2 border-gray-200" />
      </ReactFlow>
    </div>
  );
}
