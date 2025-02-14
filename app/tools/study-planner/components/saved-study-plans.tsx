"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LoadingSpinner } from "./loading-spinner";
import { FullStudyPlan } from "./full-study-plan";
import { useStudyPlans } from "../contexts/StudyPlanContext";
import { createClient } from "@/utils/supabase/client";
import { PdfDownloadButton } from "./pdf-download-button";
import { Pagination } from "./pagination";
import { Calendar, Clock, GraduationCap, School, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function SavedStudyPlans() {
  const { studyPlans, isLoading, error } = useStudyPlans();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const plansPerPage = 6;
  
  // Calculate pagination
  const totalPages = Math.ceil(studyPlans.length / plansPerPage);
  const startIndex = (currentPage - 1) * plansPerPage;
  const endIndex = startIndex + plansPerPage;
  const currentPlans = studyPlans.slice(startIndex, endIndex);

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
            {currentPlans.map((plan) => (
              <Card key={plan.id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="bg-primary/5 border-b">
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    {plan.subject}
                  </CardTitle>
                  <Badge variant="secondary">
                    Grade {plan.grade}
                  </Badge>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <School className="h-4 w-4" />
                      <span>{plan.board}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Target className="h-4 w-4" />
                      <span className="line-clamp-2">{plan.learning_goal}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(plan.created_at).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      <Button 
                        onClick={() => {
                          setSelectedPlanId(plan.id);
                          setTimeout(() => {
                            document.getElementById('fullPlanView')?.scrollIntoView({
                              behavior: 'smooth',
                              block: 'start'
                            });
                          }, 100);
                        }}
                        className="w-full"
                      >
                        View Plan
                      </Button>
                    </div>
                    <div className="mt-2">
                      <PdfDownloadButton plan={plan} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}

          {selectedPlanId && (
            <div id="fullPlanView">
              <FullStudyPlan
                planId={selectedPlanId}
                onClose={() => setSelectedPlanId(null)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
