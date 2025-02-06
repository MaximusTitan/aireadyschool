"use client";

import React, { useState, useEffect } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from "reactflow";
import { Info } from "lucide-react";
import "reactflow/dist/style.css";

const MindMapPage = () => {
  const [topic, setTopic] = useState("");
  const [mindMapData, setMindMapData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [layout, setLayout] = useState<"circular" | "tree">("tree");

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMindMapData(null);
    try {
      const res = await fetch("/api/mindmap-gen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });
      if (!res.ok) throw new Error("Failed to generate mind map.");
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setMindMapData(data.mindMap);
      }
    } catch (err) {
      setError((err as Error).message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mindMapData || !mindMapData.nodes || mindMapData.nodes.length === 0)
      return;

    const centerX = 400,
      centerY = 300,
      baseSpacing = 250;
    const graph: Record<string, string[]> = {};

    mindMapData.nodes.forEach((node: any) => {
      if (node && node.id) {
        graph[node.id] = [];
      }
    });

    if (mindMapData.links) {
      mindMapData.links.forEach((link: any) => {
        if (link && link.source && link.target) {
          if (graph[link.source]) graph[link.source].push(link.target);
          if (graph[link.target]) graph[link.target].push(link.source);
        }
      });
    }

    const firstNode = mindMapData.nodes[0];
    if (!firstNode || !firstNode.id) return;

    const mainNodeId = firstNode.id;

    const parentMapping: Record<string, string | null> = {};
    const levels: Record<string, number> = {};
    const queue: string[] = [];
    parentMapping[mainNodeId] = null;
    levels[mainNodeId] = 0;
    queue.push(mainNodeId);
    while (queue.length) {
      const current = queue.shift()!;
      for (const neighbor of graph[current]) {
        if (!(neighbor in parentMapping)) {
          parentMapping[neighbor] = current;
          levels[neighbor] = levels[current] + 1;
          queue.push(neighbor);
        }
      }
    }

    const childrenMapping: Record<string, any[]> = {};
    mindMapData.nodes.forEach((node: any) => {
      const parent = parentMapping[node.id];
      if (parent) {
        if (!childrenMapping[parent]) childrenMapping[parent] = [];
        childrenMapping[parent].push(node);
      }
    });

    const positions: Record<string, { x: number; y: number }> = {};
    const angles: Record<string, number> = {};

    positions[mainNodeId] = { x: centerX, y: centerY };
    angles[mainNodeId] = 0;

    const computeCircularPositions = (
      parentId: string,
      parentAngle: number | null
    ) => {
      const children = childrenMapping[parentId];
      if (!children || !children.length) return;
      if (parentId === mainNodeId) {
        children.forEach((child, idx) => {
          const angle = (2 * Math.PI * idx) / children.length;
          const pos = {
            x:
              centerX + baseSpacing * (levels[child.id] || 1) * Math.cos(angle),
            y:
              centerY + baseSpacing * (levels[child.id] || 1) * Math.sin(angle),
          };
          positions[child.id] = pos;
          angles[child.id] = angle;
          computeCircularPositions(child.id, angle);
        });
      } else {
        const gap = Math.PI / 3;
        const count = children.length;
        const startAngle = (parentAngle || 0) - (gap * (count - 1)) / 2;
        children.forEach((child, idx) => {
          const angle = startAngle + gap * idx;
          const pos = {
            x: positions[parentId].x + baseSpacing * Math.cos(angle),
            y: positions[parentId].y + baseSpacing * Math.sin(angle),
          };
          positions[child.id] = pos;
          angles[child.id] = angle;
          computeCircularPositions(child.id, angle);
        });
      }
    };

    const getSubtreeWidth = (nodeId: string, level: number): number => {
      const children = childrenMapping[nodeId] || [];
      if (children.length === 0) return 1;

      return Math.max(
        children.length,
        children.reduce(
          (sum, child) => sum + getSubtreeWidth(child.id, level + 1),
          0
        )
      );
    };

    const computeTreePositions = (
      parentId: string,
      level: number,
      startX: number,
      availableWidth: number
    ) => {
      const children = childrenMapping[parentId] || [];
      if (!children.length) return;

      const verticalSpacing = 100;
      const horizontalSpacing = Math.min(200, availableWidth / children.length);

      let currentX = startX;

      children.forEach((child) => {
        const subtreeWidth = getSubtreeWidth(child.id, level + 1);
        const childSpace = subtreeWidth * horizontalSpacing;

        const pos = {
          x: currentX + childSpace / 2,
          y: 50 + level * verticalSpacing,
        };

        positions[child.id] = pos;
        computeTreePositions(child.id, level + 1, currentX, childSpace);

        currentX += childSpace;
      });
    };

    if (layout === "circular") {
      computeCircularPositions(mainNodeId, 0);
    } else {
      const totalWidth = getSubtreeWidth(mainNodeId, 0) * 200;
      positions[mainNodeId] = { x: centerX, y: 50 };
      computeTreePositions(mainNodeId, 1, centerX - totalWidth / 2, totalWidth);
    }

    const newNodes = mindMapData.nodes.map((node: any) => ({
      id: node.id,
      data: { label: node.label },
      position: positions[node.id] || { x: centerX, y: centerY },
    }));
    const newEdges = mindMapData.links.map((link: any) => ({
      id: `${link.source}-${link.target}`,
      source: link.source,
      target: link.target,
    }));

    setNodes(newNodes);
    setEdges(newEdges);
  }, [mindMapData, layout]);

  return (
    <div className="min-h-screen p-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            Mind Map Generator
          </h1>
        </div>

        <div className="mb-8 bg-gray-100 p-6 rounded-lg shadow-lg">
          <div className="flex items-start space-x-2 mb-4">
            <Info className="text-gray-700 mt-1" size={20} />
            <p className="text-gray-700">
              Enter any topic and get an AI-generated mind map to help visualize
              concepts and relationships.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row justify-between gap-4">
            <form
              onSubmit={handleSubmit}
              className="flex-1 flex flex-col sm:flex-row gap-3"
            >
              <div className="flex-1">
                <input
                  id="topic"
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Enter a topic (e.g., 'Machine Learning Basics')"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 
                           focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition-all"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !topic.trim()}
                className="px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg 
                         hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed 
                         transition-all duration-200 shadow-md hover:shadow-lg 
                         flex items-center justify-center min-w-[160px]"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
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
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    <span>Generating...</span>
                  </div>
                ) : (
                  "Generate Mind Map"
                )}
              </button>
            </form>

            <select
              value={layout}
              onChange={(e) => setLayout(e.target.value as "circular" | "tree")}
              className="px-4 py-3 rounded-lg border border-gray-300
                       focus:border-gray-500 focus:ring-2 focus:ring-gray-200
                       bg-white transition-all cursor-pointer"
            >
              <option value="tree">Tree Layout</option>
              <option value="circular">Circular Layout</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
        )}

        <div
          className="mindmap-container rounded-lg shadow-xl overflow-hidden bg-white border"
          style={{ height: "600px" }}
        >
          {mindMapData ? (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
            >
              <MiniMap />
              <Controls />
              <Background />
            </ReactFlow>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center p-8">
                <p className="text-xl mb-2 text-gray-600">
                  Your mind map will appear here
                </p>
                <p className="text-sm text-gray-500">
                  Start by entering a topic above
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MindMapPage;
