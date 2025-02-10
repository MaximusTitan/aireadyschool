"use client"

import { useEffect } from "react"
import type React from "react"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileText, Edit2, Check, X, Loader2 } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

export interface Presentation {
  id: string
  file_url: string
  title: string
  updated_at: string
  is_embed: boolean
}

export default function PresentationSection() {
  const [presentations, setPresentations] = useState<Presentation[]>([])
  const [editingPresentation, setEditingPresentation] = useState<{
    id: string
    title: string
  } | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [embedUrl, setEmbedUrl] = useState("")
  const presentationInputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchPresentations()
  }, [])

  const fetchPresentations = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user?.email) {
      const { data, error } = await supabase
        .from("presentations")
        .select("*")
        .eq("student_email", user.email)
        .order("updated_at", { ascending: false })

      if (!error && data) {
        setPresentations(data)
      }
    }
  }

  const handlePresentationUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.email) {
      setError("Please log in to upload presentations")
      return
    }

    const file = event.target.files?.[0]
    const validTypes = [
      "application/pdf",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ]

    if (file && validTypes.includes(file.type)) {
      setIsUploading(true)
      setUploadProgress(0)
      try {
        const fileExt = file.name.split(".").pop()
        const fileName = `${crypto.randomUUID()}.${fileExt}`
        const filePath = `${user.email}/${fileName}`

        // Upload file to Supabase storage
        const { error: uploadError, data } = await supabase.storage.from("presentations").upload(filePath, file, {
          upsert: false,
        })

        if (uploadError) throw uploadError

        // Get public URL
        const {
          data: { publicUrl },
        } = supabase.storage.from("presentations").getPublicUrl(filePath)

        // Save to database with student_email
        const { error: dbError, data: presentation } = await supabase
          .from("presentations")
          .insert({
            student_email: user.email,
            title: file.name,
            file_url: publicUrl,
            is_embed: false,
          })
          .select()
          .single()

        if (dbError) throw dbError

        setPresentations((prev) => [presentation, ...prev])
        setUploadProgress(100)
      } catch (error) {
        console.error("Error handling file:", error)
        setError("Failed to upload file")
      } finally {
        setIsUploading(false)
        setUploadProgress(0)
      }
    } else {
      setError("Please upload only PDF or PowerPoint files")
    }
  }

  const handlePresentationTitleEdit = (id: string, title: string) => {
    setEditingPresentation({ id, title })
  }

  const handlePresentationTitleSave = async () => {
    if (!editingPresentation) return

    try {
      const { error } = await supabase
        .from("presentations")
        .update({
          title: editingPresentation.title,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingPresentation.id)

      if (error) throw error

      setPresentations((prev) =>
        prev.map((presentation) =>
          presentation.id === editingPresentation.id
            ? {
                ...presentation,
                title: editingPresentation.title,
                updated_at: new Date().toISOString(),
              }
            : presentation,
        ),
      )
      setEditingPresentation(null)
    } catch (error) {
      console.error("Error updating title:", error)
      setError("Failed to update title")
    }
  }

  const handlePresentationDelete = async (id: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.email) {
      setError("Please log in to delete presentations")
      return
    }

    if (!confirm("Are you sure you want to delete this presentation?")) return

    try {
      const presentation = presentations.find((p) => p.id === id)
      if (!presentation) return

      if (!presentation.is_embed) {
        // Delete from storage
        const filePath = new URL(presentation.file_url).pathname.split("/").pop()
        if (filePath) {
          await supabase.storage.from("presentations").remove([`${user.email}/${filePath}`])
        }
      }

      // Delete from database
      const { error } = await supabase.from("presentations").delete().eq("id", id)

      if (error) throw error

      setPresentations((prev) => prev.filter((presentation) => presentation.id !== id))
    } catch (error) {
      console.error("Error deleting presentation:", error)
      setError("Failed to delete presentation")
    }
  }

  const handleEmbedSubmit = async () => {
    if (!embedUrl) return

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.email) {
      setError("Please log in to add presentations")
      return
    }

    try {
      const { error, data } = await supabase
        .from("presentations")
        .insert({
          student_email: user.email,
          title: "Embedded Presentation",
          file_url: embedUrl,
          is_embed: true,
        })
        .select()
        .single()

      if (error) throw error

      setPresentations((prev) => [data, ...prev])
      setEmbedUrl("")
    } catch (error) {
      console.error("Error adding embed:", error)
      setError("Failed to add presentation embed")
    }
  }

  const getEmbedUrl = (url: string) => {
    // Google Slides embed URL
    if (url.includes("docs.google.com/presentation")) {
      return url.replace("/pub?", "/embed?")
    }
    // Add support for other presentation platforms here if needed
    return url
  }

  return (
    <div className="mt-12">
      <h2 className="text-xl font-bold mb-4">Presentations</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Enter presentation embed URL"
            value={embedUrl}
            onChange={(e) => setEmbedUrl(e.target.value)}
            className="flex-grow"
          />
          <Button onClick={handleEmbedSubmit}>Add Embed</Button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {presentations?.map((presentation) => (
          <div key={presentation.id} className="bg-gray-100 rounded-lg overflow-hidden">
            <div className="aspect-video flex items-center justify-center bg-gray-200">
              {presentation.is_embed ? (
                <iframe src={getEmbedUrl(presentation.file_url)} className="w-full h-full" allowFullScreen />
              ) : (
                <FileText className="h-16 w-16 text-gray-400" />
              )}
            </div>
            <div className="p-4">
              {editingPresentation?.id === presentation.id ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editingPresentation.title}
                    onChange={(e) =>
                      setEditingPresentation({
                        ...editingPresentation,
                        title: e.target.value,
                      })
                    }
                    className="flex-grow"
                  />
                  <Button size="icon" variant="ghost" onClick={handlePresentationTitleSave}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setEditingPresentation(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{presentation.title}</h3>
                  <div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handlePresentationTitleEdit(presentation.id, presentation.title)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handlePresentationDelete(presentation.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Last updated on {new Date(presentation.updated_at).toLocaleDateString()}
              </p>
              {!presentation.is_embed && (
                <a
                  href={presentation.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-blue-500 hover:underline"
                >
                  View Presentation
                </a>
              )}
            </div>
          </div>
        ))}
        <div
          className="aspect-video bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors flex items-center justify-center cursor-pointer"
          onClick={() => presentationInputRef.current?.click()}
        >
          <div className="flex flex-col items-center">
            {isUploading ? (
              <>
                <Loader2 className="w-12 h-12 text-gray-400 animate-spin" />
                <span className="mt-2 text-sm text-gray-500">{`Uploading... ${uploadProgress.toFixed(0)}%`}</span>
              </>
            ) : (
              <>
                <FileText className="w-12 h-12 text-gray-400" />
                <span className="mt-2 text-sm text-gray-500">Upload Presentation</span>
              </>
            )}
          </div>
        </div>
      </div>
      <input
        type="file"
        accept=".pdf,.ppt,.pptx"
        className="hidden"
        ref={presentationInputRef}
        onChange={handlePresentationUpload}
        disabled={isUploading}
      />
    </div>
  )
}

