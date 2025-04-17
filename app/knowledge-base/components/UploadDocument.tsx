// UploadDocument.tsx
"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, ArrowLeft } from "lucide-react"
import React from "react"

type Props = {
  title: string
  description: string
  board: string
  grade: string
  section: string
  subject: string
  availableGrades: string[]
  availableSections: string[]
  availableSubjects: string[]
  uploadedFile: File | null
  isDragging: boolean
  boards: string[]
  setTitle: (value: string) => void
  setDescription: (value: string) => void
  setBoard: (value: string) => void
  setGrade: (value: string) => void
  setSection: (value: string) => void
  setSubject: (value: string) => void
  setUploadedFile: (file: File | null) => void
  setIsUploadView: (value: boolean) => void
  handleSubmit: (e: React.FormEvent) => void
  handleDragOver: (e: React.DragEvent) => void
  handleDragLeave: (e: React.DragEvent) => void
  handleDrop: (e: React.DragEvent) => void
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function UploadDocument({
  title,
  description,
  board,
  grade,
  section,
  subject,
  availableGrades,
  availableSections,
  availableSubjects,
  uploadedFile,
  isDragging,
  boards,
  setTitle,
  setDescription,
  setBoard,
  setGrade,
  setSection,
  setSubject,
  setUploadedFile,
  setIsUploadView,
  handleSubmit,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleFileChange,
}: Props) {
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

        <h1 className="text-2xl font-semibold text-pink-600 mb-8">Upload New Document</h1>

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
