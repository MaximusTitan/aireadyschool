interface QuestionCountProps {
  value: number;
  onChange: (value: number) => void;
}

export default function QuestionCount({ value, onChange }: QuestionCountProps) {
  return (
    <div>
      <label
        htmlFor="questionCount"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        How many questions do you want to generate?
      </label>
      <div className="mt-1 relative rounded-md shadow-sm border border-neutral-200">
        <input
          type="number"
          name="questionCount"
          id="questionCount"
          className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-3 pr-12 sm:text-sm border-gray-300 rounded-md h-10"
          placeholder="10"
          min="1"
          max="20"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </div>
    </div>
  );
}
