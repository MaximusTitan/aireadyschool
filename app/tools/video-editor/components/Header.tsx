"use client";

import React from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  addUrlField: () => void;
  handleExportVideo: () => Promise<void>;
  isLoading: boolean;
  isReady: boolean;
  validUrlsLength: number;
  triggerFileInput: () => void;
}

const Header: React.FC<HeaderProps> = ({
  addUrlField,
  handleExportVideo,
  isLoading,
  isReady,
  validUrlsLength,
  triggerFileInput,
}) => {
  return (
    <Card className="border-b rounded-none">
      <CardContent className="max-w-7xl mx-auto flex items-center justify-between p-4">
        <CardTitle className="text-2xl">Video Editor</CardTitle>
        <div className="flex gap-4">
          <Button variant="secondary" onClick={addUrlField}>
            Add Video
          </Button>
          <Button variant="secondary" onClick={triggerFileInput}>
            Upload Video
          </Button>
          <Button
            onClick={handleExportVideo}
            disabled={isLoading || !isReady || validUrlsLength === 0}
          >
            {isLoading ? "Processing..." : "Export"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Header;
