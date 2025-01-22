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

interface KnowledgeParameters {
  [subject: string]: {
    [key: string]: number;
  };
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
            {/* Display all student information */}
            {Object.entries(generatedPLP.studentInformation).map(
              ([key, value]) => (
                <p key={key} className="capitalize">
                  {key}: {value}
                </p>
              )
            )}
          </div>
        </section>

        <section>
          <h3 className="font-semibold mb-2">Subject Specific Information</h3>
          <div className="grid gap-4">
            <h4 className="font-medium">General</h4>
            {Object.entries(
              generatedPLP.subjectSpecificInformation.general as Record<
                string,
                string
              >
            ).map(([key, value]) => (
              <p key={key} className="capitalize">
                {key}: {value}
              </p>
            ))}

            <h4 className="font-medium mt-4">Cognitive Parameters</h4>
            {Object.entries(
              generatedPLP.subjectSpecificInformation
                .cognitiveParameters as Record<string, number>
            ).map(([key, value]) => (
              <p key={key} className="capitalize">
                {key}: {value}
              </p>
            ))}

            <h4 className="font-medium mt-4">Knowledge Parameters</h4>
            {Object.entries(
              generatedPLP.subjectSpecificInformation
                .knowledgeParameters as KnowledgeParameters
            ).map(([subject, params]) => (
              <div key={subject}>
                <h5 className="font-medium capitalize">{subject}</h5>
                {Object.entries(params as Record<string, number>).map(
                  ([key, value]) => (
                    <p key={key} className="capitalize ml-4">
                      {key}: {value}
                    </p>
                  )
                )}
              </div>
            ))}

            <h4 className="font-medium mt-4">Additional Information</h4>
            <p>Topic: {generatedPLP.subjectSpecificInformation.topic}</p>
            <p>
              Other Information:{" "}
              {generatedPLP.subjectSpecificInformation.otherInformation}
            </p>
            <p>Goal: {generatedPLP.subjectSpecificInformation.goal}</p>
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
