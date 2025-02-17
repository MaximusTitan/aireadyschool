import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AssessmentTypeSelectionProps {
  value: string;
  onChange: (value: string) => void;
}

export default function AssessmentTypeSelection({
  value,
  onChange,
}: AssessmentTypeSelectionProps) {
  const assessmentTypes = [
    { value: "mcq", label: "Multiple Choice Questions" },
    { value: "truefalse", label: "True or False" },
    { value: "fillintheblank", label: "Fill in the Blanks" },
    { value: "shortanswer", label: "Short Answer" }, // new option
  ];

  return (
    <div>
      <label
        htmlFor="assessmentType"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Select Assessment Type
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full bg-white">
          <SelectValue placeholder="Select an assessment type" />
        </SelectTrigger>
        <SelectContent>
          {assessmentTypes.map((type) => (
            <SelectItem
              key={type.value}
              value={type.value}
              className="text-neutral-500 hover:bg-rose-100"
            >
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
