import React from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

interface GeneratedContentProps {
  title: string;
  content: string;
}

export function GeneratedContent({ title, content }: GeneratedContentProps) {
  return (
    <Card className="generated-content space-y-4">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <div className="p-4">
        <p>{content}</p>
      </div>
    </Card>
  );
}
