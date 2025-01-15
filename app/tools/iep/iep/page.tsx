"use client";

import IEPForm from "../components/iep-form";
import IndividualizedEducationPlan from "../components/IndividualizedEducationPlan";
import { useState } from "react";

interface StudentInfo {
  name: string;
  grade: string;
  country: string;
  syllabus: string;
  strengths: string;
  weaknesses: string;
}

export default function IEPPage() {
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);

  const handleFormSubmit = (data: StudentInfo) => {
    setStudentInfo(data);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Student IEP</h1>
      <IEPForm onSubmit={handleFormSubmit} />
      {studentInfo && <IndividualizedEducationPlan studentInfo={studentInfo} />}
    </div>
  );
}
