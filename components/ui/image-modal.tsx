import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Info,
} from "lucide-react";
import { Button } from "./button";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  prompt: string;
  style?: string;
  model?: string;
  aspectRatio?: string;
  onDownload: (url: string) => void;
  onRegenerate?: () => void;
  date?: string;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

export function ImageModal({
  isOpen,
  onClose,
  imageUrl,
  prompt,
  style = "Not specified",
  model = "Flux Schnell",
  aspectRatio = "Square",
  onDownload,
  onRegenerate,
  date,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}: ImageModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 gap-0 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl">
        <div className="flex flex-col md:flex-row h-full">
          {/* Left side - Image */}
          <div className="relative w-full md:w-2/3 h-[50vh] md:h-[80vh] bg-black/5 dark:bg-black/20">
            <div className="absolute top-2 right-2 z-10 flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="bg-black/20 hover:bg-black/40 text-white"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="absolute inset-0 flex items-center justify-center p-4">
              <motion.img
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                src={imageUrl}
                alt={prompt}
                className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              />
            </div>

            {/* Navigation buttons */}
            <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-4 pointer-events-none">
              {hasPrevious && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onPrevious}
                  className="pointer-events-auto bg-black/20 hover:bg-black/40 text-white"
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
              )}
              {hasNext && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onNext}
                  className="pointer-events-auto bg-black/20 hover:bg-black/40 text-white"
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              )}
            </div>
          </div>

          {/* Right side - Details */}
          <div className="w-full md:w-1/3 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Prompt */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Prompt</h3>
                <p className="text-neutral-600 dark:text-neutral-300">
                  {prompt}
                </p>
              </div>

              {/* Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Details</h3>
                <div className="grid gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500">Style</span>
                    <span className="font-medium">{style}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500">Model</span>
                    <span className="font-medium">{model}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-500">Aspect Ratio</span>
                    <span className="font-medium">{aspectRatio}</span>
                  </div>
                  {date && (
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-500">Generated</span>
                      <span className="font-medium">
                        {new Date(date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3 pt-4">
                <Button
                  className={cn(
                    "w-full bg-gradient-to-r from-rose-500 to-purple-600",
                    "text-white hover:from-rose-600 hover:to-purple-700"
                  )}
                  onClick={() => onDownload(imageUrl)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Image
                </Button>
                {onRegenerate && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={onRegenerate}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Regenerate
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
