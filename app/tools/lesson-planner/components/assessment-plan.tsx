"use client";

import { Button } from "@/components/ui/button";
import { AddContentDropdown } from "./add-content-dropdown";
import { FileViewer } from "./file-viewer";
import { AssessmentPlan, UploadedFile } from "../types";

interface AssessmentPlanViewProps {
  assessmentPlan: AssessmentPlan;
  userRole: string | null;
  uploadedFiles: { [key: string]: UploadedFile[] };
  onEdit: (type: string, data: any) => void;
  onFileUpload: (file: File, type: string, sectionId: string) => Promise<void>;
  onDeleteFile: (fileId: string, sectionId: string) => Promise<void>;
}

export function AssessmentPlanView({
  assessmentPlan,
  userRole,
  uploadedFiles,
  onEdit,
  onFileUpload,
  onDeleteFile,
}: AssessmentPlanViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Assessment Plan</h2>
        <div className="flex gap-2">
          {userRole !== "Student" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit("assessmentPlan", assessmentPlan)}
            >
              Edit Plan
            </Button>
          )}
          {userRole !== "Student" && (
            <AddContentDropdown
              onUpload={(file, type) =>
                onFileUpload(file, type, "assessment-plan")
              }
            />
          )}
        </div>
      </div>

      {uploadedFiles["assessment-plan"]?.length > 0 && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h3 className="font-semibold mb-4">Uploaded Materials</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {uploadedFiles["assessment-plan"].map((file) => (
              <FileViewer
                key={file.id}
                file={file}
                onDelete={
                  userRole !== "Student"
                    ? (id) => onDeleteFile(id, "assessment-plan")
                    : undefined
                }
                canDelete={userRole !== "Student"}
              />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <h3 className="font-semibold mb-4">Formative Assessments</h3>
          <div className="space-y-4">
            {assessmentPlan.formativeAssessments.map((assessment, index) => (
              <div key={index} className="border-b pb-4">
                <div className="font-medium mb-2">{assessment.topic}</div>
                <p className="text-gray-600 mb-2">{assessment.description}</p>
                <div className="text-sm text-gray-500">
                  Type: {assessment.type}
                </div>
                <div className="mt-2">
                  <div className="font-medium text-sm mb-1">
                    Evaluation Criteria:
                  </div>
                  <ul className="list-disc pl-5 space-y-1">
                    {assessment.evaluationCriteria.map((criteria, idx) => (
                      <li key={idx} className="text-gray-600">
                        {criteria}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-4">Summative Assessments</h3>
          <div className="space-y-4">
            {assessmentPlan.summativeAssessments.map((assessment, index) => (
              <div key={index} className="border-b pb-4">
                <div className="font-medium mb-2">{assessment.topic}</div>
                <p className="text-gray-600 mb-2">{assessment.description}</p>
                <div className="text-sm text-gray-500">
                  Type: {assessment.type}
                </div>
                <div className="mt-2">
                  <div className="font-medium text-sm mb-1">
                    Evaluation Criteria:
                  </div>
                  <ul className="list-disc pl-5 space-y-1">
                    {assessment.evaluationCriteria.map((criteria, idx) => (
                      <li key={idx} className="text-gray-600">
                        {criteria}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Progress Tracking Suggestions</h3>
          <ul className="list-disc pl-5 space-y-1">
            {assessmentPlan.progressTrackingSuggestions.map(
              (suggestion, index) => (
                <li key={index} className="text-gray-600">
                  {suggestion}
                </li>
              )
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
