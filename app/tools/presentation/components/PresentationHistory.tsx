import type { Presentation } from "../types/presentation"
import { HistoryDialog } from "./HistoryDialog"

interface PresentationHistoryProps {
  presentations: Presentation[]
  onSelect: (presentation: Presentation) => void
  isLoading?: boolean
}

export function PresentationHistory({ presentations, onSelect, isLoading }: PresentationHistoryProps) {
  return (
    <div className="mb-8">
      <HistoryDialog
        presentations={presentations}
        onSelect={onSelect}
        isLoading={isLoading}
      />
    </div>
  )
}
