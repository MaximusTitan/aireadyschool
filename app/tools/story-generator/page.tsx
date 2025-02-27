"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Spinner } from "@/components/ui/spinner"
import ReactMarkdown from "react-markdown"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { StoryHistory } from "@/components/story/StoryHistory"
import type { Story } from "@/types/story"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { jsPDF } from "jspdf" // Added jsPDF import
import { useDropzone } from "react-dropzone"

interface StoryResponse {
  story: string
  imageUrl: string
  storyId?: number
}

export default function GenerateStory() {
  const resultRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState<"idle" | "story" | "image">("idle")
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<StoryResponse | null>(null)
  const [stories, setStories] = useState<Story[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const ITEMS_PER_PAGE = 6
  const [userEmail, setUserEmail] = useState<string>("")
  // Add a new state for editing mode
  const [isEditing, setIsEditing] = useState(false)

  // Add a new state for the edited story
  const [editedStory, setEditedStory] = useState("")

  // Add these state variables inside the GenerateStory component
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)

  // Fetch current user email
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUserEmail(user.email ?? "")
      }
    }
    fetchUser()
  }, [])

  useEffect(() => {
    if (userEmail) {
      loadUserStories()
    }
  }, [userEmail, currentPage])

  const loadUserStories = async () => {
    const supabase = createClient()

    // Get total count filtered by user_email
    const { count } = await supabase
      .from("stories")
      .select("*", { count: "exact", head: true })
      .eq("user_email", userEmail)

    if (count) {
      setTotalPages(Math.ceil(count / ITEMS_PER_PAGE))
    }

    // Get paginated data filtered by user_email
    const { data } = await supabase
      .from("stories")
      .select("*")
      .eq("user_email", userEmail)
      .order("created_at", { ascending: false })
      .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1)

    if (data) {
      setStories(data)
    }
  }

  const handleLoadStory = (story: Story) => {
    setResult({
      story: story.story,
      imageUrl: story.image_url,
      storyId: story.id,
    })

    // Scroll to result
    resultRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setCurrentStep("story")

    const formData = new FormData(e.currentTarget)
    const data = {
      title: formData.get("title"),
      description: formData.get("description"),
      genre: formData.get("genre"),
      ageGroup: formData.get("ageGroup"),
      tone: formData.get("tone") || "engaging",
      length: formData.get("length") || "medium",
    }

    try {
      setCurrentStep("story")
      const storyResponse = await fetch("/api/generate-story", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!storyResponse.ok) throw new Error("Failed to generate story")
      const storyData = await storyResponse.json()

      // Extract a good scene from the story for image generation
      const firstParagraph = storyData.story.split("\n")[0]
      const imagePrompt = `${data.genre} style scene: ${firstParagraph.slice(0, 200)}`

      setCurrentStep("image")
      const imageResponse = await fetch("/api/generate-story-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: imagePrompt,
          storyId: storyData.storyId,
        }),
      })

      if (!imageResponse.ok) throw new Error("Failed to generate image")
      const imageData = await imageResponse.json()

      setResult({
        story: storyData.story,
        imageUrl: imageData.imageUrl,
      })

      // Scroll to result after a short delay to ensure rendering is complete
      setTimeout(() => {
        resultRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }, 100)
    } catch (error) {
      setError(typeof error === "string" ? error : "Failed to generate story. Please try again.")
      console.error(error)
    } finally {
      setLoading(false)
      setCurrentStep("idle")
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Format the story as markdown
  const formatStoryAsMarkdown = (story: string) => {
    const paragraphs = story.split("\n")
    const title = paragraphs[0]
    const content = paragraphs.slice(1).join("\n\n")

    return `# ${title}\n\n${content}`
  }

  // Updated PDF download function with centered title and individual paragraphs for content
  const handleDownloadPdf = async () => {
    if (!result) return
    const doc = new jsPDF()
    const margin = 10
    const pageHeight = doc.internal.pageSize.height
    const pageWidth = doc.internal.pageSize.width
    const availableWidth = pageWidth - margin * 2
    let yOffset = margin

    if (result.imageUrl) {
      try {
        const response = await fetch(result.imageUrl)
        const blob = await response.blob()
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.onerror = (error) => reject(error)
          reader.readAsDataURL(blob)
        })
        doc.addImage(base64, "JPEG", margin, yOffset, availableWidth, 100)
        yOffset += 110
      } catch (err) {
        console.error("Error loading image", err)
      }
    }

    // Split the story into paragraphs using newline
    const paragraphs = result.story.split("\n").filter(Boolean)
    // Title is the first paragraph
    const titleText = paragraphs[0] || ""
    // Remaining paragraphs are the content
    const contentParagraphs = paragraphs.slice(1)

    // Add title in bold with larger font size and center it
    doc.setFont("helvetica", "bold")
    doc.setFontSize(16)
    const titleLines = doc.splitTextToSize(titleText, availableWidth)
    titleLines.forEach((line: string): void => {
      if (yOffset + 16 > pageHeight - margin) {
        doc.addPage()
        yOffset = margin
      }
      // Center the title using align option
      doc.text(line, pageWidth / 2, yOffset, { align: "center" })
      yOffset += 14
    })
    yOffset += 4 // gap after title

    // Add content paragraphs separately
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    const lineHeight = 6
    contentParagraphs.forEach((para: string) => {
      // Split each paragraph into lines
      const lines = doc.splitTextToSize(para, availableWidth)
      lines.forEach((line: string) => {
        if (yOffset + lineHeight > pageHeight - margin) {
          doc.addPage()
          yOffset = margin
        }
        doc.text(line, margin, yOffset)
        yOffset += lineHeight
      })
      yOffset += lineHeight // extra gap between paragraphs
    })

    doc.save(`story_${result.storyId || "download"}.pdf`)
  }

  // Add this function inside the GenerateStory component
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setUploadedImage(e.target?.result as string)
        }
        reader.readAsDataURL(file)

        // Upload the image to Supabase storage
        if (result?.storyId) {
          const supabase = createClient()
          const { data, error } = await supabase.storage.from("story-images").upload(`${result.storyId}.jpg`, file)

          if (error) {
            console.error("Error uploading image:", error)
          } else {
            // Update the story's image_url in the database
            const { data: urlData } = supabase.storage.from("story-images").getPublicUrl(`${result.storyId}.jpg`)

            if (urlData) {
              const { error: updateError } = await supabase
                .from("stories")
                .update({ image_url: urlData.publicUrl })
                .eq("id", result.storyId)

              if (updateError) {
                console.error("Error updating story image_url:", updateError)
              } else {
                setResult((prevResult) => ({
                  ...prevResult!,
                  imageUrl: urlData.publicUrl,
                }))
              }
            }
          }
        }
      }
    },
    [result?.storyId],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  // Add a function to handle story editing
  const handleEditStory = () => {
    setIsEditing(true)
    setEditedStory(result?.story || "")
  }

  // Update the handleSaveEdit function to include the uploaded image
  const handleSaveEdit = async () => {
    setIsEditing(false)
    if (result) {
      const updatedResult = { ...result, story: editedStory }
      if (uploadedImage) {
        updatedResult.imageUrl = uploadedImage
      }
      setResult(updatedResult)

      // Update the story in the database
      const supabase = createClient()
      const { error } = await supabase
        .from("stories")
        .update({
          story: editedStory,
          image_url: uploadedImage || result.imageUrl,
        })
        .eq("id", result.storyId)

      if (error) {
        console.error("Error updating story:", error)
        // Optionally, show an error message to the user
      }
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 max-w-6xl mx-auto mb-12">
        <Link href="/tools" className="hover:bg-gray-50 p-2 rounded-full transition-all">
          <ChevronLeft className="text-gray-900" />
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">AI Story Generator</h1>
      </div>

      <div className="max-w-4xl mx-auto"></div>
      <div className="mb-16">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-8">
          <div>
            <label className="block text-sm font-medium mb-2">Story Title *</label>
            <input
              name="title"
              className="w-full p-3 border border-gray-200 rounded-lg shadow-sm 
                  focus:ring-1 focus:ring-black focus:border-black transition-all"
              maxLength={100}
              required
              placeholder="Enter a captivating title"
            />
            <p className="mt-1 text-sm text-gray-500">Maximum 100 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description <span className="text-gray-500">(optional)</span>
            </label>
            <textarea
              name="description"
              className="w-full p-3 border border-gray-200 rounded-lg shadow-sm 
                  focus:ring-1 focus:ring-black focus:border-black transition-all"
              rows={4}
              maxLength={500}
              placeholder="Add some context or specific elements you'd like in your story"
            />
            <p className="mt-1 text-sm text-gray-500">Maximum 500 characters</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Genre *</label>
              <select
                name="genre"
                title="Genre"
                className="w-full p-3 border border-gray-200 rounded-lg shadow-sm 
                    focus:ring-1 focus:ring-black focus:border-black appearance-none bg-white"
                required
              >
                <option value="fantasy">Fantasy</option>
                <option value="adventure">Adventure</option>
                <option value="mystery">Mystery</option>
                <option value="scifi">Science Fiction</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Age Group</label>
              <select
                name="ageGroup"
                title="Age Group"
                className="w-full p-3 border border-gray-200 rounded-lg shadow-sm 
                    focus:ring-1 focus:ring-black focus:border-black appearance-none bg-white"
                required
              >
                <option value="children">Children</option>
                <option value="young-adult">Young Adult</option>
                <option value="adult">Adult</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Story Tone</label>
              <select
                name="tone"
                title="Story Tone"
                className="w-full p-3 border border-gray-200 rounded-lg shadow-sm 
                    focus:ring-1 focus:ring-black focus:border-black appearance-none bg-white"
                required
              >
                <option value="engaging">Engaging</option>
                <option value="humorous">Humorous</option>
                <option value="dramatic">Dramatic</option>
                <option value="educational">Educational</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-black hover:bg-gray-800 text-white p-4 rounded-lg 
                font-medium transition-colors disabled:opacity-50 disabled:hover:bg-black"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner className="w-5 h-5" />
                {currentStep === "story" ? "Crafting your story..." : "Creating illustration..."}
              </span>
            ) : (
              "Generate Story"
            )}
          </button>
        </form>
      </div>

      {error && (
        <div className="max-w-2xl mx-auto">
          <div className="p-4 bg-gray-50 border border-gray-200 text-gray-800 rounded-lg">{error}</div>
        </div>
      )}

      {result && (
        <div ref={resultRef} className="mt-16 space-y-12 animate-fadeIn max-w-4xl mx-auto print-content">
          <div
            {...getRootProps()}
            className="aspect-w-16 aspect-h-9 max-h-[600px] overflow-hidden rounded-xl border border-gray-100 shadow-lg print:shadow-none print:border-0 cursor-pointer"
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <div className="flex items-center justify-center h-full bg-gray-100">
                <p className="text-lg text-gray-600">Drop the image here ...</p>
              </div>
            ) : (
              <img
                src={uploadedImage || result.imageUrl || "/placeholder.svg"}
                alt="Story illustration"
                className="object-cover w-full h-full"
              />
            )}
          </div>
          <p className="text-center text-sm text-gray-500">Click or drag and drop to change the image</p>

          <article className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 print:shadow-none print:border-0 print:p-0">
            {isEditing ? (
              <textarea
                value={editedStory}
                onChange={(e) => setEditedStory(e.target.value)}
                className="w-full h-96 p-4 border border-gray-300 rounded-lg"
              />
            ) : (
              <div className="prose prose-lg max-w-none dark:prose-invert">
                <ReactMarkdown>{formatStoryAsMarkdown(result.story)}</ReactMarkdown>
              </div>
            )}
          </article>

          <div className="flex justify-center mt-8 space-x-4 no-print">
            {isEditing ? (
              <button
                onClick={handleSaveEdit}
                className="inline-flex items-center px-6 py-3 text-sm font-medium 
                    text-white bg-green-600 rounded-lg 
                    hover:bg-green-700 transition-colors"
              >
                Save Changes
              </button>
            ) : (
              <button
                onClick={handleEditStory}
                className="inline-flex items-center px-6 py-3 text-sm font-medium 
                    text-gray-700 bg-white border border-gray-300 rounded-lg 
                    hover:bg-gray-50 transition-colors"
              >
                Edit Story
              </button>
            )}
            {/* Replace Print Story with PDF Download */}
            <button
              onClick={() => handleDownloadPdf()}
              className="inline-flex items-center px-6 py-3 text-sm font-medium 
                  text-gray-700 bg-white border border-gray-300 rounded-lg 
                  hover:bg-gray-50 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Download PDF
            </button>
          </div>
        </div>
      )}

      {!result && !loading && (
        <div className="max-w-2xl mx-auto mt-12 p-8 bg-gray-50 rounded-lg text-center border border-gray-100">
          <p className="text-lg text-gray-600">Your story will appear here after generation</p>
        </div>
      )}

      {/* History section */}
      <div className="mt-16 pt-16 border-t border-gray-200">
        <h2 className="text-2xl font-semibold mb-6">Previous Stories</h2>
        <StoryHistory stories={stories} onLoadStory={handleLoadStory} />

        <div className="mt-8">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(currentPage - 1)}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>

              {[...Array(totalPages)].map((_, i) => (
                <PaginationItem key={i + 1}>
                  <PaginationLink
                    onClick={() => handlePageChange(i + 1)}
                    isActive={currentPage === i + 1}
                    className="cursor-pointer"
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </div>
  )
}
