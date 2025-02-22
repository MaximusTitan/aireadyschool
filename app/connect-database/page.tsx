"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

// Modular Components
import ChatDialog, { ChatMessage } from "./components/ChatDialog";
import ChatInput from "./components/ChatInput";
import ChatBubbleButton from "./components/ChatBubbleButton";
import ConnectionTypeToggle, {
  ConnectionType,
} from "./components/ConnectionTypeToggle";
import DatabaseSelection, {
  DatabaseOption,
} from "./components/DatabaseSelection";

import DatabaseConnectionForm from "@/app/connect-database/DatabaseConnectForm";
import HubSpotConnectionForm from "@/app/connect-database/HubSpotConnectionForm";
import SupabaseConnectionForm from "@/app/connect-database/SupabaseConnectionForm";

interface SqlDetails {
  databaseName: string; // "Name your database"
  host: string;
  port: string;
  database: string; // SQL database name
  user_name: string;
  password: string;
}
interface SupabaseConnectionDetails {
  supabaseUrl: string;
  supabaseAnonKey: string;
  databaseName: string;
}
interface CRMData {
  hubspotAccessToken: string;
  crmName: string;
}

type ToastProps = {
  message: string;
  type: "success" | "error";
};

const Toast = ({ message, type }: ToastProps) => (
  <div
    className={`fixed bottom-4 right-4 p-4 rounded-md text-white ${type === "success" ? "bg-green-500" : "bg-red-500"}`}
  >
    {message}
  </div>
);

const supabase = createClient();

export default function ConnectDatabasePage() {
  // Supabase & connection form state
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<ToastProps | null>(null);
  const [connectionType, setConnectionType] =
    useState<ConnectionType>("supabase");
  const [sqlConnectionDetails, setSqlConnectionDetails] = useState<SqlDetails>({
    databaseName: "",
    host: "",
    port: "",
    database: "",
    user_name: "",
    password: "",
  });
  const [supabaseConnectionDetails, setSupabaseConnectionDetails] =
    useState<SupabaseConnectionDetails>({
      supabaseUrl: "",
      supabaseAnonKey: "",
      databaseName: "",
    });
  const [hubspotConnectionDetails, setHubspotConnectionDetails] =
    useState<CRMData>({
      hubspotAccessToken: "",
      crmName: "",
    });

  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [defaultMessage, setDefaultMessage] = useState(
    "Hi, I'm the Aiready AI Assistant. How can I help you today?",
  );

  // Plugin & database selection state (for chat bubble)
  const [selectedDatabase, setSelectedDatabase] = useState<string | null>(null);
  const [selectedDatabaseCategory, setSelectedDatabaseCategory] = useState<
    "Cloud" | "CRM" | "SQL" | null
  >(null);
  const [databases, setDatabases] = useState<DatabaseOption[]>([]);
  const [isPluginClicked, setIsPluginClicked] = useState(false);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Fetch available databases from all tables

  useEffect(() => {
    const fetchDatabases = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !user.email) {
        throw new Error("User not authenticated");
      }
      const { data: supabaseData } = await supabase
        .from("connected_db")
        .select("database_name")
        .eq("email", user.email);
      const { data: crmData } = await supabase
        .from("connected_crm")
        .select("crm_name")
        .eq("email", user.email);
      const { data: sqlData } = await supabase
        .from("connect_sql_database")
        .select("database_name")
        .eq("email", user.email);

      console.log("Fetched data:", { supabaseData, crmData, sqlData });

      const allDatabases: DatabaseOption[] = [
        ...(supabaseData
          ? supabaseData.map((db: any) => ({
              name: db.database_name,
              category: "Cloud" as const,
            }))
          : []),
        ...(crmData
          ? crmData.map((db: any) => ({
              name: db.crm_name,
              category: "CRM" as const,
            }))
          : []),
        ...(sqlData
          ? sqlData.map((db: any) => ({
              name: db.database_name,
              category: "SQL" as const,
            }))
          : []),
      ];

      console.log("Processed databases:", allDatabases);

      setDatabases(allDatabases);
    };
    fetchDatabases();
  }, []);

  useEffect(() => {
    console.log("Current databases state:", databases);
  }, [databases]);

  // When a user selects a database, fetch its connection details
  const handleDatabaseSelection = async (
    database: string,
    category: "Cloud" | "CRM" | "SQL",
  ) => {
    setSelectedDatabase(database);
    setSelectedDatabaseCategory(category);

    try {
      if (category === "Cloud") {
        const { data, error } = await supabase
          .from("connected_db")
          .select("supabase_url, anon_key")
          .eq("database_name", database)
          .single();

        if (error) throw error;
        if (data) {
          // Map the response to your SupabaseConnectionDetails interface:
          setSupabaseConnectionDetails({
            supabaseUrl: data.supabase_url,
            supabaseAnonKey: data.anon_key,
            databaseName: database, // Using the selected database name
          });
        }
      } else if (category === "CRM") {
        const { data, error } = await supabase
          .from<"connected_crm", any>("connected_crm")
          .select("access_token")
          .eq("crm_name", database)
          .single();
        if (error) throw error;
        if (data) {
          // Map to your CRMData interface:
          setHubspotConnectionDetails({
            crmName: database,
            hubspotAccessToken: data.access_token,
          });
        }
      } else if (category === "SQL") {
        const { data, error } = await supabase
          .from<"connect_sql_database", any>("connect_sql_database")
          .select("host, port, database, user_name, password")
          .eq("database_name", database)
          .single();
        if (error) throw error;
        if (data) {
          setSqlConnectionDetails({
            ...data,
            databaseName: database, // override with selected name if needed
          });
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

      if (connectionType === "supabase") {
        apiEndpoint = "/api/connect-database";
        requestBody = {
          supabaseUrl: supabaseConnectionDetails.supabaseUrl,
          supabaseAnonKey: supabaseConnectionDetails.supabaseAnonKey,
          databaseName: supabaseConnectionDetails.databaseName,
          email,
        };
      } else if (connectionType === "hubspot") {
        apiEndpoint = "/api/connect-hubspot";
        requestBody = {
          crmName: hubspotConnectionDetails.crmName,
          email,
          hubspotAccessToken: hubspotConnectionDetails.hubspotAccessToken,
        };
      } else if (connectionType === "sql") {
        apiEndpoint = "/api/connect-sql-database";
        requestBody = {
          databaseName: sqlConnectionDetails.databaseName,
          email,
          host: sqlConnectionDetails.host,
          port: sqlConnectionDetails.port,
          database: sqlConnectionDetails.database,
          userName: sqlConnectionDetails.user_name,
          password: sqlConnectionDetails.password,
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

      setToast({
        message: `Successfully connected to ${selectedDatabase}`,
        type: "success",
      });
    } catch (error) {
      console.error("Error submitting connection:", error);
      setToast({
        message:
          "Failed to connect. Please check your credentials and try again.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle the chat dialog open/close state
  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
    if (!isChatOpen && messages.length === 0) {
      setMessages([{ text: defaultMessage, isUser: false }]);
    }
  };

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
            supabaseUrl: supabaseConnectionDetails.supabaseUrl,
            supabaseKey: supabaseConnectionDetails.supabaseAnonKey,
            databaseName: supabaseConnectionDetails.databaseName,
          };
        } else if (selectedDatabaseCategory === "CRM") {
          // For CRM (e.g., HubSpot) connections.
          requestBody = {
            ...requestBody,
            crmAccessToken: hubspotConnectionDetails.hubspotAccessToken,
            crmName: hubspotConnectionDetails.crmName,
          };
        } else if (selectedDatabaseCategory === "SQL") {
          // For direct SQL connections.
          requestBody = {
            ...requestBody,
            host: sqlConnectionDetails.host,
            port: sqlConnectionDetails.port,
            database: sqlConnectionDetails.database,
            userName: sqlConnectionDetails.user_name,
            password: sqlConnectionDetails.password,
          };
        } else {
          throw new Error("No valid database category selected.");
        }
        // Determine which API endpoint to use.
        // (For example, you might always use /api/query-database when the plugin is clicked.)
        const endpoint = isPluginClicked
          ? "/api/query-database"
          : "/api/processSqlQuery";

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
              text:
                processedResult.naturalLanguageResponse ||
                "No response generated.",
              isUser: false,
              naturalLanguageResponse: processedResult.naturalLanguageResponse,
            },
          ]);
        } else {
          throw new Error(
            processedResult.error ||
              "Unknown error occurred while processing the query.",
          );
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
      sendMessage();
    }
  };

  // Render the correct connection form based on the selected type
  const renderConnectionForm = () => {
    switch (connectionType) {
      case "sql":
        return (
          <DatabaseConnectionForm
            connectionDetails={sqlConnectionDetails}
            setConnectionDetails={setSqlConnectionDetails}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
          />
        );
      case "supabase":
        return (
          <SupabaseConnectionForm
            connectionDetails={supabaseConnectionDetails}
            setConnectionDetails={setSupabaseConnectionDetails}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
          />
        );
      case "hubspot":
        return (
          <HubSpotConnectionForm
            connectionDetails={hubspotConnectionDetails}
            setConnectionDetails={setHubspotConnectionDetails}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto py-10">
      {/* Connection Type Toggle */}
      <ConnectionTypeToggle
        connectionType={connectionType}
        setConnectionType={setConnectionType}
      />
      {/* Render the appropriate connection form */}
      {renderConnectionForm()}

      {toast && <Toast message={toast.message} type={toast.type} />}
      <div className="mt-4 text-center">
        {selectedDatabase && `Connected to: ${selectedDatabase}`}
      </div>
      {/* Database Selection rendered outside the chat container */}
      <DatabaseSelection
        databases={databases}
        selectedDatabase={selectedDatabase}
        onSelect={handleDatabaseSelection}
        onPluginClick={() => setIsPluginClicked(true)}
      />

      {/* Chat Bubble Button */}
      <ChatBubbleButton onClick={toggleChat} />

      {isChatOpen && (
        <div className="fixed bottom-20 right-4 w-96 bg-white dark:bg-neutral-800 rounded-lg shadow-xl z-50 flex flex-col max-h-[70vh]">
          <ChatDialog messages={messages} />
          <ChatInput
            message={message}
            setMessage={setMessage}
            sendMessage={sendMessage}
            onKeyDown={handleKeyPress}
            isFocused={isChatOpen}
          />
        </div>
      )}
    </div>
  );
}
