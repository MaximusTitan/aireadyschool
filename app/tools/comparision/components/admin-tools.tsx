"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RefreshCw, Trash2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

export function AdminTools() {
  const [studentEmail, setStudentEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const clearCache = async (email?: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/clear-analysis-cache", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ studentEmail: email }),
      });

      if (!response.ok) {
        throw new Error("Failed to clear cache");
      }

      const data = await response.json();
      toast({
        title: "Success",
        description: data.message,
      });

      setStudentEmail("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear analysis cache",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Tools</CardTitle>
        <CardDescription>Manage AI analysis cache</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              placeholder="Student email (optional)"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => clearCache(studentEmail || undefined)}
            disabled={isLoading}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear Cache
          </Button>
        </div>
        <Button
          variant="destructive"
          onClick={() => clearCache()}
          disabled={isLoading}
          className="w-full"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Clear All Cache
        </Button>
      </CardContent>
    </Card>
  );
}
