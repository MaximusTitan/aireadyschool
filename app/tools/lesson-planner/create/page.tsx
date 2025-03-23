"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import CreateLessonPlan from "../components/create-lesson-plan";

function CreateLessonPlanPageContent() {
  const searchParams = useSearchParams();

  const studentProps = {
    studentId: searchParams.get("studentId") || "",
    studentName: searchParams.get("studentName") || "",
    studentGrade: searchParams.get("grade") || "",
    studentEmail: searchParams.get("email") || "",
    subject: searchParams.get("subject") || undefined,
    title: searchParams.get("title") || undefined,
    board: searchParams.get("board") || undefined,
    assessmentId: searchParams.get("assessmentId") || undefined,
  };

  return (
    <div className="bg-backgroundApp min-h-screen">
      <CreateLessonPlan studentProps={studentProps} />
    </div>
  );
}

export default function CreateLessonPlanPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateLessonPlanPageContent />
    </Suspense>
  );
}
