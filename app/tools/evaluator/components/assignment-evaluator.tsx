"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, Info, Edit, Download } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import Markdown from "react-markdown"
import { countries, boardsByCountry, subjects } from "@/app/constants/education-data"
import { jsPDF } from "jspdf"

interface Evaluation {
  contentUnderstanding: { score: number; comment: string }
  criticalThinking: { score: number; comment: string }
  structureAndOrganization: { score: number; comment: string }
  languageAndCommunication: { score: number; comment: string }
  researchAndCitation: { score: number; comment: string }
  totalScore: number
  strengths: string
  areasForImprovement: string
  overallComment: string
  rubricUsed?: boolean
}

const isValidEvaluation = (data: any): data is Evaluation => {
  return data && typeof data === "object" && "contentUnderstanding" in data && "totalScore" in data
}

export function AssignmentEvaluator() {
  const [file, setFile] = useState<File | null>(null)
  const [gradeLevel, setGradeLevel] = useState("")
  const [subject, setSubject] = useState("")
  const [rubricFile, setRubricFile] = useState<File | null>(null)
  const [evaluation, setEvaluation] = useState<Evaluation | string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [assignmentText, setAssignmentText] = useState("")
  const [rubricText, setRubricText] = useState("")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [inputMethod, setInputMethod] = useState<"file" | "text" | null>(null)
  const [rubricInputMethod, setRubricInputMethod] = useState<"file" | "text" | null>(null)
  const [country, setCountry] = useState("")
  const [board, setBoard] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [editedEvaluation, setEditedEvaluation] = useState<Evaluation | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setInputMethod("file")
      setAssignmentText("")
      setError("")
    }
  }

  const handleAssignmentTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAssignmentText(e.target.value)
    if (e.target.value) {
      setInputMethod("text")
      setFile(null)
    } else {
      setInputMethod(null)
    }
    setError("")
  }

  const clearFile = () => {
    setFile(null)
    setInputMethod(null)
  }

  const clearText = () => {
    setAssignmentText("")
    setInputMethod(null)
  }

  const handleRubricChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setRubricFile(e.target.files[0])
      setRubricInputMethod("file")
      setRubricText("")
      setError("")
    }
  }

  const handleRubricTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRubricText(e.target.value)
    if (e.target.value) {
      setRubricInputMethod("text")
      setRubricFile(null)
    } else {
      setRubricInputMethod(null)
    }
    setError("")
  }

  const clearRubricFile = () => {
    setRubricFile(null)
    setRubricInputMethod(null)
  }

  const clearRubricText = () => {
    setRubricText("")
    setRubricInputMethod(null)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if ((!file && !assignmentText) || !gradeLevel || !subject || !country || !board) {
      setError("Please provide an assignment (file or text), fill in all required fields.")
      return
    }

    setIsLoading(true)
    setError("")
    setEvaluation(null)
    setUploadProgress(0)
    const interval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 10, 90))
    }, 1000)

    const formData = new FormData()
    if (file) {
      formData.append("file", file)
    }
    formData.append("title", title)
    formData.append("description", description)
    formData.append("assignmentText", assignmentText)
    formData.append("gradeLevel", gradeLevel)
    formData.append("subject", subject)
    if (rubricFile) {
      formData.append("rubric", rubricFile)
    }
    formData.append("rubricText", rubricText)
    formData.append("country", country)
    formData.append("board", board)

    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        if (isValidEvaluation(data.evaluation)) {
          setEvaluation(data.evaluation)
        } else {
          setEvaluation(data.evaluation)
        }
      } else {
        setError(data.error || "Something went wrong!")
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      setError("Failed to upload the file or evaluate the assignment.")
    } finally {
      clearInterval(interval)
      setUploadProgress(100)
      setIsLoading(false)
    }
  }

  const getDisabledMessage = (type: "assignment" | "rubric", method: "file" | "text") => {
    const otherMethod = method === "file" ? "text" : "file"
    return `This ${type} ${method} input is disabled because you are using ${otherMethod} input. Clear the ${otherMethod} to use this instead.`
  }

  const handleEdit = () => {
    setIsEditing(true)
    setEditedEvaluation(evaluation as Evaluation)
  }

  const handleSave = () => {
    setIsEditing(false)
    setEvaluation(editedEvaluation)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedEvaluation(null)
  }

  const handleInputChange = (field: keyof Evaluation, subField: "score" | "comment", value: string | number) => {
    setEditedEvaluation((prev) => {
      if (!prev) return null

      if (
        field === "strengths" ||
        field === "areasForImprovement" ||
        field === "overallComment" ||
        field === "totalScore"
      ) {
        return {
          ...prev,
          [field]: value,
        }
      } else {
        const updatedField = prev[field] as { score: number; comment: string }
        return {
          ...prev,
          [field]: {
            ...updatedField,
            [subField]: subField === "score" ? Number(value) : value,
          },
        }
      }
    })
  }

  const handleDownloadPDF = () => {
    if (!evaluation) return

    const doc = new jsPDF()
    let yOffset = 10

    doc.setFontSize(18)
    doc.text("Evaluation Results", 10, yOffset)
    yOffset += 10

    doc.setFontSize(12)
    if (typeof evaluation === "string") {
      doc.text(evaluation, 10, yOffset, { maxWidth: 190 })
    } else {
      doc.text(`Total Score: ${evaluation.totalScore}/100`, 10, yOffset)
      yOffset += 10

      const addSection = (title: string, content: string) => {
        doc.setFontSize(14)
        doc.text(title, 10, yOffset)
        yOffset += 7
        doc.setFontSize(12)
        doc.text(content, 10, yOffset, { maxWidth: 190 })
        yOffset += doc.getTextDimensions(content, { maxWidth: 190 }).h + 5
      }

      addSection(
        "Content Understanding",
        `Score: ${evaluation.contentUnderstanding.score}/25\n${evaluation.contentUnderstanding.comment}`,
      )
      addSection(
        "Critical Thinking",
        `Score: ${evaluation.criticalThinking.score}/25\n${evaluation.criticalThinking.comment}`,
      )
      addSection(
        "Structure and Organization",
        `Score: ${evaluation.structureAndOrganization.score}/20\n${evaluation.structureAndOrganization.comment}`,
      )
      addSection(
        "Language and Communication",
        `Score: ${evaluation.languageAndCommunication.score}/20\n${evaluation.languageAndCommunication.comment}`,
      )
      addSection(
        "Research and Citation",
        `Score: ${evaluation.researchAndCitation.score}/10\n${evaluation.researchAndCitation.comment}`,
      )
      addSection("Strengths", evaluation.strengths)
      addSection("Areas for Improvement", evaluation.areasForImprovement)
      addSection("Overall Comment", evaluation.overallComment)
    }

    doc.save("evaluation_results.pdf")
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card className="shadow-lg border-2">
          <CardContent className="p-6 space-y-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Country and Board Selection */}
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label htmlFor="countrySelect" className="text-base font-semibold">
                    Country
                  </Label>
                  <Select
                    value={country}
                    onValueChange={(value) => {
                      setCountry(value)
                      setBoard("")
                    }}
                  >
                    <SelectTrigger className="w-full h-11 bg-white">
                      <SelectValue placeholder="Select country..." />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.value} value={country.value}>
                          {country.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="boardSelect" className="text-base font-semibold">
                    Educational Board
                  </Label>
                  <Select value={board} onValueChange={setBoard}>
                    <SelectTrigger className="w-full h-11 bg-white">
                      <SelectValue placeholder="Select board..." />
                    </SelectTrigger>
                    <SelectContent>
                      {country &&
                        boardsByCountry[country]?.map((board) => (
                          <SelectItem key={board.value} value={board.value}>
                            {board.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Grade Level and Subject */}
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label htmlFor="gradeLevel" className="text-base font-semibold">
                    Grade Level
                  </Label>
                  <Select onValueChange={setGradeLevel} value={gradeLevel}>
                    <SelectTrigger id="gradeLevel" className="w-full h-11 bg-white">
                      <SelectValue placeholder="Select Grade Level" />
                    </SelectTrigger>
                    <SelectContent>
                      {[...Array(12)].map((_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          Grade {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-base font-semibold">
                    Subject
                  </Label>
                  <Select onValueChange={setSubject} value={subject}>
                    <SelectTrigger id="subject" className="w-full h-11 bg-white">
                      <SelectValue placeholder="Select Subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.value} value={subject.value}>
                          {subject.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Title and Description */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-base font-semibold">
                    Assignment Title
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter assignment title"
                    className="h-11 bg-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-base font-semibold">
                    Assignment Description
                  </Label>
                  <textarea
                    id="description"
                    className="min-h-[100px] w-full p-4 border rounded-md resize-y bg-white"
                    placeholder="Enter assignment description..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Assignment Input Section */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file" className="text-base font-semibold">
                    Assignment Submission
                  </Label>
                  <Input
                    id="file"
                    type="file"
                    accept="application/pdf,text/plain"
                    onChange={handleFileChange}
                    disabled={isLoading || inputMethod === "text"}
                    className={`h-11 bg-white cursor-${inputMethod === "text" ? "not-allowed" : "pointer"}`}
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or paste text</span>
                  </div>
                </div>

                <textarea
                  className="w-full min-h-[150px] p-4 border rounded-md bg-white resize-y"
                  placeholder="Enter assignment text here..."
                  value={assignmentText}
                  onChange={handleAssignmentTextChange}
                  disabled={isLoading || inputMethod === "file"}
                />
              </div>

              {/* Rubric Section */}
              <div className="space-y-4">
                <Label htmlFor="rubric" className="text-base font-semibold">
                  Rubric (Optional)
                </Label>
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
                        <TooltipContent>{getDisabledMessage("rubric", "file")}</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  {rubricFile && (
                    <Button type="button" variant="outline" size="sm" onClick={clearRubricFile}>
                      Clear
                    </Button>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-background px-2 text-muted-foreground text-sm">OR</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rubricText" className="text-base font-semibold">
                    Rubric Text
                  </Label>
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
                          <TooltipContent>{getDisabledMessage("rubric", "text")}</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    {rubricText && (
                      <Button type="button" variant="outline" size="sm" onClick={clearRubricText}>
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
                    {uploadProgress < 100 ? "Processing assignment..." : "Finalizing evaluation..."}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                disabled={(!file && !assignmentText) || !gradeLevel || !subject || !country || !board || isLoading}
                className="w-fit h-10 text-base font-semibold bg-rose-500 hover:bg-rose-600"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Evaluating...
                  </>
                ) : (
                  "Evaluate Assignment"
                )}
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
          <Card className="shadow-lg border-2">
            <CardHeader className="bg-muted/50 border-b">
              <CardTitle className="flex items-center justify-between text-2xl font-bold">
                Evaluation Results
                {typeof evaluation !== "string" && (
                  <span className="text-lg font-normal">Score: {evaluation.totalScore}/100</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {typeof evaluation === "string" ? (
                <div className="prose max-w-none">
                  <div className="p-4 bg-muted rounded-lg">
                    <Markdown>{evaluation}</Markdown>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {isEditing ? (
                    // Render editable fields
                    <div className="space-y-4">
                      {/* Content Understanding */}
                      <div>
                        <Label htmlFor="contentUnderstanding">Content Understanding</Label>
                        <Input
                          id="contentUnderstanding"
                          value={editedEvaluation?.contentUnderstanding.score || ""}
                          onChange={(e) => handleInputChange("contentUnderstanding", "score", e.target.value)}
                          type="number"
                          max="25"
                        />
                        <textarea
                          value={editedEvaluation?.contentUnderstanding.comment || ""}
                          onChange={(e) => handleInputChange("contentUnderstanding", "comment", e.target.value)}
                          className="w-full mt-2 p-2 border rounded"
                        />
                      </div>

                      {/* Critical Thinking */}
                      <div>
                        <Label htmlFor="criticalThinking">Critical Thinking</Label>
                        <Input
                          id="criticalThinking"
                          value={editedEvaluation?.criticalThinking.score || ""}
                          onChange={(e) => handleInputChange("criticalThinking", "score", e.target.value)}
                          type="number"
                          max="25"
                        />
                        <textarea
                          value={editedEvaluation?.criticalThinking.comment || ""}
                          onChange={(e) => handleInputChange("criticalThinking", "comment", e.target.value)}
                          className="w-full mt-2 p-2 border rounded"
                        />
                      </div>

                      {/* Structure and Organization */}
                      <div>
                        <Label htmlFor="structureAndOrganization">Structure and Organization</Label>
                        <Input
                          id="structureAndOrganization"
                          value={editedEvaluation?.structureAndOrganization.score || ""}
                          onChange={(e) => handleInputChange("structureAndOrganization", "score", e.target.value)}
                          type="number"
                          max="20"
                        />
                        <textarea
                          value={editedEvaluation?.structureAndOrganization.comment || ""}
                          onChange={(e) => handleInputChange("structureAndOrganization", "comment", e.target.value)}
                          className="w-full mt-2 p-2 border rounded"
                        />
                      </div>

                      {/* Language and Communication */}
                      <div>
                        <Label htmlFor="languageAndCommunication">Language and Communication</Label>
                        <Input
                          id="languageAndCommunication"
                          value={editedEvaluation?.languageAndCommunication.score || ""}
                          onChange={(e) => handleInputChange("languageAndCommunication", "score", e.target.value)}
                          type="number"
                          max="20"
                        />
                        <textarea
                          value={editedEvaluation?.languageAndCommunication.comment || ""}
                          onChange={(e) => handleInputChange("languageAndCommunication", "comment", e.target.value)}
                          className="w-full mt-2 p-2 border rounded"
                        />
                      </div>

                      {/* Research and Citation */}
                      <div>
                        <Label htmlFor="researchAndCitation">Research and Citation</Label>
                        <Input
                          id="researchAndCitation"
                          value={editedEvaluation?.researchAndCitation.score || ""}
                          onChange={(e) => handleInputChange("researchAndCitation", "score", e.target.value)}
                          type="number"
                          max="10"
                        />
                        <textarea
                          value={editedEvaluation?.researchAndCitation.comment || ""}
                          onChange={(e) => handleInputChange("researchAndCitation", "comment", e.target.value)}
                          className="w-full mt-2 p-2 border rounded"
                        />
                      </div>

                      {/* Strengths */}
                      <div>
                        <Label htmlFor="strengths">Strengths</Label>
                        <textarea
                          id="strengths"
                          value={editedEvaluation?.strengths || ""}
                          onChange={(e) => handleInputChange("strengths", "comment", e.target.value)}
                          className="w-full mt-2 p-2 border rounded"
                        />
                      </div>

                      {/* Areas for Improvement */}
                      <div>
                        <Label htmlFor="areasForImprovement">Areas for Improvement</Label>
                        <textarea
                          id="areasForImprovement"
                          value={editedEvaluation?.areasForImprovement || ""}
                          onChange={(e) => handleInputChange("areasForImprovement", "comment", e.target.value)}
                          className="w-full mt-2 p-2 border rounded"
                        />
                      </div>

                      {/* Overall Comment */}
                      <div>
                        <Label htmlFor="overallComment">Overall Comment</Label>
                        <textarea
                          id="overallComment"
                          value={editedEvaluation?.overallComment || ""}
                          onChange={(e) => handleInputChange("overallComment", "comment", e.target.value)}
                          className="w-full mt-2 p-2 border rounded"
                        />
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button onClick={handleSave}>Save</Button>
                        <Button onClick={handleCancel} variant="outline">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Render evaluation results
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
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button onClick={handleEdit} disabled={isEditing}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button onClick={handleDownloadPDF}>
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  )
}
