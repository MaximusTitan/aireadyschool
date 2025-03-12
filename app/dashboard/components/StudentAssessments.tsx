import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface AssessmentProps {
  student: {
    id: string;
    grade_id: string;
    section_id: string;
  };
}

interface AssignedAssessment {
  id: string;
  assessment_id: number;
  due_date: string;
  completed: boolean;
  score: number | null;
  assessments: {
    subject: string;
    topic: string;
    questions: any[];
    assessment_type: string;
    difficulty: string;
  };
}

export default function StudentAssessments({ student }: AssessmentProps) {
  const [assessments, setAssessments] = useState<AssignedAssessment[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function fetchAssignedAssessments() {
      const { data, error } = await supabase
        .from("assigned_assessments")
        .select(
          `
          id,
          assessment_id,
          due_date,
          completed,
          score,
          assessments!inner (
            subject,
            topic,
            questions,
            assessment_type,
            difficulty
          )
        `
        )
        .or(
          `student_id.eq.${student.id},and(grade_id.eq.${student.grade_id},section_id.eq.${student.section_id},student_id.is.null)`
        )
        .order("due_date", { ascending: true });

      if (data) {
        // First cast to unknown, then to AssignedAssessment[]
        setAssessments(data as unknown as AssignedAssessment[]);
      }
    }

    fetchAssignedAssessments();
  }, [student, supabase]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mt-6">
      <h2 className="text-lg font-medium text-gray-800 mb-4">
        Assigned Assessments
      </h2>
      {assessments.length === 0 ? (
        <p className="text-gray-500">No assessments assigned.</p>
      ) : (
        <div className="space-y-4">
          {assessments.map((assessment) => (
            <div
              key={assessment.id}
              className="border rounded-lg p-4 hover:border-rose-200 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium text-gray-800">
                    {assessment.assessments.topic}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {assessment.assessments.subject} •{" "}
                    {assessment.assessments.difficulty}
                  </p>
                </div>
                {assessment.completed ? (
                  <div className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
                    Score: {assessment.score}%
                  </div>
                ) : (
                  <div className="bg-yellow-100 text-yellow-800 text-sm px-3 py-1 rounded-full">
                    Due: {new Date(assessment.due_date).toLocaleDateString()}
                  </div>
                )}
              </div>

              {!assessment.completed && (
                <Link
                  href={`/assessment/${assessment.assessment_id}?assigned_id=${assessment.id}`}
                  className="block w-full"
                >
                  <Button
                    variant="outline"
                    className="w-full mt-2 border-rose-200 hover:border-rose-300 hover:bg-rose-50"
                  >
                    Start Assessment
                  </Button>
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
