"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { FiMusic, FiLoader, FiPlay, FiPause } from "react-icons/fi";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createClient } from "@/utils/supabase/client";

// Types for Supabase songs
type Song = {
  id: string;
  user_id: string;
  prompt: string;
  lyrics: string;
  reference_audio_url: string;
  generated_audio_url: string;
  song_description: string;
  created_at: string;
};

const REFERENCE_SONGS = [
  {
    name: "APT.",
    url: "https://xndjwmkypyilvkyczvbj.supabase.co/storage/v1/object/public/generated-audio//apt.mp3",
  },
  {
    name: "Die With A Smile",
    url: "https://xndjwmkypyilvkyczvbj.supabase.co/storage/v1/object/public/generated-audio//diewithasmile.mp3",
  },
  {
    name: "Starboy",
    url: "https://xndjwmkypyilvkyczvbj.supabase.co/storage/v1/object/public/generated-audio//starboy.mp3",
  },
  {
    name: "Never Gonna Let You Down",
    url: "https://xndjwmkypyilvkyczvbj.supabase.co/storage/v1/object/public/generated-audio//nevergonnaletyoudown.mp3",
  },
];

const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-32 bg-gray-100 rounded"></div>
    <div className="grid grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-20 bg-gray-100 rounded"></div>
      ))}
    </div>
  </div>
);

const AudioPlayer = ({
  url,
  isPlaying,
  onToggle,
}: {
  url: string;
  isPlaying: boolean;
  onToggle: (e: React.MouseEvent) => void;
}) => (
  <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-full">
    <button
      onClick={onToggle}
      className="p-2 rounded-full bg-gray-900 text-white hover:bg-gray-800 transition-all"
    >
      {isPlaying ? (
        <FiPause className="w-4 h-4" />
      ) : (
        <FiPlay className="w-4 h-4" />
      )}
    </button>
    <div className="flex-1">
      <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full bg-gray-900 transition-all ${isPlaying ? "animate-progress" : ""}`}
          style={{ width: isPlaying ? "100%" : "0%" }}
        ></div>
      </div>
    </div>
  </div>
);

const SongGenerator = () => {
  const { toast } = useToast();

  const [prompt, setPrompt] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [selectedSong, setSelectedSong] = useState("");
  const [useCustomUrl, setUseCustomUrl] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playingAudio, setPlayingAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isGeneratingLyrics, setIsGeneratingLyrics] = useState(false);
  const [songDescription, setSongDescription] = useState("");
  const [lyricsType, setLyricsType] = useState<"ai" | "custom">("ai");

  // State for user song history
  const [savedSongs, setSavedSongs] = useState<Song[]>([]);

  useEffect(() => {
    setIsMounted(true);
    const supabase = createClient();
    const fetchSavedSongs = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from("songs")
          .select("*")
          .order("created_at", { ascending: false });
        if (data) setSavedSongs(data);
      }
    };

    fetchSavedSongs();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    const supabase = createClient();
    const finalAudioUrl = useCustomUrl ? audioUrl : selectedSong;
    if (!finalAudioUrl) {
      toast({
        title: "Error",
        description: "Please select a reference audio or provide a custom URL",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/generate-song", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          audioUrl: finalAudioUrl,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate song");
      }

      const data = await response.json();
      setGeneratedAudio(data.audioUrl);
      toast({
        title: "Success",
        description: "Your song has been generated!",
        variant: "default",
      });

      // Save generated song to Supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { error: saveError } = await supabase
          .from("songs")
          .insert({
            user_id: session.user.id,
            prompt: prompt,
            lyrics: prompt,
            reference_audio_url: finalAudioUrl,
            generated_audio_url: data.audioUrl,
            song_description: songDescription,
          });
        if (saveError) throw saveError;

        // Refresh saved songs (song history)
        const { data: newSongs } = await supabase
          .from("songs")
          .select("*")
          .order("created_at", { ascending: false });
        if (newSongs) setSavedSongs(newSongs);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSongSelect = useCallback(
    (song: (typeof REFERENCE_SONGS)[0]) => {
      setSelectedSong(song.url);
      setUseCustomUrl(false);
    },
    []
  );

  const togglePlay = useCallback(
    (url: string, e: React.MouseEvent) => {
      e.stopPropagation();

      if (!isMounted) return;

      if (isPlaying === url) {
        if (audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(null);
        }
        return;
      }

      // Select the song when playing starts
      const selectedRefSong = REFERENCE_SONGS.find((song) => song.url === url);
      if (selectedRefSong) {
        handleSongSelect(selectedRefSong);
      }

      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(url);
      audioRef.current = audio;
      audio.play();
      setIsPlaying(url);

      audio.addEventListener("ended", () => {
        setIsPlaying(null);
      });
    },
    [isPlaying, isMounted, handleSongSelect]
  );

  const generateLyrics = async () => {
    if (!songDescription) {
      toast({
        title: "Error",
        description: "Please enter a song description",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingLyrics(true);
    try {
      const response = await fetch("/api/generate-lyrics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ songDescription }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate lyrics");
      }

      const data = await response.json();
      setPrompt(data.story);
      toast({
        title: "Success",
        description: "Lyrics generated successfully!",
        variant: "default",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to generate lyrics",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingLyrics(false);
    }
  };

  const handleDownload = useCallback(
    async (url: string) => {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = "generated-song.mp3";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to download the song",
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  const characterLimit = 500;
  const characterCount = prompt.length;

  if (!isMounted) return <LoadingSkeleton />;

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center gap-3 ml-8 mx-auto">
        <Link href="/tools" className="hover:bg-gray-100 p-2 rounded-full transition-all">
          <ChevronLeft className="text-gray-900" />
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Song Generator</h1>
      </div>
      <div className="sticky top-0 bg-white/80 backdrop-blur-sm z-10 py-4 px-8 border-b"></div>

      <div className="container mx-auto p-6 max-w-6xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
            <label className="block text-gray-700 font-bold mb-3">Song Lyrics</label>

            <RadioGroup
              value={lyricsType}
              onValueChange={(value) => setLyricsType(value as "ai" | "custom")}
              className="flex gap-4 mb-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ai" id="lyrics-ai" />
                <Label htmlFor="lyrics-ai" className="text-sm text-gray-700 font-medium">
                  Generate lyrics with AI
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="lyrics-custom" />
                <Label htmlFor="lyrics-custom" className="text-sm text-gray-700">
                  Write custom lyrics
                </Label>
              </div>
            </RadioGroup>

            {lyricsType === "ai" && (
              <div className="mb-4">
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={songDescription}
                    onChange={(e) => setSongDescription(e.target.value)}
                    placeholder="Describe your song (e.g., 'a happy love song about summer')"
                    className="flex-1 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={generateLyrics}
                    disabled={isGeneratingLyrics || !songDescription}
                    className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-200 disabled:cursor-not-allowed transition-all"
                  >
                    {isGeneratingLyrics ? <FiLoader className="animate-spin" /> : "Generate"}
                  </button>
                </div>
              </div>
            )}

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent transition-all text-lg"
              rows={6}
              maxLength={characterLimit}
              placeholder={
                lyricsType === "ai"
                  ? "Your AI-generated lyrics will appear here..."
                  : "Write your song lyrics..."
              }
              required
            />
            <div className="flex justify-between mt-2">
              <span className="text-sm text-gray-500">Use clear, descriptive lyrics for better results</span>
              <span className={`text-sm ${characterCount > characterLimit * 0.9 ? "text-red-500" : "text-gray-500"}`}>
                {characterCount}/{characterLimit}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-gray-700 font-bold mb-2">Reference Audio</label>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {REFERENCE_SONGS.map((song) => (
                  <div
                    key={song.url}
                    onClick={() => handleSongSelect(song)}
                    className={`p-4 border rounded-lg text-left transition-all flex items-center justify-between group hover:border-gray-400 cursor-pointer ${
                      !useCustomUrl && selectedSong === song.url ? "border-gray-900 bg-gray-50" : "border-gray-200"
                    }`}
                  >
                    <div className="font-medium">{song.name}</div>
                    <AudioPlayer
                      url={song.url}
                      isPlaying={isPlaying === song.url}
                      onToggle={(e) => togglePlay(song.url, e)}
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="useCustomUrl"
                  checked={useCustomUrl}
                  onChange={(e) => setUseCustomUrl(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="useCustomUrl" className="text-sm text-gray-700">
                  Use custom audio URL instead
                </label>
              </div>

              {useCustomUrl && (
                <div>
                  <input
                    type="url"
                    value={audioUrl}
                    onChange={(e) => setAudioUrl(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-all"
                    placeholder="https://example.com/audio.mp3"
                    required={useCustomUrl}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Provide a publicly accessible audio file URL (.mp3 or .wav)
                  </p>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !prompt || (!selectedSong && !useCustomUrl)}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white px-6 py-4 rounded-lg font-medium transition-all disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
          >
            {isLoading ? (
              <>
                <FiLoader className="animate-spin" />
                Creating your masterpiece...
              </>
            ) : (
              <>
                <FiMusic className="w-5 h-5" />
                Generate Song
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded">
            <p className="text-gray-900">{error}</p>
          </div>
        )}

        {generatedAudio && (
          <div className="mt-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Your Generated Song</h2>
              <button
                onClick={() => handleDownload(generatedAudio)}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all"
              >
                Download
              </button>
            </div>
            <AudioPlayer
              url={generatedAudio}
              isPlaying={isPlaying === generatedAudio}
              onToggle={() => togglePlay(generatedAudio, new Event("click") as any)}
            />
          </div>
        )}

        {/* User Song History Section */}
        <div className="mt-8 p-6 border border-gray-200 rounded-lg bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900">Your Song History</h2>
          {savedSongs.length === 0 ? (
            <p className="text-gray-500">No songs generated yet.</p>
          ) : (
            savedSongs.map((song) => (
              <div key={song.id} className="mt-4 p-4 border rounded-lg bg-gray-50">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {song.song_description || "Untitled Song"}
                    </h3>
                    <p className="text-sm text-gray-600">{new Date(song.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={(e) => togglePlay(song.generated_audio_url, e)}
                      className="p-2 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-all"
                    >
                      {isPlaying === song.generated_audio_url ? (
                        <FiPause className="w-4 h-4" />
                      ) : (
                        <FiPlay className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDownload(song.generated_audio_url)}
                      className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all"
                    >
                      Download
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SongGenerator;
