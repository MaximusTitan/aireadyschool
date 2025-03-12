// useCompositionState.tsx
import { useState, useEffect, useMemo } from "react";

export interface MergeConfig {
  durationInFrames: number;
  width: number;
  height: number;
  fps: number;
}

interface ConfigState {
  mergeConfig: MergeConfig;
  isReady: boolean;
}

export const useMergeConfig = (
  videoDurations: number[],
  fps: number = 30,
  width: number = 1280,
  height: number = 720
): ConfigState => {
  const [mergeConfig, setMergeConfig] = useState<MergeConfig>(
    {
      durationInFrames: 0,
      width,
      height,
      fps,
    }
  );
  const [isReady, setIsReady] = useState<boolean>(false);

  const durationsInFrames = useMemo(
    () => videoDurations.map((duration) => Math.ceil(duration * fps)),
    [videoDurations, fps]
  );

  const totalFrames = useMemo(
    () => durationsInFrames.reduce((sum, frames) => sum + frames, 0),
    [durationsInFrames]
  );

  useEffect(() => {
    if (videoDurations.length === 0) {
      setMergeConfig((prev) => ({ ...prev, durationInFrames: 0 }));
      setIsReady(false);
      return;
    }

    setMergeConfig((prev) => ({
      ...prev,
      durationInFrames: totalFrames,
    }));
    setIsReady(true);
  }, [videoDurations, totalFrames]);

  const result = useMemo(
    () => ({ mergeConfig, isReady }),
    [mergeConfig, isReady]
  );

  return result;
};