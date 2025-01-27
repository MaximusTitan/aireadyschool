"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { SkillRating } from "./SkillRating";

interface Skill {
  id: string;
  name: string;
  rating: number;
}

interface SkillRecord {
  skill_id: string;
  skills: {
    id: string;
    name: string;
  };
  rating: number;
}

export function SkillsSection() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
        await fetchSkills(user.email);
      } else {
        setError("User not authenticated");
      }
      setIsLoading(false);
    };
    fetchUser();
  }, []);

  const fetchSkills = async (email: string) => {
    const { data: rawData, error } = await supabase
      .from("student_skills")
      .select(
        `
        skill_id,
        skills (
          id,
          name
        ),
        rating
      `
      )
      .eq("student_email", email);

    if (error) {
      setError(error.message);
      return;
    }

    // Ensure the data is typed correctly
    const data = rawData as unknown as SkillRecord[];

    setSkills(
      data.map((item) => ({
        id: item.skill_id,
        name: item.skills.name,
        rating: item.rating,
      }))
    );
  };

  const handleSkillRatingChange = async (
    skillId: string,
    newRating: number
  ) => {
    if (!userEmail) return;

    const { error } = await supabase
      .from("student_skills")
      .update({ rating: newRating })
      .match({ student_email: userEmail, skill_id: skillId });

    if (error) {
      setError(error.message);
      return;
    }

    setSkills((prevSkills) =>
      prevSkills.map((skill) =>
        skill.id === skillId ? { ...skill, rating: newRating } : skill
      )
    );
  };

  const handleAddSkill = async () => {
    if (!newSkill.trim() || !userEmail) return;

    // First, insert or get the skill
    const { data: skillData, error: skillError } = await supabase
      .from("skills")
      .select("id")
      .eq("name", newSkill.trim())
      .single();

    let skillId;
    if (!skillData) {
      const { data: newSkillData, error: newSkillError } = await supabase
        .from("skills")
        .insert({ name: newSkill.trim() })
        .select("id")
        .single();

      if (newSkillError) {
        setError(newSkillError.message);
        return;
      }
      skillId = newSkillData.id;
    } else {
      skillId = skillData.id;
    }

    // Then, create the student-skill relationship
    const { error: relationError } = await supabase
      .from("student_skills")
      .insert({
        student_email: userEmail,
        skill_id: skillId,
        rating: 1,
      });

    if (relationError) {
      setError(relationError.message);
      return;
    }

    setSkills([...skills, { id: skillId, name: newSkill.trim(), rating: 1 }]);
    setNewSkill("");
    setIsAddingSkill(false);
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Skills</h2>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setIsAddingSkill(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-3">
        {skills.length === 0 && !isAddingSkill ? (
          <p className="text-gray-500 text-center py-4">
            No skills added yet. Click the + button to add your first skill.
          </p>
        ) : (
          <>
            {skills.map((skill) => (
              <SkillRating
                key={skill.id}
                name={skill.name}
                rating={skill.rating}
                onRatingChange={(rating) =>
                  handleSkillRatingChange(skill.id, rating)
                }
              />
            ))}
          </>
        )}
        {isAddingSkill && (
          <div className="flex items-center gap-2">
            <Input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="Enter new skill"
              className="flex-grow"
            />
            <Button onClick={handleAddSkill}>Add</Button>
            <Button variant="ghost" onClick={() => setIsAddingSkill(false)}>
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
