import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface QuestionCountProps {
  value: number;
  onChange: (value: number) => void;
}

export default function QuestionCount({ value, onChange }: QuestionCountProps) {
  return (
    <div className="grid w-full items-center gap-1.5">
      <Label htmlFor="questionCount">
        How many questions do you want to generate?
      </Label>
      <Input
        type="number"
        id="questionCount"
        placeholder="10"
        min="1"
        max="20"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
