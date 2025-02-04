"use client"

import { useState } from "react"
import { ResearchAssistant } from "./components/research-assistant"
import { ResearchSidebar } from "./components/research-sidebar"
import { Inter } from "next/font/google"
import { ErrorBoundaryWrapper } from "./components/error-boundary-wrapper"
import { ResearchEntry } from "./types"

const inter = Inter({ subsets: ["latin"] })

export default function Home() {
  const [researchContent, setResearchContent] = useState("")
  const [selectedResearch, setSelectedResearch] = useState<ResearchEntry | undefined>(undefined)

  const handleNewChat = () => {
    setSelectedResearch(undefined)
    setResearchContent("")
  }

  const handleSelectResearch = (research: ResearchEntry) => {
    setSelectedResearch(research)
    setResearchContent(research.response)
  }

  return (
    <div className={`flex ${inter.className}`}>
      <ResearchSidebar onNewChat={handleNewChat} onSelectResearch={handleSelectResearch} />
      <div className="flex-1 p-4">
        <ErrorBoundaryWrapper>
          <ResearchAssistant
            onContentUpdate={setResearchContent}
            initialResearch={selectedResearch}
            onNewResearch={handleNewChat}
          />
        </ErrorBoundaryWrapper>
      </div>
    </div>
  )
}

