import React from "react";

import { GeneratedText } from "./GeneratedText";
import { GeneratedImage } from "./GeneratedImage";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface GeneratedContentProps {
  text: string;
  imageUrl?: string;
  title: string;
  contentType: string;
}

export function GeneratedContent({
  text,
  imageUrl,
  title,
  contentType,
}: GeneratedContentProps) {
  return (
    <Card className="generated-content space-y-4 rounded-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold mb-4">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {imageUrl &&
          ["guided-notes", "case-studies", "scenario-activities"].includes(
            contentType,
          ) && (
            <div>
              <GeneratedImage imageUrl={imageUrl} />
            </div>
          )}
        <GeneratedText text={text} />
      </CardContent>
    </Card>
  );
}
