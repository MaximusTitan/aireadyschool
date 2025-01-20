"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { IEPData } from "../types/iep";

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
  generatedIEP: IEPData | null;
}

export function IndividualizedEducationPlan({
  studentInfo,
  generatedIEP,
}: IndividualizedEducationPlanProps) {
  if (!generatedIEP) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Individualized Education Plan (IEP)</CardTitle>
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
        <CardTitle>Individualized Education Plan (IEP)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <section>
          <h3 className="font-semibold mb-2">Present Levels of Performance</h3>
          <div className="grid gap-4 mb-4">
            {Object.entries(generatedIEP.presentLevelsOfPerformance).map(
              ([key, value]) => (
                <div key={key}>
                  <h4 className="font-medium capitalize">{key}</h4>
                  <p className="text-gray-700">{value}</p>
                </div>
              )
            )}
          </div>
        </section>

        <section>
          <h3 className="font-semibold mb-2">Annual Goals</h3>
          <div className="space-y-4">
            {generatedIEP.annualGoals.map((goal, index) => (
              <div key={index} className="border-l-2 border-gray-200 pl-4">
                <p className="font-medium">{goal.goal}</p>
                <ul className="list-disc list-inside mt-2">
                  {goal.objectives.map((objective, idx) => (
                    <li key={idx} className="text-gray-700">
                      {objective}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="font-semibold mb-2">Special Education Services</h3>
          <ul className="list-disc list-inside">
            {generatedIEP.specialEducationServices.map((service, index) => (
              <li key={index}>
                {service.service} - {service.frequency}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="font-semibold mb-2">
            Accommodations and Modifications
          </h3>
          <ul className="list-disc list-inside">
            {generatedIEP.accommodationsAndModifications.map((item, index) => (
              <li key={index} className="text-gray-700">
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="font-semibold mb-2">
            Assessment & Progress Monitoring
          </h3>
          <div className="grid gap-4">
            <div>
              <h4 className="font-medium">Assessment Methods</h4>
              <ul className="list-disc list-inside">
                {generatedIEP.assessmentInformation.methods.map(
                  (method, index) => (
                    <li key={index} className="text-gray-700">
                      {method}
                    </li>
                  )
                )}
              </ul>
              <p className="mt-1">
                Schedule: {generatedIEP.assessmentInformation.schedule}
              </p>
            </div>
            <div>
              <h4 className="font-medium">Progress Monitoring</h4>
              <ul className="list-disc list-inside">
                {generatedIEP.progressMonitoringPlan.methods.map(
                  (method, index) => (
                    <li key={index} className="text-gray-700">
                      {method}
                    </li>
                  )
                )}
              </ul>
              <p className="mt-1">
                Frequency: {generatedIEP.progressMonitoringPlan.frequency}
              </p>
            </div>
          </div>
        </section>

        <section>
          <h3 className="font-semibold mb-2">Personal Context</h3>
          <div className="grid gap-4">
            <div>
              <h4 className="font-medium">Disabilities</h4>
              <ul className="list-disc list-inside">
                {generatedIEP.personalContext.disabilities.map(
                  (disability, index) => (
                    <li key={index} className="text-gray-700">
                      {disability}
                    </li>
                  )
                )}
              </ul>
            </div>
            <div>
              <h4 className="font-medium">Additional Notes</h4>
              <p className="text-gray-700">
                {generatedIEP.personalContext.additionalNotes}
              </p>
            </div>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
