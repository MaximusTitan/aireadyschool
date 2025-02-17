interface DifficultySelectionProps {
  value: string;
  onChange: (value: string) => void;
}

export default function DifficultySelection({
  value,
  onChange,
}: DifficultySelectionProps) {
  const difficulties = ["Easy", "Medium", "Hard"];

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Choose Difficulty Level
      </label>
      <div className="flex space-x-4">
        {difficulties.map((difficulty) => (
          <button
            key={difficulty}
            type="button"
            className={`px-4 py-2 border border-transparent text-sm font-medium rounded-md ${
              value === difficulty
                ? "text-neutral-800 bg-rose-300 hover:bg-rose-400"
                : "text-neutral-700 bg-neutral-100 hover:bg-neutral-200"
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500`}
            onClick={() => onChange(difficulty)}
          >
            {difficulty}
          </button>
        ))}
      </div>
    </div>
  );
}
