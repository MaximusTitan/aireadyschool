import React from "react";

import { GeneratedText } from "./GeneratedText";
import { GeneratedImage } from "./GeneratedImage";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface GeneratedContentProps {
  text: string;
  imageUrl?: string;
  title: string;
  contentType: string;
  isImageLoading?: boolean;  // Add this prop
}

export function GeneratedContent({
  text,
  imageUrl,
  title,
  contentType,
  isImageLoading = false,  // Provide default value
}: GeneratedContentProps) {
  return (
    <Card className="generated-content space-y-4 rounded-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold mb-4">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {isImageLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          imageUrl && (
            <div>
              <GeneratedImage imageUrl={imageUrl} />
            </div>
          )
        )}
        <GeneratedText text={text} />
      </CardContent>
    </Card>
  );
}
