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
        const visited = new Set<string>();

        // Calculate levels for each node with cycle detection
        const calculateLevels = (nodeId: string, level: number) => {
          if (visited.has(nodeId)) return; // Prevent cycles
          visited.add(nodeId);
          levels[nodeId] = level;

          const children = mindMapData.links
            .filter((link) => link.source === nodeId)
            .map((link) => link.target);

          children.forEach((childId) => {
            if (!visited.has(childId)) {
              calculateLevels(childId, level + 1);
            }
          });
        };

        if (parentNode) {
          calculateLevels(parentNode, 0);
        }

        // Calculate child count for positioning
        mindMapData.links.forEach((link) => {
          childCount[link.source] = (childCount[link.source] || 0) + 1;
        });

        // Create nodes with modified tree layout positions
        const newNodes = mindMapData.nodes.map((node) => {
          const level = levels[node.id] || 0;
          const parentLink = mindMapData.links.find(
            (l) => l.target === node.id
          );
          const siblings = parentLink
            ? mindMapData.links.filter(
                (link) => link.source === parentLink.source
              ).length
            : 1;
          const index = parentLink
            ? mindMapData.links
                .filter((link) => link.source === parentLink.source)
                .findIndex((link) => link.target === node.id)
            : 0;

          // Calculate vertical offset based on the total height needed for all siblings
          const verticalSpacing = 150; // Increased vertical spacing between nodes
          const verticalOffset =
            index * verticalSpacing - ((siblings - 1) * verticalSpacing) / 2;

          // Add slight horizontal offset for alternating levels to prevent straight lines
          const horizontalOffset = level % 2 === 0 ? 0 : 50;

          return {
            id: node.id,
            data: { label: node.label },
            position: {
              x: level * 300 + horizontalOffset, // Increased horizontal spacing
              y: verticalOffset,
            },
            style: {
              background: level === 0 ? "#f1f5f9" : "#fff",
              border: "1px solid #94a3b8",
              borderRadius: "8px",
              padding: "10px",
              minWidth: "150px", // Increased minimum width
              maxWidth: "200px", // Added maximum width
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
      <div className="h-[400px] border rounded-lg flex items-center justify-center text-red-500">
        Error: {error}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-[400px] border rounded-lg flex items-center justify-center">
        <div className="animate-pulse">Generating mind map...</div>
      </div>
    );
  }

  return (
    <div className="h-[400px] border rounded-lg overflow-hidden">
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
