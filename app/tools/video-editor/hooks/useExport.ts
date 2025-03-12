"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MergeConfig } from "./useMergeConfig";
import { useToast } from "@/hooks/use-toast";

export interface ExportState {
  isLoading: boolean;
  downloadLink: string | null;
  handleExportVideo: () => Promise<void>;
}

export const useExport = (
  validUrls: string[],
  mergeConfig: MergeConfig,
  isReady: boolean,
): ExportState => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [downloadLink, setDownloadLink] = useState<string | null>(null);
  const { toast } = useToast();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const handleExportVideo = useCallback(async () => {
    if (!isReady) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Videos are not ready for export",
      });
      return;
    }
    setIsLoading(true);

    try {
      // Create a canvas and its 2D context
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Failed to get canvas context");

      canvas.width = mergeConfig.width;
      canvas.height = mergeConfig.height;

      // Capture canvas stream and create a MediaRecorder
      const stream = canvas.captureStream(mergeConfig.fps);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm",
      });
      mediaRecorderRef.current = mediaRecorder;

      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (e: BlobEvent) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        setDownloadLink(URL.createObjectURL(blob));
        setIsLoading(false);
      };
      mediaRecorder.start();
      // function to play videos sequentially and draw frames onto the canvas
      const playNextVideo = async (index: number): Promise<void> => {
        if (index >= validUrls.length) {
          mediaRecorder.stop();
          return;
        }
        // create video
        if (!videoRef.current) {
          videoRef.current = document.createElement("video");
          videoRef.current.crossOrigin = "anonymous";
        }
        videoRef.current.src = validUrls[index];
        await videoRef.current.play();

        const drawFrame = () => {
          if (videoRef.current) {
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            if (!videoRef.current.paused && !videoRef.current.ended) {
              requestAnimationFrame(drawFrame);
            } else {
              playNextVideo(index + 1);
            }
          }
        };
        drawFrame();
      };

      await playNextVideo(0);
    } catch (error: unknown) {
      let errorMessage = "Failed to export video. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      console.error("Error exporting video:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
      setIsLoading(false);
    }
  }, [validUrls, mergeConfig, isReady, toast]);

  // Cleanup: stop recording if still active when component unmounts
  useEffect(() => {
    return () => {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  return { isLoading, downloadLink, handleExportVideo };
};