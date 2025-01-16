import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ClassSelectionProps {
  value: string;
  onChange: (value: string) => void;
}

export default function ClassSelection({
  value,
  onChange,
}: ClassSelectionProps) {
  return (
    <div>
      <label
        htmlFor="class"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Choose the Grade
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a grade" />
        </SelectTrigger>
        <SelectContent>
          {[...Array(12)].map((_, i) => (
            <SelectItem
              key={i + 1}
              value={`Grade ${i + 1}`}
              className="text-neutral-500 hover:bg-neutral-100"
            >
              Grade {i + 1}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
