"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { MessageCircle, Send, Plug, Search } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import DatabaseConnectionForm from "@/app/connect-database/DatabaseConnectForm"
import HubSpotConnectionForm from "@/app/connect-database/HubSpotConnectionForm"

const supabase = createClient()

interface ChatMessage {
  text: string
  isUser: boolean
  naturalLanguageResponse?: string
  error?: string
}

type ToastProps = {
  message: string
  type: "success" | "error"
}

const Toast = ({ message, type }: ToastProps) => (
  <div
    className={`fixed bottom-4 right-4 p-4 rounded-md text-white ${
      type === "success" ? "bg-green-500" : "bg-red-500"
    }`}
  >
    {message}
  </div>
)

type ConnectionType = "sql" | "supabase" | "hubspot"

export default function ConnectDatabasePage() {
  // Supabase & connection form state
  const [supabaseUrl, setSupabaseUrl] = useState("")
  const [supabaseAnonKey, setSupabaseAnonKey] = useState("")
  const [databaseNameInput, setDatabaseNameInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<ToastProps | null>(null)
  const [databaseName, setDatabaseName] = useState<string | null>(null)
  const [connectionType, setConnectionType] = useState<ConnectionType>("supabase")

  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [defaultMessage, setDefaultMessage] = useState(
    "Hi, I'm the Aiready AI Assistant. How can I help you today?"
  )
  const inputRef = useRef<HTMLInputElement>(null)

  // Plugin & database selection state (for chat bubble)
  const [selectedDatabase, setSelectedDatabase] = useState<string | null>(null)
  const [databases, setDatabases] = useState<string[]>([])
  const [isPluginClicked, setIsPluginClicked] = useState(false)
  const [supabaseKey, setSupabaseKey] = useState("")

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  // Fetch available databases from the connected_db table
  useEffect(() => {
    const fetchDatabases = async () => {
      const { data, error } = await supabase.from("connected_db").select("database_name")
      if (error) {
        console.error("Error fetching databases:", error)
      } else if (data) {
        setDatabases(data.map((db: any) => db.database_name))
      }
    }
    fetchDatabases()
  }, [])

  // When a user selects a database, fetch its connection details
  const handleDatabaseSelection = async (database: string) => {
    setSelectedDatabase(database)
    const { data, error } = await supabase
      .from("connected_db")
      .select("supabase_url, anon_key")
      .eq("database_name", database)
      .single()
    if (error) {
      console.error("Error fetching database details:", error)
    } else if (data) {
      setSupabaseUrl(data.supabase_url)
      setSupabaseKey(data.anon_key)
      // Optionally, reinitialize your client here if needed
    }
  }

  // Supabase connection form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user || !user.email) {
        throw new Error("User not authenticated")
      }
      const email = user.email
      const response = await fetch("/api/connect-database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supabaseUrl, supabaseAnonKey, databaseName: databaseNameInput, email }),
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || "Failed to connect to database")
      }
      if (result.message) {
        setToast({ message: result.message, type: "error" })
      } else {
        setDatabaseName(result.databaseName)
        setToast({ message: `Successfully connected to ${databaseNameInput}`, type: "success" })
      }
    } catch (error) {
      setToast({ message: "Failed to connect. Please check your credentials and try again.", type: "error" })
    } finally {
      setIsLoading(false)
    }
  }

  // Render the correct connection form based on the selected type
  const renderConnectionForm = () => {
    switch (connectionType) {
      case "sql":
        return <DatabaseConnectionForm />
      case "supabase":
        return (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Connect to Supabase</CardTitle>
              <CardDescription>Enter your Supabase credentials to connect.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="supabaseUrl">Supabase URL</Label>
                  <Input
                    id="supabaseUrl"
                    type="url"
                    placeholder="https://your-project.supabase.co"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supabaseAnonKey">Supabase Anon Key</Label>
                  <Input
                    id="supabaseAnonKey"
                    type="password"
                    placeholder="Your Supabase Anon Key"
                    value={supabaseAnonKey}
                    onChange={(e) => setSupabaseAnonKey(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="databaseName">Database Name</Label>
                  <Input
                    id="databaseName"
                    type="text"
                    placeholder="Enter a name for your database connection"
                    value={databaseNameInput}
                    onChange={(e) => setDatabaseNameInput(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Connecting..." : "Connect"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        )
      case "hubspot":
        return <HubSpotConnectionForm />
      default:
        return null
    }
  }

  // Toggle the chat dialog open/close state
  const toggleChat = () => {
    setIsChatOpen(!isChatOpen)
    if (!isChatOpen && messages.length === 0) {
      setMessages([{ text: defaultMessage, isUser: false }])
    }
  }

  // Send a message and, based on the plugin toggle, use the appropriate API endpoint
  const sendMessage = async () => {
    if (message.trim()) {
      setMessages((prev) => [...prev, { text: message, isUser: true }])
      setMessage("")
      try {
        const response = await fetch(isPluginClicked ? "/api/query-database" : "/api/processSqlQuery", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: message,
            supabaseUrl: supabaseUrl,
            supabaseKey: supabaseKey,
          }),
        })
        const processedResult = await response.json()
        if (processedResult.success) {
          setMessages((prev) => [
            ...prev,
            {
              text: processedResult.naturalLanguageResponse || "No response generated.",
              isUser: false,
              naturalLanguageResponse: processedResult.naturalLanguageResponse,
            },
          ])
        } else {
          throw new Error(processedResult.error || "Unknown error occurred while processing the query.")
        }
      } catch (error) {
        console.error("Error processing query:", error)
        setMessages((prev) => [
          ...prev,
          {
            text: `An error occurred while processing your query: ${
              error instanceof Error ? error.message : "Unknown error"
            }. Please try again.`,
            isUser: false,
            error: error instanceof Error ? error.message : "Unknown error",
          },
        ])
      }
    }
  }

  // Allow sending the message with the Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      sendMessage()
    }
  }

  // Focus the chat input when the chat dialog opens
  useEffect(() => {
    if (isChatOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isChatOpen])

  return (
    <div className="container mx-auto py-10">
      {/* Connection Type Toggle */}
      <div className="flex justify-center items-center mb-6">
        <div className="inline-flex rounded-md shadow-sm" role="group">
          {(["sql", "supabase", "hubspot"] as const).map((type) => (
            <Button
              key={type}
              onClick={() => setConnectionType(type)}
              variant={connectionType === type ? "default" : "outline"}
              className={`${
                connectionType === type ? "bg-primary text-primary-foreground" : "bg-background"
              } px-4 py-2 text-sm font-medium uppercase`}
            >
              {type}
            </Button>
          ))}
        </div>
      </div>

      {/* Render the appropriate connection form */}
      {renderConnectionForm()}

      {toast && <Toast message={toast.message} type={toast.type} />}
      {databaseName && <div className="mt-4 text-center">Connected to: {databaseNameInput}</div>}

      {/* Chat Bubble Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          title="Open Chat"
          onClick={toggleChat}
          className="bg-rose-300 hover:bg-rose-400 text-white rounded-full p-3 shadow-lg transition-colors duration-200"
        >
          <MessageCircle size={24} />
        </button>
      </div>

      {/* Chat Dialog */}
      {isChatOpen && (
        <div className="fixed bottom-20 right-4 w-96 bg-white dark:bg-neutral-800 rounded-lg shadow-xl z-50 flex flex-col max-h-[70vh]">
          {/* Chat Header with dropdown and plugin button */}
          <div className="p-4 border-b dark:border-neutral-700 flex justify-between items-center">
            <div className="font-semibold">Chat</div>
            <div className="flex items-center space-x-2">
              <select
                value={selectedDatabase || ""}
                onChange={(e) => handleDatabaseSelection(e.target.value)}
                className="bg-neutral-100 dark:bg-neutral-700 px-2 py-1 rounded text-sm"
              >
                <option value="" disabled>
                  Select Database
                </option>
                {databases.map((db, idx) => (
                  <option key={idx} value={db}>
                    {db}
                  </option>
                ))}
              </select>
              <button
                title="Use plugin"
                aria-label="Use plugin"
                onClick={() => {
                  console.log(`Using Supabase URL: ${supabaseUrl}, Key: ${supabaseKey}`)
                  setIsPluginClicked(true)
                }}
                className="p-2 bg-rose-300 rounded-full text-white hover:bg-rose-400"
              >
                <Plug size={16} />
                <span className="sr-only">Use plugin</span>
              </button>
            </div>
          </div>
          {/* Chat Messages */}
          <div className="flex-grow overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`p-2 rounded-lg ${
                  msg.isUser
                    ? "bg-neutral-100 dark:bg-neutral-700"
                    : msg.error
                    ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                    : "bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200"
                }`}
              >
                {msg.text}
                {msg.error && (
                  <div className="mt-2 p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                    <p className="text-xs font-semibold mb-1">Error:</p>
                    <pre className="text-xs overflow-x-auto">{msg.error}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* Chat Input */}
          <div className="p-4 border-t dark:border-neutral-700 flex">
            <input
              ref={inputRef}
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your query..."
              className="flex-grow px-3 py-2 bg-neutral-100 dark:bg-neutral-700 rounded-l-lg focus:outline-none"
            />
            <button
              onClick={sendMessage}
              title="Send Message"
              aria-label="Send Message"
              className="bg-rose-300 hover:bg-rose-400 text-white px-4 rounded-r-lg transition-colors duration-200"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
