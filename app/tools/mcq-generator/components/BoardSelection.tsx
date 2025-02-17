import { CountryKey } from "@/types/assessment";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BoardSelectionProps {
  value: string;
  onChange: (value: string) => void;
  country: CountryKey | "";
}

export default function BoardSelection({
  value,
  onChange,
  country,
}: BoardSelectionProps) {
  const boardsByCountry: Record<CountryKey, string[]> = {
    India: ["CBSE", "CISCE", "State Board", "IB", "IGCSE", "NIOS"],
    Nigeria: [
      "WAEC",
      "NECO",
      "UBEC",
      "State Education Board",
      "Cambridge International",
      "IB",
    ],
    "United States": ["State Board", "Common Core", "AP", "IB"],
    "United Kingdom": [
      "National Curriculum",
      "GCSE",
      "A-Levels",
      "Scottish Qualifications",
      "IB",
    ],
    Canada: ["Provincial Curriculum", "IB"],
    Australia: ["Australian Curriculum", "State Curriculum", "IB"],
    Other: ["National Curriculum", "International Curriculum", "Other"],
  };

  const boards =
    country && country in boardsByCountry
      ? boardsByCountry[country as CountryKey]
      : [];

  return (
    <div>
      <label
        htmlFor="board"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Select Educational Board
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full bg-white" id="board">
          <SelectValue placeholder="Select an educational board" />
        </SelectTrigger>
        <SelectContent>
          {boards.map((board) => (
            <SelectItem
              key={board}
              value={board}
              className="text-neutral-500 hover:bg-rose-100"
            >
              {board}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
