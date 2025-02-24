import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface GradeSelectionProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function GradeSelection({ value, onChange, disabled = false }: GradeSelectionProps) {
  return (
    <div>
      <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-1">
        Choose the Grade
      </label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full" id="grade">
          <SelectValue placeholder="Select a grade" />
        </SelectTrigger>
        <SelectContent>
          {[...Array(12)].map((_, i) => (
            <SelectItem key={i + 1} value={`Grade ${i + 1}`} className="text-neutral-500 hover:bg-rose-100">
              Grade {i + 1}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
