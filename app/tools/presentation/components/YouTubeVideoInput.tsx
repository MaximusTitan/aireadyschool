"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Video } from "lucide-react"

interface YouTubeVideoInputProps {
  onVideoAdd: (videoUrl: string) => void
}

export function YouTubeVideoInput({ onVideoAdd }: YouTubeVideoInputProps) {
  const [videoUrl, setVideoUrl] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  const extractVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    const match = url.match(regExp)
    return match && match[2].length === 11 ? match[2] : null
  }

  const handleAdd = () => {
    const videoId = extractVideoId(videoUrl)
    if (videoId) {
      onVideoAdd(`https://www.youtube.com/embed/${videoId}`)
      setVideoUrl("")
      setIsOpen(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Video className="mr-2 h-4 w-4" />
          Add Video
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add YouTube Video</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Paste YouTube video URL here"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
          />
          <Button onClick={handleAdd} className="w-full">
            Add Video to Slide
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
