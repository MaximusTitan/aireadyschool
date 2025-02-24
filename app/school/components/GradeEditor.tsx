import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface GradeEditorProps {
  grades: { name: string; sections: { name: string }[] }[];
  onChange: (grades: { name: string; sections: { name: string }[] }[]) => void;
}

const getNextSectionName = (sections: { name: string }[]) => {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const usedNames = new Set(sections.map((s) => s.name));
  return letters.split("").find((letter) => !usedNames.has(letter)) || "A";
};

export default function GradeEditor({ grades, onChange }: GradeEditorProps) {
  const [activeGrade, setActiveGrade] = useState<number | null>(null);

  const addGrade = () => {
    onChange([
      ...grades,
      { name: `Grade ${grades.length + 1}`, sections: [{ name: "A" }] },
    ]);
  };

  const deleteGrade = (gradeIndex: number) => {
    const updatedGrades = [...grades];
    updatedGrades.splice(gradeIndex, 1);
    onChange(updatedGrades);
    setActiveGrade(null);
    toast.success("Grade deleted successfully");
  };

  const addSection = (gradeIndex: number) => {
    const nextName = getNextSectionName(grades[gradeIndex].sections);
    const updatedGrades = [...grades];
    updatedGrades[gradeIndex].sections.push({ name: nextName });
    onChange(updatedGrades);
    toast.success(`Added section ${nextName}`);
  };

  const removeSection = (gradeIndex: number, sectionIndex: number) => {
    const updatedGrades = [...grades];
    updatedGrades[gradeIndex].sections.splice(sectionIndex, 1);
    onChange(updatedGrades);
  };

  const updateGradeName = (index: number, name: string) => {
    const updatedGrades = [...grades];
    updatedGrades[index].name = name;
    onChange(updatedGrades);
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addGrade}
          className="hover:bg-primary hover:text-primary-foreground"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Grade
        </Button>
      </div>

      <div className="grid gap-2">
        {grades.map((grade, gradeIndex) => (
          <div
            key={gradeIndex}
            className="border rounded-lg p-3 space-y-2 hover:border-primary/50 transition-colors"
            onClick={() => setActiveGrade(gradeIndex)}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={grade.name}
                  onChange={(e) => updateGradeName(gradeIndex, e.target.value)}
                  className="w-32"
                  placeholder="Grade name"
                />
                <div className="flex flex-wrap gap-1 flex-1 items-center">
                  {grade.sections.map((section, sectionIndex) => (
                    <Badge
                      key={sectionIndex}
                      variant="secondary"
                      className="cursor-pointer hover:bg-destructive/10"
                    >
                      {section.name}
                      <X
                        className="h-3 w-3 ml-1 hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSection(gradeIndex, sectionIndex);
                        }}
                      />
                    </Badge>
                  ))}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      addSection(gradeIndex);
                    }}
                    className="h-7 w-7 p-0 ml-1 rounded-full"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => deleteGrade(gradeIndex)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
