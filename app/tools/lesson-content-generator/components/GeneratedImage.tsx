import Image from "next/image"

interface GeneratedImageProps {
  imageUrl: string
}

export function GeneratedImage({ imageUrl }: GeneratedImageProps) {
  return (
    <div className="space-y-2"> <br /><br /><br />
      <div className="rounded-lg overflow-hidden border border-gray-200">
        <div className="relative aspect-square">
          <Image
            src={imageUrl || "/placeholder.svg"}
            alt="Generated image"
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 400px, 100vw"
          />
        </div>
      </div>
    </div>
  )
}

