"use client";
import React from "react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { supabase } from "@/app/dat/utils/supabaseClient";
import { Button } from "@/components/ui/button";
import { FileText, ChevronDown, ChevronUp, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface InstructionContent {
  videoUrl: string;
  documentUrl: string;
}

interface InstructionMaterials {
  id?: string;
  idea: InstructionContent;
  presentation: InstructionContent;
  prototype: InstructionContent;
}

interface Idea {
  id: string;
  status: string;
}

interface PresentationStatus {
  status:
    | "not_submitted"
    | "review_pending"
    | "update_needed"
    | "qualified_for_round1"
    | "rejected"
    | "round1_winner"
    | "round1_runner_up";
}

interface PrototypeStatus {
  status:
    | "not_submitted"
    | "review_pending"
    | "update_needed"
    | "qualified_for_round2"
    | "rejected"
    | "round2_winner"
    | "round2_runner_up"
    | "finals_winner"
    | "finals_runner_up";
}

export default function ViewInstructionsPage() {
  const [materials, setMaterials] = useState<InstructionMaterials>({
    idea: { videoUrl: "", documentUrl: "" },
    presentation: { videoUrl: "", documentUrl: "" },
    prototype: { videoUrl: "", documentUrl: "" },
  });
  const [visibleDocs, setVisibleDocs] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [idea, setIdea] = useState<Idea | null>(null);
  const [presentationStatus, setPresentationStatus] =
    useState<PresentationStatus | null>(null);
  const [prototypeStatus, setPrototypeStatus] =
    useState<PrototypeStatus | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchMaterials();
    fetchStudentData();
  }, []);

  const fetchMaterials = async () => {
    const { data } = await supabase
      .from("dat_instruction_materials")
      .select("*")
      .single();

    if (data) {
      setMaterials(data);
    }
    setIsLoading(false);
  };

  const fetchStudentData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.email) {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("dat_student_details")
        .select("*")
        .eq("email", user.email)
        .single();

      if (profileData) {
        // Fetch idea status
        const { data: ideaData } = await supabase
          .from("dat_ideas")
          .select("id, status")
          .eq("student_id", profileData.id)
          .single();
        setIdea(ideaData);

        // Fetch presentation status
        const { data: presentationData } = await supabase
          .from("dat_presentation_links")
          .select("status")
          .eq("student_id", profileData.id)
          .single();
        setPresentationStatus(presentationData);

        // Fetch prototype status
        const { data: prototypeData } = await supabase
          .from("dat_prototype_links")
          .select("status")
          .eq("student_id", profileData.id)
          .single();
        setPrototypeStatus(prototypeData);
      }
    }
  };

  // Keep existing helper functions
  const getDocumentViewerUrl = (url: string): string => {
    const driveMatch = url.match(/\/d\/(.*?)\/|id=(.*?)&|^[^/]*$/);
    const fileId = driveMatch ? driveMatch[1] || driveMatch[2] : null;
    return fileId ? `https://drive.google.com/file/d/${fileId}/preview` : url;
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

  const InstructionCard = ({
    title,
    content,
    section,
  }: {
    title: string;
    content: InstructionContent;
    section: string;
  }) => {
    const documentRef = React.useRef<HTMLDivElement>(null);

    const toggleDocument = () => {
      setVisibleDocs((prev) => ({ ...prev, [section]: !prev[section] }));
      if (!visibleDocs[section]) {
        setTimeout(() => {
          documentRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }, 100);
      }
    };

    return (
      <Card className="border-rose-200 mb-6">
        <CardHeader>
          <h3 className="text-xl font-semibold text-black">{title}</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-6 max-w-4xl mx-auto">
            {/* Video Section */}
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

            {/* Document Section */}
            {content.documentUrl && (
              <div className="w-full">
                <div className="flex items-center justify-between mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleDocument}
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
                    onClick={() => window.open(content.documentUrl, "_blank")}
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
          {/* Show Prototype Instructions first - only for Round 1 winners/runners-up and further stages */}
          {(presentationStatus?.status === "round1_winner" ||
            presentationStatus?.status === "round1_runner_up" ||
            prototypeStatus?.status === "round2_winner" ||
            prototypeStatus?.status === "round2_runner_up" ||
            prototypeStatus?.status === "finals_winner" ||
            prototypeStatus?.status === "finals_runner_up") && (
            <InstructionCard
              title="Prototype Instructions"
              content={materials.prototype}
              section="prototype"
            />
          )}

          {/* Show Presentation Instructions second - only if idea is approved */}
          {idea?.status === "approved" && (
            <InstructionCard
              title="Presentation Instructions"
              content={materials.presentation}
              section="presentation"
            />
          )}

          {/* Show Idea Instructions last - always visible */}
          <InstructionCard
            title="Idea Instructions"
            content={materials.idea}
            section="idea"
          />
        </div>
      </div>
    </div>
  );
}
