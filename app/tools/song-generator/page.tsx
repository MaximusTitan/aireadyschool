"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { FiMusic, FiLoader, FiPlay, FiPause } from "react-icons/fi";

const REFERENCE_SONGS = [
  {
    name: "APT.",
    url: "https://xndjwmkypyilvkyczvbj.supabase.co/storage/v1/object/public/generated-audio//apt.mp3",
    lyrics: `Frowny face, frowny face
Avoiding my phone, yeah
I'm tryna dodge your calls for real (Uh-uh, uh-uh)
Blue thumbs, blue thumbs
That's what I'm on, nah
Don't give me somethin' I can feel, no-no, no

Don't you leave me like I left you, baby?
Don't you miss me like I dodged you now?
Stay tonight, but tomorrow, stay lazy
All you gotta do is just leave me at the

Nowhere, nowhere
Nowhere, nowhere
Nowhere, nowhere
Uh, uh-uh, uh-uh`,
  },
  {
    name: "Die With A Smile",
    url: "https://xndjwmkypyilvkyczvbj.supabase.co/storage/v1/object/public/generated-audio//diewithasmile.mp3",
    lyrics: `You, you showed up in my wacky dream
Where you and I ate jelly bean
And I don't know what it could mean
But since I woke up, I'm feeling free
Wherever you go, I'll go the other way
Nobody needs to hang out every day
So I'll skip you every night like it's the first time
Like it's the first time
If the world kept spinning, I'd just do my own thing
If the party kept going, I'd grab snacks and go sing
I'd wave goodbye and ride my bike with a smile
If the world kept spinning, I'd be happy for a while`,
  },
  {
    name: "Starboy",
    url: "https://xndjwmkypyilvkyczvbj.supabase.co/storage/v1/object/public/generated-audio//starboy.mp3",
    lyrics: `I'm tryna keep you in the best mood, yeah
Worn-out sneakers but they feel good, yeah
Twenty bucks saved, that's a win, dude, yeah
Bike ride fresh, ain't no tease, true, yeah

Room so cozy, got the perfect piece
Secondhand table, got it dirt cheap
Spilled some paint but that's my vibe, sweet, yeah
I sip my tea, I don't need champagne

Look what I've done
I'm a humble, grounded nice guy
Look what I've done
I'm a humble, grounded nice guy`,
  },
  {
    name: "Never Gonna Let You Down",
    url: "https://xndjwmkypyilvkyczvbj.supabase.co/storage/v1/object/public/generated-audio//nevergonnaletyoudown.mp3",
    lyrics: `We're complete strangers to hate
You break the rules, and so will I
No commitment's what I'm dreamin' of
You'd find this from any other guy

I just wanna hide what I'm concealing
Gotta make you misunderstand

Always gonna give you up
Always gonna let you down
Always gonna run away and desert you
Always gonna make you cry
Always gonna wave goodbye
Always gonna tell a lie and hurt you

We've just met, it hasn't been that long
My heart's been laughing, and I just had to say it`,
  },
];

const SongGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [selectedSong, setSelectedSong] = useState("");
  const [useCustomUrl, setUseCustomUrl] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playingAudio, setPlayingAudio] = useState<HTMLAudioElement | null>(
    null
  );
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
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

    const finalAudioUrl = useCustomUrl ? audioUrl : selectedSong;

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSongSelect = useCallback((song: (typeof REFERENCE_SONGS)[0]) => {
    setSelectedSong(song.url);
    setUseCustomUrl(false);
    setPrompt(song.lyrics);
  }, []);

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

  const characterLimit = 500;
  const characterCount = prompt.length;

  if (!isMounted) {
    return null; // or a loading state
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="flex items-center gap-3 mb-8 ml-8">
        <Link href="/tools">
          <ChevronLeft className="text-gray-900" />
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Song Generator</h1>
      </div>
      <div className="container mx-auto p-6 max-w-6xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block text-gray-700 font-bold mb-2">
              Lyrics for your song
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-all"
              rows={6}
              maxLength={characterLimit}
              placeholder="Enter your song lyrics or select a reference song below..."
              required
            />
            <div className="flex justify-end mt-1">
              <span
                className={`text-sm ${characterCount > characterLimit * 0.9 ? "text-gray-900" : "text-gray-500"}`}
              >
                {characterCount}/{characterLimit} characters
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-gray-700 font-bold mb-2">
              Reference Audio
            </label>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {REFERENCE_SONGS.map((song) => (
                  <div
                    key={song.url}
                    onClick={() => handleSongSelect(song)}
                    className={`p-4 border rounded-lg text-left transition-all flex items-center justify-between group hover:border-gray-400 cursor-pointer ${
                      !useCustomUrl && selectedSong === song.url
                        ? "border-gray-900 bg-gray-50"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="font-medium">{song.name}</div>
                    <button
                      type="button"
                      onClick={(e) => togglePlay(song.url, e)}
                      className="p-2 rounded-full hover:bg-gray-100 transition-all"
                    >
                      {isPlaying === song.url ? (
                        <FiPause className="w-5 h-5" />
                      ) : (
                        <FiPlay className="w-5 h-5" />
                      )}
                    </button>
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
            disabled={isLoading}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded font-medium transition-all disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <FiLoader className="animate-spin" />
                Generating your song...
              </>
            ) : (
              <>Generate Song</>
            )}
          </button>
        </form>

        {error && (
          <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded">
            <p className="text-gray-900">{error}</p>
          </div>
        )}

        {generatedAudio && (
          <div className="mt-8 p-4 border border-gray-200 rounded">
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              Your Generated Song
            </h2>
            <audio controls src={generatedAudio} className="w-full" />
          </div>
        )}
      </div>
    </div>
  );
};

export default SongGenerator;
