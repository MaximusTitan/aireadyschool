"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LoadingSpinner } from "./loading-spinner";
import { FullStudyPlan } from "./full-study-plan";
import { useStudyPlans } from "../contexts/StudyPlanContext";

export function SavedStudyPlans() {
  const { studyPlans, isLoading, error } = useStudyPlans();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Your Saved Study Plans</h2>
      {studyPlans.length === 0 ? (
        <p>You haven't created any study plans yet.</p>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {studyPlans.map((plan) => (
              <Card key={plan.id}>
                <CardHeader>
                  <CardTitle>{plan.subject}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    <strong>Grade:</strong> {plan.grade}
                  </p>
                  <p>
                    <strong>Board:</strong> {plan.board}
                  </p>
                  <p>
                    <strong>Learning Goal:</strong> {plan.learning_goal}
                  </p>
                  <p>
                    <strong>Created:</strong>{" "}
                    {new Date(plan.created_at).toLocaleDateString()}
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => setSelectedPlanId(plan.id)}
                  >
                    View Plan
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          {selectedPlanId && (
            <FullStudyPlan
              planId={selectedPlanId}
              onClose={() => setSelectedPlanId(null)}
            />
          )}
        </>
      )}
    </div>
  );
}
