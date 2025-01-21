import type React from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { GeneratedText } from "./GeneratedText";

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
    return <p className="text-center mt-4">Loading...</p>;
  }

  if (!assignment) {
    return null;
  }

  return (
    <Card className="mt-8 p-4 max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle>{assignment.title}</CardTitle>
      </CardHeader>
      <GeneratedText text={assignment.content} />
    </Card>
  );
};
