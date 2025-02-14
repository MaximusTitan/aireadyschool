"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/utils/supabase/client";

export default function SuggestFeatureForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string>("");

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
      }
    });
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError("Title and Description cannot be empty.");
      return;
    }
    setError("");
    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (!currentUser) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("feedback")
        .insert({
          title,
          description,
          author: currentUser.email,
        })
        .select("id")
        .single();

      if (error) throw error;
      router.push(`/feedback/${data.id}`);
      setTitle("");
      setDescription("");
    } catch (error) {
      console.error("Error inserting feature:", error);
      setError("Failed to submit feedback. Please try again.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Suggest a feature</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="Short, descriptive title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Textarea
              placeholder="Description"
              className="min-h-[100px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button
            type="submit"
            className="w-full bg-rose-500 hover:bg-rose-600"
          >
            Suggest feature
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
