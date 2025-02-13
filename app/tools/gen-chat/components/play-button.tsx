import { Volume2, VolumeOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface PlayButtonProps {
  text: string;
  isPlaying: boolean;
  onClick: () => void;
}

export function PlayButton({ text, isPlaying, onClick }: PlayButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="opacity-50 hover:opacity-100 transition-opacity"
      onClick={onClick}
    >
      {isPlaying ? (
        <VolumeOff className="h-4 w-4" />
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
    </Button>
  );
}
