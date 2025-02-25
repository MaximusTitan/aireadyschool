import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { KnowledgeBaseRecord } from "../page"

interface DocumentViewerProps {
  document: KnowledgeBaseRecord
  onBack: () => void
}

export function DocumentViewer({ document, onBack }: DocumentViewerProps) {
  const isImageFile = document.file_url.match(/\.(jpg|jpeg|png|gif)$/i)

  return (
    <div className="h-screen bg-pink-50/50 p-6">
      <div className="max-w-7xl mx-auto">
        <Button variant="ghost" className="mb-6 text-gray-600 hover:text-gray-900" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Document Viewer */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {isImageFile ? (
              <img
                src={document.file_url || "/placeholder.svg"}
                alt={document.title}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-[600px] relative [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 hover:[&::-webkit-scrollbar-thumb]:bg-gray-300">
                <iframe
                  src={document.file_url}
                  className="absolute inset-0 w-full h-full"
                  title={document.title}
                  style={{
                    border: "none",
                    backgroundColor: "white",
                  }}
                />
              </div>
            )}
          </div>

          {/* Document Info */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-gray-900">{document.title}</h1>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <Badge variant="outline" className="text-gray-600">
                {document.education_board}
              </Badge>
              <Badge variant="outline" className="text-gray-600">
                {document.grade}th Grade
              </Badge>
              <Badge variant="outline" className="text-gray-600 uppercase">
                Section {document.section}
              </Badge>
            </div>

            <p className="text-gray-600 leading-relaxed">
              {document.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

