"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CardContent, CardFooter } from "@/components/ui/card";

import { FormCard, FormInput, FormButton } from "./FormElements";

interface SqlDetails {
  databaseName: string; // from "Name your database"
  host: string;
  port: string;
  database: string; //sql database name
  user_name: string;
  password: string;
}

interface DatabaseConnectionFormProps {
  connectionDetails: SqlDetails;
  setConnectionDetails: (details: SqlDetails) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  isLoading: boolean;
}

const DatabaseConnectionForm = ({
  connectionDetails,
  setConnectionDetails,
  handleSubmit,
  isLoading,
}: DatabaseConnectionFormProps) => {
  const [dbType, setDbType] = useState("postgres");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConnectionDetails({
      ...connectionDetails,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <FormCard
      title="Connect to SQL Database"
      description="Enter your database credentials to connect."
    >
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <FormInput
            key="database_name"
            label="Name your database"
            id="databaseName"
            name="databaseName"
            type="text"
            value={connectionDetails.databaseName}
            onChange={handleChange}
            placeholder="Enter a name for your database connection"
            required
          />
          <div className="space-y-2">
            <Label htmlFor="dbType">Database Type</Label>
            <Select value={dbType} onValueChange={setDbType}>
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
          {(["host", "port", "database", "user_name", "password"] as const).map(
            (field) => (
              <FormInput
                key={field}
                label={field.replace("_", " ")}
                id={field}
                name={field}
                type={field === "password" ? "password" : "text"}
                value={connectionDetails[field]}
                onChange={handleChange}
                placeholder={
                  field === "port" ? "5432" : `Enter ${field.replace("_", " ")}`
                }
                required
              />
            ),
          )}
        </CardContent>
        <CardFooter>
          <FormButton type="submit" isLoading={isLoading}>
            Connect
          </FormButton>
        </CardFooter>
      </form>
    </FormCard>
  );
};

export default DatabaseConnectionForm;
