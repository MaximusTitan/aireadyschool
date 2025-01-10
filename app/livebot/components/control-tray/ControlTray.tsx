import { memo, ReactNode, RefObject, useEffect, useRef, useState } from "react";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { UseMediaStreamResult } from "../../hooks/use-media-stream-mux";
import { useScreenCapture } from "../../hooks/use-screen-capture";
import { useWebcam } from "../../hooks/use-webcam";
import { AudioRecorder } from "../../lib/audio-recorder";
import {
  Mic,
  MicOff,
  X,
  Presentation,
  Video,
  VideoOff,
  Pause,
  Play,
} from "lucide-react";

interface MediaStreamButtonProps {
  isStreaming: boolean;
  Icon: typeof Video | typeof Presentation;
  OffIcon: typeof VideoOff | typeof X;
  start: () => Promise<void>;
  stop: () => void;
}

interface ControlTrayProps {
  videoRef: RefObject<HTMLVideoElement>;
  children?: ReactNode;
  supportsVideo: boolean;
  onVideoStreamChange?: (stream: MediaStream | null) => void;
}

const MediaStreamButton = memo(
  ({ isStreaming, Icon, OffIcon, start, stop }: MediaStreamButtonProps) => (
    <button
      className="flex items-center justify-center bg-neutral-200 text-neutral-600 transition-all duration-200 w-12 h-12 rounded-lg border border-transparent hover:border-neutral-200 focus:border-neutral-200 focus:outline-none"
      onClick={isStreaming ? stop : start}
    >
      {isStreaming ? <OffIcon size={24} /> : <Icon size={24} />}
    </button>
  )
);

MediaStreamButton.displayName = "MediaStreamButton";

function ControlTray({
  videoRef,
  children,
  onVideoStreamChange = () => {},
  supportsVideo,
}: ControlTrayProps) {
  const videoStreams = [useWebcam(), useScreenCapture()];
  const [activeVideoStream, setActiveVideoStream] =
    useState<MediaStream | null>(null);
  const [webcam, screenCapture] = videoStreams;
  const [inVolume, setInVolume] = useState(0);
  const [audioRecorder] = useState(() => new AudioRecorder());
  const [muted, setMuted] = useState(false);
  const renderCanvasRef = useRef<HTMLCanvasElement>(null);
  const connectButtonRef = useRef<HTMLButtonElement>(null);
  const { client, connected, connect, disconnect } = useLiveAPIContext();

  useEffect(() => {
    if (!connected && connectButtonRef.current) {
      connectButtonRef.current.focus();
    }
  }, [connected]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--volume",
      `${Math.max(5, Math.min(inVolume * 200, 8))}px`
    );
  }, [inVolume]);

  useEffect(() => {
    const onData = (base64: string) => {
      client.sendRealtimeInput([
        {
          mimeType: "audio/pcm;rate=16000",
          data: base64,
        },
      ]);
    };

    if (connected && !muted && audioRecorder) {
      audioRecorder.on("data", onData).on("volume", setInVolume).start();
      return () => {
        audioRecorder.off("data", onData).off("volume", setInVolume).stop();
      };
    }
  }, [connected, client, muted, audioRecorder]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = activeVideoStream;
    }

    let animationFrameId: number;
    let timeoutId: number;

    const sendVideoFrame = () => {
      const video = videoRef.current;
      const canvas = renderCanvasRef.current;

      if (!video || !canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = video.videoWidth * 0.25;
      canvas.height = video.videoHeight * 0.25;

      if (canvas.width && canvas.height) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL("image/jpeg", 1.0);
        const data = base64.slice(base64.indexOf(",") + 1);
        client.sendRealtimeInput([{ mimeType: "image/jpeg", data }]);
      }

      if (connected) {
        timeoutId = window.setTimeout(() => {
          animationFrameId = requestAnimationFrame(sendVideoFrame);
        }, 2000); // 0.5 FPS
      }
    };

    if (connected && activeVideoStream) {
      animationFrameId = requestAnimationFrame(sendVideoFrame);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(timeoutId);
    };
  }, [connected, activeVideoStream, client, videoRef]);

  const changeStreams = (next?: UseMediaStreamResult) => async () => {
    try {
      if (next) {
        const mediaStream = await next.start();
        setActiveVideoStream(mediaStream);
        onVideoStreamChange(mediaStream);
      } else {
        setActiveVideoStream(null);
        onVideoStreamChange(null);
      }

      videoStreams
        .filter((stream) => stream !== next)
        .forEach((stream) => stream.stop());
    } catch (error) {
      console.error("Failed to change media stream:", error);
    }
  };

  return (
    <section className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex justify-center items-start gap-2.5 pb-4">
      <canvas className="hidden" ref={renderCanvasRef} />
      <nav
        className={`flex space-x-3 items-center ${
          !connected ? "opacity-50" : ""
        }`}
      >
        <button
          className="flex items-center justify-center bg-red-500 text-black transition-colors duration-200 w-12 h-12 rounded-lg border-2 border-neutral-200 focus:outline-none focus:ring-2 focus:ring-red-500"
          onClick={() => setMuted(!muted)}
        >
          {muted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>

        {supportsVideo && (
          <>
            <MediaStreamButton
              isStreaming={screenCapture.isStreaming}
              Icon={Presentation}
              OffIcon={X}
              start={changeStreams(screenCapture)}
              stop={changeStreams()}
            />
            <MediaStreamButton
              isStreaming={webcam.isStreaming}
              Icon={Video}
              OffIcon={VideoOff}
              start={changeStreams(webcam)}
              stop={changeStreams()}
            />
          </>
        )}
        {children}
      </nav>

      <div
        className={`flex flex-col items-center gap-1 ${
          connected ? "connected" : ""
        }`}
      >
        <div className="flex items-center justify-center bg-neutral-50 border border-neutral-300 rounded-full p-2">
          <button
            ref={connectButtonRef}
            className={`flex items-center justify-center bg-blue-500 text-neutral-50 transition-colors duration-200 w-12 h-12 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              connected ? "bg-blue-800 text-blue-500" : ""
            }`}
            onClick={connected ? disconnect : connect}
          >
            {connected ? <Pause size={24} /> : <Play size={24} />}
          </button>
        </div>
        <span className="text-xs text-blue-500 select-none">Streaming</span>
      </div>
    </section>
  );
}

export default memo(ControlTray);
