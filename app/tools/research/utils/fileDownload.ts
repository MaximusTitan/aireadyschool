import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ExternalHyperlink } from "docx"
import FileSaver from "file-saver"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { jsPDF } from 'jspdf';

const generateTitle = async (content: string): Promise<string> => {
  if (!process.env.G_API_KEY) {
    console.error("Missing Gemini API Key")
    return ""
  }

  const genAI = new GoogleGenerativeAI(process.env.G_API_KEY)
  const model = genAI.getGenerativeModel({ model: "gemini-pro" })

  const prompt = `Generate a title for the following research content. The title should be concise and captivating, providing context for the whole research. It should follow markdown format:

${content.substring(0, 500)}...

Title:`

  try {
    const result = await model.generateContent(prompt)
    const title = result.response.text().trim()
    return title.replace(/^\*\*|\*\*$/g, "") || ""
  } catch (error) {
    console.error("Error generating title:", error)
    return ""
  }
}

export async function downloadAsPDF(content: string): Promise<void> {
  const pdf = new jsPDF();
  
  // Set up PDF
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(12);
  
  // Add title
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  const title = content.split('\n')[0].replace('#', '').trim();
  pdf.text(title, 20, 20);
  
  // Add content
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  
  // Remove markdown formatting for PDF
  const cleanContent = content
    .replace(/^#+ /gm, '') // Remove headings
    .replace(/\*\*/g, '')  // Remove bold
    .replace(/\*/g, '')    // Remove italics
    .replace(/\`\`\`[\s\S]*?\`\`\`/g, '') // Remove code blocks
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)'); // Convert links
  
  const splitText = pdf.splitTextToSize(cleanContent, 170);
  pdf.text(splitText, 20, 30);
  
  // Save the PDF
  pdf.save(`research-${new Date().toISOString().split('T')[0]}.pdf`);
}

// Rest of the code remains the same until the DOC export function...

export const downloadAsDOC = async (content: string) => {
  try {
    const titleMatch = content.match(/^# (.+)$/m)
    const title = titleMatch ? titleMatch[1] : ""

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: title,
                  size: 32,
                  bold: true,
                }),
              ],
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 },
            }),
            ...content.split("\n").map((line) => {
              const titleMatch = line.match(/^(#{1,6})\s(.+)/)
              if (titleMatch) {
                const level = titleMatch[1].length
                const text = titleMatch[2]
                return new Paragraph({
                  children: [
                    new TextRun({
                      text: text,
                      size: 28 - (level * 2), // Decrease size for each heading level
                      bold: true,
                    }),
                  ],
                  heading: HeadingLevel[`HEADING_${level}` as keyof typeof HeadingLevel],
                  spacing: { after: 200 },
                })
              } else {
                const runs: (TextRun | ExternalHyperlink)[] = []
                const text = line

                // Process links
                const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
                let lastIndex = 0
                let match

                while ((match = linkRegex.exec(text)) !== null) {
                  if (match.index > lastIndex) {
                    // Add text before the link
                    runs.push(
                      new TextRun({
                        text: processMarkdownText(text.slice(lastIndex, match.index)),
                      })
                    )
                  }
                  
                  // Add the link
                  runs.push(
                    new ExternalHyperlink({
                      children: [
                          new TextRun({
                            text: match[1],
                            style: "Hyperlink",
                            underline: { type: "single" },
                          }),
                        ],
                      link: match[2],
                    })
                  )
                  lastIndex = match.index + match[0].length
                }

                // Add remaining text after last link
                if (lastIndex < text.length) {
                  runs.push(
                    new TextRun({
                      text: processMarkdownText(text.slice(lastIndex)),
                    })
                  )
                }

                // If no links were found, create a single TextRun
                if (runs.length === 0 && text.trim().length > 0) {
                  runs.push(
                    new TextRun({
                      text: processMarkdownText(text),
                    })
                  )
                }

                return new Paragraph({
                  children: runs,
                  spacing: { after: 200 },
                })
              }
            }).filter(paragraph => (paragraph as any).children && (paragraph as any).children.length > 0), // Remove empty paragraphs
          ],
        },
      ],
    })

    const blob = await Packer.toBlob(doc)
    FileSaver.saveAs(blob, `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.docx`)
  } catch (error) {
    console.error("DOC download error:", error)
    throw error
  }
}

// Helper function to process markdown text formatting
function processMarkdownText(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1") // Bold
    .replace(/\*(.*?)\*/g, "$1") // Italic
    .replace(/`(.*?)`/g, "$1") // Inline code
    .trim()
}

