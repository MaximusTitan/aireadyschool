import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Presentation Not Found</h1>
        <p className="text-muted-foreground">The presentation you're looking for doesn't exist or has been removed.</p>
        <Link href="/">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Generator
          </Button>
        </Link>
      </div>
    </div>
  )
}

