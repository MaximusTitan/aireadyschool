"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function InterestsSection() {
  const [interests, setInterests] = useState<string[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [newInterest, setNewInterest] = useState("");
  const [isAddingInterest, setIsAddingInterest] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && user.email) {
        setUserEmail(user.email);
      } else {
        setError("User not authenticated");
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (userEmail) {
      fetchInterests();
    }
  }, [userEmail]);

  const fetchInterests = async () => {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("interests")
        .eq("student_email", userEmail)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No data found, set empty interests
          setInterests([]);
          return;
        }
        throw error;
      }
      setInterests(data?.interests || []);
    } catch (err) {
      setError("Failed to fetch interests");
      if (err instanceof Error) {
        console.error(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddInterest = async () => {
    if (newInterest.trim()) {
      const updatedInterests = [...interests, newInterest.trim()];
      try {
        const { error } = await supabase
          .from("students")
          .update({ interests: updatedInterests })
          .eq("student_email", userEmail);

        if (error) throw error;
        setInterests(updatedInterests);
        setNewInterest("");
        setIsAddingInterest(false);
      } catch (err: any) {
        setError("Failed to add interest");
        console.error(err);
      }
    }
  };

  const handleRemoveInterest = async (interestToRemove: string) => {
    const updatedInterests = interests.filter(
      (interest) => interest !== interestToRemove
    );
    try {
      const { error } = await supabase
        .from("students")
        .update({ interests: updatedInterests })
        .eq("student_email", userEmail);

      if (error) throw error;
      setInterests(updatedInterests);
    } catch (err: any) {
      setError("Failed to remove interest");
      console.error(err);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Interest Areas</h2>
        {interests.length > 0 && (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setIsAddingInterest(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {interests.length === 0 && !isAddingInterest ? (
          <div className="w-full text-center py-4">
            <p className="text-gray-500 mb-2">No interests added yet</p>
            <Button onClick={() => setIsAddingInterest(true)}>
              Add Your First Interest
            </Button>
          </div>
        ) : (
          <>
            {interests.map((interest) => (
              <span
                key={interest}
                className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm flex items-center"
              >
                {interest}
                <button
                  onClick={() => handleRemoveInterest(interest)}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  &times;
                </button>
              </span>
            ))}
          </>
        )}
        {isAddingInterest && (
          <div className="flex items-center gap-2">
            <Input
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              placeholder="Enter new interest"
              className="flex-grow"
            />
            <Button onClick={handleAddInterest}>Add</Button>
            <Button variant="ghost" onClick={() => setIsAddingInterest(false)}>
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
