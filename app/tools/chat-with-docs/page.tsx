"use client";
import { useState, useEffect } from "react"; // Add useEffect import
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Send, Upload, ChevronLeft, FileText } from "lucide-react"; // Add FileText import
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox"; // Add this import
import { createClient } from "@/utils/supabase/client";

export default function Home() {
  const [files, setFiles] = useState<File[]>([]); // Changed from single file to array
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<{ role: string; content: string }[]>([]);
  const [fetchedFiles, setFetchedFiles] = useState<string[]>([]); // Add state for fetched files
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    };
    checkAuth();
  }, []);

  const fetchFiles = async () => {
    try {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setChat((prev) => [
          ...prev,
          {
            role: "system",
            content: "Please sign in to access your documents.",
          },
        ]);
        return;
      }

      const response = await fetch("/api/documents", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const data = await response.json();

      if (response.ok) {
        const fileNames = data.files.map(
          (doc: { file_name: string }) => doc.file_name
        );
        const uniqueFileNames = Array.from(new Set(fileNames));
        setFetchedFiles(uniqueFileNames as string[]);
        // Set all documents as selected by default
        setSelectedDocs(uniqueFileNames as string[]);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [isAuthenticated]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setChat((prev) => [
        ...prev,
        {
          role: "system",
          content: "Please sign in to upload documents.",
        },
      ]);
      return;
    }

    setLoading(true);
    const uploadedFiles = Array.from(e.target.files);
    setFiles(uploadedFiles);

    const formData = new FormData();
    uploadedFiles.forEach((file) => formData.append("files", file));

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const result = await response.json();
      uploadedFiles.forEach((file) => {
        setChat((prev) => [
          ...prev,
          {
            role: "system",
            content: `File "${file.name}" uploaded successfully!`,
          },
        ]);
      });
    } catch (error) {
      setChat((prev) => [
        ...prev,
        { role: "system", content: "Error uploading files." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setChat((prev) => [
        ...prev,
        {
          role: "system",
          content: "Please sign in to chat with documents.",
        },
      ]);
      return;
    }

    const userMessage = message;
    setMessage("");
    setChat((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch("/api/chat-with-docs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          message: userMessage,
          selectedDocs: selectedDocs, // Add selected documents
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to get response");
      }

      if (!result.hasContext) {
        setChat((prev) => [
          ...prev,
          {
            role: "system",
            content:
              "No relevant documents found. Please try uploading a document first or rephrase your question.",
          },
        ]);
      }

      setChat((prev) => [
        ...prev,
        {
          role: "assistant",
          content: result.response,
        },
      ]);
    } catch (error) {
      setChat((prev) => [
        ...prev,
        {
          role: "system",
          content:
            error instanceof Error ? error.message : "Error getting response.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Add toggle function for document selection
  const toggleDocumentSelection = (fileName: string) => {
    setSelectedDocs((prev) =>
      prev.includes(fileName)
        ? prev.filter((name) => name !== fileName)
        : [...prev, fileName]
    );
  };

  return (
    <>
      <div className="ml-4 flex h-16 items-center space-x-2">
        <Link href="/tools" className="text-neutral-500 hover:text-neutral-700">
          <ChevronLeft className="h-6 w-6 text-neutral-800" />
        </Link>
        <CardTitle className="text-neutral-800 text-3xl">
          Chat With Docs
        </CardTitle>
      </div>

      <div className="flex gap-4 mx-8 h-[calc(100vh-6rem)]">
        <Card className="bg-white dark:bg-neutral-950 flex-grow">
          <CardContent className="p-0 h-full flex flex-col">
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
              {chat.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "p-4 rounded-lg max-w-[80%]",
                    msg.role === "user"
                      ? "ml-auto bg-neutral-500 text-white"
                      : msg.role === "assistant"
                        ? "bg-neutral-100 dark:bg-neutral-800"
                        : "bg-neutral-200 dark:bg-neutral-800 italic"
                  )}
                >
                  {msg.content}
                </div>
              ))}
              {loading && (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="animate-spin text-neutral-500" />
                </div>
              )}
            </div>
            <div className="p-4 border-t dark:border-neutral-800">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="dark:border-neutral-800 dark:hover:bg-neutral-800"
                    onClick={() =>
                      document.getElementById("file-upload")?.click()
                    }
                    disabled={loading}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Doc
                  </Button>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt"
                    multiple // Added multiple attribute
                    onChange={handleFileUpload}
                    aria-label="Upload documents"
                  />
                </div>
                <div className="flex gap-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ask a question about your document..."
                    className="flex-1 dark:bg-neutral-800 dark:border-neutral-800"
                    disabled={loading}
                  />
                  <Button
                    type="submit"
                    disabled={loading || !message.trim()}
                    className="bg-neutral-500 hover:bg-neutral-600"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>

        <div className="w-80 space-y-4">
          {fetchedFiles.length > 0 && (
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg font-medium">
                  Available Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  {fetchedFiles.map((fileName, index) => (
                    <div
                      key={index}
                      className="flex items-center p-2 rounded-lg border dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <Checkbox
                        checked={selectedDocs.includes(fileName)}
                        onCheckedChange={() =>
                          toggleDocumentSelection(fileName)
                        }
                        className="mr-2"
                      />
                      <FileText className="h-4 w-4 mr-2 text-neutral-500" />
                      <span className="text-sm truncate" title={fileName}>
                        {fileName}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {files.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">
                  Recently Uploaded
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center p-2 rounded-lg border dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900"
                    >
                      <FileText className="h-4 w-4 mr-2 text-neutral-500" />
                      <span className="text-sm truncate" title={file.name}>
                        {file.name}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
