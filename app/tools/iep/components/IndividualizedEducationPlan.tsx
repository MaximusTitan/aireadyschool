"use client";

import { useState, useEffect } from "react";
import { generateIEP } from "../utils/generateIEP";
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
}

export default function IndividualizedEducationPlan({
  studentInfo,
}: IndividualizedEducationPlanProps) {
  const [iepContent, setIepContent] = useState<string | null>(null);

  useEffect(() => {
    const fetchIEP = async () => {
      const generatedIEP = await generateIEP(studentInfo);
      setIepContent(generatedIEP);
    };

    fetchIEP();
  }, [studentInfo]);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Individualized Education Plan (IEP)</CardTitle>
      </CardHeader>
      <CardContent>
        {iepContent ? (
          <ReactMarkdown className="prose max-w-none">
            {iepContent}
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
