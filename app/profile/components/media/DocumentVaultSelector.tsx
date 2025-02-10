"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Card, CardContent } from "@/components/ui/card";
import { Folder, File, Grid, List, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface VaultItem {
  id: string;
  file_name: string;
  file_path: string;
  parent_folder: string;
  type: "folder" | "file";
  public_url: string | null;
}

interface DocumentVaultSelectorProps {
  onSelect: (document: VaultItem) => void;
}

export function DocumentVaultSelector({
  onSelect,
}: DocumentVaultSelectorProps) {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewType, setViewType] = useState<"list" | "grid">("list");

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setIsLoading(true);
    const supabase = createClient();
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("User not authenticated");

      console.log("Fetching all items for user:", user.user.email);

      const { data, error } = await supabase
        .from("document-vault")
        .select("*")
        .eq("user_email", user.user.email)
        .order("type", { ascending: false }) // Folders first, then files
        .order("file_name", { ascending: true });

      if (error) throw error;
      console.log("Fetched items:", data);
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching items:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unknown error occurred";
      setError(`Failed to fetch items: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const GridViewItem = ({ item }: { item: VaultItem }) => (
    <Card
      className="w-40 h-40 relative group cursor-pointer"
      onClick={() => onSelect(item)}
    >
      <CardContent className="p-4 flex flex-col items-center justify-center h-full">
        {item.type === "folder" ? (
          <Folder className="h-12 w-12 mb-2 stroke-current" />
        ) : (
          <File className="h-12 w-12 mb-2 stroke-current" />
        )}
        <p className="text-center text-sm font-medium truncate w-full">
          {item.file_name}
        </p>
      </CardContent>
    </Card>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Select from Document Vault</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[725px]">
        <DialogHeader>
          <DialogTitle>Select a document from your vault</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">All Documents</h2>
            <ToggleGroup
              type="single"
              value={viewType}
              onValueChange={(value) => setViewType(value as "list" | "grid")}
            >
              <ToggleGroupItem value="list" aria-label="List view">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="grid" aria-label="Grid view">
                <Grid className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <>
              {items.length === 0 ? (
                <p className="text-gray-500">
                  No items found in your document vault.
                </p>
              ) : viewType === "list" ? (
                <ul className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-md max-h-[60vh] overflow-y-auto">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="py-2 border-b border-gray-300 dark:border-gray-700 flex items-center justify-between cursor-pointer"
                      onClick={() => onSelect(item)}
                    >
                      <div className="flex items-center">
                        {item.type === "folder" ? (
                          <Folder className="h-4 w-4 mr-2 stroke-current" />
                        ) : (
                          <File className="h-4 w-4 mr-2 stroke-current" />
                        )}
                        <span className="text-blue-500">{item.file_name}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto">
                  {items.map((item) => (
                    <GridViewItem key={item.id} item={item} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
