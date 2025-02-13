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
  isImageLoading?: boolean;
}

export function GeneratedContent({
  text,
  imageUrl,
  title,
  contentType,
  isImageLoading = false,
}: GeneratedContentProps) {
  return (
    <Card className="generated-content border-2 shadow-lg overflow-hidden">
      <CardHeader className="bg-muted/50 border-b">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-neutral-900 to-neutral-600 bg-clip-text text-transparent">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-8">
        {isImageLoading ? (
          <div className="flex items-center justify-center h-64 bg-muted/20 rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
          </div>
        ) : (
          imageUrl && (
            <div className="rounded-lg overflow-hidden border-2">
              <GeneratedImage imageUrl={imageUrl} />
            </div>
          )
        )}
        <GeneratedText text={text} />
      </CardContent>
    </Card>
  );
}
