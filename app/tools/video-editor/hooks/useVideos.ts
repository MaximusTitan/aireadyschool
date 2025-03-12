"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface VideoState {
  urls: string[];
  videoDurations: number[];
  selectedIndex: number | null;
  activePreview: string | null;
  validUrls: string[];
  addUrlField: () => void;
  removeUrlField: (index: number) => void;
  handleUrlChange: (
    index: number,
    event: ChangeEvent<HTMLInputElement>,
  ) => void;
  handleVideoSelect: (index: number) => void;
  handleFileUpload: (event: ChangeEvent<HTMLInputElement>) => void;
}

const isValidUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    // Allow http, https, or blob protocols
    return ["http:", "https:", "blob:"].includes(parsed.protocol);
  } catch {
    return false;
  }
};

export const useVideos = (): VideoState => {
  const [urls, setUrls] = useState<string[]>([]);
  const [videoDurations, setVideoDurations] = useState<number[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [activePreview, setActivePreview] = useState<string | null>(null);
  const { toast } = useToast();

  const addUrlField = useCallback(() => {
    setUrls((prev) => {
      const newUrls = [...prev, ""];
      // Automatically select the newly added field.
      setSelectedIndex(newUrls.length - 1);
      return newUrls;
    });
  }, []);

  const removeUrlField = useCallback(
    (index: number) => {
      setUrls((prev) => prev.filter((_, i) => i !== index));
      setSelectedIndex((prev) =>
        prev === index ? null : prev !== null && prev > index ? prev - 1 : prev,
      );
      setActivePreview((prev) => (selectedIndex === index ? null : prev));
    },
    [selectedIndex],
  );

  // Add this new function inside useVideos, e.g., right before returning state
  const handleFileUpload = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files) return;
      const newUrls = Array.from(files).map((file) =>
        URL.createObjectURL(file),
      );
      setUrls((prev) => [...prev, ...newUrls]);
    },
    [],
  );

  const handleUrlChange = useCallback(
    (index: number, event: ChangeEvent<HTMLInputElement>) => {
      setUrls((prev) => {
        const updated = [...prev];
        updated[index] = event.target.value;
        return updated;
      });
    },
    [],
  );

  const validUrls = useMemo(
    () => urls.filter((url) => url && isValidUrl(url)),
    [urls],
  );

  const handleVideoSelect = useCallback(
    (index: number) => {
      setSelectedIndex(index);
      setActivePreview(validUrls[index]);
    },
    [validUrls],
  );

  // Fetch duration for each valid URL
  const fetchDuration = useCallback(async (url: string): Promise<number> => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.preload = "metadata";
    video.src = url;

    return new Promise<number>((resolve, reject) => {
      video.onloadedmetadata = () => {
        if (isFinite(video.duration) && video.duration > 0) {
          resolve(video.duration);
        } else {
          reject(new Error(`Invalid duration for video ${url}`));
        }
      };
      video.onerror = () =>
        reject(new Error(`Failed to load metadata for ${url}`));
    });
  }, []);

  useEffect(() => {
    const computeDurations = async () => {
      if (validUrls.length === 0) {
        setVideoDurations([]);
        return;
      }
      try {
        const results = await Promise.allSettled(
          validUrls.map((url) => fetchDuration(url)),
        );
        const durations = results.map((result, index) => {
          if (result.status === "fulfilled") {
            return result.value;
          } else {
            const errorMessage =
              result.reason instanceof Error
                ? result.reason.message
                : "An unknown error occurred";
            console.error(
              `Error fetching duration for ${validUrls[index]}:`,
              errorMessage,
            );
            toast({
              variant: "destructive",
              title: "Error",
              description: `Failed to calculate video duration for ${validUrls[index]}: ${errorMessage}`,
            });
            return 0;
          }
        });
        setVideoDurations(durations);
      } catch (error) {
        console.error("Error computing durations", error);
      }
    };
    computeDurations();
  }, [validUrls, fetchDuration, toast]);

  const state = useMemo(
    () => ({
      urls,
      videoDurations,
      selectedIndex,
      activePreview,
      validUrls,
    }),
    [urls, videoDurations, selectedIndex, activePreview, validUrls],
  );

  const actions = useMemo(
    () => ({
      addUrlField,
      removeUrlField,
      handleUrlChange,
      handleVideoSelect,
      handleFileUpload,
    }),
    [
      addUrlField,
      removeUrlField,
      handleUrlChange,
      handleVideoSelect,
      handleFileUpload,
    ],
  );

  return { ...state, ...actions };
};