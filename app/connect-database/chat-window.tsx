import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface ChatWindowProps {
  onClose: () => void
  databaseName: string
  supabaseUrl: string
  supabaseAnonKey: string
}

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export function ChatWindow({ onClose, databaseName, supabaseUrl, supabaseAnonKey }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage: ChatMessage = { role: "user", content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/query-database", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: input,
          supabaseUrl,
          supabaseAnonKey,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to execute query")
      }

      const assistantMessage: ChatMessage = { role: "assistant", content: JSON.stringify(result.data, null, 2) }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error executing query:", error)
      const errorMessage: ChatMessage = { role: "assistant", content: "Error executing query. Please try again." }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="fixed bottom-20 right-4 w-96 h-[500px] flex flex-col">
      <CardHeader className="flex flex-row items-center">
        <CardTitle className="flex-grow">Chat with {databaseName}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto">
        {messages.map((message, index) => (
          <div key={index} className={`mb-4 ${message.role === "user" ? "text-right" : "text-left"}`}>
            <div
              className={`inline-block p-2 rounded-lg ${
                message.role === "user" ? "bg-blue-500 text-white" : "bg-gray-200 text-black"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
      </CardContent>
      <CardFooter>
        <form onSubmit={handleSubmit} className="flex w-full">
          <Input
            type="text"
            placeholder="Enter your SQL query..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-grow mr-2"
          />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Sending..." : "Send"}
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}

