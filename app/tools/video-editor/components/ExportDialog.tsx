"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ExportDialogProps {
  downloadLink: string | null;
  setDownloadLink: (link: string | null) => void;
}

const ExportDialog: React.FC<ExportDialogProps> = ({
  downloadLink,
  setDownloadLink,
}) => {
  return (
    <Dialog open={!!downloadLink} onOpenChange={() => setDownloadLink(null)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Complete</DialogTitle>
          <DialogDescription>
            Click Download to save the merged video.
          </DialogDescription>
        </DialogHeader>
        {downloadLink ? (
          <video
            crossOrigin="anonymous"
            src={downloadLink}
            controls
            className="w-full rounded-lg mb-4"
          />
        ) : null}
        <div className="flex justify-end">
          <Button asChild>
            <a href={downloadLink || "#"} download="merged-video.webm">
              Download Video
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
