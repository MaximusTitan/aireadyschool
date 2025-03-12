"use client";

import React from "react";
import { Sequence, Video } from "remotion";

export interface MergeProps {
  videoUrls: string[];
  clipDurations: number[];
}

export const Merge: React.FC<MergeProps> = ({ videoUrls, clipDurations }) => {
  let startFrame = 0;
  const sequences = videoUrls.map((url, index) => {
    const duration = clipDurations[index] ?? 0.1;
    const seq = (
      <Sequence key={index} from={startFrame} durationInFrames={duration}>
        <Video
          crossOrigin="anonymous"
          src={url}
          style={{ width: "100%", height: "100%" }}
        />
      </Sequence>
    );
    startFrame += duration;
    return seq;
  });
  return <>{sequences}</>;
};
