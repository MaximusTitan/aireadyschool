"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Grade = {
  name: string;
  sections: { name: string }[];
};

interface GradePatternSelectorProps {
  onSelect: (grades: Grade[]) => void;
}

const GRADE_PATTERNS = {
  primary: Array.from({ length: 5 }, (_, i) => ({
    name: `Grade ${i + 1}`,
    sections: [{ name: "A" }, { name: "B" }],
  })),
  middle: Array.from({ length: 3 }, (_, i) => ({
    name: `Grade ${i + 6}`,
    sections: [{ name: "A" }, { name: "B" }],
  })),
  high: Array.from({ length: 2 }, (_, i) => ({
    name: `Grade ${i + 9}`,
    sections: [{ name: "A" }, { name: "B" }],
  })),
  senior: Array.from({ length: 2 }, (_, i) => ({
    name: `Grade ${i + 11}`,
    sections: [{ name: "A" }, { name: "B" }],
  })),
};

export default function GradePatternSelector({
  onSelect,
}: GradePatternSelectorProps) {
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>([]);

  const handlePatternClick = (pattern: string) => {
    // Toggle pattern selection
    const newSelectedPatterns = selectedPatterns.includes(pattern)
      ? selectedPatterns.filter((p) => p !== pattern)
      : [...selectedPatterns, pattern];
    
    setSelectedPatterns(newSelectedPatterns);
  };

  const handleApply = () => {
    // Combine all selected patterns
    const combinedGrades = selectedPatterns.flatMap(
      (pattern) => GRADE_PATTERNS[pattern as keyof typeof GRADE_PATTERNS]
    );
    
    onSelect(combinedGrades);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" type="button" className="w-full">
          Quick Add Grades
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select Grade Pattern</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            Quick add grade patterns:
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(GRADE_PATTERNS).map(([key, grades]) => (
              <Button
                key={key}
                type="button"
                variant={selectedPatterns.includes(key) ? "default" : "outline"}
                size="sm"
                className="flex items-center gap-1"
                onClick={() => handlePatternClick(key)}
              >
                {selectedPatterns.includes(key) && (
                  <Check className="h-3 w-3" />
                )}
                {key.charAt(0).toUpperCase() + key.slice(1)} ({grades.length})
              </Button>
            ))}
          </div>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={handleApply}
            disabled={selectedPatterns.length === 0}
          >
            Apply Selected Patterns
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
