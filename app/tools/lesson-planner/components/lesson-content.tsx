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
import { Day, ScheduleItem, GeneratedNotes, UploadedFile } from "../types";
import { Fragment } from "react";

interface LessonContentProps {
  day: Day;
  userRole: string | null;
  generatedNotes: GeneratedNotes;
  uploadedFiles: { [key: string]: UploadedFile[] };
  onEdit: (type: string, data: any, dayIndex?: number) => void;
  onGenerateNotes: (activityTitle: string, activityContent: string) => void;
  onFileUpload: (file: File, type: string, sectionId: string) => Promise<void>;
  onDeleteFile: (fileId: string, sectionId: string) => Promise<void>;
  onChatWithBuddy: (item: ScheduleItem, day: Day) => void;
  showDocumentGenerator?: boolean;
  setShowDocumentGenerator?: (show: boolean) => void;
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
}: LessonContentProps) {
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
                      <div className="mt-1 text-sm text-gray-500">
                        {item.content}
                      </div>
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
                        {userRole !== "Student" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              onGenerateNotes(item.title, item.content)
                            }
                          >
                            {generatedNotes[item.title]
                              ? "See Notes"
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
                                    <h4 className="font-medium text-gray-900 mb-2">
                                      Generated Notes
                                    </h4>
                                    <div className="text-sm text-gray-600 whitespace-pre-wrap">
                                      <ReactMarkdown>
                                        {generatedNotes[item.title]}
                                      </ReactMarkdown>
                                    </div>
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
          {userRole === "Student" &&
            day.assignment &&
            showDocumentGenerator !== undefined && (
              <Button
                onClick={() =>
                  setShowDocumentGenerator?.(!showDocumentGenerator)
                }
                className="mt-2"
              >
                {showDocumentGenerator ? "Hide" : "Open"} Document Generator
              </Button>
            )}
        </div>
      </div>
    </div>
  );
}
