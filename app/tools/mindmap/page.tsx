"use client";

import React, { useState, useEffect } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";

const MindMapPage = () => {
  const [topic, setTopic] = useState("");
  const [mindMapData, setMindMapData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    if (!mindMapData) return;

    const centerX = 200,
      centerY = 200,
      baseSpacing = 150;
    const graph: Record<string, string[]> = {};
    mindMapData.nodes.forEach((node: any) => {
      graph[node.id] = [];
    });
    mindMapData.links.forEach((link: any) => {
      if (graph[link.source]) graph[link.source].push(link.target);
      if (graph[link.target]) graph[link.target].push(link.source);
    });

    const mainNodeId = mindMapData.nodes[0].id;
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

    const computePositions = (parentId: string, parentAngle: number | null) => {
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
          computePositions(child.id, angle);
        });
      } else {
        const gap = Math.PI / 4;
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
          computePositions(child.id, angle);
        });
      }
    };

    computePositions(mainNodeId, 0);

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
  }, [mindMapData]);

  return (
    <div className="min-h-screen p-4">
      <h1 className="text-3xl font-bold mb-6">Mind Map Generator</h1>
      <form
        onSubmit={handleSubmit}
        className="mb-4 flex flex-col sm:flex-row items-start sm:items-center"
      >
        <label htmlFor="topic" className="sr-only">
          Topic
        </label>
        <input
          id="topic"
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter a topic"
          className="border p-2 flex-1 mb-2 sm:mb-0 sm:mr-2"
        />
        <button
          type="submit"
          disabled={loading || !topic.trim()}
          className="bg-blue-500 text-white p-2 disabled:opacity-50 rounded"
        >
          {loading ? "Generating..." : "Generate Mind Map"}
        </button>
      </form>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div
        className="mindmap-container border p-4 rounded shadow min-h-[300px]"
        style={{ height: "500px" }}
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
          <p className="text-gray-500">Your mind map will appear here.</p>
        )}
      </div>
    </div>
  );
};

export default MindMapPage;
