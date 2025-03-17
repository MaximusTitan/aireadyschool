"use client";

import React from "react";
import { Player } from "@remotion/player";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Merge } from "./Merge";
import { MergeConfig } from "../hooks/useMergeConfig";

interface VideoPreviewProps {
  activePreview: string | null;
  isReady: boolean;
  validUrls: string[];
  clipDurations: number[];
  mergeConfig: MergeConfig;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({
  activePreview,
  isReady,
  validUrls,
  clipDurations,
  mergeConfig,
}) => {
  // Only consider activePreview valid if it's a non-empty string
  const hasActivePreview =
    activePreview !== null && activePreview.trim().length > 0;

  return (
    <Card className="col-span-8">
      <CardContent className="p-4">
        <CardTitle>Preview</CardTitle>
        <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-4">
          {hasActivePreview ? (
            <video
              crossOrigin="anonymous"
              key={activePreview}
              src={activePreview}
              controls
              className="w-full h-full object-contain"
            />
          ) : isReady &&
            validUrls.length > 0 &&
            mergeConfig.durationInFrames > 0 ? (
            <Player
              acknowledgeRemotionLicense={true}
              component={Merge}
              inputProps={{
                videoUrls: validUrls,
                clipDurations: clipDurations,
              }}
              durationInFrames={mergeConfig.durationInFrames}
              fps={mergeConfig.fps}
              compositionWidth={mergeConfig.width}
              compositionHeight={mergeConfig.height}
              style={{ width: "100%", height: "100%" }}
              controls
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              {validUrls.length === 0
                ? "Add videos to preview"
                : "Loading videos..."}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoPreview;
