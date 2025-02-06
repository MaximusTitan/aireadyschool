"use client";

import React, { useState, useEffect, useRef } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";

// Add cache for API responses
const responseCache = new Map<string, MindMapResponse>();
const pendingRequests = new Map<string, Promise<MindMapResponse | null>>();

type MindMapData = {
  topic: string;
  pending: boolean;
};

type MindMapResponse = {
  nodes: Array<{ id: string; label: string }>;
  links: Array<{ source: string; target: string }>;
};

type MindMapViewerProps = {
  data: MindMapData;
};

export const MindMapViewer = ({ data }: MindMapViewerProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    const fetchMindMap = async () => {
      if (!data.topic) return null;

      // Check cache first
      if (responseCache.has(data.topic)) {
        return responseCache.get(data.topic)!;
      }

      // Check if there's already a pending request for this topic
      if (pendingRequests.has(data.topic)) {
        return pendingRequests.get(data.topic);
      }

      // Create new request
      const promise = (async () => {
        try {
          const response = await fetch("/api/mindmap-gen", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ topic: data.topic }),
          });

          if (!response.ok) {
            throw new Error("Failed to generate mind map");
          }

          const result = await response.json();
          if (result.error) {
            throw new Error(result.error);
          }

          // Cache the successful response
          responseCache.set(data.topic, result.mindMap);
          return result.mindMap as MindMapResponse;
        } catch (err) {
          if (mounted.current) {
            setError((err as Error).message);
          }
          return null;
        } finally {
          // Clean up pending request
          pendingRequests.delete(data.topic);
        }
      })();

      // Store the pending request
      pendingRequests.set(data.topic, promise);
      return promise;
    };

    const setupMindMap = async () => {
      if (!data.topic) return;

      setLoading(true);
      const mindMapData = await fetchMindMap();

      if (mindMapData?.nodes && mounted.current) {
        // Initialize node positions using tree layout
        const levels: { [key: string]: number } = {};
        const childCount: { [key: string]: number } = {};
        const parentNode = mindMapData.nodes[0]?.id;

        // Calculate levels for each node
        const calculateLevels = (nodeId: string, level: number) => {
          levels[nodeId] = level;
          const children = mindMapData.links
            .filter((link) => link.source === nodeId)
            .map((link) => link.target);

          children.forEach((childId) => {
            calculateLevels(childId, level + 1);
          });
        };

        if (parentNode) {
          calculateLevels(parentNode, 0);
        }

        // Calculate child count for positioning
        mindMapData.links.forEach((link) => {
          childCount[link.source] = (childCount[link.source] || 0) + 1;
        });

        // Create nodes with tree layout positions
        const newNodes = mindMapData.nodes.map((node) => {
          const level = levels[node.id] || 0;
          const siblings = mindMapData.links.filter(
            (link) =>
              link.source ===
              mindMapData.links.find((l) => l.target === node.id)?.source
          ).length;
          const index = mindMapData.links
            .filter(
              (link) =>
                link.source ===
                mindMapData.links.find((l) => l.target === node.id)?.source
            )
            .findIndex((link) => link.target === node.id);

          return {
            id: node.id,
            data: { label: node.label },
            position: {
              x: level * 200,
              y: level === 0 ? 150 : (index - (siblings - 1) / 2) * 100 + 150,
            },
            style: {
              background: level === 0 ? "#f1f5f9" : "#fff",
              border: "1px solid #94a3b8",
              borderRadius: "8px",
              padding: "10px",
              minWidth: "100px",
              textAlign: "center" as const,
            },
          };
        });

        // Create edges with smooth bezier curves
        const newEdges = mindMapData.links.map((link) => ({
          id: `${link.source}-${link.target}`,
          source: link.source,
          target: link.target,
          type: "smoothstep",
          style: { stroke: "#94a3b8" },
        }));

        setNodes(newNodes);
        setEdges(newEdges);
      }
      if (mounted.current) {
        setLoading(false);
      }
    };

    setupMindMap();
  }, [data.topic, setNodes, setEdges]);

  if (error) {
    return (
      <div className="h-[300px] border rounded-lg flex items-center justify-center text-red-500">
        Error: {error}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-[300px] border rounded-lg flex items-center justify-center">
        <div className="animate-pulse">Generating mind map...</div>
      </div>
    );
  }

  return (
    <div className="h-[300px] border rounded-lg overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
};
