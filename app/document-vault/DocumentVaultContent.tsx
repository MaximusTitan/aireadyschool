"use client";

import { useEffect, useState } from "react";
import { Plus, Upload, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { usePathname } from "next/navigation";

export default function DocumentVaultContent() {
  const [fileData, setFileData] = useState<{ length: number; url: string } | null>(null);
  const [items, setItems] = useState<{ file_name: string; file_path: string; type: "file" | "folder" }[]>([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const pathname = usePathname(); // Get current URL

  // Extract folder name from pathname
  const folderName = pathname.split("/").pop() || "";

  // Fetch files and folders when component mounts
  useEffect(() => {
    async function fetchItems() {
      try {
        const response = await fetch(`/api/document-vault?folder_name=document-vault`);
        if (!response.ok) throw new Error("Failed to fetch files");

        const data = await response.json();
        setItems(data.files); // Store fetched files and folders
      } catch (error) {
        console.error("Error fetching files:", error);
      }
    }

    fetchItems();
  }, [folderName]);

  const handleFileUpload = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "*/*";
    input.onchange = async (event: Event) => {
      const target = event.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        const file = target.files[0];
        const formData = new FormData();
        formData.append("file", file);

        try {
          const response = await fetch("/api/document-vault", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) throw new Error("Failed to upload file");

          const data = await response.json();
          setFileData(data); // Store file data
          setItems((prevItems) => [...prevItems, { file_name: file.name, file_path: data.url, type: "file" }]); // Add file to list
        } catch (error) {
          console.error("Error uploading file:", error);
        }
      }
    };
    input.click();
  };

  const handleNewFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const response = await fetch("/api/document-vault", {
        method: "PUT",
        body: JSON.stringify({ folderName: newFolderName }),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error("Failed to create folder");

      setIsFolderDialogOpen(false);
      setItems((prevItems) => [...prevItems, { file_name: newFolderName, file_path: `/${newFolderName}`, type: "folder" }]); // Add folder to list
      setNewFolderName("");
    } catch (error) {
      console.error("Error creating folder:", error);
    }
  };

  // In your DocumentVaultContent component:
const handleDelete = async (fileName: string, type: "file" | "folder", filePath: string) => {
  if (confirm(`Are you sure you want to delete ${fileName}?`)) {
    try {
      // Send the DELETE request to the backend
      const response = await fetch("/api/document-vault", {
        method: "DELETE",
        body: JSON.stringify({ fileName, type, filePath }),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error("Failed to delete item");

      // Remove the item from the state after successful deletion
      setItems((prevItems) => prevItems.filter((item) => item.file_name !== fileName));

      console.log(`${fileName} deleted successfully`);
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  }
};

  return (
    <div className="relative min-h-[calc(100vh-2rem)] p-4">
      <h2 className="text-lg font-bold mb-4">{folderName}</h2>

      {/* Display uploaded files and folders */}
      <ul className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-md">
        {items.length > 0 ? (
          items.map((item, index) => (
            <li key={index} className="py-2 border-b border-gray-300 dark:border-gray-700 flex items-center">
              {item.type === "folder" ? (
                <>
                  <Folder className="h-4 w-4 mr-2 text-blue-500" />
                  <a href={`/document-vault/${item.file_name}`} className="text-blue-500 font-semibold">
                    {item.file_name}
                  </a>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2 text-green-500" />
                  <a href={item.file_path} target="_blank" rel="noopener noreferrer" className="text-blue-500">
                    {item.file_name}
                  </a>
                </>
              )}
              <Button
                size="sm"
                className="ml-4"
                onClick={() => handleDelete(item.file_name, item.type, item.file_path)}
              >
                Delete
              </Button>
            </li>
          ))
        ) : (
          <p>No files or folders found.</p>
        )}
      </ul>

      {/* Display last uploaded file info */}
      {fileData && (
        <div className="p-4 mt-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md text-center">
          <p>File name length: {fileData.length}</p>
          <a href={fileData.url} target="_blank" rel="noopener noreferrer" className="text-blue-500">
            View File
          </a>
        </div>
      )}

      {/* Floating Action Button with Dropdown */}
      <div className="fixed bottom-6 right-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="lg" className="rounded-full shadow-lg bg-white text-black hover:bg-gray-100 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700">
              <Plus className="h-5 w-5 mr-2" />
              New
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => setIsFolderDialogOpen(true)} className="cursor-pointer">
              <Folder className="h-4 w-4 mr-2" />
              <span>New Folder</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleFileUpload} className="cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              <span>File Upload</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* New Folder Dialog */}
      <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <Input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Folder Name" />
          <DialogFooter>
            <Button onClick={handleNewFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
