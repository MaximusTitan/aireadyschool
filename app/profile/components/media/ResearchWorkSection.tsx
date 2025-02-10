"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Edit2, Check, X, Loader2, FileIcon } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { DocumentVaultSelector } from "./DocumentVaultSelector";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export interface ResearchWork {
  id: string;
  file_url: string;
  title: string;
  updated_at: string;
  student_email: string;
}

interface VaultItem {
  id: string;
  file_name: string;
  file_path: string;
  parent_folder: string;
  type: "folder" | "file";
  public_url: string | null;
}

export default function ResearchWorkSection() {
  const [researchWorks, setResearchWorks] = useState<ResearchWork[]>([]);
  const [editingResearchWork, setEditingResearchWork] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const researchWorkInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchResearchWorks();
  }, []);

  const fetchResearchWorks = async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.email) {
      const { data, error } = await supabase
        .from("research_works")
        .select("*")
        .eq("student_email", user.email)
        .order("updated_at", { ascending: false });

      if (!error && data) {
        setResearchWorks(data);
      }
    }
  };

  const handleResearchWorkUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      setError("No file selected");
      return;
    }

    await uploadFile(file);
  };

  const handleVaultDocumentSelect = (document: VaultItem) => {
    uploadVaultDocument(document).catch((error) => {
      console.error("Error processing vault document:", error);
      setError("Failed to process document from vault");
    });
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) {
      setError("User not authenticated");
      setIsUploading(false);
      return;
    }

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${user.email}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("research-works")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("research-works").getPublicUrl(filePath);

      const { error: dbError, data: researchWork } = await supabase
        .from("research_works")
        .insert({
          student_email: user.email,
          title: file.name,
          file_url: publicUrl,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setResearchWorks((prev) => [researchWork, ...prev]);
    } catch (error) {
      console.error("Error handling file:", error);
      setError("Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const uploadVaultDocument = async (document: VaultItem) => {
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) {
      setError("User not authenticated");
      return;
    }

    try {
      const { error: dbError, data: researchWork } = await supabase
        .from("research_works")
        .insert({
          student_email: user.email,
          title: document.file_name,
          file_url: document.file_path,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      setResearchWorks((prev) => [researchWork, ...prev]);
    } catch (error) {
      console.error("Error handling vault document:", error);
      setError("Failed to add document from vault");
    }
  };

  const handleResearchWorkTitleEdit = (id: string, title: string) => {
    setEditingResearchWork({ id, title });
  };

  const handleResearchWorkTitleSave = async () => {
    if (!editingResearchWork) return;

    const supabase = createClient();
    try {
      const { error } = await supabase
        .from("research_works")
        .update({
          title: editingResearchWork.title,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingResearchWork.id);

      if (error) throw error;

      setResearchWorks((prev) =>
        prev.map((work) =>
          work.id === editingResearchWork.id
            ? {
                ...work,
                title: editingResearchWork.title,
                updated_at: new Date().toISOString(),
              }
            : work
        )
      );
      setEditingResearchWork(null);
    } catch (error) {
      console.error("Error updating title:", error);
      setError("Failed to update title");
    }
  };

  const handleResearchWorkDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this research work?")) return;

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      setError("Please log in to delete research work");
      return;
    }
    try {
      const work = researchWorks.find((w) => w.id === id);
      if (!work) return;

      // Delete from storage
      const filePath = new URL(work.file_url).pathname.split("/").pop();
      if (filePath) {
        await supabase.storage
          .from("research-works")
          .remove([`${user.email}/${filePath}`]);
      }

      // Delete from database
      const { error } = await supabase
        .from("research_works")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setResearchWorks((prev) => prev.filter((work) => work.id !== id));
    } catch (error) {
      console.error("Error deleting research work:", error);
      setError("Failed to delete research work");
    }
  };

  return (
    <div className="mt-12">
      <h2 className="text-xl font-bold mb-4">Research Work</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {researchWorks.map((work) => (
          <div key={work.id} className="bg-gray-100 rounded-lg overflow-hidden">
            <div className="aspect-video flex items-center justify-center bg-gray-200">
              <FileIcon className="h-16 w-16 text-gray-400" />
            </div>
            <div className="p-4">
              {editingResearchWork?.id === work.id ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editingResearchWork.title}
                    onChange={(e) =>
                      setEditingResearchWork({
                        ...editingResearchWork,
                        title: e.target.value,
                      })
                    }
                    className="flex-grow"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleResearchWorkTitleSave}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setEditingResearchWork(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{work.title}</h3>
                  <div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        handleResearchWorkTitleEdit(work.id, work.title)
                      }
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleResearchWorkDelete(work.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Last updated on {new Date(work.updated_at).toLocaleDateString()}
              </p>
              <div className="mt-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <FileIcon className="w-4 h-4 mr-2" />
                      View Document
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl h-[80vh]">
                    <DialogHeader>
                      <DialogTitle>{work.title}</DialogTitle>
                      <DialogDescription>
                        Last updated on{" "}
                        {new Date(work.updated_at).toLocaleDateString()}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 h-full">
                      {work.file_url.endsWith(".pdf") ? (
                        <object
                          data={work.file_url}
                          type="application/pdf"
                          width="100%"
                          height="100%"
                        >
                          <p>
                            Unable to display PDF file.{" "}
                            <a href={work.file_url} download={work.title}>
                              Download
                            </a>{" "}
                            instead.
                          </p>
                        </object>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p>
                            Preview not available for this file type.{" "}
                            <a href={work.file_url} download={work.title}>
                              Download
                            </a>{" "}
                            to view.
                          </p>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        ))}
        <div className="aspect-video bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors flex flex-col items-center justify-center cursor-pointer p-4">
          <div className="flex flex-col items-center mb-4">
            <FileText className="w-12 h-12 text-gray-400 mb-2" />
            <span className="text-sm text-gray-500">Upload Research Work</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => researchWorkInputRef.current?.click()}
              disabled={isUploading}
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
            <DocumentVaultSelector onSelect={handleVaultDocumentSelect} />
          </div>
        </div>
      </div>
      <input
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        ref={researchWorkInputRef}
        onChange={handleResearchWorkUpload}
        disabled={isUploading}
      />
    </div>
  );
}
