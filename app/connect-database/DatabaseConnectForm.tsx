"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"

const DatabaseConnectionForm = () => {
  const [dbType, setDbType] = useState("postgres")
  const [config, setConfig] = useState({
    host: "",
    port: "5432",
    database: "",
    user: "",
    password: "",
  })
  const [databaseName, setDatabaseName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig({ ...config, [e.target.name]: e.target.value })
  }

  const handleConnect = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/connect-sql-database", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: dbType, databaseName, ...config }),
      })
      const data = await response.json()
      alert(data.success ? "Connected successfully!" : `Error: ${data.error}`)
    } catch (error) {
      console.error("Error connecting to database:", error)
      alert("An error occurred while connecting to the database.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Connect to SQL Database</CardTitle>
        <CardDescription>Enter your database credentials to connect.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="databaseName">Name your database</Label>
          <Input
            id="databaseName"
            name="databaseName"
            type="text"
            value={databaseName}
            onChange={(e) => setDatabaseName(e.target.value)}
            placeholder="Enter a name for your database connection"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dbType">Database Type</Label>
          <Select value={dbType} onValueChange={(value) => setDbType(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select database type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="postgres">PostgreSQL</SelectItem>
              <SelectItem value="mysql">MySQL</SelectItem>
              <SelectItem value="mssql">SQL Server</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {(["host", "port", "database", "user", "password"] as const).map((field) => (
          <div key={field} className="space-y-2">
            <Label htmlFor={field} className="capitalize">
              {field}
            </Label>
            <Input
              id={field}
              name={field}
              type={field === "password" ? "password" : "text"}
              value={config[field]}
              onChange={handleChange}
              placeholder={field === "port" ? "5432" : `Enter ${field}`}
            />
          </div>
        ))}
      </CardContent>
      <CardFooter>
        <Button onClick={handleConnect} className="w-full" disabled={isLoading}>
          {isLoading ? "Connecting..." : "Connect"}
        </Button>
      </CardFooter>
    </Card>
  )
}

export default DatabaseConnectionForm

