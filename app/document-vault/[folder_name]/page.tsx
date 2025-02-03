"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Upload, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function FolderView() {
  const { folder_name } = useParams(); // Get folder name from URL
  const decodedFolderName = decodeURIComponent(folder_name as string);
  const [items, setItems] = useState<{ file_name: string; file_path: string; type: "file" | "folder" }[]>([]);
  const router = useRouter();

  // Fetch files and subfolders inside this folder
  const fetchItems = async () => {
    try {
      const folderParam = decodedFolderName ? `?folder_name=${encodeURIComponent(decodedFolderName)}` : "";
      const response = await fetch(`/api/document-vault${folderParam}`);
      if (!response.ok) throw new Error("Failed to fetch files");

      const data = await response.json();
      setItems(data.files);
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [decodedFolderName]);

  // Handle File Upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;
    const file = event.target.files[0];

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`/api/document-vault?folder_name=${encodeURIComponent(decodedFolderName)}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to upload file");

      const data = await response.json();
      console.log("File uploaded successfully!", data);
      fetchItems(); // Refresh file list
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  // Handle New Folder Creation
  const handleNewFolder = async () => {
    const folderName = prompt("Enter new folder name:");
    if (!folderName) return;
  
    const parentFolder = decodedFolderName !== "document-vault" ? decodedFolderName : ""; // Extract parent folder
  
    const response = await fetch(`/api/document-vault`, {
      method: "PUT",
      body: JSON.stringify({ folderName, parentFolder }), // Send separate values
      headers: { "Content-Type": "application/json" },
    });
  
    if (response.ok) {
      console.log("Folder created successfully!");
      fetchItems(); // Refresh file list
    } else {
      console.error("Folder creation failed");
    }
  };  

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Contents of "{decodedFolderName}"</h2>

      {/* Display files and folders */}
      <ul className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-md">
        {items.length > 0 ? (
          items.map((item, index) => (
            <li key={index} className="py-2 border-b border-gray-300 dark:border-gray-700 flex items-center">
              {item.type === "folder" ? (
                <>
                  <Folder className="h-4 w-4 mr-2 text-blue-500" />
                  <button onClick={() => router.push(`/document-vault/${encodeURIComponent(item.file_name)}`)} className="text-blue-500 font-semibold">
                    {item.file_name}
                  </button>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2 text-green-500" />
                  <a href={item.file_path} target="_blank" rel="noopener noreferrer" className="text-blue-500">
                    {item.file_name}
                  </a>
                </>
              )}
            </li>
          ))
        ) : (
          <p>No files or folders found.</p>
        )}
      </ul>

      {/* Floating "+ New" Button */}
      <div className="fixed bottom-6 right-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="lg" className="rounded-full shadow-lg bg-white text-black hover:bg-gray-100 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700">
              <Plus className="h-5 w-5 mr-2" />
              New
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {/* File Upload */}
            <DropdownMenuItem
                onSelect={() => {
                    const fileInput = document.getElementById("fileUpload") as HTMLInputElement;
                    if (fileInput) {
                    fileInput.click();
                    } else {
                    console.error("File input element not found");
                    }
                }}
                className="cursor-pointer">
              <Upload className="h-4 w-4 mr-2 text-green-500" />
              File Upload
            </DropdownMenuItem>

            {/* Hidden file input */}
            <input
              type="file"
              id="fileUpload"
              className="hidden"
              onChange={handleFileUpload}
            />

            {/* New Folder */}
            <DropdownMenuItem onClick={handleNewFolder} className="cursor-pointer">
              <Folder className="h-4 w-4 mr-2 text-blue-500" />
              New Folder
            </DropdownMenuItem>

            {/* Go Back (only if inside a folder) */}
            {decodedFolderName !== "document-vault" && (
              <DropdownMenuItem onClick={() => router.back()} className="cursor-pointer">
                Go Back
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
