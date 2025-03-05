"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { generateEventAnnouncement } from "../actions"
import { Loader2, Calendar, Clock, MapPin, User, Mail, ChevronLeft, Edit, Download } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { jsPDF } from "jspdf"
import { Header } from "../common/Header"

export default function Page() {
  const [loading, setLoading] = useState(false)
  const [output, setOutput] = useState("")
  const [error, setError] = useState("")
  const [eventType, setEventType] = useState("academic")
  const [isEditing, setIsEditing] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setOutput("")

    const formData = new FormData(e.currentTarget)
    const eventName = formData.get("eventName") as string
    const eventDate = formData.get("eventDate") as string
    const eventTime = formData.get("eventTime") as string
    const eventLocation = formData.get("eventLocation") as string
    const eventDescription = formData.get("eventDescription") as string
    const contactPerson = formData.get("contactPerson") as string
    const contactEmail = formData.get("contactEmail") as string

    const details = `
      Event Name: ${eventName}
      Date: ${eventDate}
      Time: ${eventTime}
      Location: ${eventLocation}
      Description: ${eventDescription}
      Contact Person: ${contactPerson}
      Contact Email: ${contactEmail}
    `

    try {
      const response = await generateEventAnnouncement(eventType, details)
      if (response.success) {
        setOutput(response.content)
      } else {
        setError(response.error || "Failed to generate announcement")
      }
    } catch (err) {
      console.error("Error in announcement generation:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  function handleEdit() {
    setIsEditing(true)
  }

  function handleSaveEdit() {
    setIsEditing(false)
  }

  function handleDownloadPDF() {
    const doc = new jsPDF()
    doc.text(output, 10, 10)
    doc.save("event-announcement.pdf")
  }

  return (
    <div className="min-h-screen bg-backgroundApp dark:bg-neutral-950">
      <Header
        title="Event Announcement Generator"
        description="Generate engaging announcements for school events, activities, and important dates. This tool helps you create professional and informative event announcements for your school community."
      />
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="space-y-6 min-h-screen pb-8">
            <div className="mx-auto bg-white p-6 rounded-lg border">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="eventType">Event Type</Label>
                  <Select value={eventType} onValueChange={setEventType}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="academic">Academic Event</SelectItem>
                      <SelectItem value="cultural">Cultural Event</SelectItem>
                      <SelectItem value="sports">Sports Event</SelectItem>
                      <SelectItem value="parent">Parent-Teacher Meeting</SelectItem>
                      <SelectItem value="fundraiser">Fundraiser</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventName">Event Name</Label>
                  <Input id="eventName" name="eventName" placeholder="Enter the name of the event" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="eventDate">Event Date</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input id="eventDate" name="eventDate" type="date" className="pl-10" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="eventTime">Event Time</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input id="eventTime" name="eventTime" type="time" className="pl-10" required />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventLocation">Event Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      id="eventLocation"
                      name="eventLocation"
                      placeholder="Enter the location of the event"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventDescription">Event Description</Label>
                  <Textarea
                    id="eventDescription"
                    name="eventDescription"
                    placeholder="Provide a brief description of the event..."
                    required
                    className="min-h-[100px]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactPerson">Contact Person</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        id="contactPerson"
                        name="contactPerson"
                        placeholder="Name of contact person"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        id="contactEmail"
                        name="contactEmail"
                        type="email"
                        placeholder="Contact email address"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Generate Announcement
                </Button>
              </form>

              {error && <div className="text-red-500 text-sm">{error}</div>}

              {output && (
                <Card className="mt-6">
                  <CardContent className="pt-6">
                    <div className="prose max-w-none">
                      <h3 className="text-lg font-semibold mb-2">Generated Announcement:</h3>
                      {isEditing ? (
                        <div className="space-y-4">
                          <Textarea value={output} onChange={(e) => setOutput(e.target.value)} className="min-h-[200px]" />
                          <Button onClick={handleSaveEdit}>Save</Button>
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded-md border border-gray-200">{output}</div>
                      )}
                      <div className="mt-4 flex space-x-4">
                        <Button onClick={handleEdit} disabled={isEditing}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button onClick={handleDownloadPDF}>
                          <Download className="mr-2 h-4 w-4" />
                          Download PDF
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
        </div>
      </div>
    </div>
  )
}
