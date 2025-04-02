"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { formatDistanceToNow } from "date-fns";
import {
  listUserDocuments,
  getUserId,
  updateCanvasTitle,
  deleteDocument,
} from "./lib/canvas-persistence";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Plus,
  Clock,
  Share2,
  Trash2,
  Edit2,
  Check,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

type CanvasRecord = {
  document_id: string;
  created_at: string;
  updated_at: string;
  is_shared: boolean;
  title: string;
};

export default function CanvasHistoryPage() {
  const [documents, setDocuments] = useState<CanvasRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState<string>("");
  const [sharing, setSharing] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchDocuments() {
      try {
        const email = await getUserId(false); // Explicitly set to false for non-view mode
        const docs = await listUserDocuments(email);
        // Use the stored title or generate a default one
        const docsWithTitles = docs.map((doc, index) => ({
          ...doc,
          title: doc.title || `Canvas ${index + 1}`,
        }));
        setDocuments(docsWithTitles);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch documents:", err);
        setError("Please sign in to view your canvases");
      } finally {
        setLoading(false);
      }
    }

    fetchDocuments();
  }, []);

  const handleCreateNewCanvas = () => {
    router.push("/canvas-ai/canvas");
  };

  const handleOpenCanvas = (documentId: string) => {
    router.push(`/canvas-ai/canvas?id=${documentId}`);
  };

  const handleDeleteCanvas = async (documentId: string) => {
    setDeleting(documentId);
    try {
      const userId = await getUserId();
      const success = await deleteDocument(documentId, userId);

      if (success) {
        setDocuments(documents.filter((doc) => doc.document_id !== documentId));
      } else {
        console.error("Failed to delete canvas");
      }
    } catch (err) {
      console.error("Failed to delete canvas:", err);
    } finally {
      setDeleting(null);
    }
  };

  const startEditing = (documentId: string, currentTitle: string) => {
    setEditing(documentId);
    setEditTitle(currentTitle);
  };

  const saveTitle = async (documentId: string) => {
    try {
      const userId = await getUserId();
      const newTitle = editTitle.trim() || "Untitled Canvas";

      const success = await updateCanvasTitle(documentId, userId, newTitle);

      if (success) {
        setDocuments(
          documents.map((doc) =>
            doc.document_id === documentId ? { ...doc, title: newTitle } : doc
          )
        );
      }
      setEditing(null);
    } catch (err) {
      console.error("Failed to update canvas title:", err);
    }
  };

  const handleShareCanvas = (documentId: string) => {
    setSharing(documentId);

    const shareUrl = `${window.location.origin}/canvas-ai/canvas?id=${documentId}&mode=view`;

    // Copy to clipboard
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        toast({
          title: "Link copied to clipboard!",
          description: "Anyone with this link can view your canvas.",
        });
      })
      .catch((err) => {
        console.error("Failed to copy link:", err);
        toast({
          title: "Failed to copy link",
          description: `Share this link: ${shareUrl}`,
          variant: "destructive",
        });
      })
      .finally(() => {
        setSharing(null);
      });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-lg mb-4">{error}</p>
        <Button asChild>
          <a href="/sign-in">Sign In</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Canvas Studio</h1>
          <p className="text-muted-foreground mt-1">
            Create, edit, and manage your canvases
          </p>
        </div>
        <Button onClick={handleCreateNewCanvas} size="lg">
          <Plus className="mr-2 h-5 w-5" /> Create New Canvas
        </Button>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-16 bg-muted/30 rounded-lg">
          <h2 className="text-xl font-medium mb-4">No canvases found</h2>
          <p className="text-muted-foreground mb-6">
            Create your first canvas to get started
          </p>
          <Button onClick={handleCreateNewCanvas}>
            <Plus className="mr-2 h-4 w-4" /> Create New Canvas
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((canvas) => (
            <Card key={canvas.document_id} className="overflow-hidden">
              <CardHeader className="pb-3">
                {editing === canvas.document_id ? (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="Enter canvas title"
                      className="h-9"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveTitle(canvas.document_id);
                        else if (e.key === "Escape") setEditing(null);
                      }}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => saveTitle(canvas.document_id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{canvas.title}</CardTitle>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() =>
                              startEditing(canvas.document_id, canvas.title)
                            }
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit title</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
                <CardDescription>
                  Last edited{" "}
                  {formatDistanceToNow(new Date(canvas.updated_at), {
                    addSuffix: true,
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div
                  className="h-32 bg-slate-50 rounded-md border flex items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleOpenCanvas(canvas.document_id)}
                >
                  <span className="text-muted-foreground">Click to open</span>
                </div>
              </CardContent>
              <CardFooter className="pt-2 flex justify-between">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>
                    Created {format(new Date(canvas.created_at), "PP")}
                  </span>
                </div>
                <div className="flex gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShareCanvas(canvas.document_id);
                          }}
                          disabled={sharing === canvas.document_id}
                        >
                          {sharing === canvas.document_id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Share2 className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Share canvas</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete canvas?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete &quot;{canvas.title}
                          &quot; and cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => handleDeleteCanvas(canvas.document_id)}
                          disabled={deleting === canvas.document_id}
                        >
                          {deleting === canvas.document_id ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Deleting...
                            </>
                          ) : (
                            "Delete"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
