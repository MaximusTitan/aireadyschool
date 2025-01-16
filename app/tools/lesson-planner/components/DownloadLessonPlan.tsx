import React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";

interface LessonPlanSection {
  name: string;
  duration: string;
  activities?: string[];
  keyPoints?: string[];
  description?: string;
  steps?: string[];
  methods?: string[];
}

interface LessonPlan {
  topic: string;
  objective: string;
  duration: string;
  gradeLevel: string;
  subject: string;
  sections: LessonPlanSection[];
  resources: string[];
}

interface DownloadLessonPlanProps {
  lessonPlan: LessonPlan;
}

export function DownloadLessonPlan({ lessonPlan }: DownloadLessonPlanProps) {
  const generatePDF = (lessonPlan: LessonPlan) => {
    const doc = new jsPDF({
      orientation: "landscape", // Set orientation to landscape
      unit: "mm",
      format: "a4", // You can change to 'a3' if more width is needed
    });

    // Title
    doc.setFontSize(20);
    doc.text("Lesson Plan", 105, 15, { align: "center" });

    // Overview
    doc.setFontSize(12);
    doc.text(`Topic: ${lessonPlan.topic}`, 20, 30);
    doc.text(`Objective: ${lessonPlan.objective}`, 20, 40);
    doc.text(`Duration: ${lessonPlan.duration}`, 20, 50);
    doc.text(`Grade Level: ${lessonPlan.gradeLevel}`, 20, 60);
    doc.text(`Subject: ${lessonPlan.subject}`, 20, 70);

    let yOffset = 90;

    // Sections
    lessonPlan.sections.forEach((section, index) => {
      if (yOffset > 250) {
        doc.addPage();
        yOffset = 20;
      }

      doc.setFontSize(14);
      doc.text(`${section.name} (${section.duration})`, 20, yOffset);
      yOffset += 10;

      doc.setFontSize(12);
      if (section.activities) {
        doc.text("Activities:", 30, yOffset);
        yOffset += 10;
        section.activities.forEach((activity) => {
          doc.text(`• ${activity}`, 40, yOffset);
          yOffset += 10;
        });
      }

      if (section.keyPoints) {
        doc.text("Key Points:", 30, yOffset);
        yOffset += 10;
        section.keyPoints.forEach((point) => {
          doc.text(`• ${point}`, 40, yOffset);
          yOffset += 10;
        });
      }

      if (section.description) {
        doc.text("Description:", 30, yOffset);
        yOffset += 10;
        const descriptionLines = doc.splitTextToSize(section.description, 150);
        descriptionLines.forEach((line: string) => {
          doc.text(line, 40, yOffset);
          yOffset += 10;
        });
      }

      if (section.steps) {
        doc.text("Steps:", 30, yOffset);
        yOffset += 10;
        section.steps.forEach((step, i) => {
          doc.text(`${i + 1}. ${step}`, 40, yOffset);
          yOffset += 10;
        });
      }

      if (section.methods) {
        doc.text("Methods:", 30, yOffset);
        yOffset += 10;
        section.methods.forEach((method) => {
          doc.text(`• ${method}`, 40, yOffset);
          yOffset += 10;
        });
      }

      yOffset += 10;
    });

    // Resources
    if (yOffset > 250) {
      doc.addPage();
      yOffset = 20;
    }
    doc.setFontSize(14);
    doc.text("Resources", 20, yOffset);
    yOffset += 10;
    doc.setFontSize(12);
    lessonPlan.resources.forEach((resource) => {
      doc.text(`• ${resource}`, 30, yOffset);
      yOffset += 10;
    });

    doc.save(`lesson_plan_${lessonPlan.topic.replace(/\s+/g, "_")}.pdf`);
  };

  return (
    <Button
      onClick={() => generatePDF(lessonPlan)}
      className="bg-neutral-500 hover:bg-neutral-600 text-white"
    >
      <Download className="mr-2 h-4 w-4" /> Download Lesson Plan (PDF)
    </Button>
  );
}
