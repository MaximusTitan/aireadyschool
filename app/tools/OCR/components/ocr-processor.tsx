"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, Copy } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"

export function OCRProcessor() {
  const [url, setUrl] = useState<string>("")
  const [extractedText, setExtractedText] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [progress, setProgress] = useState(0)
  const { toast } = useToast()

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value)
    setError("")
  }

  const clearUrl = () => {
    setUrl("")
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(extractedText)
    toast({
      title: "Copied to clipboard",
      description: "The extracted text has been copied to your clipboard.",
    })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!url) {
      setError("Please enter a URL to extract text from.")
      return
    }

    // Basic URL validation
    try {
      new URL(url)
    } catch (err) {
      setError("Please enter a valid URL.")
      return
    }

    setIsLoading(true)
    setError("")
    setExtractedText("")
    setProgress(0)
    const interval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 10, 90))
    }, 1000)

    try {
      const response = await fetch("/api/ocr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      })

      const data = await response.json()

      if (response.ok) {
        setExtractedText(data.extractedText)
      } else {
        setError(data.error || "Something went wrong!")
      }
    } catch (error) {
      console.error("Error processing URL:", error)
      setError("Failed to extract text from the provided URL.")
    } finally {
      clearInterval(interval)
      setProgress(100)
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Enter Document URL</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="url">Document URL</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="url"
                    type="text"
                    placeholder="https://example.com/document.pdf"
                    value={url}
                    onChange={handleUrlChange}
                    disabled={isLoading}
                  />
                  {url && (
                    <Button type="button" variant="outline" size="sm" onClick={clearUrl} disabled={isLoading}>
                      Clear
                    </Button>
                  )}
                </div>
                <p className="text-sm text-gray-500">Enter the URL of a document (PDF) or image to extract text from</p>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Extracting Text...
                </>
              ) : (
                "Extract Text"
              )}
            </Button>

            {isLoading && <Progress value={progress} className="h-2 w-full" />}
          </form>
        </CardContent>
      </Card>

      {extractedText && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Extracted Text</CardTitle>
            <Button variant="outline" size="icon" onClick={copyToClipboard}>
              <Copy className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="text">
              <TabsList className="mb-4">
                <TabsTrigger value="text">Plain Text</TabsTrigger>
                <TabsTrigger value="formatted">Formatted</TabsTrigger>
              </TabsList>
              <TabsContent value="text">
                <Textarea 
                  value={extractedText} 
                  readOnly 
                  className="min-h-[300px] font-mono text-sm"
                />
              </TabsContent>
              <TabsContent value="formatted">
                <div className="bg-muted p-4 rounded-md min-h-[300px] whitespace-pre-wrap">
                  {extractedText}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
