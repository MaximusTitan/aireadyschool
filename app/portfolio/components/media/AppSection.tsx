"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Smartphone, Edit2, Check, X, Plus, Loader2 } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent, CardFooter } from "@/components/ui/card"

interface App {
  id: string
  name: string
  description: string
  app_url: string
  created_at: string
  updated_at: string
}

export function AppSection() {
  const [apps, setApps] = useState<App[]>([])
  const [editingApp, setEditingApp] = useState<{ id: string; name: string; description: string } | null>(null)
  const [newAppUrl, setNewAppUrl] = useState("")
  const [newAppName, setNewAppName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    fetchApps()
  }, [])

  const fetchApps = async () => {
    setIsLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user?.email) {
      const { data, error } = await supabase
        .from("apps")
        .select("*")
        .eq("student_email", user.email)
        .order("created_at", { ascending: false })

      if (error) {
        setError("Failed to fetch apps")
      } else {
        setApps(data || [])
      }
    }
    setIsLoading(false)
  }

  const handleAppAdd = async () => {
    if (!newAppUrl || !newAppName) {
      setError("Please enter both app name and URL")
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user?.email) {
      setError("You must be logged in to add an app")
      return
    }

    const newApp = {
      student_email: user.email,
      name: newAppName,
      description: "A new app project",
      app_url: newAppUrl,
    }

    const { data, error } = await supabase.from("apps").insert(newApp).select().single()

    if (error) {
      setError("Failed to add app")
    } else if (data) {
      setApps([data, ...apps])
      setNewAppUrl("")
      setNewAppName("")
    }

    setError(null)
  }

  const handleAppEdit = (id: string, name: string, description: string) => {
    setEditingApp({ id, name, description })
  }

  const handleAppSave = async () => {
    if (!editingApp) return

    const { data, error } = await supabase
      .from("apps")
      .update({
        name: editingApp.name,
        description: editingApp.description,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingApp.id)
      .select()
      .single()

    if (error) {
      setError("Failed to update app")
    } else if (data) {
      setApps(apps.map((app) => (app.id === data.id ? data : app)))
    }

    setEditingApp(null)
  }

  const handleAppDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this app?")) return

    const { error } = await supabase.from("apps").delete().eq("id", id)

    if (error) {
      setError("Failed to delete app")
    } else {
      setApps(apps.filter((app) => app.id !== id))
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="mt-12">
      <h2 className="text-xl font-bold mb-4">Apps</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="border-2 border-dashed">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <Smartphone className="w-12 h-12 text-gray-400" />
              <span className="text-sm font-medium text-gray-900">Add App Project</span>
              <div className="w-full space-y-3">
                <Input
                  type="text"
                  placeholder="Enter app name"
                  value={newAppName}
                  onChange={(e) => setNewAppName(e.target.value)}
                />
                <Input
                  type="text"
                  placeholder="Enter app URL"
                  value={newAppUrl}
                  onChange={(e) => setNewAppUrl(e.target.value)}
                />
                <Button onClick={handleAppAdd} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add App
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {apps.map((app) => (
          <Card key={app.id} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative bg-gray-100 border-b">
                <div className="h-[300px] overflow-hidden">
                  <iframe
                    src={app.app_url}
                    className="w-full h-full border-0 scale-[0.6] origin-top-left"
                    style={{
                      width: "calc(100% / 0.6)",
                      height: "calc(300px / 0.6)",
                    }}
                    loading="lazy"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-4 flex-col items-start gap-2">
              {editingApp?.id === app.id ? (
                <div className="w-full space-y-2">
                  <Input
                    value={editingApp.name}
                    onChange={(e) => setEditingApp({ ...editingApp, name: e.target.value })}
                  />
                  <Input
                    value={editingApp.description}
                    onChange={(e) => setEditingApp({ ...editingApp, description: e.target.value })}
                  />
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={handleAppSave}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingApp(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="w-full">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-base">{app.name}</h3>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleAppEdit(app.id, app.name, app.description)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleAppDelete(app.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">Added on {new Date(app.created_at).toLocaleDateString()}</p>
                    <a
                      href={app.app_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      View App →
                    </a>
                  </div>
                </div>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
