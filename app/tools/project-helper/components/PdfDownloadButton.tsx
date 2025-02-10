"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { jsPDF } from "jspdf";
import { marked } from "marked";
import DOMPurify from "dompurify";

interface PdfDownloadButtonProps {
  projectName: string;
  content: {
    title: string;
    text: string;
  }[];
  isSavedText?: boolean;
}

export default function PdfDownloadButton({
  projectName,
  content,
  isSavedText = false,
}: PdfDownloadButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Set default font and color
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0); // Black color for all text

      // Add footer
      const addFooter = (pageNumber: number) => {
        const footerHeight = 10;
        doc.setFillColor(245, 245, 245); // Light gray background
        doc.rect(0, 297 - footerHeight, 210, footerHeight, "F");
        doc.setFontSize(8);
        doc.text(`Generated on ${new Date().toLocaleDateString()}`, 10, 294);
        doc.text(`Page ${pageNumber}`, 190, 294, { align: "right" });
      };

      let yPosition = 20;
      let pageNumber = 1;

      // Add title only if it's not a saved text
      if (!isSavedText) {
        doc.setFontSize(18);
        doc.text(projectName, 15, yPosition);
        yPosition += 15;
      }

      const addNewPage = () => {
        addFooter(pageNumber);
        doc.addPage();
        pageNumber++;
        yPosition = 20;
      };

      const renderText = (text: string, x: number, fontSize: number, isBold = false) => {
        if (yPosition > 270) addNewPage();
        
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", isBold ? "bold" : "normal");
        
        const textLines = doc.splitTextToSize(text, 180);
        doc.text(textLines, x, yPosition);
        yPosition += textLines.length * (fontSize / 2 + 2);
      };

      for (const section of content) {
        if (!isSavedText && section.title !== "Project Timeline") {
          renderText(section.title, 15, 14, true);
          yPosition += 5;
        }

        // Convert Markdown to HTML
        const html = DOMPurify.sanitize(await marked.parse(section.text));
        const parser = new DOMParser();
        const doc2 = parser.parseFromString(html, "text/html");
        const elements = doc2.body.children;

        Array.from(elements).forEach((element) => {
          if (yPosition > 270) addNewPage();

          switch (element.tagName.toLowerCase()) {
            case "h1":
              renderText(element.textContent || "", 15, 16, true);
              yPosition += 5;
              break;
            case "h2":
              renderText(element.textContent || "", 15, 14, true);
              yPosition += 4;
              break;
            case "h3":
              renderText(element.textContent || "", 15, 12, true);
              yPosition += 3;
              break;
            case "p":
              renderText(element.textContent || "", 15, 10);
              yPosition += 3;
              break;
            case "ul":
              Array.from(element.children).forEach((li) => {
                if (yPosition > 270) addNewPage();
                renderText(`• ${li.textContent}`, 20, 10);
              });
              yPosition += 3;
              break;
            case "ol":
              Array.from(element.children).forEach((li, index) => {
                if (yPosition > 270) addNewPage();
                renderText(`${index + 1}. ${li.textContent}`, 20, 10);
              });
              yPosition += 3;
              break;
            case "blockquote":
              doc.setDrawColor(200, 200, 200); // Light gray line
              doc.setLineWidth(0.5);
              doc.line(20, yPosition, 20, yPosition + 20);
              renderText(element.textContent || "", 25, 10);
              yPosition += 5;
              break;
            case "pre":
              const code = element.textContent || "";
              doc.setFillColor(245, 245, 245); // Light gray background
              doc.rect(15, yPosition, 180, code.split("\n").length * 5 + 10, "F");
              renderText(code, 20, 8);
              yPosition += 5;
              break;
          }
        });

        yPosition += 10; // Space between sections
      }

      // Add footer to the last page
      addFooter(pageNumber);

      // Save the PDF
      doc.save(`${projectName.replace(/\s+/g, "_")}_summary.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("An error occurred while generating the PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button onClick={generatePDF} disabled={isGenerating}>
      {isGenerating ? "Generating PDF..." : "Download PDF"}
    </Button>
  );
}
