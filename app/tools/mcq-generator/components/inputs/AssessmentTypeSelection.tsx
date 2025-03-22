import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AssessmentTypeSelectionProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export default function AssessmentTypeSelection({ value, onChange, disabled = false }: AssessmentTypeSelectionProps) {
  const assessmentTypes = [
    { value: "mcq", label: "Multiple Choice Questions" },
    { value: "truefalse", label: "True or False" },
    { value: "fillintheblank", label: "Fill in the Blanks" },
    { value: "shortanswer", label: "Short Answer" },
    { value: "mixedassessment", label: "Mixed Assessments" },
  ]

  return (
    <div>
      <label htmlFor="assessmentType" className="block text-sm font-medium text-gray-700 mb-1">
        Select Assessment Type
      </label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select an assessment type" />
        </SelectTrigger>
        <SelectContent>
          {assessmentTypes.map((type) => (
            <SelectItem key={type.value} value={type.value} className="text-neutral-500 hover:bg-rose-100">
              {type.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

