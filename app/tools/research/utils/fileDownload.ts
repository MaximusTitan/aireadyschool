import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ExternalHyperlink } from "docx"
import FileSaver from "file-saver"
import { GoogleGenerativeAI } from "@google/generative-ai"

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

export const downloadAsPDF = async (content: string) => {
  const printWindow = window.open("", "_blank")
  if (printWindow) {
    const titleMatch = content.match(/^# (.+)$/m)
    const title = titleMatch ? titleMatch[1] : ""

    printWindow.document.write(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/marked/2.0.3/marked.min.js"></script>
  <style>
    @page {
      margin: 0;
    }
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 {
      color: #000000;
      text-align: center;
      font-size: 28px;
      margin-bottom: 20px;
    }
    h2, h3, h4, h5, h6 {
      color: #000000;
    }
    a {
      color: #2c5282;
      text-decoration: underline;
    }
    @media print {
      body {
        max-width: none;
      }
      @page {
        margin: 0;
        size: auto;
      }
    }
  </style>
</head>
<body>
  <div id="content"></div>
  <script>
    function removeExtraIndex(content) {
      const lines = content.split('\\n');
      const titleLine = lines.find(line => line.startsWith('# '));
      const contentWithoutTitle = lines.filter(line => !line.startsWith('# ')).join('\\n');
      return titleLine ? \`\${titleLine}\\n\\n\${contentWithoutTitle}\` : content;
    }
    document.getElementById('content').innerHTML = marked.parse(removeExtraIndex(\`${content.replace(/`/g, "\\`")}\`));
    setTimeout(() => {
      window.print();
      window.close();
    }, 1000);
  </script>
</body>
</html>
`)
    printWindow.document.close()
  } else {
    console.error("Failed to open print window")
    throw new Error("Unable to open print window. Please check your browser settings.")
  }
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

