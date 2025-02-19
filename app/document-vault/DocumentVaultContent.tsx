"use client"

import { useEffect, useState, useCallback } from "react"
import { Plus, Upload, Folder, Trash2, Grid, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { usePathname } from "next/navigation"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Card, CardContent } from "@/components/ui/card"
import { createClient } from "@/utils/supabase/client"

type VaultItem = {
  file_name: string
  file_path: string
  public_url?: string  // New property to store the public URL
  type: "file" | "folder"
}

export default function DocumentVaultContent() {
  const [fileData, setFileData] = useState<{ length: number; url: string } | null>(null)
  const [items, setItems] = useState<VaultItem[]>([])
  const [newFolderName, setNewFolderName] = useState("")
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false)
  const [viewType, setViewType] = useState<"list" | "grid">("list")
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const pathname = usePathname()

  const folderName = pathname.split("/").pop() || "document-vault"

  const fetchUserEmail = useCallback(async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    setUserEmail(user?.email ?? null)
  }, [])

  useEffect(() => {
    fetchUserEmail()
  }, [fetchUserEmail])

  useEffect(() => {
    async function fetchItems() {
      if (!userEmail) return;
      try {
        const userEmailParam = userEmail ? `&userEmail=${encodeURIComponent(userEmail)}` : ""
        const response = await fetch(`/api/document-vault?folder_name=${folderName}${userEmailParam}`)
        if (!response.ok) throw new Error("Failed to fetch files")

        const data = await response.json()
        setItems(data.files)
      } catch (error) {
        console.error("Error fetching files:", error)
      }
    }

    fetchItems()
  }, [folderName, userEmail])

  const handleFileUpload = async () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "*/*"
    input.onchange = async (event: Event) => {
      const target = event.target as HTMLInputElement
      if (target.files && target.files.length > 0) {
        const file = target.files[0]
        const formData = new FormData()
        formData.append("file", file)
        formData.append("userEmail", userEmail || "")
        formData.append("fullPath", folderName)

        try {
          const response = await fetch("/api/document-vault", {
            method: "POST",
            body: formData,
          })

          if (!response.ok) throw new Error("Failed to upload file")

          const data = await response.json()
          setFileData(data)
          // Save both file_path and public_url; public_url will be used for the link
          setItems((prevItems) => [
            ...prevItems, 
            { 
              file_name: file.name, 
              file_path: data.url, 
              public_url: data.url, 
              type: "file" 
            }
          ])
        } catch (error) {
          console.error("Error uploading file:", error)
          setUploadError("Failed to upload file. Please try again.")
        }
      }
    }
    input.click()
  }

  const handleNewFolder = async () => {
    if (!newFolderName.trim() || newFolderName.includes("_")) return

    const fullPath = folderName !== "document-vault" ? `${folderName}/${newFolderName}` : newFolderName
    const sanitizedFolderName = newFolderName.replace(/ /g, "_")

    try {
      const response = await fetch("/api/document-vault", {
        method: "PUT",
        body: JSON.stringify({ folderName: sanitizedFolderName, fullPath, userEmail }),
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) throw new Error("Failed to create folder")

      const data = await response.json()
      setIsFolderDialogOpen(false)
      setItems((prevItems) => [
        ...prevItems, 
        { file_name: newFolderName, file_path: data.path, type: "folder" }
      ])
      setNewFolderName("")
    } catch (error) {
      console.error("Error creating folder:", error)
    }
  }

  const handleDelete = async (fileName: string, type: "file" | "folder", filePath: string) => {
    if (confirm(`Are you sure you want to delete ${fileName}?`)) {
      try {
        const response = await fetch("/api/document-vault", {
          method: "DELETE",
          body: JSON.stringify({ fileName, type, filePath, userEmail }),
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
          <a
            href={`/document-vault/${item.file_name.replace(/_/g, " ")}`}
            className="flex flex-col items-center text-current hover:text-gray-700 dark:hover:text-gray-300"
          >
            <Folder className="h-12 w-12 mb-2 stroke-current" />
            <p className="text-center text-sm font-medium truncate w-full">
              {item.file_name.replace(/_/g, " ")}
            </p>
          </a>
        ) : (
          <a
            href={item.public_url} // Use the public URL here
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center text-current hover:text-gray-700 dark:hover:text-gray-300"
          >
            <Upload className="h-12 w-12 mb-2 stroke-current" />
            <p className="text-center text-sm font-medium truncate w-full">
              {item.file_name.replace(/_/g, " ")}
            </p>
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
      {uploadError && <p className="text-red-500">{uploadError}</p>}
      {userEmail === null ? (
        <p>Please sign in to view your documents.</p>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-3xl font-bold mb-6 text-gray-800">
              {folderName
                .replace(/-/g, " ")
                .split(" ")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ")}
            </h2>
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
                          <a
                            href={`/document-vault/${item.file_name}`}
                            className="text-blue-500 font-semibold"
                          >
                            {item.file_name.replace(/_/g, " ")}
                          </a>
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2 stroke-current" />
                          <a
                            href={item.public_url} // Using public URL for file items
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500"
                          >
                            {item.file_name.replace(/_/g, " ")}
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

          <div className="fixed bottom-6 left-84">
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

          <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
              </DialogHeader>
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder Name"
              />
              <DialogFooter>
                <Button onClick={handleNewFolder}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}
