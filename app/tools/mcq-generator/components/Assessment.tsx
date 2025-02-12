import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import MCQQuestion from "./MCQQuestion";
import TrueFalseQuestion from "./TrueFalseQuestion";
import FillInTheBlankQuestion from "./FillInTheBlankQuestion";
import { downloadAssessment } from "@/utils/exportAssessment";
import { Download } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface AssessmentProps {
  assessment: any[];
  assessmentType: string;
  onSubmit: (answers: any[]) => void;
  showResults: boolean;
  userAnswers: any[];
  assessmentId?: string; // Make assessmentId optional
  topic: string; // Add this prop
}

export default function Assessment({
  assessment,
  assessmentType,
  onSubmit,
  showResults,
  userAnswers,
  assessmentId,
  topic,
}: AssessmentProps) {
  const [answers, setAnswers] = useState<any[]>(
    userAnswers.length > 0
      ? userAnswers
      : new Array(assessment.length).fill(null)
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  // New state for summary explanation and chat
  const [explanation, setExplanation] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<string[]>([]);
  const [chatContext, setChatContext] = useState<string>(""); // Add this new state

  useEffect(() => {
    setAnswers(
      Array.isArray(userAnswers) && userAnswers.length > 0
        ? userAnswers
        : new Array(assessment.length).fill(null)
    );
  }, [userAnswers, assessment]);

  const handleAnswerChange = (questionIndex: number, answer: any) => {
    const newAnswers = [...answers];
    if (assessmentType === "mcq") {
      // For MCQ, store the numeric index
      newAnswers[questionIndex] = typeof answer === "number" ? answer : null;
    } else {
      // For other types, store the answer as is
      newAnswers[questionIndex] = answer;
    }
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    onSubmit(answers);
  };

  const calculateScore = () => {
    if (!Array.isArray(answers)) {
      console.error("Answers is not an array:", answers);
      return 0;
    }
    return answers.reduce((score, answer, index) => {
      const question = assessment[index];
      if (!question) return score;

      if (assessmentType === "mcq" && question.correctAnswer !== undefined) {
        // Compare numeric indices for MCQ
        return score + (answer === question.correctAnswer ? 1 : 0);
      } else if (
        assessmentType === "truefalse" &&
        question.correctAnswer !== undefined
      ) {
        return score + (answer === question.correctAnswer ? 1 : 0);
      } else if (assessmentType === "fillintheblank" && question.answer) {
        return (
          score +
          (answer?.toLowerCase() === question.answer.toLowerCase() ? 1 : 0)
        );
      }
      return score;
    }, 0);
  };

  const handleSaveResults = async () => {
    setIsSaving(true);
    setSaveError("");

    try {
      const response = await fetch("/api/generate-assessment", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: assessmentId,
          answers: answers,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save answers");
      }

      const data = await response.json();
      console.log("Answers saved successfully:", data);
    } catch (error) {
      console.error("Error saving answers:", error);
      setSaveError(
        `Failed to save answers: ${error instanceof Error ? error.message : "Unknown error occurred"}`
      );
    } finally {
      setIsSaving(false);
    }
  };

  // New function to fetch summary explanation
  const fetchSummaryExplanation = async (followUpMessage?: string) => {
    try {
      const payload: any = { assessment, userAnswers: answers };
      if (followUpMessage) {
        payload.message = followUpMessage;
      }
      const response = await fetch("/api/assessment-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (data.explanation) {
        if (followUpMessage) {
          // Only show follow-up messages in chat history
          setChatHistory((prev) => [...prev, `You: ${followUpMessage}`, `Bot: ${data.explanation}`]);
        } else {
          // Store initial analysis separately
          setExplanation(data.explanation);
          setChatContext(data.explanation); // Save context but don't show in chat
          setChatHistory([]); // Reset chat history when getting new explanation
        }
      }
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  };

  const handleChatSubmit = async () => {
    if (chatInput.trim()) {
      await fetchSummaryExplanation(chatInput.trim());
      setChatInput("");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-end mb-4">
        <Button 
          onClick={() => downloadAssessment(assessment, assessmentType, topic, 'pdf', showResults)}
          className="bg-neutral-900 hover:bg-neutral-700"
        >
          <Download className="mr-2 h-4 w-4" />
          Download {showResults ? "PDF with Answers" : "Questions PDF"}
        </Button>
      </div>

      {assessment.map((question, index) => (
        <div key={index} className="border rounded-lg p-4">
          {assessmentType === "mcq" && (
            <MCQQuestion
              question={question}
              index={index}
              userAnswer={answers[index]}
              onChange={(answer) => handleAnswerChange(index, answer)}
              showResults={showResults}
            />
          )}
          {assessmentType === "truefalse" && (
            <TrueFalseQuestion
              question={question}
              index={index}
              userAnswer={answers[index]}
              onChange={(answer) => handleAnswerChange(index, answer)}
              showResults={showResults}
            />
          )}
          {assessmentType === "fillintheblank" && (
            <FillInTheBlankQuestion
              question={question}
              index={index}
              userAnswer={answers[index]}
              onChange={(answer) => handleAnswerChange(index, answer)}
              showResults={showResults}
            />
          )}
        </div>
      ))}
      {!showResults ? (
        <Button
          onClick={handleSubmit}
          className="w-full bg-neutral-500 hover:bg-neutral-600"
        >
          Submit Answers
        </Button>
      ) : (
        <div className="text-center">
          <h2 className="text-2xl font-bold">
            Your Score: {calculateScore()} / {assessment.length}
          </h2>
          <div className="flex justify-center gap-2 mt-4">
            <Button
              onClick={handleSaveResults}
              className="bg-neutral-900 hover:bg-neutral-700"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Results"}
            </Button>
            <Button 
              onClick={() => downloadAssessment(assessment, assessmentType, topic, 'pdf', true)}
              className="bg-neutral-900 hover:bg-neutral-700"
            >
              <Download className="mr-2 h-4 w-4" />
              Download PDF with Answers
            </Button>
            <Button
              onClick={() => window.location.reload()}
              className="bg-neutral-900 hover:bg-neutral-700"
            >
              Start New Assessment
            </Button>
          </div>
          {saveError && <p className="text-red-600 mt-2">{saveError}</p>}
          {/* New section for summary explanation and chat */}
          <div className="mt-8 border-t pt-4">
            <Button
              onClick={() => fetchSummaryExplanation()}
              className="bg-blue-600 hover:bg-blue-500 text-white"
            >
              Get Summary Explanation
            </Button>
            {explanation && (
              <div className="mt-4 p-4 border rounded bg-gray-50 text-left">
                <h3 className="font-semibold mb-2">Summary Explanation:</h3>
                {/* Changed className to reduce extra spacing */}
                <ReactMarkdown className="prose prose-sm leading-tight">{explanation}</ReactMarkdown>
              </div>
            )}
            {chatHistory.length > 0 && (
              <div className="mt-4 p-4 border rounded bg-gray-50 text-left">
                <h3 className="font-semibold mb-2">Chat:</h3>
                <div className="space-y-2">
                  {chatHistory.map((msg, idx) => (
                    <div key={idx} className="p-2 rounded bg-white shadow-sm">
                      {/* Changed className to reduce extra spacing */}
                      <ReactMarkdown className="prose prose-sm leading-tight">{msg}</ReactMarkdown>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-4 flex space-x-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask a follow-up question..."
                className="border rounded p-2 flex-grow"
              />
              <Button onClick={handleChatSubmit} className="bg-green-600 hover:bg-green-500 text-white">
                Send
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
