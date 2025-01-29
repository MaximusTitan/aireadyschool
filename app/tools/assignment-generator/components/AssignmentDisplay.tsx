import type React from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { GeneratedText } from "./GeneratedText";
import { Skeleton } from "@/components/ui/skeleton";

interface Assignment {
  title: string;
  content: string;
}

interface AssignmentDisplayProps {
  assignment: Assignment | null;
  isLoading: boolean;
}

export const AssignmentDisplay: React.FC<AssignmentDisplayProps> = ({
  assignment,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <Card className="mt-8 p-4 max-w-6xl mx-auto animate-pulse">
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
        </CardHeader>
        <div className="p-4 space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
      </Card>
    );
  }

  if (!assignment) {
    return null;
  }

  return (
    <Card className="mt-8 p-4 mb-8 max-w-6xl mx-auto animate-fadeIn">
      <CardHeader>
        <CardTitle className="text-2xl">{assignment.title}</CardTitle>
      </CardHeader>
      <GeneratedText text={assignment.content} />
    </Card>
  );
};
