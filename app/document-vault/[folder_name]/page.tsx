"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus, Upload, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type VaultItem = {
  file_name: string;
  file_path: string;
  type: "file" | "folder";
};

export default function FolderView() {
  const router = useRouter();
  const params = useParams();

  const folderParam = params?.folder_name;
  const folderSegments = Array.isArray(folderParam)
    ? folderParam
    : folderParam
      ? [folderParam]
      : [];
  const decodedFolderName =
    folderSegments.length > 0
      ? decodeURIComponent(folderSegments.join("/"))
      : "document-vault";

  const [items, setItems] = useState<VaultItem[]>([]);

  // Fetch files and subfolders inside this folder
  const fetchItems = useCallback(async () => {
    try {
      const folderParam = decodedFolderName
        ? `?folder_name=${encodeURIComponent(decodedFolderName)}`
        : "";
      const response = await fetch(`/api/document-vault${folderParam}`);
      if (!response.ok) throw new Error("Failed to fetch files");

      const data = await response.json();
      setItems(data.files);
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  }, [decodedFolderName]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Handle File Upload
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!event.target.files?.length) return;
    const file = event.target.files[0];

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        `/api/document-vault?folder_name=${encodeURIComponent(decodedFolderName)}`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) throw new Error("Failed to upload file");

      const data = await response.json();
      console.log("File uploaded successfully!", data);
      await fetchItems(); // Refresh file list
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  // Handle New Folder Creation
  const handleNewFolder = async () => {
    const folderName = prompt("Enter new folder name:");
    if (!folderName) return;
    if (folderName.includes("/")) {
      alert("Folder names cannot contain slashes");
      return;
    }

    const parentFolder =
      decodedFolderName !== "document-vault" ? decodedFolderName : ""; // Extract parent folder
    try {
      const response = await fetch(`/api/document-vault`, {
        method: "PUT",
        body: JSON.stringify({ folderName, parentFolder }), // Send separate values
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error("Failed to create folder");
      await fetchItems(); // Refresh file list
    } catch (error) {
      console.error("Error creating folder:", error);
    }
  };

  const handleNavigate = (path: string) => {
    const formattedPath = path.replace(/\s+/g, "-");
    router.push(`/document-vault/${encodeURIComponent(formattedPath)}`);
  };

  const handleGoBack = () => {
    const pathSegments = decodedFolderName.split("/");
    pathSegments.pop();
    const parentPath = pathSegments.join("/").replace(/\s+/g, "-");;
    router.push(
      parentPath
        ? `/document-vault/${encodeURIComponent(parentPath)}/`
        : "document-vault",
    );
  };

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
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">
        {decodedFolderName}
      </h2>

      {/* Display files and folders */}
      <ul className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-md">
        {items.length > 0 ? (
          items.map((item, index) => (
            <li
              key={index}
              className="py-2 border-b border-gray-300 dark:border-gray-700 flex items-center"
            >
              {item.type === "folder" ? (
                <>
                  <Folder className="h-4 w-4 mr-2 text-blue-500" />
                  <button
                    onClick={() => handleNavigate(item.file_path)}
                    className="text-blue-500 font-semibold hover:underline"
                  >
                    {item.file_name}
                  </button>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2 text-green-500" />
                  <a
                    href={item.file_path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
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
          <p className="text-gray-500 dark:text-gray-400 py-4">
            No files or folders found.
          </p>
        )}
      </ul>

      {/* Floating "+ New" Button */}
      <div className="fixed bottom-6 right-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="lg" className="rounded-full shadow-lg">
              <Plus className="h-5 w-5 mr-2" /> New
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={() => document.getElementById("fileUpload")?.click()}
              className="flex items-center cursot-pointer"
            >
              <Upload className="h-4 w-4 mr-2" /> Upload File
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleNewFolder}>
              <Folder className="h-4 w-4 mr-2" />
              New Folder
            </DropdownMenuItem>
            {decodedFolderName !== "document-vault" && (
              <DropdownMenuItem onSelect={handleGoBack}>
                Go Back
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <input
          type="file"
          id="fileUpload"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>
    </div>
  );
}
