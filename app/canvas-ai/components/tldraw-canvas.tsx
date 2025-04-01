"use client";

import { Tldraw } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import { useEffect, useState } from "react";

export function TldrawCanvas() {
  const [mounted, setMounted] = useState(false);

  // Only render the canvas on the client side
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="h-screen w-full">
      <Tldraw persistenceKey="tldraw-infinite-canvas" />
    </div>
  );
}
