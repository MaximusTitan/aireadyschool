"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Trash2, Plus, FileText, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { getAllDocuments } from "@/lib/db";

interface Document {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  email: string;
}

export default function DocumentList() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);

        // Get current user's email
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user?.email) {
          console.log("No authenticated user");
          setDocuments([]);
          return;
        }

        // Fetch documents for the current user
        const { data, error } = await supabase
          .from("document_generator")
          .select("*")
          .eq("is_deleted", false)
          .eq("email", session.user.email)
          .order("updated_at", { ascending: false });

        if (error) throw error;

        console.log("Fetched documents:", data); // Debug log
        setDocuments(data || []);
      } catch (error) {
        console.error("Error fetching documents:", error);
        toast.error("Failed to load documents");
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();

    // Set up real-time subscription
    const channel = supabase
      .channel("document_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "document_generator",
        },
        () => {
          fetchDocuments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, router]);

  const createNewDocument = () => {
    router.push("/tools/document-generator");
  };

  const editDocument = (id: string) => {
    router.push(`/tools/document-generator?id=${id}&mode=edit`);
  };

  const deleteDocument = async (id: string) => {
    try {
      const { error } = await supabase
        .from("document_generator")
        .update({ is_deleted: true })
        .eq("id", id);

      if (error) throw error;

      setDocuments(documents.filter((doc) => doc.id !== id));
      toast.success("Document deleted successfully");
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">My Documents</h1>
          <Button
            variant="outline"
            onClick={() => router.push("/tools/document-generator")}
            className="ml-4"
          >
            Back to Editor
          </Button>
        </div>
        <Button onClick={createNewDocument} className="flex items-center gap-2">
          <Plus size={16} />
          New Document
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">No documents yet</h3>
          <p className="text-gray-500 mb-4">
            Create your first document to get started
          </p>
          <Button onClick={createNewDocument}>Create Document</Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document Title</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Modified</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell
                  className="font-medium cursor-pointer hover:text-primary"
                  onClick={() =>
                    router.push(
                      `/tools/document-generator?id=${doc.id}&mode=view`
                    )
                  }
                >
                  {doc.title || "Untitled Document"}
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(doc.created_at), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(doc.updated_at), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      router.push(
                        `/tools/document-generator?id=${doc.id}&mode=view`
                      )
                    }
                    className="mr-2"
                  >
                    <FileText size={16} className="mr-2" />
                    Open
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => editDocument(doc.id)}
                    className="mr-2"
                  >
                    <Edit size={16} className="mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteDocument(doc.id)}
                    className="text-destructive"
                  >
                    <Trash2 size={16} className="mr-2" />
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
