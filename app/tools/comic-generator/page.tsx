"use client";

import { useState, useRef } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { X } from 'lucide-react';
import Loader from "@/components/ui/loader";

export default function ComicGenerator() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setImageUrls([]);
    setLoading(true);

    try {
      const promptResponse = await fetch('/api/prompt-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const promptData = await promptResponse.json();
      if (!promptResponse.ok) throw new Error(promptData.message);

      const imageResponse = await fetch('/api/image-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompts: promptData.prompts }),
      });

      const imageData = await imageResponse.json();
      if (!imageResponse.ok) throw new Error(imageData.message);

      setImageUrls(imageData.imageUrls);
    } catch (error) {
      console.error('Error generating comic:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  return (
    <div className="flex flex-col items-center p-4">
      <h1 className="text-3xl font-bold mb-6">Comic Generator</h1>
      <form onSubmit={handleSubmit} className="w-full max-w-md mb-8">
        <Textarea
          ref={textareaRef}
          placeholder="Enter your comic idea here..."
          value={prompt}
          onChange={handleTextareaChange}
          className="w-full min-h-[100px] resize-none mb-4"
        />
        <Button type="submit" className="w-full">
          Generate Comic!
        </Button>
      </form>
      {loading && <Loader />}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center relative">
            <button onClick={() => setShowModal(false)} className="absolute top-2 right-2 text-gray-500 hover:text-black">
              <X className="h-6 w-6" />
            </button>
            <h2 className="text-lg mb-4">You do not have enough credits to generate a comic. <br />
            Please recharge your credits.</h2>
            <Button onClick={() => router.push('/credits')} className="bg-primary text-white">
              Buy Credits
            </Button>
          </div>
        </div>
      )}
      {imageUrls.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full max-w-6xl">
          {imageUrls.map((url, index) => (
            <div key={index} className="relative aspect-square">
              <Image 
                src={url} 
                alt={`Comic panel ${index + 1}`} 
                layout="fill"
                objectFit="cover"
                className="rounded-lg"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

