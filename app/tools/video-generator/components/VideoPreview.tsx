interface VideoPreviewProps {
  videoUrl: string;
}

export function VideoPreview({ videoUrl }: VideoPreviewProps) {
  return (
    <div id="generated-video" className="mb-6">
      <h2 className="text-lg font-bold text-neutral-500 mb-2">
        Your Generated Video
      </h2>
      <video
        src={videoUrl}
        controls
        className="w-full rounded-lg shadow-lg"
        autoPlay
        loop
      />
      <p className="text-sm text-gray-500 mt-2">
        Tip: Download the video by clicking the three dots on the video player.
      </p>
    </div>
  );
}
