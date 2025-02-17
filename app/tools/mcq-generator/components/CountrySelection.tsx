import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CountryKey, COUNTRIES } from "@/types/assessment";

interface CountrySelectionProps {
  value: CountryKey | "";
  onChange: (value: CountryKey) => void;
}

export default function CountrySelection({
  value,
  onChange,
}: CountrySelectionProps) {
  return (
    <div>
      <label
        htmlFor="country"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Select Country
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full bg-white" id="country">
          <SelectValue placeholder="Select a country" />
        </SelectTrigger>
        <SelectContent>
          {COUNTRIES.map((country) => (
            <SelectItem
              key={country}
              value={country}
              className="text-neutral-500 hover:bg-neutral-100"
            >
              {country}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
