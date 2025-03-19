import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { useAudioSettings } from "@/app/tools/buddy/hooks/useAudioSettings";
import { useLanguageSettings } from "@/app/tools/buddy/hooks/useLanguageSettings";

const GIF_URLS = {
  constant:
    "https://xndjwmkypyilvkyczvbj.supabase.co/storage/v1/object/public/store//o-constant.gif",
  talking:
    "https://xndjwmkypyilvkyczvbj.supabase.co/storage/v1/object/public/store//o-talking-small.gif",
  thinking:
    "https://xndjwmkypyilvkyczvbj.supabase.co/storage/v1/object/public/store//O-Thinking.gif",
};

const usePreloadImages = (urls: string[]) => {
  useEffect(() => {
    urls.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }, []);
};

interface BuddyPanelProps {
  messages: any[];
  isLoading: boolean;
}

export function BuddyPanel({ messages, isLoading }: BuddyPanelProps) {
  usePreloadImages(Object.values(GIF_URLS));

  const [lastMessageTime, setLastMessageTime] = useState<number | null>(null);
  const [isTalking, setIsTalking] = useState(false);
  const { isAudioEnabled, toggleAudio, stopAudio } = useAudioSettings();
  const { language } = useLanguageSettings();

  useEffect(() => {
    if (messages.length > 0) {
      const currentTime = Date.now();
      setLastMessageTime(currentTime);
      setIsTalking(true);

      const timer = setTimeout(() => {
        setIsTalking(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [messages]);

  const getGifSource = () => {
    if (!lastMessageTime || messages.length === 0) {
      return GIF_URLS.constant;
    }

    if (isLoading) {
      return GIF_URLS.thinking;
    }

    if (isTalking) {
      return GIF_URLS.talking;
    }

    return GIF_URLS.constant;
  };

  const handleAudioButtonClick = () => {
    toggleAudio();
  };

  return (
    <div className="relative p-4 flex flex-col items-center">
      <img
        src={getGifSource()}
        alt="AI Assistant"
        className="w-32 h-32 object-contain"
      />
      <div className="mt-2">
        <button
          onClick={handleAudioButtonClick}
          className="flex items-center gap-2 px-3 py-2 rounded-full bg-white hover:bg-gray-50 transition-colors border border-gray-200"
          title={isAudioEnabled ? "Disable audio" : "Enable audio"}
        >
          {isAudioEnabled ? (
            <>
              <Volume2 className="h-4 w-4" />
              <span className="text-sm">
                {language === "english" ? "Audio On" : "ऑडियो चालू"}
              </span>
            </>
          ) : (
            <>
              <VolumeX className="h-4 w-4" />
              <span className="text-sm">
                {language === "english" ? "Audio Off" : "ऑडियो बंद"}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
