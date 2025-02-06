"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { Plus, Upload, Folder, Trash2, Grid, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Card, CardContent } from "@/components/ui/card"

type VaultItem = {
  file_name: string
  file_path: string
  type: "file" | "folder"
}

export default function FolderView() {
  const router = useRouter()
  const { folder_name } = useParams()
  const decodedFolderName = decodeURIComponent(folder_name as string)
  const [items, setItems] = useState<VaultItem[]>([])
  const [viewType, setViewType] = useState<"list" | "grid">("list")

  const fetchItems = useCallback(async () => {
    try {
      const folderParam = decodedFolderName ? `?folder_name=${encodeURIComponent(decodedFolderName)}` : ""
      const response = await fetch(`/api/document-vault${folderParam}`)
      if (!response.ok) throw new Error("Failed to fetch files")

      const data = await response.json()
      setItems(data.files)
    } catch (error) {
      console.error("Error fetching files:", error)
    }
  }, [decodedFolderName])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return
    const file = event.target.files[0]

    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch(`/api/document-vault?folder_name=${encodeURIComponent(decodedFolderName)}`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Failed to upload file")

      const data = await response.json()
      console.log("File uploaded successfully!", data)
      await fetchItems()
    } catch (error) {
      console.error("Error uploading file:", error)
    }
  }

  const handleNewFolder = async () => {
    const folderName = prompt("Enter new folder name:")
    if (!folderName) return

    const parentFolder = decodedFolderName !== "document-vault" ? decodedFolderName : ""

    const response = await fetch(`/api/document-vault`, {
      method: "PUT",
      body: JSON.stringify({ folderName, parentFolder }),
      headers: { "Content-Type": "application/json" },
    })

    if (response.ok) {
      console.log("Folder created successfully!")
      fetchItems()
    } else {
      console.error("Folder creation failed")
    }
  }

  const handleDelete = async (fileName: string, type: "file" | "folder", filePath: string) => {
    if (confirm(`Are you sure you want to delete ${fileName}?`)) {
      try {
        const response = await fetch("/api/document-vault", {
          method: "DELETE",
          body: JSON.stringify({ fileName, type, filePath }),
          headers: { "Content-Type": "application/json" },
        })

        if (!response.ok) throw new Error("Failed to delete item")

        setItems((prevItems) => prevItems.filter((item) => item.file_name !== fileName))

        console.log(`${fileName} deleted successfully`)
      } catch (error) {
        console.error("Error deleting item:", error)
      }
    }
  }

  const GridViewItem = ({ item }: { item: VaultItem }) => (
    <Card className="w-40 h-40 relative group">
      <CardContent className="p-4 flex flex-col items-center justify-center h-full">
        {item.type === "folder" ? (
          <button
            onClick={() => router.push(`/document-vault/${item.file_name.replace(/\s+/g, "-").toLowerCase()}`)}
            className="flex flex-col items-center text-current hover:text-gray-700 dark:hover:text-gray-300"
          >
            <Folder className="h-12 w-12 mb-2 stroke-current" />
            <p className="text-center text-sm font-medium truncate w-full">{item.file_name}</p>
          </button>
        ) : (
          <a
            href={item.file_path}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center text-current hover:text-gray-700 dark:hover:text-gray-300"
          >
            <Upload className="h-12 w-12 mb-2 stroke-current" />
            <p className="text-center text-sm font-medium truncate w-full">{item.file_name}</p>
          </a>
        )}
      </CardContent>
      <Button
        size="icon"
        variant="ghost"
        className="absolute top-1 right-1 h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          handleDelete(item.file_name, item.type, item.file_path)
        }}
      >
        <Trash2 className="h-4 w-4 stroke-current" />
        <span className="sr-only">Delete {item.file_name}</span>
      </Button>
    </Card>
  )

  return (
    <div className="relative min-h-[calc(100vh-2rem)] p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">{decodedFolderName.replace(/-/g, " ").split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</h2>
        <ToggleGroup type="single" value={viewType} onValueChange={(value) => setViewType(value as "list" | "grid")}>
          <ToggleGroupItem value="list" aria-label="List view">
            <List className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="grid" aria-label="Grid view">
            <Grid className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {viewType === "list" ? (
        <ul className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg shadow-md">
          {items.length > 0 ? (
            items.map((item, index) => (
              <li
                key={index}
                className="py-2 border-b border-gray-300 dark:border-gray-700 flex items-center justify-between"
              >
                <div className="flex items-center">
                  {item.type === "folder" ? (
                    <>
                      <Folder className="h-4 w-4 mr-2 stroke-current" />
                      <button
                        onClick={() =>
                          router.push(`/document-vault/${item.file_name.replace(/\s+/g, "-").toLowerCase()}`)
                        }
                        className="text-blue-500 font-semibold"
                      >
                        {item.file_name}
                      </button>
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2 stroke-current" />
                      <a href={item.file_path} target="_blank" rel="noopener noreferrer" className="text-blue-500">
                        {item.file_name}
                      </a>
                    </>
                  )}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900"
                  onClick={() => handleDelete(item.file_name, item.type, item.file_path)}
                >
                  <Trash2 className="h-4 w-4 stroke-current" />
                  <span className="sr-only">Delete {item.file_name}</span>
                </Button>
              </li>
            ))
          ) : (
            <p>No files or folders found.</p>
          )}
        </ul>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.length > 0 ? (
            items.map((item, index) => <GridViewItem key={index} item={item} />)
          ) : (
            <p>No files or folders found.</p>
          )}
        </div>
      )}

      <div className="fixed bottom-6 right-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="lg"
              className="rounded-full shadow-lg bg-white text-black hover:bg-gray-100 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700"
            >
              <Plus className="h-5 w-5 mr-2" />
              New
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => document.getElementById("fileUpload")?.click()} className="cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              <span>File Upload</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleNewFolder} className="cursor-pointer">
              <Folder className="h-4 w-4 mr-2" />
              <span>New Folder</span>
            </DropdownMenuItem>
            {decodedFolderName !== "document-vault" && (
              <DropdownMenuItem onClick={() => router.back()} className="cursor-pointer">
                Go Back
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <input type="file" id="fileUpload" className="hidden" onChange={handleFileUpload} />
      </div>
    </div>
  )
}

