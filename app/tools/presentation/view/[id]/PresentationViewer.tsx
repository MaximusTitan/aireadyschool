"use client"

import { useState } from "react"
import { RevealPresentation } from "../../components/RevealPresentation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { Presentation } from "../../types/presentation"

interface PresentationViewerProps {
  presentation: Presentation
}

export function PresentationViewer({ presentation }: PresentationViewerProps) {
  const [isEditing, setIsEditing] = useState(false)

  const handleSave = (updatedPresentation: Presentation) => {
    // Implement save logic here
    console.log("Saving presentation:", updatedPresentation)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Generator
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{presentation.topic}</h1>
        </div>
        <RevealPresentation
          presentation={presentation}
          onSave={handleSave}
          isEditing={isEditing}
          theme={presentation.theme || "modern"}
          transition={(presentation.transition as "none" | "fade" | "slide" | "convex" | "concave" | "zoom") || "slide"}
        />
        <Button onClick={() => setIsEditing(!isEditing)} className="mt-4">
          {isEditing ? "Exit Edit Mode" : "Edit Presentation"}
        </Button>
      </div>
    </div>
  )
}
