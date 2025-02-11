"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Download } from "lucide-react"
import { SlideRenderer } from "./SlideRenderer"
import type { Presentation, Slide } from "../types/presentation"
import { toast } from "@/hooks/use-toast"
import { Spinner } from "../components/ui/spinner"
import html2canvas from "html2canvas"
import { jsPDF } from "jspdf"

interface PresentationPreviewProps {
  presentation?: Presentation
  onUpdateSlide: (slideId: string, updatedSlide: Slide) => void
}

// Define constant dimensions for both PDF and screenshots
const SLIDE_WIDTH = 1254
const SLIDE_HEIGHT = 702

export default function PresentationPreview({ presentation, onUpdateSlide }: PresentationPreviewProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const slideRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const updateScale = () => {
      if (slideRef.current) {
        const containerWidth = slideRef.current.offsetWidth
        setScale(containerWidth / SLIDE_WIDTH)
      }
    }

    updateScale()
    window.addEventListener("resize", updateScale)
    return () => window.removeEventListener("resize", updateScale)
  }, [])

  if (!presentation) {
    return <div>No presentation data available</div>
  }

  const captureSlide = async (slideIndex: number): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        // Set current slide
        setCurrentSlide(slideIndex)

        // Wait for slide transition and content to load
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Create a container for the cloned slide
        const container = document.createElement('div')
        container.style.position = 'fixed'
        container.style.left = '-9999px'
        container.style.top = '0'
        document.body.appendChild(container)

        // Clone the current slide
        const slideClone = slideRef.current?.cloneNode(true) as HTMLElement
        if (!slideClone) throw new Error('Failed to clone slide')

        // Reset transforms and set dimensions
        slideClone.style.transform = 'none'
        slideClone.style.width = `${SLIDE_WIDTH}px`
        slideClone.style.height = `${SLIDE_HEIGHT}px`
        container.appendChild(slideClone)

        // Wait for all images to load
        const images = Array.from(slideClone.getElementsByTagName('img'))
        await Promise.all(
          images.map(img => {
            if (img.complete) return Promise.resolve()
            return new Promise((resolve, reject) => {
              img.onload = resolve
              img.onerror = reject
            })
          })
        )

        // Capture the slide
        const canvas = await html2canvas(slideClone, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
          logging: false,
          onclone: (document) => {
            const element = document.body.firstChild as HTMLElement
            if (element) {
              element.style.transform = 'none'
              element.style.scale = '1'
            }
          }
        })

        // Clean up
        document.body.removeChild(container)

        // Convert to image
        const imageData = canvas.toDataURL('image/jpeg', 1.0)
        resolve(imageData)
      } catch (error) {
        reject(error)
      }
    })
  }

  const handleExport = async (format: "pdf" | "ppt") => {
    if (format === "ppt") return

    setIsExporting(true)
    setExportProgress(0)

    try {
      // Save current slide
      const originalSlide = currentSlide
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [SLIDE_WIDTH, SLIDE_HEIGHT],
        hotfixes: ["px_scaling"],
      })

      // Process each slide
      for (let i = 0; i < presentation.slides.length; i++) {
        setExportProgress(Math.round((i / presentation.slides.length) * 100))
        
        // Add new page for slides after first
        if (i > 0) pdf.addPage([SLIDE_WIDTH, SLIDE_HEIGHT])
        
        // Capture and add slide
        const slideImage = await captureSlide(i)
        pdf.addImage({
          imageData: slideImage,
          format: "JPEG",
          x: 0,
          y: 0,
          width: SLIDE_WIDTH,
          height: SLIDE_HEIGHT,
          compression: "MEDIUM",
          rotation: 0,
        })
      }

      // Save PDF
      const fileName = `${presentation.topic.replace(/\s+/g, "_")}_Presentation.pdf`
      pdf.save(fileName)

      // Restore original slide
      setCurrentSlide(originalSlide)

      toast({
        title: "Export Successful",
        description: "Your presentation has been exported as PDF.",
      })
    } catch (error) {
      console.error("Error exporting presentation:", error)
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
      setExportProgress(0)
    }
  }

  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentSlide((prev) => Math.max(0, prev - 1))}
            disabled={currentSlide === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentSlide((prev) => Math.min(presentation.slides.length - 1, prev + 1))}
            disabled={currentSlide === presentation.slides.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="px-4 py-2">
            Slide {currentSlide + 1} of {presentation.slides.length}
          </span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport("pdf")} disabled={isExporting}>
            {isExporting ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                <span>Generating PDF ({exportProgress}%)</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                <span>Download as PDF</span>
              </>
            )}
          </Button>
        </div>
      </div>

      <div
        className="w-full"
        style={{
          aspectRatio: `${SLIDE_WIDTH} / ${SLIDE_HEIGHT}`,
        }}
      >
        <div
          ref={slideRef}
          className="origin-top-left overflow-hidden"
          style={{
            width: `${SLIDE_WIDTH}px`,
            height: `${SLIDE_HEIGHT}px`,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          <SlideRenderer
            slide={presentation.slides[currentSlide]}
            theme={presentation.theme}
            dimensions={{ width: SLIDE_WIDTH, height: SLIDE_HEIGHT }}
          />
        </div>
      </div>
    </div>
  )
}

