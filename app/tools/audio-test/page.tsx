"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Play, Square, Volume2, MessageSquare, Send, Mic, MicOff } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

// Define a type for chat messages
type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  audioData?: string;
};

// Helper function to check if a string is valid base64
const isValidBase64 = (str: string): boolean => {
  try {
    // Regular expression to check if string only contains valid base64 characters
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    
    // Check if the string matches the base64 pattern and length is multiple of 4
    return base64Regex.test(str) && str.length % 4 === 0;
  } catch (e) {
    return false;
  }
};

export default function AudioTestPage() {
  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Audio state
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  
  // Audio streaming refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingStreamRef = useRef<boolean>(false);
  const currentStreamingMessageIdRef = useRef<string | null>(null);
  
  // Text buffering refs for delayed display
  const textBufferRef = useRef<string[]>([]);
  const textDisplayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioStartedRef = useRef<boolean>(false);
  
  // Speech recording refs
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Clean up audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      // Stop all audio sources
      audioSourcesRef.current.forEach(source => {
        try { source.stop(); } catch (e) {}
      });
      // Clear any text display timers
      if (textDisplayTimerRef.current) {
        clearTimeout(textDisplayTimerRef.current);
      }
      // Stop recording if active
      stopRecording();
    };
  }, []);

  // Initialize audio context
  useEffect(() => {
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Display buffered text chunks with delay
  const startTextDisplay = (assistantMessageId: string) => {
    if (textDisplayTimerRef.current) {
      clearTimeout(textDisplayTimerRef.current);
    }
    
    // Initial delay before showing first text
    const initialDelay = 500; // 500ms delay before first text appears
    const textUpdateInterval = 50; // Time between text updates in ms
    
    let displayedText = '';
    let chunkIndex = 0;
    
    const displayNextChunk = () => {
      if (chunkIndex < textBufferRef.current.length) {
        displayedText += textBufferRef.current[chunkIndex];
        chunkIndex++;
        
        // Update message with currently displayed text
        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: displayedText } 
              : msg
          )
        );
        
        // Schedule next chunk display
        textDisplayTimerRef.current = setTimeout(displayNextChunk, textUpdateInterval);
      }
    };
    
    // Start the display process after initial delay
    textDisplayTimerRef.current = setTimeout(displayNextChunk, initialDelay);
  };

  // Play the next audio buffer in the queue
  const playNextInQueue = async () => {
    if (!audioContextRef.current || !isPlayingStreamRef.current || audioQueueRef.current.length === 0) {
      return;
    }
    
    try {
      const buffer = audioQueueRef.current.shift();
      if (!buffer) return;
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      
      audioSourcesRef.current.push(source);
      
      // Mark that audio has started playing
      if (!audioStartedRef.current && currentStreamingMessageIdRef.current) {
        audioStartedRef.current = true;
        // Start displaying text now that audio has started
        startTextDisplay(currentStreamingMessageIdRef.current);
      }
      
      source.onended = () => {
        // Remove this source from the sources array
        audioSourcesRef.current = audioSourcesRef.current.filter(s => s !== source);
        
        // Play next buffer if there's more in the queue
        if (audioQueueRef.current.length > 0) {
          playNextInQueue();
        } else if (audioSourcesRef.current.length === 0) {
          // If no more sources are playing and queue is empty, we're done
          isPlayingStreamRef.current = false;
          setCurrentPlayingId(null);
          currentStreamingMessageIdRef.current = null;
        }
      };
      
      source.start(0);
    } catch (err) {
      console.error("Error playing audio chunk:", err);
    }
  };
  
  // Process and play a new audio chunk
  const processAudioChunk = async (base64Data: string, messageId: string) => {
    if (!audioContextRef.current) return;
    
    try {
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Decode audio data
      const audioBuffer = await audioContextRef.current.decodeAudioData(bytes.buffer);
      
      // If this is a new message or we're not playing, start playback
      if (currentStreamingMessageIdRef.current !== messageId || !isPlayingStreamRef.current) {
        // Stop any currently playing sources first
        audioSourcesRef.current.forEach(source => {
          try { source.stop(); } catch (e) {}
        });
        audioSourcesRef.current = [];
        audioQueueRef.current = [];
        
        currentStreamingMessageIdRef.current = messageId;
        isPlayingStreamRef.current = true;
        audioStartedRef.current = false;
        setCurrentPlayingId(messageId);
        
        // Add to queue and start playing
        audioQueueRef.current.push(audioBuffer);
        playNextInQueue();
      } else {
        // Add to queue, it will play when previous chunks finish
        audioQueueRef.current.push(audioBuffer);
      }
    } catch (err) {
      console.error("Error processing audio chunk:", err);
    }
  };
  
  // Stop streaming audio
  const stopStreamingAudio = () => {
    if (!isPlayingStreamRef.current) return;
    
    isPlayingStreamRef.current = false;
    audioSourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    audioSourcesRef.current = [];
    audioQueueRef.current = [];
    currentStreamingMessageIdRef.current = null;
    setCurrentPlayingId(null);
    
    // Also clear text display timer
    if (textDisplayTimerRef.current) {
      clearTimeout(textDisplayTimerRef.current);
      textDisplayTimerRef.current = null;
    }
  };

  // Send a message and get a response
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsGenerating(true);
    setError(null);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const assistantMessageId = (Date.now() + 1).toString();
    
    // Add empty assistant message that will be updated
    setMessages(prev => [...prev, {
      id: assistantMessageId,
      role: 'assistant',
      content: ''
    }]);
    
    // Reset the text buffer and audio started flag
    textBufferRef.current = [];
    audioStartedRef.current = false;

    try {
      const response = await fetch("/api/test/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: userMessage.content }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate content");
      }

      if (!response.body) {
        throw new Error("Response body is null");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let audioChunks: string[] = [];

      // Process the stream
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        // Process the chunk
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            
            if (data.type === 'text') {
              fullText += data.content;
              // Instead of updating immediately, add to buffer
              textBufferRef.current.push(data.content);
            } else if (data.type === 'audio') {
              // Process the audio chunk for immediate playback
              audioChunks.push(data.content);
              processAudioChunk(data.content, assistantMessageId);
            }
          } catch (e) {
            console.error('Error parsing chunk:', e);
          }
        }
      }

      // If audio never started (no audio chunks), show all text immediately
      if (!audioStartedRef.current && textBufferRef.current.length > 0) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: fullText } 
              : msg
          )
        );
      }

      // Update the final message with audio data
      const combinedAudioData = audioChunks.join('');
      setMessages(prev => 
        prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, content: fullText, audioData: combinedAudioData } 
            : msg
        )
      );

    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message);
        // Update the assistant message to show error
        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: "Sorry, I encountered an error while generating a response." } 
              : msg
          )
        );
      }
    } finally {
      setIsGenerating(false);
      // Clear text display timer
      if (textDisplayTimerRef.current) {
        clearTimeout(textDisplayTimerRef.current);
        textDisplayTimerRef.current = null;
      }
    }
  };

  // Play audio for a specific message
  const playMessageAudio = (messageId: string, audioData: string) => {
    if (!audioData) return;
    
    // If it's already playing, stop it
    if (currentPlayingId === messageId) {
      stopStreamingAudio();
      return;
    }
    
    // Stop any current playback
    stopStreamingAudio();
    
    try {
      // Check if the audioData is an error message instead of actual audio data
      try {
        // Try to parse the audioData as JSON to check for error messages
        const errorData = JSON.parse(audioData);
        console.log("Decoded audio data:", errorData);
        if (errorData.error === 'authentication_required') {
          console.error("ElevenLabs authentication failed:", errorData);
          setError("ElevenLabs API key is missing or invalid. Please check your API key configuration.");
          return;
        }
      } catch (e) {
        // Not JSON, treat as regular audio data
        console.log("Audio data is not JSON, treating as audio data");
      }
      
      if (!audioData || audioData.length === 0) {
        console.error("Empty audio data received");
        setError("No valid audio data available for playback");
        return;
      }

      // Validate base64 data before decoding
      if (!isValidBase64(audioData)) {
        console.error("Invalid base64 data received");
        setError("Received invalid audio data format");
        return;
      }

      // Start playing the saved audio data
      try {
        const binaryString = atob(audioData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
        
        // Use classic audio element for playing stored audio
        if (audioRef.current) {
          const url = URL.createObjectURL(audioBlob);
          audioRef.current.src = url;
          audioRef.current.play()
            .then(() => {
              setCurrentPlayingId(messageId);
            })
            .catch(err => {
              console.error("Error playing audio:", err);
              setError("Failed to play audio: " + (err.message || "Unknown error"));
            });
        }
      } catch (err) {
        console.error("Error decoding base64 data:", err);
        setError("Failed to decode audio data: " + (err instanceof Error ? err.message : "Unknown error"));
      }
    } catch (err) {
      console.error("Error processing audio data:", err);
      setError("Failed to process audio data: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  // Handle key press in text input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Start recording audio
  const startRecording = async () => {
    try {
      setError(null);
      audioChunksRef.current = [];
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      // Set up event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        // Process recorded audio when stopped
        if (audioChunksRef.current.length > 0) {
          await processRecording();
        }
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error starting recording:", err);
      setError(`Microphone access error: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
  };

  // Stop recording audio
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Process the recorded audio for transcription
  const processRecording = async () => {
    try {
      setIsTranscribing(true);
      
      // Create a blob from recorded chunks
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
      
      // Convert blob to base64
      const base64Data = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          // Remove the data URL prefix (e.g., "data:audio/mp3;base64,")
          const base64Data = base64.split(',')[1];
          resolve(base64Data);
        };
        reader.readAsDataURL(audioBlob);
      });
      
      // Send to API for transcription
      const response = await fetch("/api/test/webhook", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioData: base64Data }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Transcription failed");
      }
      
      const transcriptionResult = await response.json();
      
      // Set the transcribed text as input message
      setInputMessage(transcriptionResult.text);
      
    } catch (err) {
      console.error("Error processing recording:", err);
      setError(`Transcription error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsTranscribing(false);
    }
  };

  return (
    <div className="container mx-auto py-4 max-w-3xl">
      <Card className="h-[85vh] flex flex-col">
        <CardHeader>
          <CardTitle>Chat with AI</CardTitle>
          <CardDescription>Chat with a voice-enabled AI assistant (audio streams in real-time)</CardDescription>
        </CardHeader>
        
        <CardContent className="flex-grow flex flex-col overflow-hidden">
          {/* Chat messages container */}
          <div className="flex-grow overflow-y-auto mb-4 space-y-4 p-2">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>Send a message to start chatting with the AI assistant</p>
              </div>
            ) : (
              messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    
                    {message.role === 'assistant' && message.audioData && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="mt-2 h-6"
                        onClick={() => playMessageAudio(message.id, message.audioData!)}
                      >
                        {currentPlayingId === message.id 
                          ? <Square size={14} className="mr-1" /> 
                          : <Play size={14} className="mr-1" />}
                        {currentPlayingId === message.id ? "Stop" : "Play"}
                        {currentPlayingId === message.id && <Volume2 size={14} className="ml-1 animate-pulse" />}
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {error && (
            <div className="bg-red-50 text-red-500 p-2 mb-2 rounded text-sm">
              {error}
            </div>
          )}

          {/* Audio element (hidden) */}
          <audio
            ref={audioRef}
            onEnded={() => setCurrentPlayingId(null)}
            onError={() => {
              setError("Error playing audio");
              setCurrentPlayingId(null);
            }}
          />
          
          {/* Input area */}
          <div className="flex flex-col gap-2">
            <div className="flex items-end gap-2">
              <Textarea
                placeholder="Type your message..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                className="resize-none"
                rows={2}
                disabled={isGenerating || isRecording || isTranscribing}
              />
              
              <div className="flex flex-col gap-2 mb-[2px]">
                <Button 
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isGenerating || isTranscribing}
                  variant={isRecording ? "destructive" : "outline"}
                  size="icon"
                  title={isRecording ? "Stop Recording" : "Start Recording"}
                >
                  {isRecording ? (
                    <MicOff size={18} className="animate-pulse" />
                  ) : (
                    <Mic size={18} />
                  )}
                </Button>
                
                <Button 
                  onClick={sendMessage} 
                  disabled={isGenerating || isRecording || isTranscribing || !inputMessage.trim()}
                  size="icon"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </Button>
              </div>
            </div>
            
            {isTranscribing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Transcribing your speech...</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
