'use server'

import { Presentation, Slide } from '../types/presentation'
import path from 'path'
import { writeFile, mkdir } from 'fs/promises'
import { Buffer } from 'buffer'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

async function fetchImageBytes(imageUrl: string): Promise<ArrayBuffer | null> {
  try {
    console.log(`Fetching image from URL: ${imageUrl}`)
    const response = await fetch(imageUrl)
    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.statusText}`)
      return null
    }
    const arrayBuffer = await response.arrayBuffer()
    console.log(`Successfully fetched image, size: ${arrayBuffer.byteLength} bytes`)
    return arrayBuffer
  } catch (error) {
    console.error(`Error fetching image: ${error instanceof Error ? error.message : String(error)}`)
    return null
  }
}

function wrapText(text: string, maxWidth: number, font: any, fontSize: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = words[0]

  for (let i = 1; i < words.length; i++) {
    const word = words[i]
    const testLine = `${currentLine} ${word}`
    const textWidth = font.widthOfTextAtSize(testLine, fontSize)
    
    if (textWidth <= maxWidth) {
      currentLine = testLine
    } else {
      lines.push(currentLine)
      currentLine = word
    }
  }
  lines.push(currentLine)
  return lines
}

export async function exportToPDF(presentation: Presentation): Promise<ArrayBuffer> {
  console.log('Starting PDF export process')
  
  try {
    const pdfDoc = await PDFDocument.create()
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    for (const slide of presentation.slides) {
      const page = pdfDoc.addPage([1920, 1080]) // 16:9 aspect ratio
      const { width, height } = page.getSize()
      
      // Define layout constants
      const margin = width * 0.08 // 8% margin
      const titleHeight = height * 0.15 // 15% for title section
      const contentGap = width * 0.04 // 4% gap between image and content
      
      // Calculate content areas
      const contentAreaHeight = height - titleHeight - (margin * 2)
      const imageWidth = (width - (2 * margin) - contentGap) * 0.45 // 45% of usable width
      const contentWidth = (width - (2 * margin) - contentGap) * 0.45 // 45% of usable width
      
      // Calculate positions
      const titleY = height - margin
      const contentStartY = height - titleHeight - margin
      const imageX = margin
      const imageY = margin
      const contentX = margin + imageWidth + contentGap

      // Add Title with word wrapping and centering
      const titleSize = 64 // Larger, more prominent title
      const titleText = slide.title || 'Untitled Slide'
      const titleWidth = helveticaBold.widthOfTextAtSize(titleText, titleSize)
      const titleX = (width - titleWidth) / 2 // Center the title

      page.drawText(titleText, {
        x: titleX,
        y: titleY - titleSize,
        size: titleSize,
        font: helveticaBold,
        color: rgb(0.1, 0.1, 0.1), // Dark gray for better contrast
      })

      // Add Image
      if (slide.image) {
        try {
          const imageBytes = await fetchImageBytes(slide.image)
          if (imageBytes) {
            let image;
            try {
              image = await pdfDoc.embedJpg(imageBytes)
            } catch (jpgError) {
              try {
                image = await pdfDoc.embedPng(imageBytes)
              } catch (pngError) {
                throw new Error('Unable to embed image as JPG or PNG')
              }
            }
            
            // Calculate image dimensions maintaining aspect ratio
            const imgAspectRatio = image.width / image.height
            const containerAspectRatio = imageWidth / contentAreaHeight
            
            let finalWidth = imageWidth
            let finalHeight = contentAreaHeight
            
            if (imgAspectRatio > containerAspectRatio) {
              finalHeight = imageWidth / imgAspectRatio
            } else {
              finalWidth = contentAreaHeight * imgAspectRatio
            }

            // Center the image vertically in its container
            const imageOffsetY = (contentAreaHeight - finalHeight) / 2

            page.drawImage(image, {
              x: imageX,
              y: imageY + imageOffsetY,
              width: finalWidth,
              height: finalHeight,
            })
          }
        } catch (error) {
          console.error('Error processing image:', error)
        }
      }

      // Add Content with enhanced styling
      let currentY = contentStartY
      if (slide.content) {
        const contentSize = 32 // Larger font size for better readability
        const contentLines = wrapText(slide.content, contentWidth, helveticaFont, contentSize)
        
        contentLines.forEach((line) => {
          page.drawText(line, {
            x: contentX,
            y: currentY - contentSize,
            size: contentSize,
            font: helveticaFont,
            color: rgb(0.2, 0.2, 0.2), // Dark gray for better contrast
          })
          currentY -= contentSize * 1.4 // Increased line spacing for better readability
        })
        
        currentY -= contentSize // Extra spacing before bullet points
      }

      // Add Bullet Points with enhanced styling
      if (Array.isArray(slide.bulletPoints) && slide.bulletPoints.length > 0) {
        const bulletSize = 28 // Slightly larger bullet points
        const bulletIndent = 40 // Increased indentation
        
        for (const point of slide.bulletPoints) {
          const bulletLines = wrapText(point, contentWidth - bulletIndent, helveticaFont, bulletSize)
          
          // Draw custom bullet point (circle)
          page.drawCircle({
            x: contentX + 8,
            y: currentY - bulletSize + 8,
            size: 6,
            color: rgb(0.4, 0.4, 0.8), // Accent color for bullets
          })
          
          // Draw bullet point text
          bulletLines.forEach((line, index) => {
            page.drawText(line, {
              x: contentX + bulletIndent,
              y: currentY - bulletSize - (index * bulletSize * 1.3),
              size: bulletSize,
              font: helveticaFont,
              color: rgb(0.2, 0.2, 0.2),
            })
          })
          
          currentY -= (bulletLines.length * bulletSize * 1.3) + bulletSize * 0.7
        }
      }
    }

    console.log('PDF generation completed')
    return (await pdfDoc.save()).buffer as ArrayBuffer
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export async function exportToPPT(presentation: Presentation): Promise<string> {
  throw new Error('PPT export is not implemented yet')
}

