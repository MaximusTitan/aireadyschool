"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { ArrowLeft, Plus, type File, Upload } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/utils/supabase/client"

type KnowledgeBaseRecord = {
  id: string
  title: string
  description: string
  file_url: string
  education_board: string
  grade: string
  subject: string
  topic: string
  section: string
}

export default function KnowledgeBase() {
  const [isUploadView, setIsUploadView] = useState(false)
  const [board, setBoard] = useState("")
  const [grade, setGrade] = useState("")
  const [section, setSection] = useState("")
  const [subject, setSubject] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [records, setRecords] = useState<KnowledgeBaseRecord[]>([])

  const [availableGrades, setAvailableGrades] = useState<string[]>([])
  const [availableSections, setAvailableSections] = useState<string[]>([])
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([])

  const boards = ["All", "CBSE", "ICSE", "CAIE"]
  const supabase = createClient()

  // When board is selected, set available grades and reset lower filters.
  // When board is selected, update available grades and reset lower filters
  useEffect(() => {
    if (board && board !== "All") {
      const grades: string[] = ["All", ...Array.from({ length: 12 }, (_, i) => (i + 1).toString())]
      setAvailableGrades(grades)
      setGrade("All")
      setSection("All")
      setSubject("All")
    } else {
      setAvailableGrades(["All"])
      setGrade("All")
      setSection("All")
      setSubject("All")
    }
  }, [board])

  // When grade is selected, update available sections and reset lower filters
  useEffect(() => {
    let sections: string[] = []
    if (board && grade && grade !== "All") {
      if (Number.parseInt(grade) <= 5) {
        sections = ["A", "B", "C"]
      } else if (Number.parseInt(grade) <= 10) {
        sections = ["A", "B", "C", "D"]
      } else {
        sections = ["Science", "Commerce", "Arts"]
      }
    }
    setAvailableSections(["All", ...sections])
    setSection("All")
    setSubject("All")
  }, [board, grade])

  // When section is selected, set available subjects and reset subject.
  useEffect(() => {
    if (board && grade) {
      let subjects: string[] = []
      if (board === "CBSE" || board === "ICSE" || board === "CAIE") {
        if (Number.parseInt(grade) <= 5) {
          subjects = ["English", "Hindi", "Mathematics", "Environmental Studies", "Arts"]
        } else if (Number.parseInt(grade) <= 8) {
          subjects = ["English", "Hindi", "Mathematics", "Science", "Social Science", "Arts"]
        } else if (Number.parseInt(grade) <= 10) {
          subjects = [
            "English",
            "Hindi or Regional Language",
            "Mathematics",
            "Science",
            "Social Science",
            "Information Technology (Optional)",
          ]
        } else {
          if (section === "Science") {
            subjects = [
              "English Core",
              "Physics",
              "Chemistry",
              "Mathematics",
              "Biology",
              "Computer Science",
              "Physical Education",
            ]
          } else if (section === "Commerce") {
            subjects = [
              "English Core",
              "Accountancy",
              "Business Studies",
              "Economics",
              "Mathematics",
              "Informatics Practices",
              "Physical Education",
            ]
          } else if (section === "Arts") {
            subjects = [
              "English Core",
              "History",
              "Political Science",
              "Geography",
              "Economics",
              "Psychology",
              "Physical Education",
            ]
          } else {
            subjects = [
              "English Core",
              "Physics",
              "Chemistry",
              "Mathematics",
              "Biology",
              "Computer Science",
              "Accountancy",
              "Business Studies",
              "Economics",
              "History",
              "Political Science",
              "Geography",
              "Psychology",
              "Physical Education",
            ]
          }
        }
      }
      setAvailableSubjects(["All", ...subjects])
      setSubject("")
    } else {
      setAvailableSubjects([])
    }
  }, [board, grade, section])

  // Always fetch records so that when no filter is selected, all records are shown.
  useEffect(() => {
    console.log("Fetching records with filters:", { board, grade, section, subject })
    fetchRecords()
  }, [board, grade, section, subject])

  const fetchRecords = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      console.error("User is not authenticated")
      return
    }
  
    let query = supabase.from("knowledge_base").select("*")
  
    if (board && board !== "All") {
      query = query.eq("education_board", board)
    }
    if (grade && grade !== "All") {
      query = query.eq("grade", grade)
    }
    if (section && section !== "All") {
      query = query.eq("section", section)
    }
    if (subject && subject !== "All") {
      query = query.eq("subject", subject)
    }
  
    const { data, error } = await query
  
    if (error) {
      console.error("Error fetching records:", error)
    } else {
      setRecords(data)
    }
  }  

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadedFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !board || !grade || !section || !uploadedFile) {
      alert("Please fill in all required fields")
      return
    }

    const formDataUpload = new FormData()
    formDataUpload.append("title", title)
    formDataUpload.append("board", board)
    formDataUpload.append("grade", grade)
    formDataUpload.append("section", section)
    formDataUpload.append("subject", subject)
    formDataUpload.append("description", description)
    formDataUpload.append("file", uploadedFile)

    try {
      const res = await fetch("/api/knowledge-base", {
        method: "POST",
        body: formDataUpload,
      })

      if (res.ok) {
        setIsUploadView(false)
        // Reset form fields
        setTitle("")
        setDescription("")
        setUploadedFile(null)
        // Re-fetch records after upload
        fetchRecords()
      } else {
        console.error("Upload failed")
      }
    } catch (error) {
      console.error("Error uploading:", error)
    }
  }

  if (isUploadView) {
    return (
      <div className="min-h-screen bg-pink-50/50 p-6">
        <div className="max-w-3xl mx-auto">
          <Button
            variant="ghost"
            className="mb-6 text-gray-600 hover:text-gray-900"
            onClick={() => setIsUploadView(false)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <h1 className="text-2xl font-semibold text-pink-600 mb-8">Upload New Resource</h1>

          <div className="bg-white border-2 border-purple-100 rounded-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Document Title</Label>
                <Input
                  id="title"
                  placeholder="Enter Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="border-gray-200"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Input text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[100px] border-gray-200"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="board">Education Board</Label>
                <Select value={board} onValueChange={setBoard}>
                <SelectTrigger className="border-gray-200">
                  <SelectValue placeholder="Select Board" />
                </SelectTrigger>
                <SelectContent>
                  {boards.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="grade">Grade</Label>
                <Select value={grade} onValueChange={setGrade} disabled={!board}>
                <SelectTrigger className="border-gray-200">
                  <SelectValue placeholder="Select Grade" />
                </SelectTrigger>
                <SelectContent>
                  {availableGrades.map((g) => (
                    <SelectItem key={g} value={g}>
                      Grade {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="section">Section</Label>
                <Select value={section} onValueChange={setSection} disabled={!grade}>
                  <SelectTrigger id="section" className="border-gray-200">
                    <SelectValue placeholder="Select Section" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSections.map((s) => (
                      <SelectItem key={s} value={s}>
                        Section {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select value={subject} onValueChange={setSubject} disabled={!section}>
                  <SelectTrigger id="subject" className="border-gray-200">
                    <SelectValue placeholder="Select Subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableSubjects.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Upload file</Label>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center ${
                    isDragging ? "border-pink-500 bg-pink-50" : "border-gray-200"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-gray-400" />
                    <p className="text-sm text-gray-600">Drop files here</p>
                    <p className="text-xs text-gray-400">Supported format: PNG, JPG</p>
                    <p className="text-sm text-gray-500 mt-2">OR</p>
                    <label className="text-pink-500 hover:text-pink-600 cursor-pointer text-sm">
                      Browse files
                      <input type="file" className="hidden" onChange={handleFileChange} accept="image/png,image/jpeg" />
                    </label>
                  </div>
                  {uploadedFile && <div className="mt-4 text-sm text-gray-600">Selected: {uploadedFile.name}</div>}
                </div>
              </div>

              <Button type="submit" className="bg-pink-500 hover:bg-pink-600 text-white">
                Save
              </Button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-pink-50/50 p-6">
      <div className="max-w-7xl mx-auto">
      <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Knowledge Base
          </h2>
        </div>

        <div className="mb-8">
          <Button onClick={() => setIsUploadView(true)} className="bg-pink-500 hover:bg-pink-600 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Resources
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="w-full md:w-1/4">
            <Select value={board} onValueChange={setBoard}>
              <SelectTrigger className="border-gray-200">
                <SelectValue placeholder="Select Board" />
              </SelectTrigger>
              <SelectContent>
                {boards.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-1/4">
            <Select value={grade} onValueChange={setGrade} disabled={!board}>
              <SelectTrigger className="border-gray-200">
                <SelectValue placeholder="Select Grade" />
              </SelectTrigger>
              <SelectContent>
                {availableGrades.map((g) => (
                  <SelectItem key={g} value={g}>
                    Grade {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-1/4">
            <Select value={section} onValueChange={setSection} disabled={!grade}>
              <SelectTrigger className="border-gray-200">
                <SelectValue placeholder="Select Section" />
              </SelectTrigger>
              <SelectContent>
                {availableSections.map((s) => (
                  <SelectItem key={s} value={s}>
                    Section {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-1/4">
            <Select value={subject} onValueChange={setSubject} disabled={!section}>
              <SelectTrigger className="border-gray-200">
                <SelectValue placeholder="Select Subject" />
              </SelectTrigger>
              <SelectContent>
                {availableSubjects.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-white border-2 border-purple-100 rounded-lg p-6 overflow-x-auto">
          {records.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium text-gray-600">Board</th>
                  <th className="text-left p-4 font-medium text-gray-600">Document Title</th>
                  <th className="text-left p-4 font-medium text-gray-600">Grade</th>
                  <th className="text-left p-4 font-medium text-gray-600">Subject</th>
                  <th className="text-left p-4 font-medium text-gray-600">Section</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-b last:border-b-0">
                    <td className="p-4">{record.education_board}</td>
                    <td className="p-4">
                      <a
                        href={record.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700 underline"
                      >
                        {record.title}
                      </a>
                    </td>
                    <td className="p-4">{`${record.grade}th Grade`}</td>
                    <td className="p-4">{record.subject}</td>
                    <td className="p-4">{record.section}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center text-gray-500 p-4">No resources uploaded yet for the selected filters.</div>
          )}
        </div>
      </div>
    </div>
  )
}
