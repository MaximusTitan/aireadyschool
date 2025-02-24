import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BoardSelectionProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const boards = [
  "CBSE", "CISCE", "State Board", "IB", "CAIE", "NIOS",
  "WAEC", "NECO", "UBEC", "State Education Board", "Cambridge International",
  "Common Core", "AP", "National Curriculum", "GCSE", "A-Levels", "Scottish Qualifications",
  "Provincial Curriculum", "Australian Curriculum", "Other"
];

export default function BoardSelection({ value, onChange, disabled = false }: BoardSelectionProps) {
  return (
    <div>
      <label htmlFor="board" className="block text-sm font-medium text-gray-700 mb-1">
        Select Educational Board
      </label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full" id="board">
          <SelectValue placeholder="Select an educational board" />
        </SelectTrigger>
        <SelectContent>
          {boards.map((board) => (
            <SelectItem key={board} value={board} className="text-neutral-500 hover:bg-rose-100">
              {board}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
