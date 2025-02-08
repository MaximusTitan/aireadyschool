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
import { Download, Copy, Check } from "lucide-react";
import {
  TextInputNode,
  TextOutputNode,
} from "./components/TextProcessingNodes";

// Custom Image Node
const ImageNode = ({ data }: { data: any }) => {
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);

  const handleDownload = async () => {
    try {
      const response = await fetch(data.imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `generated-image-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  return (
    <div className="group p-4 border-2 border-purple-100 rounded-xl bg-white shadow-lg hover:shadow-xl transition-all">
      <div className="relative w-[256px] h-[256px] overflow-hidden rounded-lg bg-gray-50">
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
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
            <button
              onClick={handleDownload}
              className="bg-black/50 text-white p-2 rounded-full backdrop-blur-sm hover:bg-black/70 transition-all"
              title="Download image"
            >
              <Download size={14} />
            </button>
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
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(data.label);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 border-2 border-emerald-100 rounded-xl bg-white shadow-lg hover:shadow-xl transition-shadow max-w-[300px]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
          <h3 className="text-sm font-medium text-emerald-700">AI Response</h3>
        </div>
        <button
          onClick={handleCopy}
          className={`p-1.5 rounded-md transition-all ${
            copied
              ? "bg-emerald-100 text-emerald-600"
              : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"
          }`}
          title={copied ? "Copied!" : "Copy to clipboard"}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
      <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-[15px]">
        {data.label}
      </div>
    </div>
  );
};

const nodeTypes = {
  imageNode: ImageNode,
  textNode: TextNode,
  textInputNode: TextInputNode,
  textOutputNode: TextOutputNode,
};

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

export default function CanvasPage() {
  const [inputValue, setInputValue] = useState("");
  const [mode, setMode] = useState<"text" | "image">("text");
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isLoading, setIsLoading] = useState(false);

  const [textInput, setTextInput] = useState("");
  const [textOperation, setTextOperation] = useState("summarize");
  const [textOutput, setTextOutput] = useState("");
  const [textLoading, setTextLoading] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState("spanish");

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
        const response = await fetch("/api/canvas-chat", {
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

        setNodes((nodes) => [...nodes, newNode]);
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

        setNodes((nodes) => [...nodes, newNode]);
      }

      setInputValue("");
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const processText = async () => {
    if (!textInput.trim() || textLoading) return;
    setTextLoading(true);
    try {
      const response = await fetch("/api/process-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textInput,
          operation: textOperation,
          targetLanguage:
            textOperation === "translate" ? targetLanguage : undefined,
        }),
      });
      const data = await response.json();
      setTextOutput(data.result);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setTextLoading(false);
    }
  };

  useEffect(() => {
    setNodes((nodes) => {
      // Remove existing text processing nodes
      const filteredNodes = nodes.filter(
        (node) => !["text-input", "text-output"].includes(node.id)
      );

      if (mode === "text") {
        // Add text input node
        const textInputNode = {
          id: "text-input",
          position: { x: 100, y: 100 },
          type: "textInputNode",
          data: {
            input: textInput,
            operation: textOperation,
            loading: textLoading,
            setInput: setTextInput,
            setOperation: setTextOperation,
            processText,
            targetLanguage,
            setTargetLanguage,
          },
        };
        filteredNodes.push(textInputNode);

        // Add text output node only if there's output
        if (textOutput) {
          const textOutputNode = {
            id: "text-output",
            position: { x: 600, y: 100 },
            type: "textOutputNode",
            data: {
              output: textOutput,
            },
          };
          filteredNodes.push(textOutputNode);

          // Add edge between input and output nodes
          setEdges([
            {
              id: "text-edge",
              source: "text-input",
              target: "text-output",
              type: "smoothstep",
              animated: true,
              style: { stroke: "#94a3b8", strokeWidth: 2 },
            },
          ]);
        } else {
          setEdges([]);
        }
      }

      return filteredNodes;
    });
  }, [mode, textOutput, textInput, textOperation, textLoading, targetLanguage]);

  return (
    <div
      style={{ width: "100vw", height: "100vh" }}
      className="bg-gradient-to-br from-gray-50 to-gray-100"
    >
      <ReactFlow
        nodes={nodes}
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
        className="transition-all"
        minZoom={0.5}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        <Background gap={12} size={1} color="#e2e8f0" className="opacity-50" />
        <Controls
          showInteractive={false}
          className="bg-white/80 backdrop-blur-sm"
        />
        <MiniMap
          className="bg-white/80 backdrop-blur-sm rounded-lg border-2 border-gray-200"
          maskColor="rgb(0, 0, 0, 0.1)"
          nodeColor={(node) => {
            if (node.type === "imageNode") return "#9333ea";
            if (node.type === "textNode") return "#059669";
            return "#3b82f6";
          }}
        />
      </ReactFlow>

      {/* Floating Prompt Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[800px] max-w-[90vw]">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 hover:border-blue-300 transition-all">
            <div className="flex items-center px-4">
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as "text" | "image")}
                className="py-3 pr-2 bg-transparent border-r border-gray-200 focus:outline-none text-gray-600 cursor-pointer hover:text-blue-600 transition-colors"
              >
                <option value="text">💬 Text</option>
                <option value="image">🎨 Image</option>
              </select>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1 p-3 bg-transparent focus:outline-none placeholder:text-gray-400"
                placeholder={
                  mode === "text"
                    ? "Ask anything... (Press '/' to focus)"
                    : "Describe an image... (Press '/' to focus)"
                }
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={!inputValue || isLoading}
            className={`px-6 rounded-xl font-medium shadow-lg transition-all transform active:scale-95
              ${
                isLoading
                  ? "bg-gray-400"
                  : "bg-blue-500 hover:bg-blue-600 hover:shadow-blue-200/50 hover:shadow-xl"
              }
              text-white`}
          >
            {isLoading ? (
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
            ) : (
              "Send"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
