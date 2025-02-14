// app/connect-database/SupabaseConnectionForm.tsx
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"

type SupabaseConnectionFormProps = {
  supabaseUrl: string
  setSupabaseUrl: (url: string) => void
  supabaseAnonKey: string
  setSupabaseAnonKey: (key: string) => void
  databaseNameInput: string
  setDatabaseNameInput: (name: string) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>
  isLoading: boolean
}

const SupabaseConnectionForm = ({
  supabaseUrl,
  setSupabaseUrl,
  supabaseAnonKey,
  setSupabaseAnonKey,
  databaseNameInput,
  setDatabaseNameInput,
  handleSubmit,
  isLoading,
}: SupabaseConnectionFormProps) => {
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Connect to Supabase</CardTitle>
        <CardDescription>Enter your Supabase credentials to connect.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="supabaseUrl">Supabase URL</Label>
            <Input
              id="supabaseUrl"
              type="url"
              placeholder="https://your-project.supabase.co"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supabaseAnonKey">Supabase Anon Key</Label>
            <Input
              id="supabaseAnonKey"
              type="password"
              placeholder="Your Supabase Anon Key"
              value={supabaseAnonKey}
              onChange={(e) => setSupabaseAnonKey(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="databaseName">Database Name</Label>
            <Input
              id="databaseName"
              type="text"
              placeholder="Enter a name for your database connection"
              value={databaseNameInput}
              onChange={(e) => setDatabaseNameInput(e.target.value)}
              required
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Connecting..." : "Connect"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

export default SupabaseConnectionForm