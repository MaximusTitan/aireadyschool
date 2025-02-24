"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import MCQQuestion from "./MCQQuestion";
import TrueFalseQuestion from "./TrueFalseQuestion";
import FillInTheBlankQuestion from "./FillInTheBlankQuestion";
import ShortQuestion from "./ShortQuestion";
import { downloadAssessment } from "@/utils/exportAssessment";
import { Download, Edit, Save } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface AssessmentProps {
  assessment: any[];
  assessmentType: string;
  onSubmit: (answers: any[]) => void;
  showResults: boolean;
  userAnswers: any[];
  assessmentId?: string;
  topic: string;
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
  const [explanation, setExplanation] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<string[]>([]);
  const [chatContext, setChatContext] = useState<string>("");
  const [shortAnswerScores, setShortAnswerScores] = useState<number[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [editedAssessment, setEditedAssessment] = useState(assessment);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(false);

  useEffect(() => {
    setAnswers(
      Array.isArray(userAnswers) && userAnswers.length > 0
        ? userAnswers
        : new Array(assessment.length).fill(null)
    );
  }, [userAnswers, assessment]);

  useEffect(() => {
    setEditedAssessment(assessment);
  }, [assessment]);

  useEffect(() => {
    if (showResults && assessmentType === "shortanswer") {
      const evaluateAnswers = async () => {
        try {
          const payload = {
            questions: assessment.map((q, index) => ({
              question: q.question,
              correctAnswer: q.answer,
              userAnswer: answers[index] || "",
            })),
          };
          const res = await fetch("/api/evaluate-short-answer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          const data = await res.json();
          if (data.scores && Array.isArray(data.scores)) {
            setShortAnswerScores(data.scores);
          }
        } catch (error) {
          console.error("Error evaluating short answers:", error);
        }
      };
      evaluateAnswers();
    }
  }, [showResults, assessment, answers, assessmentType]);

  const handleAnswerChange = (questionIndex: number, answer: any) => {
    const newAnswers = [...answers];
    if (assessmentType === "mcq") {
      newAnswers[questionIndex] = typeof answer === "number" ? answer : null;
    } else {
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
      } else if (assessmentType === "shortanswer") {
        return score + (shortAnswerScores[index] || 0);
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

  const fetchSummaryExplanation = async (followUpMessage?: string): Promise<void> => {
    try {
      if (followUpMessage) {
        setIsLoadingChat(true);
      } else {
        setIsLoadingAnalysis(true);
      }
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
          setChatHistory((prev) => [
            ...prev,
            `You: ${followUpMessage}`,
            `Bot: ${data.explanation}`,
          ]);
        } else {
          setExplanation(data.explanation);
          setChatContext(data.explanation);
          setChatHistory([]);
        }
      }
    } catch (error) {
      console.error("Error fetching summary:", error);
    } finally {
      setIsLoadingChat(false);
      setIsLoadingAnalysis(false);
    }
  };

  const handleChatSubmit = async () => {
    if (chatInput.trim()) {
      await fetchSummaryExplanation(chatInput.trim());
      setChatInput("");
    }
  };

  const handleEdit = (index: number, field: string, value: string) => {
    const newAssessment = [...editedAssessment];
    newAssessment[index] = { ...newAssessment[index], [field]: value };
    setEditedAssessment(newAssessment);
  };

  const handleOptionEdit = (
    questionIndex: number,
    optionIndex: number,
    value: string
  ) => {
    const newAssessment = [...editedAssessment];
    newAssessment[questionIndex].options[optionIndex] = value;
    setEditedAssessment(newAssessment);
  };

  const saveEdits = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/generate-assessment", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: assessmentId,
          questions: editedAssessment,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update assessment");
      }

      const data = await response.json();
      if (data.success) {
        setEditMode(false);
        // Update the assessment state with the edited version
        setEditedAssessment(data.data[0].questions);
        setSaveError("");
        console.log("Assessment updated successfully:", data.data[0].questions);
      } else {
        throw new Error("Failed to update assessment");
      }
    } catch (error) {
      console.error("Error updating assessment:", error);
      setSaveError("Failed to update assessment. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const renderQuestion = (question: any, index: number) => {
    if (editMode) {
      return (
        <div key={index} className="border rounded-lg p-4 mb-4">
          <Textarea
            value={question.question}
            onChange={(e) => handleEdit(index, "question", e.target.value)}
            className="mb-2"
          />
          {assessmentType === "mcq" && (
            <div>
              {question.options.map((option: string, optionIndex: number) => (
                <Input
                  key={optionIndex}
                  value={option}
                  onChange={(e) =>
                    handleOptionEdit(index, optionIndex, e.target.value)
                  }
                  className="mb-1"
                />
              ))}
            </div>
          )}
          {(assessmentType === "truefalse" ||
            assessmentType === "fillintheblank" ||
            assessmentType === "shortanswer") && (
            <Input
              value={question.answer}
              onChange={(e) => handleEdit(index, "answer", e.target.value)}
              className="mt-2"
            />
          )}
        </div>
      );
    } else {
      switch (assessmentType) {
        case "mcq":
          return (
            <MCQQuestion
              key={index}
              question={editedAssessment[index]}
              index={index}
              userAnswer={answers[index]}
              onChange={(answer) => handleAnswerChange(index, answer)}
              showResults={showResults}
            />
          );
        case "truefalse":
          return (
            <TrueFalseQuestion
              key={index}
              question={editedAssessment[index]}
              index={index}
              userAnswer={answers[index]}
              onChange={(answer) => handleAnswerChange(index, answer)}
              showResults={showResults}
            />
          );
        case "fillintheblank":
          return (
            <FillInTheBlankQuestion
              key={index}
              question={editedAssessment[index]}
              index={index}
              userAnswer={answers[index]}
              onChange={(answer) => handleAnswerChange(index, answer)}
              showResults={showResults}
            />
          );
        case "shortanswer":
          return (
            <ShortQuestion
              key={index}
              question={editedAssessment[index]}
              index={index}
              userAnswer={answers[index]}
              onChange={(answer) => handleAnswerChange(index, answer)}
              showResults={showResults}
              evaluatedScore={shortAnswerScores[index]}
            />
          );
        default:
          return null;
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-4">
        <Button
          onClick={() =>
            downloadAssessment(
              assessment,
              assessmentType,
              topic,
              "pdf",
              showResults
            )
          }
          className="bg-neutral-900 hover:bg-neutral-700"
        >
          <Download className="mr-2 h-4 w-4" />
          Download {showResults ? "PDF with Answers" : "Questions PDF"}
        </Button>
        <Button
          onClick={() => {
            if (editMode) {
              saveEdits();
            } else {
              setEditMode(true);
            }
          }}
          className="bg-black hover:bg-rose-500"
        >
          {editMode ? (
            <Save className="mr-2 h-4 w-4" />
          ) : (
            <Edit className="mr-2 h-4 w-4" />
          )}
          {editMode ? "Save Changes" : "Edit Questions"}
        </Button>
      </div>

      {editMode ? (
        <div>
          {editedAssessment.map((question, index) =>
            renderQuestion(question, index)
          )}
          <Button
            onClick={saveEdits}
            className="mt-4 bg-rose-600 hover:bg-rose-500"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Edits"}
          </Button>
        </div>
      ) : (
        <div>
          {editedAssessment.map((question, index) =>
            renderQuestion(question, index)
          )}
          {!showResults && (
            <Button
              onClick={handleSubmit}
              className="w-full bg-neutral-500 hover:bg-neutral-600"
            >
              Submit Answers
            </Button>
          )}
        </div>
      )}

      {showResults && !editMode && (
        <div className="text-center">
          <h2 className="text-2xl font-bold">
            Your Score: {calculateScore()} /{" "}
            {assessmentType === "shortanswer"
              ? assessment.length * 5
              : assessment.length}
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
              onClick={() =>
                downloadAssessment(
                  assessment,
                  assessmentType,
                  topic,
                  "pdf",
                  true
                )
              }
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
          <div className="mt-8 border-t pt-4">
            <Button
              onClick={() => fetchSummaryExplanation()}
              className="bg-rose-600 hover:bg-rose-500 text-white"
              disabled={isLoadingAnalysis}
            >
              {isLoadingAnalysis ? "Loading..." : "Get Analysis"}
            </Button>
            {explanation && (
              <div className="mt-4 p-4 border rounded bg-gray-50 text-left">
                <h3 className="font-semibold mb-2">Summary Explanation:</h3>
                <ReactMarkdown className="prose prose-sm leading-tight">
                  {explanation}
                </ReactMarkdown>
              </div>
            )}
            {chatHistory.length > 0 && (
              <div className="mt-4 p-4 border rounded bg-gray-50 text-left">
                <h3 className="font-semibold mb-2">Chat:</h3>
                <div className="space-y-2">
                  {chatHistory.map((msg, idx) => (
                    <div key={idx} className="p-2 rounded bg-white shadow-sm">
                      <ReactMarkdown className="prose prose-sm leading-tight">
                        {msg}
                      </ReactMarkdown>
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
                disabled={isLoadingChat}
              />
              <Button
                onClick={handleChatSubmit}
                className="bg-rose-600 hover:bg-rose-500 text-white"
                disabled={isLoadingChat}
              >
                {isLoadingChat ? "Sending..." : "Send"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
