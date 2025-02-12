"use client"

import { useState } from "react"
import dynamic from 'next/dynamic'
import type { Presentation } from "./types/presentation"
import { toast } from "@/hooks/use-toast"
import { ErrorBoundary, type FallbackProps } from "react-error-boundary"

// Dynamically import PresentationForm with no SSR
const PresentationForm = dynamic(
  () => import('./components/PresentationForm'),
  { ssr: false }
)

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div role="alert" className="p-4 bg-red-100 border border-red-400 rounded">
      <p className="font-bold text-red-800">Something went wrong:</p>
      <pre className="text-sm text-red-600 mt-2">{error.message}</pre>
      <button className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600" onClick={resetErrorBoundary}>
        Try again
      </button>
    </div>
  )
}

export default function Home() {
  const [presentation, setPresentation] = useState<Presentation | undefined>()

  const handlePresentationGenerated = (newPresentation: Presentation) => {
    console.log("New presentation generated:", newPresentation)
    setPresentation(newPresentation)
  }

  const handleError = (error: Error) => {
    console.error("Error in Home component:", error)
    toast({
      title: "Error",
      description: error.message || "An unexpected error occurred",
      variant: "destructive",
    })
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onError={handleError}>
      <main className="container mx-auto px-2 py-4 max-w-[1280px]">
        <h1 className="text-3xl font-bold mb-8">AI-Powered Presentation Generator</h1>
        <PresentationForm onGenerated={handlePresentationGenerated} />
      </main>
    </ErrorBoundary>
  )
}

