import React from "react";

import { GeneratedText } from "./GeneratedText";
import { GeneratedImage } from "./GeneratedImage";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

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
    <Card className="generated-content space-y-4 flex">
      <div className="flex-1 p-4">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <GeneratedText text={text} />
      </div>
      {imageUrl && <GeneratedImage imageUrl={imageUrl} />}
    </Card>
  );
}
