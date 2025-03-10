import { Suspense } from "react"
import OutputContent from "./output-content"

export default function OutputPage() {
  return (
    <div className="min-h-screen bg-white">
      
      <Suspense fallback={<div className="container mx-auto p-8 text-center">Loading lesson plan...</div>}>
        <OutputContent />
      </Suspense>
    </div>
  )
}
