import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LanguageSelectorProps {
  languages: string[];
  selectedLanguage: string;
  setSelectedLanguage: (language: string) => void;
}

export default function LanguageSelector({
  languages,
  selectedLanguage,
  setSelectedLanguage,
}: LanguageSelectorProps) {
  return (
    <div className="mb-6">
      <label
        htmlFor="language-select"
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
      >
        Select a language:
      </label>
      <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a language" />
        </SelectTrigger>
        <SelectContent>
          {languages.map((language) => (
            <SelectItem key={language} value={language}>
              {language}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
