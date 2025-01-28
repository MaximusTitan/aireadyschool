import { useState, useEffect, useCallback } from "react";
import { Loader2, Play, Copy, X, Trash } from "lucide-react";
import CodeEditor from "./CodeEditor";
import CodeOutput from "./CodeOutput";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const languageMap: { [key: string]: string } = {
  JavaScript: "nodejs",
  Python: "python3",
  Java: "java",
  Rust: "rust",
};

const defaultCode = {
  JavaScript: `console.log("Hello, World!");`,
  Python: `print("Hello, World!")`,
  Java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
  Rust: `fn main() {
    println!("Hello, World!");
}`,
};

interface CodePlaygroundProps {
  language: string;
}

export default function CodePlayground({ language }: CodePlaygroundProps) {
  const [code, setCode] = useState(
    defaultCode[language as keyof typeof defaultCode] || ""
  );
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runCode = useCallback(async () => {
    setIsRunning(true);
    setError(null);
    setOutput("");

    try {
      const response = await fetch("/api/run-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language: languageMap[language] || language.toLowerCase(),
          code: code,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      if (typeof data.output === "string") {
        setOutput(data.output.trim());
      } else {
        setError("Unexpected response format from the server");
      }
    } catch (error) {
      console.error("Error running code:", error);
      setError("Failed to execute code. Please try again.");
    } finally {
      setIsRunning(false);
    }
  }, [code, language]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        runCode();
      }
    },
    [runCode]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    setCode(defaultCode[language as keyof typeof defaultCode] || "");
  }, [language]);

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
  };

  const clearOutput = () => {
    setOutput("");
    setError(null);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Code Playground ({language})</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyCode}>
            <Copy className="h-4 w-4 mr-1" /> Copy
          </Button>
          <Button variant="outline" size="sm" onClick={clearOutput}>
            <Trash className="h-4 w-4 mr-1" /> Clear
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <CodeEditor code={code} setCode={setCode} language={language} />
          <div className="absolute bottom-4 right-4 text-xs text-muted-foreground">
            Press Ctrl+Enter to run
          </div>
        </div>

        <div className="flex justify-between items-center">
          <Button onClick={runCode} disabled={isRunning} className="w-32">
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" /> Run Code
              </>
            )}
          </Button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 rounded flex justify-between items-start">
            <div className="whitespace-pre-wrap">{error}</div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {(output || error) && (
          <div className="mt-4 border rounded-lg">
            <CodeOutput output={output} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
