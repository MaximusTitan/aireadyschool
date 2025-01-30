import { GeneratedText } from "./GeneratedText"
import { GeneratedImage } from "./GeneratedImage"
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card"

interface GeneratedContentProps {
  text: string
  imageUrl?: string
  title: string
}

export function GeneratedContent({ text, imageUrl, title }: GeneratedContentProps) {
  return (
    <div>
      <CardHeader className="p-6 pb-0">
        <CardTitle className="text-2xl font-semibold text-gray-900">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 min-w-0">
            <GeneratedText text={text} />
          </div>
          {imageUrl && (
            <div className="lg:w-[400px] shrink-0">
              <div className="sticky top-6">
                <GeneratedImage imageUrl={imageUrl} />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </div>
  )
}

