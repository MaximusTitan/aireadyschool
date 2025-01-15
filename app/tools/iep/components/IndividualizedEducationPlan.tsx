"use client";

import { useState, useEffect } from "react";
import { generateIEP } from "../utils/generateIEP";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function IndividualizedEducationPlan() {
  const [iepContent, setIepContent] = useState<string | null>(null);

  useEffect(() => {
    const fetchIEP = async () => {
      const studentInfo = {
        name: "Naira Madnani",
        grade: "7",
        country: "India",
        syllabus: "IGCSE",
        strengths:
          "She is smart and has a good grasping power. She is good in Numerical calculations.",
        weaknesses:
          "Does not submit her assignments despite repeated reminders. She struggles in algebra and word problems.",
      };

      const generatedIEP = await generateIEP(studentInfo);
      setIepContent(generatedIEP);
    };

    fetchIEP();
  }, []);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Individualized Education Plan (IEP)</CardTitle>
      </CardHeader>
      <CardContent>
        {iepContent ? (
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: iepContent }}
          />
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
