"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import ReactMarkdown from "react-markdown";

interface StudentInfo {
  name: string;
  grade: string;
  country: string;
  syllabus: string;
  strengths: string;
  weaknesses: string;
}

interface IndividualizedEducationPlanProps {
  studentInfo: StudentInfo;
  generatedIEP: string | null;
}

export function IndividualizedEducationPlan({
  studentInfo,
  generatedIEP,
}: IndividualizedEducationPlanProps) {
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Individualized Education Plan (IEP)</CardTitle>
      </CardHeader>
      <CardContent>
        {generatedIEP ? (
          <ReactMarkdown className="prose max-w-none">
            {generatedIEP}
          </ReactMarkdown>
        ) : (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
