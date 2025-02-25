"use client"

import { useState } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import { ChevronLeft, ChevronRight, Minus, Plus, RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

interface PDFViewerProps {
  url: string
}

export function PDFViewer({ url }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [scale, setScale] = useState<number>(1)
  const [rotation, setRotation] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(true)

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
    setLoading(false)
  }

  function changePage(offset: number) {
    setPageNumber((prevPageNumber) => {
      const newPage = prevPageNumber + offset
      return newPage >= 1 && newPage <= numPages ? newPage : prevPageNumber
    })
  }

  function changeScale(delta: number) {
    setScale((prevScale) => {
      const newScale = prevScale + delta
      return newScale >= 0.5 && newScale <= 2 ? newScale : prevScale
    })
  }

  function rotateDocument() {
    setRotation((prevRotation) => (prevRotation + 90) % 360)
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b bg-gray-50/80">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => changePage(-1)} disabled={pageNumber <= 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              min={1}
              max={numPages}
              value={pageNumber}
              onChange={(e) => {
                const page = Number.parseInt(e.target.value)
                if (page >= 1 && page <= numPages) {
                  setPageNumber(page)
                }
              }}
              className="w-16 h-8 text-center"
            />
            <span className="text-sm text-gray-500">of {numPages}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => changePage(1)} disabled={pageNumber >= numPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => changeScale(-0.1)} disabled={scale <= 0.5}>
            <Minus className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-500 w-16 text-center">{Math.round(scale * 100)}%</span>
          <Button variant="ghost" size="icon" onClick={() => changeScale(0.1)} disabled={scale >= 2}>
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={rotateDocument}>
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-auto p-4 bg-gray-50/50 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 hover:[&::-webkit-scrollbar-thumb]:bg-gray-300">
        <div className="flex justify-center">
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex items-center justify-center h-[600px]">
                <div className="animate-pulse text-gray-400">Loading PDF...</div>
              </div>
            }
            error={<div className="flex items-center justify-center h-[600px] text-red-500">Failed to load PDF</div>}
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              rotate={rotation}
              className="shadow-lg"
              loading={<div className="h-[600px] w-[450px] bg-gray-100 animate-pulse rounded-lg" />}
            />
          </Document>
        </div>
      </div>
    </div>
  )
}

