import { Suspense } from "react"
import OutputContent from "./output-content"

export default function OutputPage() {
  return (
    <div className="min-h-screen bg-pink-50/30">
      <Suspense fallback={<div>Loading...</div>}>
        <OutputContent />
      </Suspense>
    </div>
  )
}