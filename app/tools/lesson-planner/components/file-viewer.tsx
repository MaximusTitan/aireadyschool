interface FileViewerProps {
  file: {
    name: string;
    type: string;
    url: string;
    id: string;
  };
  onDelete?: (id: string) => void;
  canDelete?: boolean;
}

export function FileViewer({ file, onDelete, canDelete }: FileViewerProps) {
  const isOfficeFile = file.name.match(/\.(docx?|pptx?|xlsx?)$/i);
  const isGoogleSlides =
    file.url.includes("docs.google.com/presentation") ||
    file.name.includes("docs.google.com/presentation");
  const isYouTube =
    file.url.includes("youtube.com") ||
    file.url.includes("youtu.be") ||
    file.name.includes("youtube.com") ||
    file.name.includes("youtu.be");

  let embedUrl = "";

  if (isGoogleSlides) {
    embedUrl = `${file.name.includes("docs.google.com/presentation") ? file.name : file.url}/embed`;
  } else if (isYouTube) {
    // Convert YouTube URLs to embed format
    const url =
      file.name.includes("youtube.com") || file.name.includes("youtu.be")
        ? file.name
        : file.url;

    // Handle youtube.com/watch?v= format
    if (url.includes("youtube.com/watch")) {
      const videoId = new URL(url).searchParams.get("v");
      if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
    }
    // Handle youtu.be/ format
    else if (url.includes("youtu.be")) {
      const videoId = url.split("youtu.be/")[1]?.split("?")[0];
      if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
    }
    // If it's already an embed URL, use it directly
    else if (url.includes("youtube.com/embed")) {
      embedUrl = url;
    }
    // Fallback
    else {
      embedUrl = url;
    }
  } else if (isOfficeFile) {
    embedUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.url)}`;
  } else {
    embedUrl = file.url;
  }

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 truncate" title={file.name}>
            {file.name}
          </h4>
          <p className="text-sm text-gray-500 mt-1">{file.type}</p>
        </div>
        {canDelete && onDelete && (
          <button
            onClick={() => onDelete(file.id)}
            className="text-gray-400 hover:text-red-500 transition-colors"
            title="Delete file"
          >
            ×
          </button>
        )}
      </div>

      {isOfficeFile || isGoogleSlides || isYouTube ? (
        <div className="aspect-video w-full">
          <iframe
            src={embedUrl}
            className="w-full h-full border-0"
            title={file.name}
            allowFullScreen={isYouTube}
          />
        </div>
      ) : (
        <a
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
        >
          View File
          <svg
            className="w-4 h-4 ml-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      )}
    </div>
  );
}
