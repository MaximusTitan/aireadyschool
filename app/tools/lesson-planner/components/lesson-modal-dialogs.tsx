"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EditLessonContent } from "./edit-lesson-content";
import { GenerateNotesDialog } from "./generate-notes-dialog";
import { EditContentState, TeacherAssignment, Student } from "../types";

interface LessonModalDialogsProps {
  editContent: EditContentState;
  onEditClose: () => void;
  onEditSave: () => Promise<void>;
  generateNotesDialog: {
    isOpen: boolean;
    activity: { title: string; content: string } | null;
  };
  onGenerateNotesClose: () => void;
  onNotesGenerated: (notes: string) => Promise<void>;
  assignLessonModal: {
    isOpen: boolean;
  };
  onAssignModalClose: () => void;
  assignments: TeacherAssignment[];
  students: Student[];
  selectedGrade: string;
  setSelectedGrade: (grade: string) => void;
  selectedSection: string;
  setSelectedSection: (section: string) => void;
  selectedStudent: string;
  setSelectedStudent: (student: string) => void;
  selectedClass: string;
  setSelectedClass: (className: string) => void;
  dueDate: Date | undefined;
  setDueDate: (date: Date | undefined) => void;
  assignmentType: "class" | "student";
  setAssignmentType: (type: "class" | "student") => void;
  onConfirmAssignment: (
    assignType: string,
    selectedValue: string,
    assignDueDate: Date
  ) => void;
  lessonPlanId: string;
}

export function LessonModalDialogs({
  editContent,
  onEditClose,
  onEditSave,
  generateNotesDialog,
  onGenerateNotesClose,
  onNotesGenerated,
  assignLessonModal,
  onAssignModalClose,
  assignments,
  students,
  selectedGrade,
  setSelectedGrade,
  selectedSection,
  setSelectedSection,
  selectedStudent,
  setSelectedStudent,
  selectedClass,
  setSelectedClass,
  dueDate,
  setDueDate,
  assignmentType,
  setAssignmentType,
  onConfirmAssignment,
  lessonPlanId,
}: LessonModalDialogsProps) {
  return (
    <>
      {editContent.isOpen && (
        <EditLessonContent
          isOpen={editContent.isOpen}
          onClose={onEditClose}
          onSave={onEditSave}
          content={editContent}
          lessonPlanId={lessonPlanId}
        />
      )}

      {generateNotesDialog.activity && (
        <GenerateNotesDialog
          isOpen={generateNotesDialog.isOpen}
          onClose={onGenerateNotesClose}
          activity={generateNotesDialog.activity}
          storedNotes={null}
          onNotesGenerated={onNotesGenerated}
        />
      )}

      {assignLessonModal.isOpen && (
        <Dialog
          open={assignLessonModal.isOpen}
          onOpenChange={(open) => {
            if (!open) onAssignModalClose();
          }}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Assign Lesson Plan</DialogTitle>
            </DialogHeader>

            <Tabs
              value={assignmentType}
              onValueChange={(val) =>
                setAssignmentType(val as "class" | "student")
              }
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="class">Entire Class</TabsTrigger>
                <TabsTrigger value="student">Single Student</TabsTrigger>
              </TabsList>

              <TabsContent value="class" className="space-y-4">
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select Class</option>
                  {assignments.map((assignment) => (
                    <option
                      key={`${assignment.grade_id}-${assignment.section_id}`}
                      value={JSON.stringify(assignment)}
                    >
                      {assignment.grade_name} - {assignment.section_name}
                    </option>
                  ))}
                </select>
              </TabsContent>

              <TabsContent value="student" className="space-y-4">
                <select
                  value={selectedGrade}
                  onChange={(e) => {
                    setSelectedGrade(e.target.value);
                    setSelectedSection("");
                    setSelectedStudent("");
                  }}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select Grade</option>
                  {Array.from(
                    new Map(
                      assignments.map((a) => [
                        a.grade_id,
                        {
                          grade_id: a.grade_id,
                          grade_name: a.grade_name,
                        },
                      ])
                    ).values()
                  ).map((item) => (
                    <option key={item.grade_id} value={item.grade_id}>
                      {item.grade_name}
                    </option>
                  ))}
                </select>

                {selectedGrade && (
                  <select
                    value={selectedSection}
                    onChange={(e) => {
                      setSelectedSection(e.target.value);
                      setSelectedStudent("");
                    }}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select Section</option>
                    {assignments
                      .filter((a) => a.grade_id === selectedGrade)
                      .map((a) => (
                        <option key={a.section_id} value={a.section_id}>
                          {a.section_name}
                        </option>
                      ))}
                  </select>
                )}

                {selectedGrade && selectedSection && (
                  <select
                    value={selectedStudent}
                    onChange={(e) => setSelectedStudent(e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select Student</option>
                    {students
                      .filter(
                        (s) =>
                          s.grade_id === selectedGrade &&
                          s.section_id === selectedSection
                      )
                      .map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.email}
                        </option>
                      ))}
                  </select>
                )}
              </TabsContent>
            </Tabs>

            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Due Date</label>
              <Calendar
                mode="single"
                selected={dueDate}
                onSelect={setDueDate}
                className="rounded-md border"
                disabled={(date) => date < new Date()}
              />
            </div>

            <Button
              onClick={() =>
                onConfirmAssignment(
                  assignmentType,
                  assignmentType === "class" ? selectedClass : selectedStudent,
                  dueDate!
                )
              }
              className="w-full mt-4"
              disabled={
                !dueDate ||
                (assignmentType === "class" ? !selectedClass : !selectedStudent)
              }
            >
              Assign Lesson Plan
            </Button>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
