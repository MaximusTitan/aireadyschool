import { ArrowUpIcon, MicIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useRef, KeyboardEvent } from "react";
import { useLanguageSettings } from "@/app/tools/gen-chat/hooks/useLanguageSettings";
import { cn } from "@/lib/utils";
import { ElevenLabsClient } from "elevenlabs";

const AVAILABLE_COMMANDS = [
  {
    command: "/math",
    description: "Generate math problems",
    examples: ["/math easy addition", "/math medium multiplication"],
  },
  {
    command: "/quiz",
    description: "Create interactive quizzes",
    examples: ["/quiz science easy", "/quiz history medium"],
  },
  {
    command: "/image",
    description: "Generate educational images",
    examples: ["/image solar system realistic", "/image cell structure vector"],
  },
  {
    command: "/visualize",
    description: "Generate interactive visualizations",
    examples: ["/visualize physics gravity", "/visualize biology cell"],
  },
  {
    command: "/mindmap",
    description: "Generate mind maps",
    examples: ["/mindmap machine learning", "/mindmap solar system"],
  },
];

const placeholders = {
  english: {
    thinking: "Thinking...",
    prompt: "Type / for commands or ask a question...",
    viewOnly: "View only - you don't own this chat",
    recording: "Recording... Click to stop",
  },
  hindi: {
    thinking: "सोच रहा हूँ...",
    prompt: "कमांड के लिए / टाइप करें या प्रश्न पूछें...",
    viewOnly: "केवल देखें - यह चैट आपके स्वामित्व में नहीं है",
    recording: "रिकॉर्डिंग... रोकने के लिए क्लिक करें",
  },
};

type CommandInputProps = {
  input: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isOwner?: boolean;
};

export const CommandInput = ({
  input,
  isLoading,
  onInputChange,
  onSubmit,
  isOwner = true,
}: CommandInputProps) => {
  const [showCommands, setShowCommands] = useState(false);
  const [filteredCommands, setFilteredCommands] = useState(AVAILABLE_COMMANDS);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingSpeech, setIsProcessingSpeech] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const { language } = useLanguageSettings();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onInputChange(value);

    if (value.startsWith("/")) {
      setShowCommands(true);
      const searchTerm = value.toLowerCase();
      const filtered = AVAILABLE_COMMANDS.filter((cmd) =>
        cmd.command.toLowerCase().includes(searchTerm)
      );
      setFilteredCommands(filtered);
    } else {
      setShowCommands(false);
      setFilteredCommands(AVAILABLE_COMMANDS);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Tab" && showCommands) {
      e.preventDefault();
      const matchingCommand = AVAILABLE_COMMANDS.find((cmd) =>
        cmd.command.toLowerCase().startsWith(input.toLowerCase())
      );
      if (matchingCommand) {
        onInputChange(matchingCommand.command + " ");
        setShowCommands(false);
      }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        await processAudioToText(audioBlob);

        // Stop all tracks in the stream to release the microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert(
        language === "english"
          ? "Could not access microphone. Please check permissions."
          : "माइक्रोफ़ोन तक पहुंच नहीं सकता। कृपया अनुमतियां जांचें।"
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessingSpeech(true);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const processAudioToText = async (audioBlob: Blob) => {
    try {
      const apiKeyResponse = await fetch("/api/elevenlabs-key");
      if (!apiKeyResponse.ok) {
        throw new Error("Failed to get ElevenLabs API key");
      }
      const { apiKey } = await apiKeyResponse.json();

      if (!apiKey) {
        throw new Error("ElevenLabs API key not found");
      }

      // Initialize client with API key from backend
      const client = new ElevenLabsClient({
        apiKey,
      });

      const transcription = await client.speechToText.convert({
        file: audioBlob,
        model_id: "scribe_v1",
        tag_audio_events: true,
        language_code: language === "hindi" ? "hin" : "eng",
      });

      // Update the input field with the transcription
      if (transcription.text) {
        const transcribedText = transcription.text.trim();
        onInputChange(transcribedText);

        // Focus the input after transcription
        inputRef.current?.focus();

        // If we have text, submit the form automatically after a short delay
        if (transcribedText) {
          setTimeout(() => {
            if (formRef.current && !isLoading) {
              formRef.current.dispatchEvent(
                new Event("submit", { cancelable: true, bubbles: true })
              );
            }
          }, 5); // Short delay to allow UI update
        }
      }
    } catch (error) {
      console.error("Error processing speech to text:", error);
      alert(
        language === "english"
          ? "Failed to process speech. Please try again."
          : "भाषण को प्रोसेस करने में विफल। कृपया पुन: प्रयास करें।"
      );
    } finally {
      setIsProcessingSpeech(false);
    }
  };

  const currentPlaceholders =
    placeholders[language as keyof typeof placeholders] || placeholders.english;

  // Determine if input should be disabled
  const isDisabled = isLoading || !isOwner;

  // Determine appropriate placeholder text
  const placeholderText = isLoading
    ? currentPlaceholders.thinking
    : !isOwner
      ? currentPlaceholders.viewOnly
      : isRecording
        ? currentPlaceholders.recording
        : currentPlaceholders.prompt;

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="sticky bottom-0 p-4 bg-white/80 backdrop-blur-sm border-t"
    >
      <div className="relative flex gap-2">
        <Button
          type="button"
          onClick={toggleRecording}
          disabled={isDisabled || isProcessingSpeech}
          className={cn(
            "p-3 rounded-lg text-white",
            isRecording
              ? "bg-rose-500 hover:bg-rose-600 animate-pulse"
              : "bg-neutral-800 hover:bg-neutral-700",
            "disabled:opacity-50 transition-colors"
          )}
        >
          <MicIcon className="w-4 h-4" />
        </Button>

        <input
          ref={inputRef}
          type="text"
          value={
            isProcessingSpeech
              ? language === "english"
                ? "Processing speech..."
                : "भाषण प्रसंस्करण..."
              : input
          }
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholderText}
          className={cn(
            "flex-1 p-3 rounded-lg bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-300 transition-all",
            !isOwner && "opacity-70",
            isProcessingSpeech && "italic text-neutral-500"
          )}
          disabled={isDisabled || isProcessingSpeech}
        />
        <Button
          type="submit"
          disabled={isDisabled || !input.trim() || isProcessingSpeech}
          className="p-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg disabled:opacity-50 transition-colors"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <ArrowUpIcon className="w-4 h-4" />
          )}
        </Button>

        {showCommands && (
          <div className="absolute bottom-full left-0 w-full mb-2 bg-white rounded-lg shadow-lg border border-neutral-200 divide-y divide-neutral-100 overflow-hidden">
            {filteredCommands.map((cmd) => (
              <button
                key={cmd.command}
                className="w-full px-4 py-3 text-left hover:bg-neutral-50 transition-colors group"
                onClick={(e) => {
                  e.preventDefault();
                  onInputChange(cmd.command + " ");
                  setShowCommands(false);
                  inputRef.current?.focus();
                }}
                onDoubleClick={(e) => {
                  e.preventDefault();
                  const command = cmd.examples[0];
                  onInputChange(command);
                  if (formRef.current) {
                    formRef.current.dispatchEvent(
                      new Event("submit", { cancelable: true, bubbles: true })
                    );
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-neutral-900">
                    {cmd.command}
                  </span>
                  <span className="text-xs text-neutral-400 group-hover:text-neutral-500">
                    Tab ↹
                  </span>
                </div>
                <p className="text-sm text-neutral-500 mt-0.5">
                  {cmd.description}
                </p>
                <div className="flex gap-2 mt-1">
                  {cmd.examples.map((example) => (
                    <span
                      key={example}
                      className="text-xs text-neutral-400 bg-neutral-50 px-2 py-0.5 rounded"
                    >
                      {example}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {!isOwner && (
        <div className="mt-2 text-xs text-center text-amber-600">
          {language === "english"
            ? "You are viewing a chat that belongs to someone else"
            : "आप किसी और के स्वामित्व वाली चैट देख रहे हैं"}
        </div>
      )}
    </form>
  );
};
