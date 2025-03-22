import React from "react";
import DashboardCard from "./DashboardCard";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation"; // added import

interface Assessment {
  id: string;
  board?: string;
  topic: string;
  class_level: string;
  subject: string;
  assessment_type: string;
  created_at: string;
}

interface AssessmentHistoryProps {
  assessments: Assessment[] | undefined;
  loading: boolean;
  error: string | null;
  assignedAssessments: any[];
  viewAssessment: (assessmentId: string) => void;
  studentEmail: string; // added prop
}

const AssessmentHistory: React.FC<AssessmentHistoryProps> = ({
  assessments,
  loading,
  error,
  assignedAssessments,
  viewAssessment,
  studentEmail, // destructured new prop
}) => {
  const router = useRouter(); // initialize router

  // new function for evaluation redirect
  const handleEvaluation = (assessmentId: string) => {
    router.push(
      `/tools/evaluator_test?assessment_id=${assessmentId}&student_email=${encodeURIComponent(studentEmail)}`
    );
  };

  return (
    <DashboardCard title="Assessment History">
      <div className="p-6">
        {loading ? (
          <div className="animate-pulse text-center py-4">
            Loading assessment history...
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-4">{error}</div>
        ) : assessments && assessments.length > 0 ? (
          <div className="relative w-full overflow-auto max-h-[400px] scrollbar-thin">
            <style>{`
              .scrollbar-thin::-webkit-scrollbar {
                width: 6px;
                height: 6px;
              }
              .scrollbar-thin::-webkit-scrollbar-track {
                background: transparent;
              }
              .scrollbar-thin::-webkit-scrollbar-thumb {
                background-color: rgba(0, 0, 0, 0.1);
                border-radius: 3px;
              }
              .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                background-color: rgba(0, 0, 0, 0.2);
              }
              .dark .scrollbar-thin::-webkit-scrollbar-thumb {
                background-color: rgba(255, 255, 255, 0.1);
              }
              .dark .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                background-color: rgba(255, 255, 255, 0.2);
              }
            `}</style>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="h-12 px-4 text-left align-middle font-medium text-gray-500">
                    Board
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-gray-500">
                    Title
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-gray-500">
                    Grade
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-gray-500">
                    Subject
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-gray-500">
                    Type
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-gray-500">
                    Date
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-gray-500">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assessments.map((assessment) => {
                  const isAssigned = assignedAssessments.some(
                    (a) => a.assessment_id === assessment.id
                  );
                  return (
                    <tr
                      key={assessment.id}
                      className="border-b transition-colors hover:bg-gray-100"
                    >
                      <td className="p-4 align-middle">
                        {assessment.board || "N/A"}
                      </td>
                      <td className="p-4 align-middle truncate max-w-[200px]">
                        {assessment.topic}
                      </td>
                      <td className="p-4 align-middle">
                        {assessment.class_level}
                      </td>
                      <td className="p-4 align-middle">{assessment.subject}</td>
                      <td className="p-4 align-middle capitalize">
                        {assessment.assessment_type}
                      </td>
                      <td className="p-4 align-middle">
                        {new Date(assessment.created_at).toLocaleDateString(
                          "en-GB",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "2-digit",
                          }
                        )}
                      </td>
                      <td className="p-4 align-middle flex gap-2">
                        {isAssigned && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => viewAssessment(assessment.id)}
                          >
                            View
                          </Button>
                        )}
                        {/* New button for evaluation action */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEvaluation(assessment.id)}
                        >
                          Show Evaluation
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500">
            No assessment history available
          </p>
        )}
      </div>
    </DashboardCard>
  );
};

export default AssessmentHistory;
