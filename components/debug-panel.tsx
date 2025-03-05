"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface DebugPanelProps {
  data: any;
  title?: string;
}

export function DebugPanel({ data, title = "Debug Info" }: DebugPanelProps) {
  const [isVisible, setIsVisible] = useState(false);

  return process.env.NODE_ENV === 'development' ? (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex flex-col items-end">
        <Button 
          variant="secondary" 
          size="sm" 
          className="mb-2 opacity-70 hover:opacity-100"
          onClick={() => setIsVisible(!isVisible)}
        >
          {isVisible ? "Hide" : "Show"} Debug
        </Button>
        
        {isVisible && (
          <div className="bg-black/80 text-white p-4 rounded-md shadow-lg max-w-md max-h-80 overflow-auto">
            <h3 className="text-sm font-bold mb-2">{title}</h3>
            <pre className="text-xs">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  ) : null;
}
