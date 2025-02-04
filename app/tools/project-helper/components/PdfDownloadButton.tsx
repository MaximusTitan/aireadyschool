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

      // Set default font
      doc.setFont("helvetica", "normal");

      // Add footer
      const footerHeight = 10;
      doc.setFillColor(236, 240, 241); // Light gray color
      doc.rect(0, 297 - footerHeight, 210, footerHeight, "F");
      doc.setTextColor(0, 0, 0); // Black color
      doc.setFontSize(8);
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, 10, 294);
      doc.text("Page 1", 190, 294, { align: "right" });

      let yPosition = 20;

      const addNewPage = () => {
        doc.addPage();
        // Add footer to new page
        doc.setFillColor(236, 240, 241); // Light gray color
        doc.rect(0, 297 - footerHeight, 210, footerHeight, "F");
        doc.setTextColor(0, 0, 0); // Black color
        doc.setFontSize(8);
        doc.text(`Generated on ${new Date().toLocaleDateString()}`, 10, 294);
        doc.text(`Page ${doc.internal.pages.length}`, 190, 294, {
          align: "right",
        });
        yPosition = 20;
      };

      const renderText = (
        text: string,
        x: number,
        fontSize: number,
        color = "#000000"
      ) => {
        doc.setFontSize(fontSize);
        doc.setTextColor(color);
        const textLines = doc.splitTextToSize(text, 180);
        doc.text(textLines, x, yPosition);
        yPosition += textLines.length * (fontSize / 2 + 2);
      };

      for (const section of content) {
        // Add section title only if it's not a saved text
        if (!isSavedText && section.title !== "Project Timeline") {
          renderText(section.title, 10, 14, "#3498db");
          yPosition += 5;
        }

        // Convert Markdown to HTML
        const html = DOMPurify.sanitize(await marked.parse(section.text));

        // Parse the HTML content
        const parser = new DOMParser();
        const doc2 = parser.parseFromString(html, "text/html");
        const elements = doc2.body.children;

        let listIndentLevel = 0;

        Array.from(elements).forEach((element) => {
          if (yPosition > 270) addNewPage();

          switch (element.tagName.toLowerCase()) {
            case "h1":
              renderText(element.textContent || "", 10, 18, "#3498db");
              yPosition += 5;
              break;
            case "h2":
              renderText(element.textContent || "", 10, 16, "#3498db");
              yPosition += 4;
              break;
            case "h3":
              renderText(element.textContent || "", 10, 14, "#3498db");
              yPosition += 3;
              break;
            case "p":
              renderText(element.textContent || "", 10, 10);
              yPosition += 3;
              break;
            case "ul":
            case "ol":
              listIndentLevel++;
              Array.from(element.children).forEach((li) => {
                if (yPosition > 270) addNewPage();
                const bullet =
                  element.tagName.toLowerCase() === "ul"
                    ? "•"
                    : `${Array.from(element.children).indexOf(li) + 1}.`;
                renderText(
                  `${bullet} ${li.textContent}`,
                  10 + listIndentLevel * 5,
                  10
                );
              });
              listIndentLevel--;
              yPosition += 3;
              break;
            case "blockquote":
              doc.setDrawColor(52, 152, 219); // Blue color
              doc.setLineWidth(0.5);
              doc.line(15, yPosition, 15, yPosition + 20);
              renderText(element.textContent || "", 20, 10, "#7f8c8d");
              yPosition += 5;
              break;
            case "pre":
              const code = element.textContent || "";
              doc.setFillColor(236, 240, 241); // Light gray color
              doc.rect(
                10,
                yPosition,
                190,
                code.split("\n").length * 5 + 10,
                "F"
              );
              renderText(code, 15, 8);
              yPosition += 5;
              break;
          }
        });

        // Add extra space between sections
        yPosition += 10;
      }

      // Save the PDF
      doc.save(`${projectName.replace(/\s+/g, "_")}_summary.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert(
        `An error occurred while generating the PDF: ${error instanceof Error ? error.message : "Unknown error"}`
      );
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
