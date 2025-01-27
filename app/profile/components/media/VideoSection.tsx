"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Video, Edit2, Check, X, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface VideoSectionProps {}

interface VideoItem {
  id: string;
  file_url: string;
  title: string;
  updated_at: string;
  student_email: string;
}

export default function VideoSection({}: VideoSectionProps) {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [editingVideo, setEditingVideo] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .eq("student_email", user.email)
      .order("updated_at", { ascending: false });

    if (error) {
      setError("Failed to load videos");
      return;
    }

    setVideos(data || []);
  };

  const handleVideoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("video/")) {
      setError("Please upload only video files");
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
        .from("videos")
        .upload(`${user.email}/${fileName}`, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage
        .from("videos")
        .getPublicUrl(`${user.email}/${fileName}`);

      const { error: dbError } = await supabase.from("videos").insert({
        student_email: user.email,
        title: file.name,
        file_url: publicUrl,
      });

      if (dbError) throw dbError;

      await loadVideos();
    } catch (error) {
      console.error("Error handling video:", error);
      setError("Failed to upload video");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleVideoTitleEdit = (id: string, title: string) => {
    setEditingVideo({ id, title });
  };

  const handleVideoTitleSave = async () => {
    if (!editingVideo) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("videos")
      .update({
        title: editingVideo.title,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingVideo.id);

    if (error) {
      setError("Failed to update title");
      return;
    }

    await loadVideos();
    setEditingVideo(null);
  };

  const handleVideoDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this video?")) return;

    const supabase = createClient();
    const video = videos.find((v) => v.id === id);
    if (!video) return;

    const fileName = video.file_url.split("/").pop();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email || !fileName) return;

    // Delete from storage
    await supabase.storage.from("videos").remove([`${user.email}/${fileName}`]);

    // Delete from database
    await supabase.from("videos").delete().eq("id", id);

    await loadVideos();
  };

  return (
    <div className="mt-12">
      <h2 className="text-xl font-bold mb-4">Videos</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {videos.map((video, index) => (
          <div
            key={video.id}
            className="bg-gray-100 rounded-lg overflow-hidden"
          >
            <div className="aspect-video">
              <video
                src={video.file_url}
                controls
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4">
              {editingVideo?.id === video.id ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editingVideo.title}
                    onChange={(e) =>
                      setEditingVideo((prev) =>
                        prev ? { ...prev, title: e.target.value } : prev
                      )
                    }
                    className="flex-grow"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleVideoTitleSave}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setEditingVideo(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{video.title}</h3>
                  <div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        handleVideoTitleEdit(video.id, video.title)
                      }
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleVideoDelete(video.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Last updated on{" "}
                {new Date(video.updated_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
        <div
          className="aspect-video bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors flex items-center justify-center cursor-pointer"
          onClick={() => videoInputRef.current?.click()}
        >
          <div className="flex flex-col items-center">
            {isUploading ? (
              <>
                <Loader2 className="w-12 h-12 text-gray-400 animate-spin" />
                <span className="mt-2 text-sm text-gray-500">{`Uploading... ${uploadProgress.toFixed(0)}%`}</span>
              </>
            ) : (
              <>
                <Video className="w-12 h-12 text-gray-400" />
                <span className="mt-2 text-sm text-gray-500">Upload Video</span>
              </>
            )}
          </div>
        </div>
      </div>
      <input
        type="file"
        accept="video/*"
        className="hidden"
        ref={videoInputRef}
        onChange={handleVideoUpload}
        disabled={isUploading}
      />
    </div>
  );
}
