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
        Choose the Class
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a class" />
        </SelectTrigger>
        <SelectContent>
          {[...Array(12)].map((_, i) => (
            <SelectItem
              key={i + 1}
              value={`Class ${i + 1}`}
              className="text-rose-500 hover:bg-rose-100"
            >
              Class {i + 1}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
