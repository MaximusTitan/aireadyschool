import { type Slide } from "../types/presentation"

interface YouTubeSlideProps {
  slide: Slide
  theme: string
  isEditing?: boolean
  onTitleChange?: (value: string) => void
  presentationTopic?: string
}

const themeStyles = {
  modern: "bg-gradient-to-b from-white/0 to-gray-100/0",
  corporate: "bg-gradient-to-b from-gray-50/0 to-gray-200/0",
  creative: "bg-gradient-to-r from-purple-500 to-pink-500",
  minimal: "bg-transparent",
  dark: "bg-gradient-to-b from-gray-900 to-black"
}

export function YouTubeSlide({ slide, theme, presentationTopic }: YouTubeSlideProps) {
  const bgStyle = themeStyles[theme as keyof typeof themeStyles] || themeStyles.modern;

  return (
    <div className={`w-full h-full flex flex-col items-center justify-center ${bgStyle}`}>
      {presentationTopic && (
        <h3 className={`mb-6 text-xl font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>
          {presentationTopic}
        </h3>
      )}
      <div className="w-full max-w-4xl aspect-video rounded-lg overflow-hidden">
        <div className="relative w-full h-0 pb-[56.25%] bg-transparent">
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src={slide.videoUrl}
            title="YouTube video player"
            frameBorder="0"
            style={{ 
              backgroundColor: 'transparent',
              boxShadow: 'none'
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}