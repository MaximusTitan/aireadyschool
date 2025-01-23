"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, ChevronLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import Link from "next/link";

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
}

export function AssignmentEvaluator() {
  const [file, setFile] = useState<File | null>(null);
  const [gradeLevel, setGradeLevel] = useState("");
  const [subject, setSubject] = useState("");
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file || !gradeLevel || !subject) {
      setError("Please fill in all fields and select a PDF file.");
      return;
    }

    setIsLoading(true);
    setError("");
    setEvaluation(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("gradeLevel", gradeLevel);
    formData.append("subject", subject);

    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setEvaluation(data.evaluation);
      } else {
        setError(data.error || "Something went wrong!");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setError("Failed to upload the file or evaluate the assignment.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4 p-4">
            <div className="space-y-2">
              <Label htmlFor="file">Assignment PDF</Label>
              <Input
                id="file"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                disabled={isLoading}
              />
            </div>
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
            <Button
              type="submit"
              disabled={!file || !gradeLevel || !subject || isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Evaluating..." : "Upload and Evaluate"}
            </Button>
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
            <CardTitle>Assignment Evaluation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                <h3 className="font-semibold">Structure and Organization</h3>
                <p>Score: {evaluation.structureAndOrganization.score}/20</p>
                <p>{evaluation.structureAndOrganization.comment}</p>
              </div>
              <div>
                <h3 className="font-semibold">Language and Communication</h3>
                <p>Score: {evaluation.languageAndCommunication.score}/20</p>
                <p>{evaluation.languageAndCommunication.comment}</p>
              </div>
              <div>
                <h3 className="font-semibold">Research and Citation</h3>
                <p>Score: {evaluation.researchAndCitation.score}/10</p>
                <p>{evaluation.researchAndCitation.comment}</p>
              </div>
              <div>
                <h3 className="font-semibold">Total Score</h3>
                <p>{evaluation.totalScore}/100</p>
              </div>
            </div>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}
