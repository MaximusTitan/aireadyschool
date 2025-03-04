"use client";

import { useState, useEffect, useRef } from "react";
import { Voice } from "./server";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Volume2, Download, RefreshCw, Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Link from "next/link";

export default function TextToSpeechPage() {
  const [text, setText] = useState("");
  const [voices, setVoices] = useState<Voice[]>([]);
  const [filteredVoices, setFilteredVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isVoicesLoading, setIsVoicesLoading] = useState(true);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  // Advanced options
  const [model, setModel] = useState("eleven_multilingual_v2");
  const [stability, setStability] = useState(0.5);
  const [similarityBoost, setSimilarityBoost] = useState(0.75);
  const [style, setStyle] = useState(0);
  const [speakerBoost, setSpeakerBoost] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [genderFilter, setGenderFilter] = useState("all");
  const [accentFilter, setAccentFilter] = useState("all");
  
  // Available models
  const models = [
    { id: "eleven_multilingual_v2", name: "Multilingual v2" },
    { id: "eleven_monolingual_v1", name: "Monolingual v1" },
    { id: "eleven_turbo_v2", name: "Turbo v2" },
    { id: "eleven_english_v2", name: "English v2" },
  ];

  useEffect(() => {
    async function fetchVoices() {
      try {
        setIsVoicesLoading(true);
        const response = await fetch("/api/tts/voices");
        if (!response.ok) {
          throw new Error("Failed to fetch voices");
        }
        const data = await response.json();
        // Filter out cloned voices
        const filteredData: Voice[] = data.filter((voice: Voice) => voice.category !== "cloned");
        setVoices(filteredData);
        setFilteredVoices(filteredData);
        if (filteredData.length > 0) {
          setSelectedVoice(filteredData[0].voice_id);
        }
      } catch (error) {
        console.error("Error fetching voices:", error);
        setError("Failed to load voices. Please try again later.");
      } finally {
        setIsVoicesLoading(false);
      }
    }
    fetchVoices();
  }, []);

  useEffect(() => {
    // Filter voices based on search query and filters
    let result = [...voices];
    
    if (searchQuery.trim()) {
      result = result.filter(voice => 
        voice.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (genderFilter !== "all") {
      result = result.filter(voice => voice.labels.gender === genderFilter);
    }
    
    if (accentFilter !== "all") {
      result = result.filter(voice => voice.labels.accent === accentFilter);
    }
    
    setFilteredVoices(result);
  }, [searchQuery, voices, genderFilter, accentFilter]);

  const handleTextToSpeech = async () => {
    if (!text.trim()) {
      setError("Please enter some text");
      return;
    }

    if (!selectedVoice) {
      setError("Please select a voice");
      return;
    }

    setIsLoading(true);
    setError("");
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }

    try {
      const response = await fetch("/api/tts/convert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          voiceId: selectedVoice,
          model,
          voice_settings: {
            stability,
            similarity_boost: similarityBoost,
            style,
            use_speaker_boost: speakerBoost,
            speed,
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to convert text to speech");
      }

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
    } catch (error: any) {
      console.error("Error generating speech:", error);
      setError(error.message || "Failed to generate speech");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlaySample = (voiceId: string, previewUrl: string) => {
    // Stop any currently playing audio
    if (currentlyPlaying) {
      document.querySelectorAll('audio').forEach(audio => audio.pause());
    }
    
    if (currentlyPlaying === voiceId) {
      setCurrentlyPlaying(null);
      return;
    }
    
    // Play the selected preview
    const audio = new Audio(previewUrl);
    audio.onended = () => setCurrentlyPlaying(null);
    audio.play();
    setCurrentlyPlaying(voiceId);
  };

  const handleDownload = (url = audioUrl, filename = "speech.mp3") => {
    if (url) {
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };
  
  const getUniqueAccents = () => {
    const accents = new Set<string>();
    voices.forEach(voice => {
      if (voice.labels.accent) accents.add(voice.labels.accent);
    });
    return Array.from(accents).sort();
  };

  const getVoiceById = (id: string) => {
    return voices.find(v => v.voice_id === id);
  };

  return (
    <div className="bg-backgroundApp min-h-screen py-10">
      <div className="container mx-auto px-4 max-w-6xl space-y-4">
      <Link href="/tools">
          <Button variant="outline" className="mb-2 border-neutral-500">
            ← Back
          </Button>
        </Link>
      <h1 className="text-3xl font-bold mb-2 text-rose-500">Text to Speech</h1>
      <p className="text-gray-500 mb-6">Convert text to natural-sounding speech using AI</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-2">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle>Text Input</CardTitle>
              <CardDescription>Enter the text you want to convert</CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                id="text-input"
                className="w-full h-36 p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter text to convert to speech..."
              />
              <div className="mt-2 flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  {text.length} characters
                </span>
                <div className="space-x-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setText("")}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleTextToSpeech}
                disabled={isLoading || !text.trim() || !selectedVoice}
                className="ml-auto bg-rose-500"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Converting...
                  </>
                ) : "Generate Speech"}
              </Button>
            </CardFooter>
          </Card>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {audioUrl && (
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle>Generated Speech</CardTitle>
                <CardDescription>
                  Voice: {getVoiceById(selectedVoice)?.name || selectedVoice}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-3 rounded-lg text-gray-700 text-sm mb-3 max-h-32 overflow-y-auto">
                  {text}
                </div>
                <audio ref={audioRef} src={audioUrl} controls className="w-full" />
              </CardContent>
              <CardFooter className="flex justify-end pt-3">
                <Button 
                  onClick={() => handleDownload()}
                  className="flex items-center"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>

        <div className="md:col-span-1">
          <Card className="shadow-sm sticky top-4">
            <CardHeader className="pb-3">
              <CardTitle>Voice Selection</CardTitle>
              <CardDescription>Choose a voice</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col space-y-3">
                <Input
                  type="text"
                  placeholder="Search voices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                
                <div className="grid grid-cols-2 gap-2">
                  <Select value={genderFilter} onValueChange={setGenderFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Genders</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={accentFilter} onValueChange={setAccentFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Accent" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Accents</SelectItem>
                      {getUniqueAccents().map(accent => (
                        <SelectItem key={accent} value={accent}>
                          {accent.charAt(0).toUpperCase() + accent.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="max-h-[400px] overflow-y-auto pr-1 mt-2 space-y-1.5">
                {isVoicesLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="animate-spin h-6 w-6 text-blue-500" />
                  </div>
                ) : filteredVoices.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No voices match your filters</p>
                ) : (
                  filteredVoices.map((voice) => (
                    <div 
                      key={voice.voice_id}
                      className={`border p-2 rounded-lg cursor-pointer transition-all ${
                        selectedVoice === voice.voice_id 
                          ? "border-blue-500 bg-blue-50/50" 
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedVoice(voice.voice_id)}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{voice.name}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlaySample(voice.voice_id, voice.preview_url);
                          }}
                        >
                          <Volume2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-xs text-gray-600 flex flex-wrap gap-1 mt-1">
                        {voice.labels.gender && <span>{voice.labels.gender}</span>}
                        {voice.labels.accent && <span>• {voice.labels.accent}</span>}
                        {voice.category === "premade" && <span>• Premade</span>}
                        {voice.category === "generated" && <span>• Generated</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    Voice Settings
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Advanced Voice Settings</DialogTitle>
                    <DialogDescription>
                      Fine-tune the voice parameters to customize your speech output.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <Select value={model} onValueChange={setModel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a model" />
                      </SelectTrigger>
                      <SelectContent>
                        {models.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label htmlFor="speed-slider">Speed: {speed}x</Label>
                      </div>
                      <Slider 
                        id="speed-slider"
                        min={0.7} 
                        max={1.2} 
                        step={0.1} 
                        value={[speed]} 
                        onValueChange={(value) => setSpeed(value[0])} 
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label htmlFor="stability-slider">Stability: {stability.toFixed(2)}</Label>
                      </div>
                      <Slider 
                        id="stability-slider"
                        min={0} 
                        max={1} 
                        step={0.05} 
                        value={[stability]} 
                        onValueChange={(value) => setStability(value[0])} 
                      />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label htmlFor="similarity-slider">Similarity Boost: {similarityBoost.toFixed(2)}</Label>
                      </div>
                      <Slider 
                        id="similarity-slider"
                        min={0} 
                        max={1} 
                        step={0.05} 
                        value={[similarityBoost]} 
                        onValueChange={(value) => setSimilarityBoost(value[0])} 
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="speaker-boost" 
                        checked={speakerBoost}
                        onCheckedChange={setSpeakerBoost}
                      />
                      <Label htmlFor="speaker-boost">Speaker Enhancement</Label>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
    </div>
  );
}
