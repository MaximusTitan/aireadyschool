import React from "react";

import { GeneratedText } from "./GeneratedText";
import { GeneratedImage } from "./GeneratedImage";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface GeneratedContentProps {
  text: string;
  imageUrl?: string;
  title: string;
}

export function GeneratedContent({
  text,
  imageUrl,
  title,
}: GeneratedContentProps) {
  return (
    <Card className="generated-content space-y-4 rounded-lg overflow-hidden">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {imageUrl && <GeneratedImage imageUrl={imageUrl} />}
        <GeneratedText text={text} />
      </CardContent>
    </Card>
  );
}
