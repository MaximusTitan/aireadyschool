"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TimelineProps {
  validUrls: string[];
  videoDurations: number[];
  selectedIndex: number | null;
  handleVideoSelect: (index: number) => void;
  removeUrlField: (index: number) => void;
}

const Timeline: React.FC<TimelineProps> = ({
  validUrls,
  videoDurations,
  selectedIndex,
  handleVideoSelect,
  removeUrlField,
}) => {
  return (
    <Card className="col-span-12">
      <CardHeader>
        <CardTitle>Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 overflow-x-auto pb-4 min-h-[160px]">
          {validUrls.map((url, index) => (
            <div
              key={index}
              onClick={() => handleVideoSelect(index)}
              className={`relative flex-shrink-0 w-[200px] rounded-lg border-2 transition-all ${
                selectedIndex === index
                  ? "border-primary"
                  : "border-transparent hover:border-primary/50"
              }`}
            >
              {url ? (
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  <video
                    crossOrigin="anonymous"
                    src={url}
                    className="w-full h-full object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeUrlField(index);
                    }}
                  >
                    ✕
                  </Button>
                </div>
              ) : (
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                  Drop video here
                </div>
              )}
              <div className="mt-2 text-sm text-muted-foreground truncate px-2">
                Video {index + 1}{" "}
                {videoDurations[index] !== undefined &&
                  `(${videoDurations[index].toFixed(1)}s)`}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default Timeline;
