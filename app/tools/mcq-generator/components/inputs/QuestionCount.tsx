// app/tools/mcq-generator/components/inputs/QuestionCount.tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface QuestionCountProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  // Optionally, you could also allow passing an id if needed:
  id?: string;
}

export default function QuestionCount({
  value,
  onChange,
  label = "How many questions do you want to generate?",
  id = "questionCount",
}: QuestionCountProps) {
  return (
    <div className="grid w-full items-center gap-1.5">
      <Label htmlFor={id}>
        {label}
      </Label>
      <Input
        type="number"
        id={id}
        placeholder="1"
        min="1"
        max="50"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
