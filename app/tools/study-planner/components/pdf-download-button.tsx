import { jsPDF } from "jspdf";
import "jspdf-autotable";
import React from "react";
import { Download } from "lucide-react"; // Add this import
import { Button } from "@/components/ui/button";

interface FocusArea {
  topic: string;
  objective: string;
}

interface Activity {
  action: string;
  suggestion: string;
}

interface DailyPlan {
  day: number;
  focusAreas: FocusArea[];
  activities: Activity[];
}

interface PdfPlan {
  // From AIStudyPlanner response
  metadata?: {
    subject: string;
    grade: string;
    board: string;
    learningGoal: string;
    availableDays: string | number;
    availableStudyTimePerDay: string | number;
  };
  // Alternatively, full plan fields from Supabase:
  subject?: string;
  grade?: string;
  board?: string;
  learning_goal?: string;
  syllabus?: string;
  areas_of_improvement?: string;
  available_days?: string | number;
  available_study_time?: string | number;
  // Table data:
  studyPlan?: DailyPlan[];
  // For Supabase plans stored as JSON strings:
  Day?: string;
  "Focus Areas"?: string;
  Activities?: string;
}

interface PdfDownloadButtonProps {
  plan: PdfPlan;
}

export function PdfDownloadButton({ plan }: PdfDownloadButtonProps) {
  const downloadPdf = () => {
    const doc = new jsPDF();
    let yOffset = 10;
    let subject = "";
    let grade = "";
    let board = "";
    let learningGoal = "";
    let duration = "";
    let studyTime = "";
    let extraFields: { label: string; value: string }[] = [];
    let tableData: DailyPlan[] = [];

    // Normalize plan data from AI response or full plan from Supabase.
    if (plan.metadata) {
      subject = plan.metadata.subject;
      grade = plan.metadata.grade;
      board = plan.metadata.board;
      learningGoal = plan.metadata.learningGoal;
      duration = plan.metadata.availableDays.toString();
      studyTime = plan.metadata.availableStudyTimePerDay.toString();
      tableData = plan.studyPlan || [];
    } else {
      subject = plan.subject || "";
      grade = plan.grade || "";
      board = plan.board || "";
      learningGoal = plan.learning_goal || "";
      duration = plan.available_days ? plan.available_days.toString() : "";
      studyTime = plan.available_study_time ? plan.available_study_time.toString() : "";
      // Include extra fields if available.
      if (plan.syllabus) {
        extraFields.push({ label: "Syllabus", value: plan.syllabus });
      }
      if (plan.areas_of_improvement) {
        extraFields.push({ label: "Areas of Improvement", value: plan.areas_of_improvement });
      }
      // If table data is not in studyPlan, try to parse JSON columns.
      if (!plan.studyPlan && plan.Day && plan["Focus Areas"] && plan.Activities) {
        try {
          const days = JSON.parse(plan.Day) as number[];
          const focus = JSON.parse(plan["Focus Areas"]) as FocusArea[][];
          const activities = JSON.parse(plan.Activities) as Activity[][];
          tableData = days.map((day, idx) => ({
            day,
            focusAreas: focus[idx],
            activities: activities[idx],
          }));
        } catch (err) {
          console.error("Error parsing table data:", err);
        }
      }
    }

    // Header
    doc.setFontSize(16);
    doc.text(`Study Plan - ${subject}`, 10, yOffset);
    yOffset += 10;

    // Common fields
    doc.setFontSize(11);
    doc.text(`Grade: ${grade}`, 10, yOffset);
    yOffset += 7;
    doc.text(`Board: ${board}`, 10, yOffset);
    yOffset += 7;
    doc.text(`Learning Goal: ${learningGoal}`, 10, yOffset);
    yOffset += 7;
    doc.text(`Duration: ${duration} days`, 10, yOffset);
    yOffset += 7;
    doc.text(`Daily Study Time: ${studyTime} hours`, 10, yOffset);
    yOffset += 10;

    // Extra fields if any.
    extraFields.forEach(field => {
      doc.text(`${field.label}: ${field.value}`, 10, yOffset);
      yOffset += 7;
    });
    if (extraFields.length > 0) yOffset += 3;

    // Prepare table data if available
    if (tableData && tableData.length > 0) {
      const head = [["Day", "Focus Areas", "Activities"]];
      const body = tableData.map(day => {
        const focusText = day.focusAreas.map(f => `${f.topic}: ${f.objective}`).join("\n");
        const actText = day.activities.map(a => `${a.action}: ${a.suggestion}`).join("\n");
        return [day.day.toString(), focusText, actText];
      });

      (doc as any).autoTable({
        startY: yOffset,
        head,
        body,
        theme: "grid",
        showHead: "firstPage",
        headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: "bold", fontSize: 14 },
        styles: { cellPadding: 2, fontSize: 10 },
        margin: { left: 10, right: 10 },
      });
    }
    doc.save(`study-plan-${subject}.pdf`);
  };

  return (
    <Button
      onClick={downloadPdf}
      variant="outline"
      className="w-full flex items-center gap-2"
    >
      <Download className="h-4 w-4" />
      <span>Download PDF</span>
    </Button>
  );
}
