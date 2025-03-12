// /components/VideoStitcher/PropertiesPanel.tsx
"use client";

import React, { ChangeEvent } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface PropertiesPanelProps {
  selectedIndex: number | null;
  urls: string[];
  videoDurations: number[];
  handleUrlChange: (
    index: number,
    event: ChangeEvent<HTMLInputElement>
  ) => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedIndex,
  urls,
  videoDurations,
  handleUrlChange,
}) => {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Properties</CardTitle>
      </CardHeader>
      <CardContent>
        {selectedIndex !== null ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Video URL</label>
              <Input
                value={urls[selectedIndex] || ""}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  handleUrlChange(selectedIndex, e)
                }
                placeholder="Enter video URL"
              />
            </div>
            {videoDurations[selectedIndex] !== undefined && (
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">
                  Duration
                </label>
                <div className="text-sm">
                  {videoDurations[selectedIndex].toFixed(2)} seconds
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-muted-foreground text-sm">
            Select a video to view and edit its properties
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PropertiesPanel;
