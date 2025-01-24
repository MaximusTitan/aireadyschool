import { MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ChatBubbleProps {
  onClick: () => void
}

export function ChatBubble({ onClick }: ChatBubbleProps) {
  return (
    <Button className="fixed bottom-4 right-4 rounded-full p-4" onClick={onClick} variant="secondary">
      <MessageCircle className="h-6 w-6" />
    </Button>
  )
}

