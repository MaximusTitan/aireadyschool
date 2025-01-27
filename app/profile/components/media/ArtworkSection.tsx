"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageIcon, Edit2, Check, X, Loader2 } from "lucide-react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";

interface ArtworkSectionProps {}

interface Artwork {
  id: string;
  file_url: string;
  title: string;
  updated_at: string;
  student_email: string;
}

export default function ArtworkSection({}: ArtworkSectionProps) {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [editingArtwork, setEditingArtwork] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const artworkInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadArtworks();
  }, []);

  const loadArtworks = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("artworks")
      .select("*")
      .eq("student_email", user.email)
      .order("updated_at", { ascending: false });

    if (error) {
      setError("Failed to load artworks");
      return;
    }

    setArtworks(data || []);
  };

  const handleArtworkUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      setError("Please upload only image files");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) return;

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { error: uploadError, data } = await supabase.storage
        .from("artworks")
        .upload(`${user.email}/${fileName}`, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage
        .from("artworks")
        .getPublicUrl(`${user.email}/${fileName}`);

      const { error: dbError } = await supabase.from("artworks").insert({
        student_email: user.email,
        title: file.name,
        file_url: publicUrl,
      });

      if (dbError) throw dbError;

      await loadArtworks();
    } catch (error) {
      console.error("Error handling artwork:", error);
      setError("Failed to upload artwork");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleArtworkTitleEdit = (id: string, title: string) => {
    setEditingArtwork({ id, title });
  };

  const handleArtworkTitleSave = async () => {
    if (!editingArtwork) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("artworks")
      .update({
        title: editingArtwork.title,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingArtwork.id);

    if (error) {
      setError("Failed to update title");
      return;
    }

    await loadArtworks();
    setEditingArtwork(null);
  };

  const handleArtworkDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this artwork?")) return;

    const supabase = createClient();
    const artwork = artworks.find((a) => a.id === id);
    if (!artwork) return;

    // Extract filename from URL
    const fileName = artwork.file_url.split("/").pop();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email || !fileName) return;

    // Delete from storage
    await supabase.storage
      .from("artworks")
      .remove([`${user.email}/${fileName}`]);

    // Delete from database
    await supabase.from("artworks").delete().eq("id", id);

    await loadArtworks();
  };

  return (
    <div className="mt-12">
      <h2 className="text-xl font-bold mb-4">Artwork</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {artworks.map((artwork) => (
          <div
            key={artwork.id}
            className="bg-gray-100 rounded-lg overflow-hidden"
          >
            <div className="aspect-square relative">
              <Image
                src={artwork.file_url || "/placeholder.svg"}
                alt={artwork.title}
                layout="fill"
                objectFit="cover"
              />
            </div>
            <div className="p-4">
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
                    className="flex-grow"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleArtworkTitleSave}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setEditingArtwork(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{artwork.title}</h3>
                  <div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        handleArtworkTitleEdit(artwork.id, artwork.title)
                      }
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleArtworkDelete(artwork.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Uploaded on {new Date(artwork.updated_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
        <div
          className="aspect-square bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors flex items-center justify-center cursor-pointer"
          onClick={() => artworkInputRef.current?.click()}
        >
          <div className="flex flex-col items-center">
            {isUploading ? (
              <>
                <Loader2 className="w-12 h-12 text-gray-400 animate-spin" />
                <span className="mt-2 text-sm text-gray-500">{`Uploading... ${uploadProgress.toFixed(0)}%`}</span>
              </>
            ) : (
              <>
                <ImageIcon className="w-12 h-12 text-gray-400" />
                <span className="mt-2 text-sm text-gray-500">
                  Upload Artwork
                </span>
              </>
            )}
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
  );
}
