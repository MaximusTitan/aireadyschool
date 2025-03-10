"use client"

import { OCRProcessor } from "./components/ocr-processor"

export default function OCRPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">OCR Text Extractor</h1>
      <p className="text-gray-600 mb-8">
        Enter URLs of images or documents to extract text using OCR (Optical Character Recognition).
        This tool uses Mistral AI to analyze and extract text from online files.
      </p>
      <OCRProcessor />
    </div>
  )
}
