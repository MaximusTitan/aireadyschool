import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface LearningOutcomesInputProps {
  value?: string[];
  onChange: (value: string[]) => void;
}

export default function LearningOutcomesInput({
  value = [],
  onChange,
}: LearningOutcomesInputProps) {
  const [newOutcome, setNewOutcome] = useState("");

  const addOutcome = () => {
    if (newOutcome.trim()) {
      onChange([...value, newOutcome.trim()]);
      setNewOutcome("");
    }
  };

  const removeOutcome = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addOutcome();
    }
  };

  return (
    <div>
      <label
        htmlFor="learningOutcomes"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Learning Objectives
      </label>
      <div className="space-y-2">
        {Array.isArray(value) &&
          value.map((outcome, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Input value={outcome} readOnly className="flex-grow" />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeOutcome(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        <div className="flex items-center space-x-2">
          <Input
            type="text"
            id="learningOutcomes"
            value={newOutcome}
            onChange={(e) => setNewOutcome(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter a learning objective"
            className="flex-grow"
          />
          <Button type="button" onClick={addOutcome}>
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
