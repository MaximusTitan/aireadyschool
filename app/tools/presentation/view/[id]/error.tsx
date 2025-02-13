"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, RefreshCcw } from "lucide-react"
import Link from "next/link"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Something went wrong!</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          {error.message || "There was an error loading the presentation. Please try again."}
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={reset}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Try again
          </Button>
          <Link href="/tools/presentation">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Generator
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
