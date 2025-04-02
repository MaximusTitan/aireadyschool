"use client";
import React from "react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { supabase } from "@/app/dat/utils/supabaseClient";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Pencil,
  Save,
  X as XIcon,
  PlusCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { ChevronLeft } from "lucide-react";
import { toast } from "sonner";

interface InstructionContent {
  videoUrl: string;
  documentUrl: string;
}

interface InstructionMaterials {
  id?: string; // Change to optional string for UUID
  idea: InstructionContent;
  presentation: InstructionContent;
  prototype: InstructionContent;
}

interface EditState {
  section: "idea" | "presentation" | "prototype" | null;
  isEditing: boolean;
}

const getDocumentViewerUrl = (url: string): string => {
  // Extract Google Drive file ID from URL
  const driveMatch = url.match(/\/d\/(.*?)\/|id=(.*?)&|^[^/]*$/);
  const fileId = driveMatch ? driveMatch[1] || driveMatch[2] : null;

  if (fileId) {
    // If it's a Google Drive URL, use the preview URL
    return `https://drive.google.com/file/d/${fileId}/preview`;
  }
  return url; // Return original URL if not a Google Drive link
};

export default function InstructionsPage() {
  const [materials, setMaterials] = useState<InstructionMaterials>({
    idea: { videoUrl: "", documentUrl: "" },
    presentation: { videoUrl: "", documentUrl: "" },
    prototype: { videoUrl: "", documentUrl: "" },
  });
  const [editState, setEditState] = useState<EditState>({
    section: null,
    isEditing: false,
  });
  const [editContent, setEditContent] = useState<InstructionContent>({
    videoUrl: "",
    documentUrl: "",
  });
  const [visibleDocs, setVisibleDocs] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initializePage = async () => {
      setIsLoading(true);
      const materials = await fetchMaterials();
      if (materials) setMaterials(materials);
      setIsLoading(false);
    };

    initializePage();
  }, []); // Run once on mount

  const fetchMaterials = async () => {
    const { data, error } = await supabase
      .from("dat_instruction_materials")
      .select("*")
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching materials:", error);
      toast.error("Failed to load instructions");
    }

    return (
      data || {
        id: undefined,
        idea: { videoUrl: "", documentUrl: "" },
        presentation: { videoUrl: "", documentUrl: "" },
        prototype: { videoUrl: "", documentUrl: "" },
      }
    );
  };

  const getYoutubeEmbedUrl = (url: string): string | undefined => {
    if (!url) return undefined;
    try {
      const videoId = url.match(
        /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/
      )?.[1];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : undefined;
    } catch {
      return undefined;
    }
  };

  const handleEdit = (section: "idea" | "presentation" | "prototype") => {
    setEditState({ section, isEditing: true });
    setEditContent(materials[section]);
  };

  const handleInputChange = (
    field: "videoUrl" | "documentUrl",
    value: string
  ) => {
    setEditContent((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!editState.section) return;

    try {
      const updatePayload: Partial<InstructionMaterials> = {
        id: materials.id,
        [editState.section]: editContent,
      };

      const { error } = await supabase
        .from("dat_instruction_materials")
        .upsert(updatePayload);

      if (error) throw error;

      setMaterials((prev) => ({
        ...prev,
        [editState.section!]: editContent,
      }));

      setEditState({ section: null, isEditing: false });
      setEditContent({ videoUrl: "", documentUrl: "" });
      toast.success("Instructions updated successfully");
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update instructions");
    }
  };

  const handleCancel = () => {
    setEditState({ section: null, isEditing: false });
    setEditContent({ videoUrl: "", documentUrl: "" });
  };

  const toggleDocument = (section: string) => {
    setVisibleDocs((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const InstructionCard = ({
    title,
    content,
    section,
  }: {
    title: string;
    content: InstructionContent;
    section: "idea" | "presentation" | "prototype";
  }) => {
    const documentRef = React.useRef<HTMLDivElement>(null);

    const handleToggleDocument = (section: string) => {
      // First show the document
      setVisibleDocs((prev) => ({
        ...prev,
        [section]: true,
      }));

      // Then scroll to it
      requestAnimationFrame(() => {
        documentRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      });
    };

    return (
      <Card className="border-rose-200 mb-6" data-section={section}>
        <CardHeader className="flex flex-row items-center justify-between">
          <h3 className="text-xl font-semibold text-black">{title}</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(section)}
            className="border-rose-200 hover:bg-rose-50"
          >
            {!content.videoUrl && !content.documentUrl ? (
              <>
                <PlusCircle className="h-4 w-4 mr-1" />
                Add Content
              </>
            ) : (
              <>
                <Pencil className="h-4 w-4 mr-1" />
                Edit Content
              </>
            )}
          </Button>
        </CardHeader>
        <CardContent>
          {editState.isEditing && editState.section === section ? (
            <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  YouTube Video URL
                </label>
                <Input
                  type="text"
                  value={editContent.videoUrl}
                  onChange={(e) =>
                    handleInputChange("videoUrl", e.target.value)
                  }
                  placeholder="https://youtube.com/watch?v=..."
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Document URL
                </label>
                <Input
                  type="text"
                  value={editContent.documentUrl}
                  onChange={(e) =>
                    handleInputChange("documentUrl", e.target.value)
                  }
                  placeholder="https://example.com/document.pdf"
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSubmit}
                  type="button"
                  className="bg-rose-600 text-white hover:bg-rose-700"
                >
                  <Save className="h-4 w-4 mr-1" />
                  Save Changes
                </Button>
                <Button
                  type="button"
                  onClick={handleCancel}
                  variant="outline"
                  className="border-rose-200"
                >
                  <XIcon className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              {!content.videoUrl && !content.documentUrl ? (
                <p className="text-gray-500 text-center py-4">
                  No content added yet
                </p>
              ) : (
                <div className="space-y-6 max-w-4xl mx-auto">
                  {/* Video Container */}
                  {content.videoUrl && getYoutubeEmbedUrl(content.videoUrl) && (
                    <div className="w-full">
                      <h4 className="text-sm font-medium text-gray-600 mb-2">
                        Video Instructions
                      </h4>
                      <div className="aspect-[16/9] w-full h-[500px]">
                        <iframe
                          className="w-full h-full rounded-lg shadow-sm"
                          src={getYoutubeEmbedUrl(content.videoUrl)}
                          title={`${title} video`}
                          allow="encrypted-media"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  )}

                  {/* Document Container */}
                  {content.documentUrl && (
                    <div className="w-full">
                      <div className="flex items-center justify-between mb-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            visibleDocs[section]
                              ? toggleDocument(section)
                              : handleToggleDocument(section)
                          }
                          className="text-rose-600 border-rose-200"
                        >
                          {visibleDocs[section] ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-1" />
                              Hide Document
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-1" />
                              Show Document
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            window.open(content.documentUrl, "_blank")
                          }
                          className="text-rose-600 border-rose-200"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          View Document
                        </Button>
                      </div>
                      {visibleDocs[section] && (
                        <div ref={documentRef} className="w-full h-[85vh]">
                          <iframe
                            className="w-full h-full rounded-lg shadow-sm border border-rose-100"
                            src={getDocumentViewerUrl(content.documentUrl)}
                            title={`${title} document`}
                            allowFullScreen
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F7F1EF" }}>
      <div className="container mx-auto p-6">
        <div className="flex items-center mb-8 gap-2">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ChevronLeft className="h-4 w-4 mr-2" />
          </Button>
          <h1 className="text-3xl font-bold text-rose-600">
            Platform Instructions
          </h1>
        </div>

        <div className="space-y-6">
          <InstructionCard
            title="Idea Instructions"
            content={materials.idea}
            section="idea"
          />
          <InstructionCard
            title="Presentation Instructions"
            content={materials.presentation}
            section="presentation"
          />
          <InstructionCard
            title="Prototype Instructions"
            content={materials.prototype}
            section="prototype"
          />
        </div>
      </div>
    </div>
  );
}
