"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit2 } from "lucide-react";

interface AboutSectionProps {}

export default function AboutSection({}: AboutSectionProps) {
  const [about, setAbout] = useState("");
  const [isEditingAbout, setIsEditingAbout] = useState(false);

  const handleAboutSave = () => {
    setIsEditingAbout(false);
  };

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">About</h2>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setIsEditingAbout(true)}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      </div>
      {isEditingAbout ? (
        <div className="space-y-2">
          <textarea
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            className="w-full p-2 border rounded-md"
            rows={5}
          />
          <div>
            <Button onClick={handleAboutSave} className="mr-2">
              Save
            </Button>
            <Button variant="outline" onClick={() => setIsEditingAbout(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-gray-600 leading-relaxed">{about}</p>
      )}
    </div>
  );
}
