import jsPDF from 'jspdf';

interface Question {
  question: string;
  options?: string[];
  correctAnswer: any;
  answer?: string;
}

export function formatAssessmentForDownload(
  assessment: Question[],
  assessmentType: string,
  topic: string,
  includeAnswers: boolean = true
): string {
  let content = `Assessment Topic: ${topic}\n\n`;

  assessment.forEach((q, index) => {
    // Remove the number from the question if it starts with a number
    const questionText = q.question.replace(/^\d+[\.\)\s]+/, '').trim();
    content += `Question ${index + 1}: ${questionText}\n`;

    if (assessmentType === "mcq" && q.options) {
      q.options.forEach((option, i) => {
        // Remove the letter prefix if it exists in the option
        const optionText = option.replace(/^[A-D][\.\)\s]+/, '').trim();
        content += `${String.fromCharCode(65 + i)}) ${optionText}\n`;
      });
      if (includeAnswers) {
        content += `Correct Answer: ${String.fromCharCode(
          65 + (q.correctAnswer as number)
        )}\n`;
      }
    } else if (assessmentType === "truefalse") {
      if (includeAnswers) {
        content += `Correct Answer: ${q.correctAnswer ? "True" : "False"}\n`;
      }
    } else if (assessmentType === "fillintheblank") {
      if (includeAnswers) {
        content += `Correct Answer: ${q.answer}\n`;
      }
    }

    content += "\n";
  });

  return content;
}

function exportToPDF(content: string, topic: string): void {
  const pdf = new jsPDF();
  
  // Add title styling
  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  const title = content.split('\n')[0];
  pdf.text(title, 15, 20);
  
  // Add content with better formatting
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "normal");
  const contentLines = content.split('\n').slice(2); // Skip title and first empty line
  
  let y = 40;
  contentLines.forEach((line: string) => {
    if (y > 280) {
      pdf.addPage();
      y = 20;
    }
    
    // Add indent for options and answers
    const indent = line.startsWith('A)') || 
                  line.startsWith('B)') || 
                  line.startsWith('C)') || 
                  line.startsWith('D)') || 
                  line.startsWith('Correct Answer:');
                  
    pdf.text(line, indent ? 25 : 15, y);
    y += 7;
  });

  pdf.save(`assessment-${topic.toLowerCase().replace(/\s+/g, "-")}.pdf`);
}

export function downloadAssessment(
  assessment: Question[],
  assessmentType: string,
  topic: string,
  format: "txt" | "pdf" = "pdf",
  includeAnswers: boolean = true
) {
  const content = formatAssessmentForDownload(assessment, assessmentType, topic, includeAnswers);
  exportToPDF(content, topic);
}
