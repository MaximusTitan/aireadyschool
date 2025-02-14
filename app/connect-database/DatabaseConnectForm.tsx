"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";

interface DatabaseConnectionFormProps {
  sqlDetails: {
    host: string;
    port: string;
    database: string;
    user_name: string;
    password: string;
  };
  setSqlDetails: React.Dispatch<React.SetStateAction<any>>;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  isLoading: boolean;
}

const DatabaseConnectionForm = ({
  sqlDetails,
  setSqlDetails,
  handleSubmit,
  isLoading,
}: DatabaseConnectionFormProps) => {
  const [dbType, setDbType] = useState("postgres");
  const [databaseName, setDatabaseName] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSqlDetails((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Connect to SQL Database</CardTitle>
        <CardDescription>Enter your database credentials to connect.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
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
          {(["host", "port", "database", "user_name", "password"] as const).map((field) => (
            <div key={field} className="space-y-2">
              <Label htmlFor={field} className="capitalize">
                {field.replace("_", " ")}
              </Label>
              <Input
                id={field}
                name={field}
                type={field === "password" ? "password" : "text"}
                value={sqlDetails ? sqlDetails[field] || "" : ""}
                onChange={handleChange}
                placeholder={field === "port" ? "5432" : `Enter ${field.replace("_", " ")}`}
              />
            </div>
          ))}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Connecting..." : "Connect"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default DatabaseConnectionForm;
