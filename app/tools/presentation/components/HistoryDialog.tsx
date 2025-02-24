import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Clock, Edit, Search, Share2 } from "lucide-react"
import type { Presentation } from "../types/presentation"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { toast } from "@/hooks/use-toast"

interface HistoryDialogProps {
  presentations: Presentation[]
  onSelect: (presentation: Presentation) => void
  isLoading?: boolean
}

export function HistoryDialog({ presentations, onSelect, isLoading }: HistoryDialogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  const filteredPresentations = presentations.filter(presentation => {
    // Check for both title and topic since we're transitioning between schemas
    const searchText = (presentation.title || presentation.topic || "").toLowerCase()
    return searchText.includes(searchQuery.toLowerCase())
  })

  const handleSelect = (presentation: Presentation) => {
    // Ensure the presentation has a topic field
    const processedPresentation = {
      ...presentation,
      topic: presentation.topic || presentation.title || "Untitled Presentation",
    }
    onSelect(processedPresentation)
    setIsOpen(false)
  }

  const handleShare = async (presentationId: string) => {
    try {
      const shareUrl = `${window.location.origin}/tools/presentation/view/${presentationId}`
      await navigator.clipboard.writeText(shareUrl)
      toast({
        title: "Link copied",
        description: "Share link has been copied to clipboard",
      })
    } catch (error) {
      console.error("Error sharing presentation:", error)
      toast({
        title: "Error",
        description: "Failed to copy share link",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Clock className="h-4 w-4" />
          View History
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] md:max-w-[1000px] lg:max-w-[1200px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Presentation History
          </DialogTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search presentations..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        ) : filteredPresentations.length > 0 ? (
          <div className="grid gap-4">
            {filteredPresentations.map((presentation) => (
              <div
                key={presentation.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">
                    {presentation.title || presentation.topic || "Untitled Presentation"}
                  </h3>
                  <div className="flex gap-2 text-sm text-muted-foreground">
                    <span>{presentation.slides?.length || 0} slides</span>
                    <span>•</span>
                    <span className="capitalize">{presentation.theme || "default"} theme</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare(presentation.id)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleSelect(presentation)}
                    className="whitespace-nowrap"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    View & Edit
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 text-muted-foreground">
            {searchQuery ? "No presentations match your search" : "No presentations found"}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
