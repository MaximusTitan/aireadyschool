"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface GenerateNotesDialogProps {
  isOpen: boolean
  onClose: () => void
  activity: {
    title: string
    content: string
  }
  storedNotes: string | null
  onNotesGenerated: (notes: string) => Promise<void>
}

export function GenerateNotesDialog({
  isOpen,
  onClose,
  activity,
  storedNotes,
  onNotesGenerated,
}: GenerateNotesDialogProps) {
  const [generatedNotes, setGeneratedNotes] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (storedNotes) {
      setGeneratedNotes(storedNotes)
    } else {
      setGeneratedNotes("")
    }
  }, [storedNotes])

  const generateNotes = async () => {
    if (storedNotes) {
      setGeneratedNotes(storedNotes)
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch("/api/generate-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: activity.title,
          content: activity.content,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate notes")
      }

      const data = await response.json()
      setGeneratedNotes(data.notes)
      await onNotesGenerated(data.notes)
    } catch (error) {
      console.error("Error generating notes:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate notes. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const formatContent = (content: string) => {
    // First process the content by lines
    return content.split("\n").map((line, index) => {
      // Handle section headers (numeric headers like "1. Key Concepts:")
      if (line.match(/^\d+\.\s+[\w\s]+:$/)) {
        return (
          <h3 key={index} className="text-xl font-bold mt-6 mb-3 text-gray-800">
            {line}
          </h3>
        );
      }
      
      // Handle bullet points
      if (line.startsWith("- ")) {
        // Process inline formatting within the bullet point
        const processedText = processInlineFormatting(line.substring(2));
        return (
          <li key={index} className="ml-6 my-2 list-disc">
            {processedText}
          </li>
        );
      }
      
      // Handle empty lines
      if (line.trim() === "") {
        return <div key={index} className="h-2" />;
      }
      
      // Process regular paragraphs with inline formatting
      const processedText = processInlineFormatting(line);
      return (
        <p key={index} className="my-2">
          {processedText}
        </p>
      );
    });
  };

  // Helper function to process inline markdown formatting
  const processInlineFormatting = (text: string) => {
    // Replace bold markdown (**text**) with styled spans
    const parts = [];
    let lastIndex = 0;
    let boldPattern = /\*\*(.*?)\*\*/g;
    let match;
    
    while ((match = boldPattern.exec(text)) !== null) {
      // Add text before the bold part
      if (match.index > lastIndex) {
        parts.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex, match.index)}</span>);
      }
      
      // Add the bold text
      parts.push(
        <span key={`bold-${match.index}`} className="font-bold">
          {match[1]}
        </span>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add any remaining text
    if (lastIndex < text.length) {
      parts.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex)}</span>);
    }
    
    return parts.length > 0 ? parts : text;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">Notes: {activity.title}</DialogTitle>
          <DialogDescription>Detailed notes and practice questions for this activity.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-4 pr-4">
          {!generatedNotes && !isGenerating && (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Click the button below to generate detailed notes for this activity.</p>
              <Button onClick={generateNotes}>Generate Notes</Button>
            </div>
          )}

          {isGenerating && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Generating notes...</p>
            </div>
          )}

          {generatedNotes && !isGenerating && (
            <div className="prose max-w-none">
              <div className="bg-gray-50 p-6 rounded-lg">{formatContent(generatedNotes)}</div>
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

