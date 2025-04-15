"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AddContentDropdown } from "./add-content-dropdown";
import { FileViewer } from "./file-viewer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import ReactMarkdown from "react-markdown";
import {
  Day,
  ScheduleItem,
  GeneratedNotes,
  UploadedFile,
} from "../types/index";
import { Fragment } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Edit2, PlusCircle, Check, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Assessment from "@/app/tools/mcq-generator/components/assessment/Assessment";

interface LessonContentProps {
  day: Day;
  userRole: string | null;
  generatedNotes: GeneratedNotes;
  uploadedFiles: { [key: string]: UploadedFile[] };
  onEdit: (type: string, data: any, dayIndex?: number) => void;
  onGenerateNotes: (activityTitle: string, activityContent: string) => void;
  onFileUpload: (file: File, type: string, sectionId: string) => Promise<void>;
  onDeleteFile: (fileId: string, sectionId: string) => Promise<void>;
  onChatWithBuddy: (item: ScheduleItem, day: Day, notes?: string) => void;
  showDocumentGenerator?: boolean;
  setShowDocumentGenerator?: (show: boolean) => void;
  onNotesEdit?: (activityTitle: string, notes: string) => void;
  onCreateAssessment?: (assessment: any) => Promise<void>;
  onSubmitAssessment?: (answers: any[]) => Promise<void>;
  assessmentData?: any;
  isCreatingAssessment?: boolean;
}

export function LessonContent({
  day,
  userRole,
  generatedNotes,
  uploadedFiles,
  onEdit,
  onGenerateNotes,
  onFileUpload,
  onDeleteFile,
  onChatWithBuddy,
  showDocumentGenerator,
  setShowDocumentGenerator,
  onNotesEdit = () => {},
  onCreateAssessment,
  onSubmitAssessment,
  assessmentData,
  isCreatingAssessment = false,
}: LessonContentProps) {
  const [editingNotes, setEditingNotes] = useState<{
    [key: string]: { editing: boolean; content: string };
  }>({});
  const [showAssessmentCreator, setShowAssessmentCreator] = useState(false);
  const [showAssessment, setShowAssessment] = useState(false);
  const [assessmentForm, setAssessmentForm] = useState({
    type: "mcq",
    topic: "",
    difficulty: "Medium",
    questionCount: 5,
    board: "",
    subject: "",
  });

  const handleEditNotes = (activityTitle: string, currentNotes: string) => {
    setEditingNotes((prev) => ({
      ...prev,
      [activityTitle]: { editing: true, content: currentNotes },
    }));
  };

  const handleSaveNotes = (activityTitle: string) => {
    if (editingNotes[activityTitle]) {
      onNotesEdit?.(activityTitle, editingNotes[activityTitle].content);
      setEditingNotes((prev) => ({
        ...prev,
        [activityTitle]: { ...prev[activityTitle], editing: false },
      }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800">
          Session {day.day}: {day.topicHeading}
        </h2>
        <p className="text-gray-600 mt-4">
          {day.schedule.find((item) => item.type === "introduction")?.content ||
            "This session focuses on key concepts related to the topic."}
        </p>
      </div>

      <div className="border-t border-gray-200 pt-6 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Learning Outcomes</h3>
          {userRole !== "Student" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                onEdit(
                  "learningOutcomes",
                  day.learningOutcomes || [],
                  day.day - 1
                )
              }
            >
              Edit
            </Button>
          )}
        </div>
        <ul className="space-y-2">
          {(day.learningOutcomes || []).map((outcome, index) => (
            <li key={index} className="flex items-start">
              <span className="inline-flex items-center justify-center rounded-full border border-gray-300 p-1 mr-3 mt-1">
                <span className="h-2 w-2 rounded-full bg-gray-500"></span>
              </span>
              <span>{outcome}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-gray-200 pt-6 mt-6">
        <h3 className="text-lg font-semibold mb-4">Lesson Objectives</h3>
        <ul className="space-y-2">
          {day.schedule
            .filter(
              (item) => item.type === "mainContent" || item.type === "activity"
            )
            .slice(0, 2)
            .map((item, index) => (
              <li key={index} className="flex items-start">
                <span className="inline-flex items-center justify-center rounded-full border border-gray-300 p-1 mr-3 mt-1">
                  <span className="h-2 w-2 rounded-full bg-gray-500"></span>
                </span>
                <span>{item.title}</span>
              </li>
            ))}
        </ul>
      </div>

      <div className="border-t border-gray-200 pt-6 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Lesson Plan</h3>
          {userRole !== "Student" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit("schedule", day.schedule, day.day - 1)}
            >
              Edit Schedule
            </Button>
          )}
        </div>
        <div className="border rounded-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 w-24">
                  Duration
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                  Activities
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {day.schedule.map((item, index) => (
                <Fragment key={index}>
                  <tr key={`row-${index}`}>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {String(item.timeAllocation).padStart(2, "0")}:
                      {String(0).padStart(2, "0")}
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900">
                        {item.title || item.type}
                      </div>
                      {userRole !== "Student" && (
                        <div className="mt-1 text-sm text-gray-500">
                          {item.content}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {userRole !== "Student" && (
                          <AddContentDropdown
                            onUpload={(file, type) =>
                              onFileUpload(
                                file,
                                type,
                                `material-${day.day}-${index}`
                              )
                            }
                          />
                        )}
                        {userRole === "Student" &&
                          generatedNotes[item.title] && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                              onClick={() =>
                                onChatWithBuddy(
                                  item,
                                  day,
                                  generatedNotes[item.title]
                                )
                              }
                            >
                              Chat with Buddy
                            </Button>
                          )}
                        {userRole !== "Student" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              onGenerateNotes(item.title, item.content)
                            }
                          >
                            {generatedNotes[item.title]
                              ? "Generate More Notes"
                              : "Generate Notes"}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {(generatedNotes[item.title] ||
                    uploadedFiles[`material-${day.day}-${index}`]?.length >
                      0) && (
                    <tr key={`content-${index}`}>
                      <td colSpan={3} className="px-4 py-4 bg-gray-50">
                        <Accordion type="single" collapsible>
                          <AccordionItem value="content">
                            <AccordionTrigger className="text-sm font-medium">
                              View Materials & Notes
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-4 pt-2">
                                {generatedNotes[item.title] && (
                                  <div className="bg-white rounded-lg border p-4">
                                    <div className="flex justify-between items-center mb-2">
                                      <h4 className="font-medium text-gray-900">
                                        Generated Notes
                                      </h4>
                                      {userRole !== "Student" && (
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() =>
                                            handleEditNotes(
                                              item.title,
                                              generatedNotes[item.title]
                                            )
                                          }
                                        >
                                          <Edit2 className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                    {editingNotes[item.title]?.editing ? (
                                      <div className="space-y-2">
                                        <Textarea
                                          value={
                                            editingNotes[item.title].content
                                          }
                                          onChange={(e) =>
                                            setEditingNotes((prev) => ({
                                              ...prev,
                                              [item.title]: {
                                                ...prev[item.title],
                                                content: e.target.value,
                                              },
                                            }))
                                          }
                                          className="min-h-[200px]"
                                        />
                                        <Button
                                          size="sm"
                                          onClick={() =>
                                            handleSaveNotes(item.title)
                                          }
                                        >
                                          Save Notes
                                        </Button>
                                      </div>
                                    ) : (
                                      <div className="text-sm text-gray-600 whitespace-pre-wrap">
                                        <ReactMarkdown>
                                          {generatedNotes[item.title]}
                                        </ReactMarkdown>
                                      </div>
                                    )}
                                  </div>
                                )}
                                {uploadedFiles[`material-${day.day}-${index}`]
                                  ?.length > 0 && (
                                  <div className="space-y-2">
                                    <h4 className="font-medium text-gray-900">
                                      Materials
                                    </h4>
                                    <div className="grid gap-4">
                                      {uploadedFiles[
                                        `material-${day.day}-${index}`
                                      ].map((file) => (
                                        <FileViewer
                                          key={file.id}
                                          file={file}
                                          onDelete={
                                            userRole !== "Student"
                                              ? (id) =>
                                                  onDeleteFile(
                                                    id,
                                                    `material-${day.day}-${index}`
                                                  )
                                              : undefined
                                          }
                                          canDelete={userRole !== "Student"}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Teaching Aids</h3>
          {userRole !== "Student" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                onEdit("teachingAids", day.teachingAids || [], day.day - 1)
              }
            >
              Edit
            </Button>
          )}
        </div>
        <ul className="space-y-2">
          {(day.teachingAids || []).map((aid, index) => (
            <li key={index} className="flex items-start">
              <span className="inline-flex items-center justify-center rounded-full border border-gray-300 p-1 mr-3 mt-1">
                <span className="h-2 w-2 rounded-full bg-gray-500"></span>
              </span>
              <span>{aid}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-gray-200 pt-6 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Assignment</h3>
          {userRole !== "Student" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                onEdit(
                  "assignment",
                  day.assignment || { description: "", tasks: [] },
                  day.day - 1
                )
              }
            >
              Edit
            </Button>
          )}
        </div>
        <div className="p-4 bg-gray-50 rounded-md">
          <p className="mb-3">
            {day.assignment?.description ||
              "No assignment description available."}
          </p>
          <ul className="list-disc pl-5 space-y-1">
            {(day.assignment?.tasks || []).map((task, index) => (
              <li key={index}>{task}</li>
            ))}
          </ul>
          {userRole === "Student" && day.assignment && (
            <Button
              onClick={() => setShowDocumentGenerator?.(true)}
              className="w-fit justify-center mt-2"
            >
              {day.assignment.document_id
                ? "Open Document"
                : "Start Assignment"}
            </Button>
          )}
          {userRole === "Teacher" && day.assignment?.document_id && (
            <Button
              onClick={() => setShowDocumentGenerator?.(true)}
              className="w-fit justify-center mt-2"
            >
              View Document
            </Button>
          )}
        </div>
      </div>

      {day.assessment && (
        <div className="border-t border-gray-200 pt-6 mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Assessment</h3>
            {userRole !== "Student" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  onEdit(
                    "assessment",
                    day.assessment || { topic: "", learningObjectives: [] },
                    day.day - 1
                  )
                }
              >
                Edit
              </Button>
            )}
          </div>
          <div className="p-4 bg-gray-50 rounded-md">
            <h4 className="font-medium mb-2">{day.assessment.topic}</h4>
            <p className="mb-3">Learning Objectives:</p>
            <ul className="list-disc pl-5 space-y-1">
              {(day.assessment.learningObjectives || []).map(
                (objective, index) => (
                  <li key={index}>{objective}</li>
                )
              )}
            </ul>

            {userRole === "Teacher" && !assessmentData && (
              <div className="mt-4">
                {showAssessmentCreator ? (
                  <div className="mt-4 border p-4 rounded-md bg-white space-y-4">
                    <h4 className="font-medium">Create Assessment</h4>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Assessment Type
                        </label>
                        <Select
                          value={assessmentForm.type}
                          onValueChange={(val) =>
                            setAssessmentForm((prev) => ({
                              ...prev,
                              type: val,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mcq">Multiple Choice</SelectItem>
                            <SelectItem value="truefalse">
                              True/False
                            </SelectItem>
                            <SelectItem value="fillintheblank">
                              Fill in the Blanks
                            </SelectItem>
                            <SelectItem value="shortanswer">
                              Short Answer
                            </SelectItem>
                            <SelectItem value="mixedassessment">
                              Mixed Assessment
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Difficulty
                        </label>
                        <Select
                          value={assessmentForm.difficulty}
                          onValueChange={(val) =>
                            setAssessmentForm((prev) => ({
                              ...prev,
                              difficulty: val,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select difficulty" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Easy">Easy</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="Hard">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Topic
                      </label>
                      <Input
                        value={assessmentForm.topic || day.assessment.topic}
                        onChange={(e) =>
                          setAssessmentForm((prev) => ({
                            ...prev,
                            topic: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Number of Questions
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max="20"
                        value={assessmentForm.questionCount}
                        onChange={(e) =>
                          setAssessmentForm((prev) => ({
                            ...prev,
                            questionCount: parseInt(e.target.value) || 5,
                          }))
                        }
                      />
                    </div>

                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => setShowAssessmentCreator(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          onCreateAssessment &&
                            onCreateAssessment({
                              ...assessmentForm,
                              board:
                                day.assessment?.board || assessmentForm.board,
                              subject:
                                day.assessment?.subject ||
                                assessmentForm.subject,
                              learningOutcomes:
                                day.assessment?.learningObjectives || [],
                            });
                        }}
                        disabled={isCreatingAssessment}
                      >
                        {isCreatingAssessment ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          "Generate Assessment"
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    onClick={() => setShowAssessmentCreator(true)}
                    className="mt-2 flex items-center gap-1"
                  >
                    <PlusCircle className="h-4 w-4" /> Create Assessment
                  </Button>
                )}
              </div>
            )}

            {assessmentData && userRole === "Teacher" && (
              <div className="mt-4 border rounded-lg p-4 bg-white">
                <h4 className="font-medium mb-2 flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-1" /> Assessment
                  Created
                </h4>
                <p className="mb-4 text-sm text-gray-600">
                  {assessmentData.questions?.length || 0} questions •{" "}
                  {assessmentData.assessment_type} • {assessmentData.difficulty}{" "}
                  difficulty
                </p>
                <Assessment
                  assessment={assessmentData.questions || []}
                  assessmentType={assessmentData.assessment_type || "mcq"}
                  onSubmit={() => {}}
                  showResults={false}
                  userAnswers={[]}
                  assessmentId={assessmentData.id || ""}
                  topic={assessmentData.topic || day.assessment.topic}
                  readOnly={false}
                  hideSubmitButton={true} // Hide the submit button for teachers
                />
              </div>
            )}

            {assessmentData && userRole === "Student" && (
              <div className="mt-4">
                {!showAssessment ? (
                  <Button
                    onClick={() => setShowAssessment(true)}
                    className="w-fit justify-center mt-2"
                  >
                    {assessmentData.submitted
                      ? "View Assessment"
                      : "Start Assessment"}
                  </Button>
                ) : (
                  <div className="mt-4 border rounded-lg p-4 bg-white">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium">Assessment</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAssessment(false)}
                      >
                        Close
                      </Button>
                    </div>
                    <p className="mb-4 text-sm text-gray-600">
                      {assessmentData.questions?.length || 0} questions •{" "}
                      {assessmentData.assessment_type} •{" "}
                      {assessmentData.difficulty} difficulty
                    </p>
                    <Assessment
                      assessment={assessmentData.questions || []}
                      assessmentType={assessmentData.assessment_type || "mcq"}
                      onSubmit={onSubmitAssessment || (() => {})}
                      showResults={assessmentData.completed || false}
                      userAnswers={assessmentData.student_answers || []}
                      assessmentId={assessmentData.id || ""}
                      topic={assessmentData.topic || day.assessment.topic}
                      readOnly={assessmentData.completed || false} // Only set readOnly if assessment is completed
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
