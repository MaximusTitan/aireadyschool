import React, { useState } from "react";
import { GeneratedText } from "./GeneratedText";
import { GeneratedImage } from "./GeneratedImage";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader2, Edit, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface GeneratedContentProps {
  text: string;
  imageUrl?: string;
  title: string;
  contentType: string;
  isImageLoading?: boolean;
}

export function GeneratedContent({
  text,
  imageUrl,
  title,
  contentType,
  isImageLoading = false,
}: GeneratedContentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(text);
  const [isSaving, setIsSaving] = useState(false);

  // Function to update content in Supabase
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("lesson_cont_gen") // Table name in Supabase
        .update({ content: editedText }) // Update content
        .eq("title", title); // Match by title

      if (error) throw error;

      setIsEditing(false);
    } catch (error) {
      console.error("Error updating content:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="generated-content border-2 shadow-lg overflow-hidden relative">
      <Button
        variant="outline"
        size="sm"
        className="absolute top-4 right-4"
        onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
        disabled={isSaving}
      >
        {isEditing ? <Save className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
        {isSaving ? "Saving..." : isEditing ? "Save" : "Edit"}
      </Button>
      
      <CardHeader className="bg-muted/50 border-b">
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-neutral-900 to-neutral-600 bg-clip-text text-transparent">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-8">
        {isImageLoading ? (
          <div className="flex items-center justify-center h-64 bg-muted/20 rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
          </div>
        ) : (
          imageUrl && (
            <div className="rounded-lg overflow-hidden border-2">
              <GeneratedImage imageUrl={imageUrl} />
            </div>
          )
        )}

        {isEditing ? (
          <textarea
            className="w-full p-4 border rounded-lg"
            rows={6}
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
          />
        ) : (
          <GeneratedText text={editedText} />
        )}
      </CardContent>
    </Card>
  );
}
