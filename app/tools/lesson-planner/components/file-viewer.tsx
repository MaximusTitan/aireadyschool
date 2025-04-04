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
  const embedUrl = isGoogleSlides
    ? `${isGoogleSlides ? (file.name.includes("docs.google.com/presentation") ? file.name : file.url) : ""}/embed`
    : isOfficeFile
      ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file.url)}`
      : file.url;

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

      {isOfficeFile || isGoogleSlides ? (
        <div className="aspect-video w-full">
          <iframe
            src={embedUrl}
            className="w-full h-full border-0"
            title={file.name}
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
