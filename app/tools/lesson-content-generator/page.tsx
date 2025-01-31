"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ContentBlock } from "./components/ContentBlock"
import { GeneratedContent } from "./components/GeneratedContent"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

const generateText = async (prompt: string, retries = 3): Promise<{ title: string; result: string }> => {
  try {
    const textResponse = await fetch("/api/generate-text", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    })

    if (!textResponse.ok) {
      const errorData = await textResponse.json()
      throw new Error(errorData.message || "Failed to generate text")
    }

    const textData = await textResponse.json()

    if (!textData.title || !textData.result) {
      if (retries > 0) {
        console.log("Invalid response format, retrying...")
        return generateText(prompt, retries - 1)
      } else {
        throw new Error("Failed to generate a response in the valid format")
      }
    }
    return textData
  } catch (error) {
    if (retries > 0) {
      console.log("Error generating text, retrying...")
      return generateText(prompt, retries - 1)
    } else {
      throw error
    }
  }
}

const generateImage = async (prompt: string): Promise<string> => {
  const imageResponse = await fetch("/api/generate-fal-image", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prompt }),
  })

  if (!imageResponse.ok) {
    const errorData = await imageResponse.json()
    throw new Error(errorData.error || "Failed to generate image")
  }

  const imageData = await imageResponse.json()
  return imageData.result
}

const ContentGenerator = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [textInput, setTextInput] = useState("")
  const [textContent, setTextContent] = useState("")
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [lessonTitle, setLessonTitle] = useState("")

  const generateContent = async () => {
    setIsLoading(true)
    setTextContent("")
    setGeneratedImage(null)
    setLessonTitle("")

    try {
      const textData = await generateText(textInput)
      setTextContent(textData.result)
      setLessonTitle(textData.title)

      const imageUrl = await generateImage(textData.title)
      setGeneratedImage(imageUrl)
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPressed = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      generateContent()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1200px] mx-auto p-8">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/tools" className="text-gray-600 hover:text-gray-800">
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900">Lesson Content Generator</h1>
        </div>

        <div className="space-y-6">
          {/* Input Card */}
          <Card className="border border-gray-200 shadow-sm bg-white">
            <ContentBlock title="Ask me anything:" description="What would you like to learn about today?">
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="textInput" className="text-sm text-gray-700">
                    Please enter your question:
                  </Label>
                  <Input
                    id="textInput"
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    onKeyDown={handleKeyPressed}
                    placeholder="Start typing here..."
                    className="w-full bg-white border-gray-200"
                  />
                </div>

                <Button
                  onClick={generateContent}
                  disabled={!textInput || isLoading}
                  className="bg-[#E31B54] hover:bg-[#E31B54]/90 text-white"
                >
                  Create Lesson
                </Button>
              </div>
            </ContentBlock>
          </Card>

          {/* Output Card */}
          {(isLoading || textContent) && (
            <Card className="border border-gray-200 shadow-sm bg-white">
              {isLoading ? (
                <div className="p-6 animate-pulse space-y-4">
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ) : (
                <GeneratedContent text={textContent} imageUrl={generatedImage || undefined} title={lessonTitle} />
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default ContentGenerator

