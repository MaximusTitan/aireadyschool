"use client";

import React from "react";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";

interface PdfDownloaderProps {
  lessonTitle: string;
  textContent: string;
  imageUrl?: string | null;
  className?: string;
}

export const PdfDownloader: React.FC<PdfDownloaderProps> = ({
  lessonTitle,
  textContent,
  imageUrl,
  className = "w-full h-11",
}) => {
  // Helper: Convert image URL to Base64
  const getBase64ImageFromURL = async (url: string): Promise<string> => {
    const data = await fetch(url);
    const blob = await data.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(blob);
    });
  };

  // Updated generatePDF function with good margins
  const generatePDF = async () => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const usableWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Enhanced title styling
    doc.setFont("helvetica", "bold");  // Set font to bold
    doc.setFontSize(24);  // Larger font size for title
    doc.setTextColor(0, 0, 0);  // Ensure title is solid black
    doc.text(lessonTitle || "Lesson Content", pageWidth / 2, yPosition, { 
      align: "center",
      renderingMode: "fill"
    });
    yPosition += 15;  // Increased spacing after title

    // Reset font settings for content
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    // If image exists, add it with left margin
    if (imageUrl) {
      try {
        const imgData = await getBase64ImageFromURL(imageUrl);
        const imgProps = doc.getImageProperties(imgData);
        const imgWidth = usableWidth;
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
        doc.addImage(imgData, "JPEG", margin, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 10;
      } catch (error) {
        console.error("Image conversion failed:", error);
      }
    }

    // Add text content with wrapping and page breaks based on margins
    const lineHeight = 7;
    const textLines = doc.splitTextToSize(textContent, usableWidth);
    for (let i = 0; i < textLines.length; i++) {
      if (yPosition + lineHeight > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(textLines[i], margin, yPosition);
      yPosition += lineHeight;
    }
    doc.save(`${lessonTitle || "lesson"}.pdf`);
  };

  return (
    <Button onClick={generatePDF} className={className}>
      Download PDF
    </Button>
  );
};
