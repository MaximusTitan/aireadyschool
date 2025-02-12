"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { MessageCircle, Send, Plug } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import DatabaseConnectionForm from "@/app/connect-database/DatabaseConnectForm"
import HubSpotConnectionForm from "@/app/connect-database/HubSpotConnectionForm"
import SupabaseConnectionForm from "@/app/connect-database/SupabaseConnectionForm"

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
    className={`fixed bottom-4 right-4 p-4 rounded-md text-white ${type === "success" ? "bg-green-500" : "bg-red-500"}`}
  >
    {message}
  </div>
)

type ConnectionType = "sql" | "supabase" | "hubspot"

interface DatabaseOption {
  name: string
  category: "CRM" | "SQL" | "Cloud"
}

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
  const [defaultMessage, setDefaultMessage] = useState("Hi, I'm the Aiready AI Assistant. How can I help you today?")
  const inputRef = useRef<HTMLInputElement>(null)

  // Plugin & database selection state (for chat bubble)
  const [selectedDatabase, setSelectedDatabase] = useState<string | null>(null)
  const [selectedDatabaseCategory, setSelectedDatabaseCategory] = useState<"Cloud" | "CRM" | "SQL" | null>(null)
  const [databases, setDatabases] = useState<DatabaseOption[]>([])
  const [isPluginClicked, setIsPluginClicked] = useState(false)
  const [supabaseKey, setSupabaseKey] = useState("")
  const [crmAccessToken, setCrmAccessToken] = useState<string | null>(null);
  const [sqlDetails, setSqlDetails] = useState<any>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  // Fetch available databases from all tables
  useEffect(() => {
    const fetchDatabases = async () => {
      const { data: supabaseData } = await supabase.from("connected_db").select("database_name")
      const { data: crmData } = await supabase.from("connected_crm").select("crm_name")
      const { data: sqlData } = await supabase.from("connect_sql_database").select("database_name")

      console.log("Fetched data:", { supabaseData, crmData, sqlData })

      const allDatabases: DatabaseOption[] = [
        ...(supabaseData
          ? supabaseData.map((db: any) => ({ name: db.database_name, category: "Cloud" as const }))
          : []),
        ...(crmData ? crmData.map((db: any) => ({ name: db.crm_name, category: "CRM" as const })) : []),
        ...(sqlData ? sqlData.map((db: any) => ({ name: db.database_name, category: "SQL" as const })) : []),
      ]

      console.log("Processed databases:", allDatabases)

      setDatabases(allDatabases)
    }
    fetchDatabases()
  }, [])

  useEffect(() => {
    console.log("Current databases state:", databases)
  }, [databases])

  // When a user selects a database, fetch its connection details
  const handleDatabaseSelection = async (database: string, category: "Cloud" | "CRM" | "SQL") => {
    setSelectedDatabase(database);
    setSelectedDatabaseCategory(category);

    try {
      let data, error;
  
      if (category === "Cloud") {
        ({ data, error } = await supabase
          .from("connected_db")
          .select("supabase_url, anon_key")
          .eq("database_name", database)
          .single());
  
        if (error) throw error;
        if (data) {
          setSupabaseUrl(data.supabase_url);
          setSupabaseKey(data.anon_key);
        }
      } else if (category === "CRM") {
        ({ data, error } = await supabase
          .from("connected_crm")
          .select("access_token")
          .eq("crm_name", database)
          .single());
  
        if (error) throw error;
        if (data) {
          console.log("CRM Access Token:", data.access_token);
          setCrmAccessToken(data.access_token);
          // Store access token or use it as needed
        }
      } else if (category === "SQL") {
        ({ data, error } = await supabase
          .from("connect_sql_database")
          .select("host, port, database, user_name, password")
          .eq("database_name", database)
          .single());
  
        if (error) throw error;
        if (data) {
          console.log("SQL Database Details:", data);
          setSqlDetails(data);
          // Store or use SQL connection details as needed
        }
      }
    } catch (err) {
      console.error("Error fetching database details:", err);
    }
  };
  
  // Supabase connection form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
  
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !user.email) {
        throw new Error("User not authenticated");
      }
      const email = user.email;
  
      let requestBody = {};
      let apiEndpoint = "";
  
      if (selectedDatabaseCategory === "Cloud") {
        apiEndpoint = "/api/connect-database";
        requestBody = {
          supabaseUrl,
          supabaseAnonKey,
          databaseName: selectedDatabase,
          email,
        };
      } else if (selectedDatabaseCategory === "CRM") {
        apiEndpoint = "/api/connect-hubspot";
        requestBody = {
          crmName: selectedDatabase,
          email,
          accessToken: crmAccessToken, // Assuming crmAccessToken is stored from handleDatabaseSelection
        };
      } else if (selectedDatabaseCategory === "SQL") {
        apiEndpoint = "/api/connect-sql-database";
        requestBody = {
          databaseName: selectedDatabase,
          email,
          host: sqlDetails?.host,
          port: sqlDetails?.port,
          database: sqlDetails?.database,
          userName: sqlDetails?.user_name,
          password: sqlDetails?.password,
        };
      } else {
        throw new Error("Invalid database category selected");
      }
  
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
  
      const result = await response.json();
  
      if (!response.ok) {
        throw new Error(result.error || "Failed to connect to database");
      }
  
      setToast({ message: `Successfully connected to ${selectedDatabase}`, type: "success" });
    } catch (error) {
      console.error("Error submitting connection:", error);
      setToast({ message: "Failed to connect. Please check your credentials and try again.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };
  

  // Render the correct connection form based on the selected type
  const renderConnectionForm = () => {
    switch (connectionType) {
      case "sql":
        return (
          <DatabaseConnectionForm
            sqlDetails={sqlDetails}
            setSqlDetails={setSqlDetails}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
          />
        )
      case "supabase":
        return (
          <SupabaseConnectionForm
            supabaseUrl={supabaseUrl}
            setSupabaseUrl={setSupabaseUrl}
            supabaseAnonKey={supabaseAnonKey}
            setSupabaseAnonKey={setSupabaseAnonKey}
            databaseNameInput={databaseNameInput}
            setDatabaseNameInput={setDatabaseNameInput}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
          />
        )
      case "hubspot":
        return (
          <HubSpotConnectionForm
            crmAccessToken={crmAccessToken}
            setCrmAccessToken={setCrmAccessToken}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
          />
        )
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
      setMessages((prev) => [...prev, { text: message, isUser: true }]);
      setMessage("");
      try {
        // Build a base request body with the query.
        let requestBody: any = { query: message };
  
        // Add parameters according to the selected category.
        if (selectedDatabaseCategory === "Cloud") {
          // For Cloud (Supabase) connections.
          requestBody = {
            ...requestBody,
            supabaseUrl: supabaseUrl,
            supabaseKey: supabaseKey,
          };
        } else if (selectedDatabaseCategory === "CRM") {
          // For CRM (e.g., HubSpot) connections.
          requestBody = {
            ...requestBody,
            crmAccessToken: crmAccessToken, // assuming this is stored in state
          };
        } else if (selectedDatabaseCategory === "SQL") {
          // For direct SQL connections.
          requestBody = {
            ...requestBody,
            host: sqlDetails.host,
            port: sqlDetails.port,
            database: sqlDetails.database,
            userName: sqlDetails.user_name, // note: adjust key names as your backend expects
            password: sqlDetails.password,
          };
        } else {
          throw new Error("No valid database category selected.");
        }
  
        // Determine which API endpoint to use.
        // (For example, you might always use /api/query-database when the plugin is clicked.)
        const endpoint = isPluginClicked ? "/api/query-database" : "/api/processSqlQuery";
  
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });
  
        const processedResult = await response.json();
        if (processedResult.success) {
          setMessages((prev) => [
            ...prev,
            {
              text: processedResult.naturalLanguageResponse || "No response generated.",
              isUser: false,
              naturalLanguageResponse: processedResult.naturalLanguageResponse,
            },
          ]);
        } else {
          throw new Error(processedResult.error || "Unknown error occurred while processing the query.");
        }
      } catch (error) {
        console.error("Error processing query:", error);
        setMessages((prev) => [
          ...prev,
          {
            text: `An error occurred while processing your query: ${
              error instanceof Error ? error.message : "Unknown error"
            }. Please try again.`,
            isUser: false,
            error: error instanceof Error ? error.message : "Unknown error",
          },
        ]);
      }
    }
  };
  

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
                onChange={(e) => {
                  const selectedDb = databases.find(db => db.name === e.target.value);
                  if (selectedDb) {
                    handleDatabaseSelection(selectedDb.name, selectedDb.category);
                  }
                }}
                className="bg-neutral-100 dark:bg-neutral-700 px-2 py-1 rounded text-sm"
              >
                <option value="" disabled>
                  Select Database
                </option>
                {databases.map((db, idx) => (
                  <option key={idx} value={db.name}>
                    {db.category}: {db.name || "Unnamed Database"}
                  </option>
                ))}
              </select>
              <button
                title="Use plugin"
                aria-label="Use plugin"
                onClick={() => {
                  if (selectedDatabaseCategory === "CRM") {
                    console.log(`Using CRM Access Token: ${crmAccessToken}`);
                  } else if (selectedDatabaseCategory === "SQL") {
                    console.log("Using SQL Details:", sqlDetails);
                  } else if (selectedDatabaseCategory === "Cloud") {
                    console.log(`Using Supabase URL: ${supabaseUrl}, Key: ${supabaseKey}`);
                  } else {
                    console.log("No valid database selected");
                  }
                  setIsPluginClicked(true);
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

