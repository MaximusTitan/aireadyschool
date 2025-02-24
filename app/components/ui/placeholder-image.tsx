export function PlaceholderImage({ text, width = 1024, height = 1024 }: { text: string, width?: number, height?: number }) {
  return (
    <div 
      className="flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded-lg"
      style={{ width: width, height: height }}
    >
      <p className="text-center text-gray-500 dark:text-gray-400 p-4">
        {decodeURIComponent(text)}
      </p>
    </div>
  )
}
