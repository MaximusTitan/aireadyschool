import { Input } from "@/components/ui/input"

interface TopicInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export default function TopicInput({ value, onChange, disabled = false }: TopicInputProps) {
  return (
    <div>
      <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">
        Enter Topic
      </label>
      <Input
        type="text"
        id="topic"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g., Algebra, World War II, Solar System"
        className="w-full"
        disabled={disabled}
      />
    </div>
  )
}

