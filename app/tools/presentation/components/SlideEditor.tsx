"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slide, SlideLayout } from "../types/presentation";
import { RefreshCw, Layout } from "lucide-react";
import { regenerateImage } from "../actions/generatePresentation";

interface SlideEditorProps {
  slide: Slide;
  onUpdate: (updatedSlide: Slide) => void;
}

export default function SlideEditor({ slide, onUpdate }: SlideEditorProps) {
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleChange = (field: keyof Slide, value: any) => {
    onUpdate({
      ...slide,
      [field]: value,
    });
  };

  const handleRegenerateImage = async (
    imageType: "main" | "right" | "additional",
    index?: number
  ) => {
    setIsRegenerating(true);
    try {
      const newImage = await regenerateImage(
        slide.title + (imageType === "right" ? " alternative" : "")
      );
      if (imageType === "main") {
        onUpdate({ ...slide, image: newImage });
      } else if (imageType === "right") {
        onUpdate({ ...slide, rightImage: newImage });
      } else if (typeof index === "number") {
        const newAdditionalImages = [...(slide.additionalImages || [])];
        newAdditionalImages[index] = newImage;
        onUpdate({ ...slide, additionalImages: newAdditionalImages });
      }
    } finally {
      setIsRegenerating(false);
    }
  };

  const renderLayout = () => {
    switch (slide.layout) {
      case "splitWithImage":
        return (
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                />
                <RegenerateButton
                  onClick={() => handleRegenerateImage("main")}
                  disabled={isRegenerating}
                />
              </div>
              <Textarea
                placeholder="Left column content"
                value={slide.leftContent || ""}
                onChange={(e) => handleChange("leftContent", e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <div className="space-y-4">
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                <img
                  src={slide.rightImage || slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover"
                />
                <RegenerateButton
                  onClick={() => handleRegenerateImage("right")}
                  disabled={isRegenerating}
                />
              </div>
              <Textarea
                placeholder="Right column content"
                value={slide.rightContent || ""}
                onChange={(e) => handleChange("rightContent", e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
        );

      case "fullBleed":
        return (
          <div className="space-y-6">
            <div className="relative aspect-[21/9] bg-muted rounded-lg overflow-hidden">
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover"
              />
              <RegenerateButton
                onClick={() => handleRegenerateImage("main")}
                disabled={isRegenerating}
              />
            </div>
            <Textarea
              placeholder="Content"
              value={slide.content || ""}
              onChange={(e) => handleChange("content", e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        );

      case "imageTop":
        return (
          <div className="space-y-6">
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover"
              />
              <RegenerateButton
                onClick={() => handleRegenerateImage("main")}
                disabled={isRegenerating}
              />
            </div>
            <Textarea
              placeholder="Content"
              value={slide.content || ""}
              onChange={(e) => handleChange("content", e.target.value)}
              className="min-h-[150px]"
            />
          </div>
        );

      case "imageBottom":
        return (
          <div className="space-y-6">
            <Textarea
              placeholder="Content"
              value={slide.content || ""}
              onChange={(e) => handleChange("content", e.target.value)}
              className="min-h-[150px]"
            />
            <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover"
              />
              <RegenerateButton
                onClick={() => handleRegenerateImage("main")}
                disabled={isRegenerating}
              />
            </div>
          </div>
        );

      case "gridLayout":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {[
                slide.image,
                slide.rightImage,
                ...(slide.additionalImages || []),
              ]
                .slice(0, 4)
                .map((img, index) => (
                  <div
                    key={index}
                    className="relative aspect-square bg-muted rounded-lg overflow-hidden"
                  >
                    <img
                      src={img}
                      alt={`${slide.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <RegenerateButton
                      onClick={() =>
                        handleRegenerateImage(
                          index === 0
                            ? "main"
                            : index === 1
                              ? "right"
                              : "additional",
                          index - 2
                        )
                      }
                      disabled={isRegenerating}
                    />
                  </div>
                ))}
            </div>
            <Textarea
              placeholder="Content"
              value={slide.content || ""}
              onChange={(e) => handleChange("content", e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        );
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-6">
        <div className="flex items-center gap-4 mb-8">
          <Input
            className="text-4xl font-bold border-none px-0 flex-1"
            placeholder="Slide Title"
            value={slide.title}
            onChange={(e) => handleChange("title", e.target.value)}
          />
          <Select
            value={slide.layout}
            onValueChange={(value: SlideLayout) =>
              handleChange("layout", value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <Layout className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Select layout" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="splitWithImage">Split View</SelectItem>
              <SelectItem value="fullBleed">Full Image</SelectItem>
              <SelectItem value="imageTop">Image Top</SelectItem>
              <SelectItem value="imageBottom">Image Bottom</SelectItem>
              <SelectItem value="gridLayout">Grid</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {renderLayout()}
      </CardContent>
    </Card>
  );
}

function RegenerateButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <Button
      size="sm"
      variant="secondary"
      className="absolute bottom-2 right-2"
      onClick={onClick}
      disabled={disabled}
    >
      <RefreshCw className={`h-4 w-4 ${disabled ? "animate-spin" : ""}`} />
      <span className="sr-only">Regenerate Image</span>
    </Button>
  );
}
