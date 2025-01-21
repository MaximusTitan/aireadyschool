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
          <h3 className="font-semibold mb-2">Annual Goals</h3>
          {Array.isArray(generatedPLP.annualGoals) &&
          generatedPLP.annualGoals.length > 0 ? (
            <div className="space-y-4">
              {generatedPLP.annualGoals.map((goal, index) => (
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
          ) : (
            <p className="text-red-500">Annual Goals data is unavailable.</p>
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

        <section>
          <h3 className="font-semibold mb-2">
            Accommodations and Modifications
          </h3>
          <ul className="list-disc list-inside">
            {generatedPLP.accommodationsAndModifications.map((item, index) => (
              <li key={index} className="text-gray-700">
                {item}
              </li>
            )) || <li>No accomodations and modifications listed.</li>}
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
                {generatedPLP.assessmentInformation.methods.map(
                  (method, index) => (
                    <li key={index} className="text-gray-700">
                      {method}
                    </li>
                  )
                ) || <li>No assessment information listed.</li>}
              </ul>
              <p className="mt-1">
                Schedule: {generatedPLP.assessmentInformation.schedule}
              </p>
            </div>
            <div>
              <h4 className="font-medium">Progress Monitoring</h4>
              <ul className="list-disc list-inside">
                {generatedPLP.progressMonitoringPlan.methods.map(
                  (method, index) => (
                    <li key={index} className="text-gray-700">
                      {method}
                    </li>
                  )
                ) || <li>No progress monitoring plan listed.</li>}
              </ul>
              <p className="mt-1">
                Frequency: {generatedPLP.progressMonitoringPlan.frequency}
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
                {generatedPLP.personalContext.disabilities.map(
                  (disability, index) => (
                    <li key={index} className="text-gray-700">
                      {disability}
                    </li>
                  )
                ) || <li>No personal context listed.</li>}
              </ul>
            </div>
            <div>
              <h4 className="font-medium">Additional Notes</h4>
              <p className="text-gray-700">
                {generatedPLP.personalContext.additionalNotes}
              </p>
            </div>
          </div>
        </section>

        <section>
          <h3 className="font-semibold mb-2">Subject Specific Information</h3>
          <div className="grid gap-4">
            <div>
              <h4 className="font-medium">General Information</h4>
              <p>Age: {generatedPLP.subjectSpecificInformation.general.age}</p>
              <p>
                Grade: {generatedPLP.subjectSpecificInformation.general.grade}
              </p>
              <p>
                Gender: {generatedPLP.subjectSpecificInformation.general.gender}
              </p>
              <p>
                Nationality:{" "}
                {generatedPLP.subjectSpecificInformation.general.nationality}
              </p>
              <p>
                Board: {generatedPLP.subjectSpecificInformation.general.board}
              </p>
            </div>
            <div>
              <h4 className="font-medium">Cognitive Parameters</h4>
              <ul className="list-disc list-inside">
                {Object.entries(
                  generatedPLP.subjectSpecificInformation.cognitiveParameters
                ).map(([key, value]) => (
                  <li key={key}>
                    {key}: {value}/5
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium">Knowledge Parameters</h4>
              {Object.entries(
                generatedPLP.subjectSpecificInformation.knowledgeParameters
              ).map(([subject, details]) => (
                <div key={subject} className="mb-2">
                  <h5 className="font-semibold capitalize">{subject}</h5>
                  <p>Score: {details.score}/5</p>
                  <ul className="list-disc list-inside">
                    {Object.entries(details).map(([skill, score]) => {
                      if (skill === "score") return null;
                      return (
                        <li key={skill}>
                          {skill}: {score}/5
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
            <div>
              <h4 className="font-medium">Topic</h4>
              <p>{generatedPLP.subjectSpecificInformation.topic}</p>
            </div>
            <div>
              <h4 className="font-medium">Other Information</h4>
              <p>Grade: {studentInfo.grade}</p> {/* Added grade */}
              <p>{generatedPLP.subjectSpecificInformation.otherInformation}</p>
            </div>
            <div>
              <h4 className="font-medium">Goal</h4>
              <p>{generatedPLP.subjectSpecificInformation.goal}</p>
            </div>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
