"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChatBubble } from "./chat-bubble";
import { ChatWindow } from "./chat-window";

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

export default function ConnectDatabasePage() {
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseAnonKey, setSupabaseAnonKey] = useState("");
  const [databaseNameInput, setDatabaseNameInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<ToastProps | null>(null);
  const [databaseName, setDatabaseName] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/connect-database", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ supabaseUrl, supabaseAnonKey }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to connect to database");
      }

      setDatabaseName(result.databaseName);
      setToast({
        message: `Successfully connected to the database: ${databaseNameInput}`,
        type: "success",
      });
    } catch (error) {
      console.error("Error connecting to database:", error);
      setToast({
        message:
          "Failed to connect to the database. Please check your credentials and try again.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Connect to Your Database</CardTitle>
          <CardDescription>
            Enter your Supabase credentials to connect your database.
          </CardDescription>
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
      {toast && <Toast message={toast.message} type={toast.type} />}
      {databaseName && (
        <>
          <div className="mt-4 text-center">
            Connected to: {databaseNameInput}
          </div>
          <ChatBubble onClick={() => setIsChatOpen(true)} />
          {isChatOpen && (
            <ChatWindow
              onClose={() => setIsChatOpen(false)}
              databaseName={databaseNameInput}
              supabaseUrl={supabaseUrl}
              supabaseAnonKey={supabaseAnonKey}
            />
          )}
        </>
      )}
    </div>
  );
}
