"use client";

import React from "react";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";

interface PDFDownloadProps {
  title: string;
  content: string;
}

export const PDFDownload: React.FC<PDFDownloadProps> = ({ title, content }) => {
  const handleDownload = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const usableWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Enhanced title styling with wrapping
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(0, 0, 0);
    const titleLines = doc.splitTextToSize(title, usableWidth);
    doc.text(titleLines, pageWidth / 2, yPosition, {
      align: "center",
      renderingMode: "fill"
    });
    yPosition += (titleLines.length * 10) + 15; // Adjust spacing based on number of title lines

    // Process markdown content
    const lines = content.split("\n");
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) {
        yPosition += 4;
        return;
      }

      // Handle markdown headings with proper wrapping
      const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const text = headingMatch[2];
        const fontSize = Math.max(20 - level * 2, 11);
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", "bold");
        const headingLines = doc.splitTextToSize(text, usableWidth);
        
        // Check if we need a new page for the entire heading
        if (yPosition + (fontSize * headingLines.length) > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        
        // Render each line of the heading
        headingLines.forEach((headingLine: string, index: number) => {
          doc.text(headingLine, margin, yPosition);
          yPosition += fontSize * 0.8;
        });
        
        yPosition += 4; // Add extra space after the complete heading
      } else {
        // Handle paragraphs and bold text
        let processed = trimmed;
        let isBold = false;

        if (/\*\*(.*?)\*\*/.test(trimmed)) {
          processed = trimmed.replace(/\*\*(.*?)\*\*/g, "$1");
          isBold = true;
        }

        doc.setFontSize(11);
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        const textLines = doc.splitTextToSize(processed, usableWidth);

        textLines.forEach((line: string) => {
          if (yPosition + 7 > pageHeight - margin) {
            doc.addPage();
            yPosition = margin;
          }
          doc.text(line, margin, yPosition);
          yPosition += 7;
        });

        yPosition += 4; // Extra space after paragraphs
      }
    });

    doc.save(`${title}.pdf`);
  };

  return (
    <Button 
      type="button"
      onClick={handleDownload}
      variant="secondary"
      size="sm"
      className="px-4"
    >
      Download PDF
    </Button>
  );
};
