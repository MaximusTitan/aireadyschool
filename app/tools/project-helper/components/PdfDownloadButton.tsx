"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { jsPDF } from "jspdf";

interface PdfDownloadButtonProps {
  projectName: string;
  content: {
    title: string;
    text: string;
  }[];
}

export default function PdfDownloadButton({
  projectName,
  content,
}: PdfDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);

    try {
      const doc = new jsPDF();

      // Set font
      doc.setFont("helvetica", "normal");

      // Add title
      doc.setFontSize(20);
      doc.text(`${projectName} - Summary`, 105, 15, { align: "center" });

      let yPosition = 30;

      content.forEach((section) => {
        // Add section title
        doc.setFontSize(16);
        doc.text(section.title, 20, yPosition);
        yPosition += 10;

        // Add section content
        doc.setFontSize(12);
        const lines = section.text.split("\n");
        lines.forEach((line) => {
          if (line.startsWith("#")) {
            // Handle headers
            const match = line.match(/^#+/);
            const level = match ? match[0].length : 0;
            const text = line.replace(/^#+\s*/, "");
            doc.setFontSize(16 - level);
            doc.text(text, 20, yPosition);
            yPosition += 10;
          } else {
            // Handle regular text
            const textLines = doc.splitTextToSize(line, 170);
            doc.setFontSize(12);
            doc.text(textLines, 20, yPosition);
            yPosition += textLines.length * 7;
          }

          // Add extra space between paragraphs
          yPosition += 5;

          // Add a new page if there's not enough space for the next line
          if (yPosition > 280) {
            doc.addPage();
            yPosition = 20;
          }
        });

        // Add extra space between sections
        yPosition += 10;
      });

      // Save the PDF
      doc.save(`${projectName.replace(/\s+/g, "_")}_summary.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert(
        `An error occurred while generating the PDF: ${(error as Error).message}`
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button onClick={generatePDF} disabled={isGenerating}>
      {isGenerating ? "Generating PDF..." : "Download Summary (PDF)"}
    </Button>
  );
}
