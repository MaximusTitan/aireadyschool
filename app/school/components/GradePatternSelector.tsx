import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GRADE_PATTERNS } from "../constants/education";

interface GradePatternSelectorProps {
  onSelect: (grades: { name: string; sections: { name: string }[] }[]) => void;
}

export default function GradePatternSelector({
  onSelect,
}: GradePatternSelectorProps) {
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
        <div className="grid gap-4">
          {Object.entries(GRADE_PATTERNS).map(([pattern, grades]) => (
            <Button
              key={pattern}
              variant="outline"
              onClick={() => {
                onSelect(grades);
              }}
            >
              {pattern}
              <span className="ml-2 text-xs text-muted-foreground">
                ({grades.length} grades)
              </span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
