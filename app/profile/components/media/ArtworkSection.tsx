"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ImageIcon, Edit2, Check, X, Loader2 } from "lucide-react"
import Image from "next/image"
import { createClient } from "@/utils/supabase/client"
import { DocumentVaultSelector } from "./DocumentVaultSelector"

type ArtworkSectionProps = {}

interface Artwork {
  id: string
  file_url: string
  title: string
  updated_at: string
  student_email: string
}

interface VaultItem {
  id: string
  file_name: string
  file_path: string
  parent_folder: string
  type: string | null
  public_url: string | null
}

export default function ArtworkSection({}: ArtworkSectionProps) {
  const [artworks, setArtworks] = useState<Artwork[]>([])
  const [editingArtwork, setEditingArtwork] = useState<{
    id: string
    title: string
  } | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const artworkInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadArtworks()
  }, [])

  const loadArtworks = async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from("artworks")
      .select("*")
      .eq("student_email", user.email)
      .order("updated_at", { ascending: false })

    if (error) {
      setError("Failed to load artworks")
      return
    }

    setArtworks(data || [])
  }

  const handleArtworkUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !file.type.startsWith("image/")) {
      setError("Please upload only image files")
      return
    }

    await uploadArtwork(file)
  }

  const uploadArtwork = async (file: File) => {
    setIsUploading(true)
    setUploadProgress(0)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user?.email) return

    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${Math.random()}.${fileExt}`
      const { error: uploadError, data } = await supabase.storage
        .from("artworks")
        .upload(`${user.email}/${fileName}`, file)

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from("artworks").getPublicUrl(`${user.email}/${fileName}`)

      const { error: dbError } = await supabase.from("artworks").insert({
        student_email: user.email,
        title: file.name,
        file_url: publicUrl,
      })

      if (dbError) throw dbError

      await loadArtworks()
    } catch (error) {
      console.error("Error handling artwork:", error)
      setError("Failed to upload artwork")
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleVaultItemSelect = async (item: VaultItem) => {
    if (item.type !== "file" || !item.public_url) {
      setError("Selected item is not a valid image file")
      return
    }

    setIsUploading(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user?.email) return

    try {
      const { error: dbError } = await supabase.from("artworks").insert({
        student_email: user.email,
        title: item.file_name,
        file_url: item.public_url,
      })

      if (dbError) throw dbError

      await loadArtworks()
    } catch (error) {
      console.error("Error adding artwork from vault:", error)
      setError("Failed to add artwork from vault")
    } finally {
      setIsUploading(false)
    }
  }

  const handleArtworkTitleEdit = (id: string, title: string) => {
    setEditingArtwork({ id, title })
  }

  const handleArtworkTitleSave = async () => {
    if (!editingArtwork) return

    const supabase = createClient()
    const { error } = await supabase
      .from("artworks")
      .update({
        title: editingArtwork.title,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingArtwork.id)

    if (error) {
      setError("Failed to update title")
      return
    }

    await loadArtworks()
    setEditingArtwork(null)
  }

  const handleArtworkDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this artwork?")) return

    const supabase = createClient()
    const artwork = artworks.find((a) => a.id === id)
    if (!artwork) return

    // Extract filename from URL
    const fileName = artwork.file_url.split("/").pop()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user?.email || !fileName) return

    // Delete from storage
    await supabase.storage.from("artworks").remove([`${user.email}/${fileName}`])

    // Delete from database
    await supabase.from("artworks").delete().eq("id", id)

    await loadArtworks()
  }

  return (
    <div className="mt-12">
      <h2 className="text-xl font-bold mb-4">Artwork</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {artworks.map((artwork) => (
          <div key={artwork.id} className="bg-white rounded-lg overflow-hidden shadow-md">
            <div className="aspect-[4/3] relative">
              <Image src={artwork.file_url || "/placeholder.svg"} alt={artwork.title} layout="fill" objectFit="cover" />
            </div>
            <div className="p-3">
              {editingArtwork?.id === artwork.id ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editingArtwork.title}
                    onChange={(e) =>
                      setEditingArtwork({
                        ...editingArtwork,
                        title: e.target.value,
                      })
                    }
                    className="flex-grow text-sm"
                  />
                  <Button size="icon" variant="ghost" onClick={handleArtworkTitleSave}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setEditingArtwork(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm truncate mr-2">{artwork.title}</h3>
                  <div className="flex-shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleArtworkTitleEdit(artwork.id, artwork.title)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleArtworkDelete(artwork.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">{new Date(artwork.updated_at).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
        <div className="bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors flex flex-col items-center justify-center p-4 aspect-[4/3]">
          <div className="flex flex-col items-center mb-4">
            <ImageIcon className="w-10 h-10 text-gray-400 mb-2" />
            <span className="text-sm text-gray-500">Upload Artwork</span>
          </div>
          <div className="flex flex-col gap-2 w-full">
            <Button
              variant="outline"
              onClick={() => artworkInputRef.current?.click()}
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload from Device"
              )}
            </Button>
            <DocumentVaultSelector onSelect={handleVaultItemSelect} />
          </div>
        </div>
      </div>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={artworkInputRef}
        onChange={handleArtworkUpload}
        disabled={isUploading}
      />
    </div>
  )
}

