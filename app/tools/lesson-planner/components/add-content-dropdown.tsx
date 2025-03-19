"use client";

import * as React from "react";
import { Plus, Upload, CheckCircle, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddContentDropdownProps {
  onUpload: (file: File, type: string) => Promise<void>;
}

export function AddContentDropdown({ onUpload }: AddContentDropdownProps) {
  const [isUploadOpen, setIsUploadOpen] = React.useState(false);
  const [selectedType, setSelectedType] = React.useState<string>("");
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleOptionClick = (type: string) => {
    setSelectedType(type);
    setIsUploadOpen(true);
    setSelectedFile(null); // Reset file when reopening dialog
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (selectedFile) {
      try {
        await onUpload(selectedFile, selectedType);
        setIsUploadOpen(false);
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <Plus className="h-4 w-4 text-pink-500" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleOptionClick("worksheet")}>
            Worksheet
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleOptionClick("video")}>
            Video
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleOptionClick("presentation")}>
            Presentation
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleOptionClick("quiz")}>
            Quiz
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload {selectedType}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="file">Choose file</Label>
              <Input
                id="file"
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept={
                  selectedType === "video"
                    ? "video/*"
                    : selectedType === "presentation"
                      ? ".ppt,.pptx,.pdf"
                      : selectedType === "worksheet"
                        ? ".doc,.docx,.pdf"
                        : selectedType === "quiz"
                          ? ".pdf,.doc,.docx"
                          : undefined
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile}
              className={
                selectedFile
                  ? "bg-blue-500 hover:bg-blue-600"
                  : "bg-gray-300 cursor-not-allowed"
              }
            >
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
