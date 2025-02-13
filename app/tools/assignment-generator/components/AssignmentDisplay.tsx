import type React from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { GeneratedText } from "./GeneratedText";
import { Skeleton } from "@/components/ui/skeleton";
import { PDFDownload } from "./PDFDownload";

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
      <Card className="mt-8 p-6 max-w-6xl mx-auto animate-pulse shadow-md">
        <CardHeader className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
        </CardHeader>
        <div className="p-4 space-y-6">
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
    <Card className="mt-8 p-6 mb-8 max-w-6xl mx-auto transition-all duration-300 ease-in-out shadow-md hover:shadow-lg">
      <CardHeader className="pb-4 border-b">
        <CardTitle className="text-2xl font-bold text-primary">{assignment.title}</CardTitle>
      </CardHeader>
      <GeneratedText text={assignment.content} />
      <div className="mt-6 px-4 pb-4 flex justify-end border-t pt-4">
        <PDFDownload title={assignment.title} content={assignment.content} />
      </div>
    </Card>
  );
};
