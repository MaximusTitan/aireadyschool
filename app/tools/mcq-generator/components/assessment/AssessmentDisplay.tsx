interface Question {
  question: string;
  answer: string;
}

interface AssessmentDisplayProps {
  assessment: Question[];
}

export default function AssessmentDisplay({
  assessment,
}: AssessmentDisplayProps) {
  if (!assessment || assessment.length === 0) {
    return <p className="mt-4 text-red-600">No assessment data available.</p>;
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Generated Assessment</h2>
      <div className="space-y-4">
        {assessment.map((item, index) => (
          <div key={index} className="border rounded-md p-4">
            <p className="font-semibold">
              Question {index + 1}: {item.question || "N/A"}
            </p>
            <p className="mt-2">Answer: {item.answer || "N/A"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
