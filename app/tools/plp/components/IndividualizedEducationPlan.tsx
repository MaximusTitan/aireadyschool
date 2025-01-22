"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { PLPData } from "../types/plp";

interface StudentInfo {
  name: string;
  grade: string;
  country: string;
  board: string;
  strengths: string;
  weaknesses: string;
}

interface IndividualizedEducationPlanProps {
  studentInfo: StudentInfo;
  generatedPLP: PLPData | null;
}

export function IndividualizedEducationPlan({
  studentInfo,
  generatedPLP,
}: IndividualizedEducationPlanProps) {
  if (!generatedPLP) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Individualized Education Plan (PLP)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Individualized Education Plan (PLP)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Student Information Section */}
        <section>
          <h3 className="font-semibold mb-2">Student Information</h3>
          <div className="grid gap-4">
            <p>Name: {generatedPLP.studentInformation.name}</p>
            <p>Grade: {generatedPLP.studentInformation.grade}</p>
            <p>Board: {generatedPLP.studentInformation.board}</p>
            <p>Country: {generatedPLP.studentInformation.country}</p>
            <p>Strengths: {studentInfo.strengths}</p>
            <p>Weaknesses: {studentInfo.weaknesses}</p>
          </div>
        </section>

        <section>
          <h3 className="font-semibold mb-2">Present Levels of Performance</h3>
          {generatedPLP.presentLevelsOfPerformance ? (
            <div className="grid gap-4 mb-4">
              {Object.entries(generatedPLP.presentLevelsOfPerformance)
                .filter(([key]) =>
                  ["academic", "social", "behavioral"].includes(key)
                )
                .map(([key, value]) => (
                  <div key={key}>
                    <h4 className="font-medium capitalize">{key}</h4>
                    <p className="text-gray-700">{value}</p>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-red-500">
              Present Levels of Performance data is unavailable.
            </p>
          )}
        </section>

        <section>
          <h3 className="font-semibold mb-2">Special Education Services</h3>
          <ul className="list-disc list-inside">
            {generatedPLP.specialEducationServices?.map((service, index) => (
              <li key={index}>
                {service.service} - {service.frequency}
              </li>
            )) || <li>No special education services listed.</li>}
          </ul>
        </section>
      </CardContent>
    </Card>
  );
}
