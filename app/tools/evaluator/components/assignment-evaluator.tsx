"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, ChevronLeft, Info } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import Markdown from "react-markdown";

interface Evaluation {
  contentUnderstanding: { score: number; comment: string };
  criticalThinking: { score: number; comment: string };
  structureAndOrganization: { score: number; comment: string };
  languageAndCommunication: { score: number; comment: string };
  researchAndCitation: { score: number; comment: string };
  totalScore: number;
  strengths: string;
  areasForImprovement: string;
  overallComment: string;
  rubricUsed?: boolean;
}

const isValidEvaluation = (data: any): data is Evaluation => {
  return (
    data &&
    typeof data === "object" &&
    "contentUnderstanding" in data &&
    "totalScore" in data
  );
};

export function AssignmentEvaluator() {
  const [file, setFile] = useState<File | null>(null);
  const [gradeLevel, setGradeLevel] = useState("");
  const [subject, setSubject] = useState("");
  const [rubricFile, setRubricFile] = useState<File | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [assignmentText, setAssignmentText] = useState("");
  const [rubricText, setRubricText] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [inputMethod, setInputMethod] = useState<"file" | "text" | null>(null);
  const [rubricInputMethod, setRubricInputMethod] = useState<
    "file" | "text" | null
  >(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setInputMethod("file");
      setAssignmentText("");
      setError("");
    }
  };

  const handleAssignmentTextChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setAssignmentText(e.target.value);
    if (e.target.value) {
      setInputMethod("text");
      setFile(null);
    } else {
      setInputMethod(null);
    }
    setError("");
  };

  const clearFile = () => {
    setFile(null);
    setInputMethod(null);
  };

  const clearText = () => {
    setAssignmentText("");
    setInputMethod(null);
  };

  const handleRubricChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setRubricFile(e.target.files[0]);
      setRubricInputMethod("file");
      setRubricText("");
      setError("");
    }
  };

  const handleRubricTextChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setRubricText(e.target.value);
    if (e.target.value) {
      setRubricInputMethod("text");
      setRubricFile(null);
    } else {
      setRubricInputMethod(null);
    }
    setError("");
  };

  const clearRubricFile = () => {
    setRubricFile(null);
    setRubricInputMethod(null);
  };

  const clearRubricText = () => {
    setRubricText("");
    setRubricInputMethod(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if ((!file && !assignmentText) || !gradeLevel || !subject) {
      setError(
        "Please provide an assignment (file or text), fill in all fields."
      );
      return;
    }

    setIsLoading(true);
    setError("");
    setEvaluation(null);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 10, 90));
    }, 1000);

    const formData = new FormData();
    if (file) {
      formData.append("file", file);
    }
    formData.append("title", title);
    formData.append("description", description);
    formData.append("assignmentText", assignmentText);
    formData.append("gradeLevel", gradeLevel);
    formData.append("subject", subject);
    if (rubricFile) {
      formData.append("rubric", rubricFile);
    }
    formData.append("rubricText", rubricText);

    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        // Check if the evaluation is a valid structured response
        if (isValidEvaluation(data.evaluation)) {
          setEvaluation(data.evaluation);
        } else {
          // If not structured, treat as string response
          setEvaluation(data.evaluation);
        }
      } else {
        setError(data.error || "Something went wrong!");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setError("Failed to upload the file or evaluate the assignment.");
    } finally {
      clearInterval(interval);
      setUploadProgress(100);
      setIsLoading(false);
    }
  };

  const getDisabledMessage = (
    type: "assignment" | "rubric",
    method: "file" | "text"
  ) => {
    const otherMethod = method === "file" ? "text" : "file";
    return `This ${type} ${method} input is disabled because you are using ${otherMethod} input. Clear the ${otherMethod} to use this instead.`;
  };

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-4">
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <div className="space-y-6">
              {/* Grade Level and Subject - Moved to top */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="gradeLevel">Grade Level</Label>
                  <Select onValueChange={setGradeLevel} value={gradeLevel}>
                    <SelectTrigger id="gradeLevel">
                      <SelectValue placeholder="Select Grade Level" />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        "K",
                        "1",
                        "2",
                        "3",
                        "4",
                        "5",
                        "6",
                        "7",
                        "8",
                        "9",
                        "10",
                        "11",
                        "12",
                      ].map((grade) => (
                        <SelectItem key={grade} value={grade}>
                          Grade {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Select onValueChange={setSubject} value={subject}>
                    <SelectTrigger id="subject">
                      <SelectValue placeholder="Select Subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        "Math",
                        "Science",
                        "English",
                        "History",
                        "Art",
                        "Music",
                        "Physical Education",
                      ].map((subj) => (
                        <SelectItem key={subj} value={subj}>
                          {subj}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Title and Description */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Assignment Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter assignment title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Assignment Description</Label>
                  <textarea
                    id="description"
                    className="min-h-[100px] w-full p-2 border rounded resize-y"
                    placeholder="Enter assignment description..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Assignment Submission Section */}
              <div className="space-y-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="space-y-2">
                      <Label htmlFor="file">Assignment Submission</Label>
                      <div className="flex gap-2 items-start">
                        <div className="relative flex-1">
                          <Input
                            id="file"
                            type="file"
                            accept="application/pdf,text/plain"
                            onChange={handleFileChange}
                            disabled={isLoading || inputMethod === "text"}
                            className={`cursor-${inputMethod === "text" ? "not-allowed" : "pointer"}`}
                          />
                          {inputMethod === "text" && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                  <Info className="h-4 w-4 text-muted-foreground" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                {getDisabledMessage("assignment", "file")}
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                        {file && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={clearFile}
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>Upload PDF or text file</TooltipContent>
                </Tooltip>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-background px-2 text-muted-foreground text-sm">
                      OR
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignmentText">Assignment Text</Label>
                  <div className="flex gap-2 items-start">
                    <div className="relative flex-1">
                      <textarea
                        id="assignmentText"
                        className={`min-h-[150px] w-full p-2 border rounded resize-y cursor-${
                          inputMethod === "file" ? "not-allowed" : "text"
                        }`}
                        placeholder="Enter assignment text here..."
                        value={assignmentText}
                        onChange={handleAssignmentTextChange}
                        disabled={isLoading || inputMethod === "file"}
                      />
                      {inputMethod === "file" && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="absolute right-2 top-2">
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {getDisabledMessage("assignment", "text")}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    {assignmentText && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={clearText}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Rubric Section */}
              <div className="space-y-4">
                <Label htmlFor="rubric">Rubric (Optional)</Label>
                <div className="flex gap-2 items-start">
                  <div className="relative flex-1">
                    <Input
                      id="rubric"
                      type="file"
                      accept="application/pdf,text/plain"
                      onChange={handleRubricChange}
                      disabled={isLoading || rubricInputMethod === "text"}
                      className={`cursor-${rubricInputMethod === "text" ? "not-allowed" : "pointer"}`}
                    />
                    {rubricInputMethod === "text" && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {getDisabledMessage("rubric", "file")}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  {rubricFile && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={clearRubricFile}
                    >
                      Clear
                    </Button>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-background px-2 text-muted-foreground text-sm">
                      OR
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rubricText">Rubric Text</Label>
                  <div className="flex gap-2 items-start">
                    <div className="relative flex-1">
                      <textarea
                        id="rubricText"
                        className={`w-full p-2 border rounded cursor-${
                          rubricInputMethod === "file" ? "not-allowed" : "text"
                        }`}
                        placeholder="Enter rubric text here..."
                        value={rubricText}
                        onChange={handleRubricTextChange}
                        disabled={isLoading || rubricInputMethod === "file"}
                      />
                      {rubricInputMethod === "file" && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="absolute right-2 top-2">
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {getDisabledMessage("rubric", "text")}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    {rubricText && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={clearRubricText}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {isLoading && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-sm text-center text-muted-foreground">
                    {uploadProgress < 100
                      ? "Processing assignment..."
                      : "Finalizing evaluation..."}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                disabled={
                  (!file && !assignmentText) ||
                  !gradeLevel ||
                  !subject ||
                  isLoading
                }
                className="w-full md:w-auto"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Evaluating..." : "Upload and Evaluate"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {evaluation && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Evaluation Results
              {typeof evaluation !== "string" && (
                <span className="text-lg font-normal">
                  Score: {evaluation.totalScore}/100
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {typeof evaluation === "string" ? (
              <div className="prose max-w-none">
                <div className=" p-4 bg-muted rounded-lg">
                  <Markdown>{evaluation}</Markdown>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold">Content Understanding</h3>
                    <p>Score: {evaluation.contentUnderstanding.score}/25</p>
                    <p>{evaluation.contentUnderstanding.comment}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Critical Thinking</h3>
                    <p>Score: {evaluation.criticalThinking.score}/25</p>
                    <p>{evaluation.criticalThinking.comment}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      Structure and Organization
                    </h3>
                    <p>Score: {evaluation.structureAndOrganization.score}/20</p>
                    <p>{evaluation.structureAndOrganization.comment}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      Language and Communication
                    </h3>
                    <p>Score: {evaluation.languageAndCommunication.score}/20</p>
                    <p>{evaluation.languageAndCommunication.comment}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Research and Citation</h3>
                    <p>Score: {evaluation.researchAndCitation.score}/10</p>
                    <p>{evaluation.researchAndCitation.comment}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold">Strengths</h3>
                    <p>{evaluation.strengths}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Areas for Improvement</h3>
                    <p>{evaluation.areasForImprovement}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Overall Comment</h3>
                    <p>{evaluation.overallComment}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
