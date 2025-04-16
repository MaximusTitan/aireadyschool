'use client'

import { useState, useEffect, memo, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Poppins } from 'next/font/google'
import { Inter } from 'next/font/google'
import { Typewriter } from 'react-simple-typewriter'
import { Share2, Download, Film } from 'lucide-react'
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from '@supabase/supabase-js';
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRouter, useSearchParams } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const inter = Inter({ subsets: ['latin'] })

interface Scene {
  id: string;
  text: string;
  imageUrl: string;
  imagePrompt?: string;
  isGenerating?: boolean;
  placeholder?: boolean;
  visualDetails?: string;
  focusElements?: string;
  number: number;
  videoPrompt?: string;
  videoMotion?: {
    cameraMovement?: string;
    characterMotion?: string;
    backgroundEffects?: string;
  };
  storyboardImageUrl: string;
  generatedImageUrl?: string;
  videoUrl?: string;
}

interface ParsedScene extends Scene {
  rawText?: string;
}

interface GeneratedImage {
  id: string;
  imageUrl: string;
  sceneId: string;
  isGenerating: boolean;
}

interface VideoResult {
  videoUrl: string;
  status: 'processing' | 'completed' | 'failed';
}

interface Step {
  id: string;
  label: string;
  number: number;
  completed: boolean;
  current: boolean;
  enabled: boolean;
}

interface SceneInputs {
  sceneDescription: string;
  imageDescription: string;
  shotType: string;
}

interface VideoSceneInputs {
  videoMotion: string;
  cameraMovement: string;
}

interface VideoGenerationSectionProps {
  isGeneratingVideo: boolean;
  videoResult: VideoResult | null;
  generatedImages: GeneratedImage[];
  onGenerateVideo: () => Promise<void>;
  onResetVideo: () => void;
}

interface ApiResponse {
  success: boolean;
  refinedStory?: string;
  scenes?: ParsedScene[];
  error?: string;
}

interface StoryInputs {
  storyTitle: string;
  mainCharacters: string;
  storyGenre: string;
  storyLocation: string;
  openingScene: string;
  storyDuration: '15' | '30' | '60';
}

const genreOptions = [
  { value: 'funny', label: 'Funny' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'mystery', label: 'Mystery' },
  { value: 'scifi', label: 'Sci-fi' },
  { value: 'historical', label: 'Historical' },
  { value: 'fantasy', label: 'Fantasy' },
  { value: 'sliceoflife', label: 'Slice of Life' }
];

const durationOptions = [
  { value: '15', label: '15 Seconds' },
  { value: '30', label: '30 Seconds' },
  { value: '60', label: '60 Seconds' }
];

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
}

const slideUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

const getGreyscaleUrl = (sceneNumber: number, text: string) => {
  const encodedText = encodeURIComponent(`Scene ${sceneNumber}: ${text.slice(0, 30)}...`)
  return `https://via.placeholder.com/800x450/333333/FFFFFF?text=${encodedText}`
}

const createGreyscaleSvg = (sceneData: { 
  id: string; 
  number: number; 
  text: string; 
  imageUrl: string;
}) => {
  const svgUrl = `data:image/svg+xml,${encodeURIComponent(`
    <svg width="800" height="450" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#333"/>
      <text x="50%" y="50%" font-family="Arial" font-size="20" fill="white" text-anchor="middle">
        Scene ${sceneData.number}
      </text>
      <text x="50%" y="60%" font-family="Arial" font-size="16" fill="#999" text-anchor="middle" width="80%">
        ${sceneData.text.substring(0, 50)}${sceneData.text.length > 50 ? '...' : ''}
      </text>
    </svg>
  `).trim()}`;

  return {
    ...sceneData,
    storyboardImageUrl: svgUrl,
    imageUrl: svgUrl
  };
};

interface StoryboardSceneProps {
  scene: Scene;
  onSave: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onRegenerate: (id: string) => void;
  onPromptSave: (id: string, prompt: string) => void;
  isEditing?: boolean;
}

const StoryboardScene = memo(({ 
  scene, 
  onSave, 
  onDelete, 
  onRegenerate,
  onPromptSave,
  isEditing: parentIsEditing 
}: StoryboardSceneProps) => {
  const [localText, setLocalText] = useState(scene.text)
  const [imageError, setImageError] = useState(false)
  const [isEditingPrompt, setIsEditingPrompt] = useState(false)
  const [localPrompt, setLocalPrompt] = useState(scene.imagePrompt || '')
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // Reset error state when imageUrl changes
  useEffect(() => {
    setImageError(false)
  }, [scene.storyboardImageUrl])

  const handleSave = () => {
    onSave(scene.id, localText)
    setIsEditing(false)
  }

  const handlePromptSave = () => {
    onPromptSave(scene.id, localPrompt)
    setIsEditingPrompt(false)
  }

  const enhancePrompt = async () => {
    setIsEnhancingPrompt(true)
    try {
      const response = await fetch('/api/generate-image-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sceneText: localPrompt })
      })
      const data = await response.json()
      setLocalPrompt(data.prompt)
    } catch (error) {
      console.error('Error enhancing prompt:', error)
    }
    setIsEnhancingPrompt(false)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-2xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl"
    >
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-3xl font-bold text-rose-500">
            Scene {scene.number}
          </h3>
          <button
            onClick={() => onDelete(scene.id)}
            className="p-2 text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="relative group">
          {scene.isGenerating ? (
            <div className="w-full aspect-video bg-rose-50 rounded-xl flex items-center justify-center">
              <div className="animate-pulse text-rose-500 font-medium">Generating...</div>
            </div>
          ) : !imageError ? (
            <div className="relative overflow-hidden rounded-xl">
              <img
                src={scene.storyboardImageUrl}
                alt={`Scene ${scene.id}`}
                className="w-full aspect-video object-cover transition-transform duration-300 group-hover:scale-105"
                onError={() => setImageError(true)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onRegenerate(scene.id)}
                  className="absolute bottom-4 right-4 px-4 py-2 bg-white/90 text-rose-500 rounded-lg font-medium shadow-lg transform translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300"
                >
                  Regenerate
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full aspect-video bg-rose-50 rounded-xl flex items-center justify-center text-rose-500">
              Failed to load image
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Scene Description</label>
          <Textarea
            value={localText}
            onChange={(e) => setLocalText(e.target.value)}
            className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-rose-400 focus:ring-2 focus:ring-rose-200 transition-all duration-200 min-h-[100px] text-gray-700"
            placeholder="Describe what happens in this scene..."
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              className="px-4 py-2 bg-rose-500 text-white rounded-lg font-medium hover:bg-rose-600 transition-colors"
            >
              Save Description
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-gray-700">Image Prompt</label>
            <button
              onClick={() => setIsEditingPrompt(!isEditingPrompt)}
              className="text-sm text-rose-500 hover:text-rose-600"
            >
              {isEditingPrompt ? 'Cancel' : 'Edit Prompt'}
            </button>
          </div>
          {isEditingPrompt ? (
            <div className="space-y-3">
              <Textarea
                value={localPrompt}
                onChange={(e) => setLocalPrompt(e.target.value)}
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-rose-400 focus:ring-2 focus:ring-rose-200 transition-all duration-200"
                rows={3}
                placeholder="Describe how you want this scene to look..."
              />
              <div className="flex gap-2">
                <Button
                  onClick={enhancePrompt}
                  disabled={isEnhancingPrompt || !localPrompt}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-rose-400 to-rose-600 text-white rounded-lg font-medium hover:from-rose-500 hover:to-rose-700 disabled:opacity-50 transition-all duration-300"
                >
                  {isEnhancingPrompt ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Enhancing...
                    </span>
                  ) : (
                    'Enhance with AI'
                  )}
                </Button>
                <Button
                  onClick={handlePromptSave}
                  className="px-4 py-2 border-2 border-rose-500 text-rose-500 rounded-lg font-medium hover:bg-rose-50 transition-colors"
                >
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded-xl">
              {scene.imagePrompt || 'No prompt yet. Click Edit to add one.'}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
})

StoryboardScene.displayName = 'StoryboardScene'

const VideoPromptSection = memo(({ 
  scene,
  onSave,
  onEnhance,
  isEnhancing
}: {
  scene: Scene;
  onSave: (prompt: string) => void;
  onEnhance: () => void;
  isEnhancing: boolean;
}) => {
  const [prompt, setPrompt] = useState(scene.videoPrompt || '');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-4 p-4 bg-gray-50 rounded-xl space-y-3"
    >
      <label className="block text-sm font-medium text-gray-700">
        Scene Motion Description
      </label>
      <Textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe the motion for this scene (e.g., 'The camera zooms into the hero's face as fire burns in the background.')"
        className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-rose-400 focus:ring-2 focus:ring-rose-200 transition-all duration-200"
        rows={3}
      />
      <div className="flex justify-between gap-2">
        <Button
          onClick={() => onEnhance()}
          disabled={isEnhancing}
          className="flex-1 px-4 py-2 bg-gradient-to-r from-rose-400 to-rose-600 text-white rounded-lg font-medium hover:from-rose-500 hover:to-rose-700 disabled:opacity-50"
        >
          {isEnhancing ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Enhancing...
            </span>
          ) : (
            'Enhance with AI'
          )}
        </Button>
        <Button
          onClick={() => onSave(prompt)}
          className="px-4 py-2 border-2 border-rose-500 text-rose-500 rounded-lg font-medium hover:bg-rose-50"
        >
          Save Motion
        </Button>
      </div>
    </motion.div>
  );
});

VideoPromptSection.displayName = 'VideoPromptSection';

const SceneContainer = memo(({ 
  scene,
  onGenerate
}: { 
  scene: Scene;
  onGenerate: (inputs: SceneInputs) => Promise<void>;
}) => {
  const [inputs, setInputs] = useState<SceneInputs>({
    sceneDescription: scene.text,
    imageDescription: '',
    shotType: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);

  const handleInputChange = (field: keyof SceneInputs, value: string) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const handleEnhancePrompt = async () => {
    if (!inputs.imageDescription) return;
    
    setIsEnhancing(true);
    try {
      const response = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: inputs.imageDescription })
      });

      if (!response.ok) throw new Error('Failed to enhance prompt');

      const data = await response.json();
      if (data.enhancedPrompt) {
        handleInputChange('imageDescription', data.enhancedPrompt);
      }
    } catch (error) {
      console.error('Error enhancing prompt:', error);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    await onGenerate(inputs);
    setIsGenerating(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6 flex gap-6">
      <div className="w-1/2 relative">
        <img
          src={scene.imageUrl}
          alt={`Scene ${scene.number}`}
          className="w-full aspect-video object-cover rounded-lg"
        />
        <div className="absolute top-3 left-3 px-2 py-1 bg-black/50 rounded-md">
          <span className="text-white text-sm font-medium">
            Scene {scene.number}
          </span>
        </div>
      </div>

      <div className="w-1/2 flex flex-col h-[400px]">
        <div className="flex-1 space-y-4 overflow-y-auto pr-4 custom-scrollbar">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Scene Description
            </label>
            <Textarea
              value={inputs.sceneDescription}
              onChange={(e) => handleInputChange('sceneDescription', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              rows={4}
            />
          </div>

          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Image Description
            </label>
            <button
              onClick={handleEnhancePrompt}
              disabled={isEnhancing || !inputs.imageDescription}
              className="absolute top-0 right-0 flex items-center text-rose-500 hover:text-rose-600 transition-colors disabled:opacity-40"
            >
              {isEnhancing ? (
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Enhancing...</span>
                </div>
              ) : (
                <>
                  <span className="mr-1">✨</span>
                  <span className="text-sm">Enhance with AI</span>
                </>
              )}
            </button>
            <Textarea
              value={inputs.imageDescription}
              onChange={(e) => handleInputChange('imageDescription', e.target.value)}
              className={`w-full p-2 border border-gray-300 rounded-md text-sm mt-2 transition-all duration-300 ${
                isEnhancing ? 'opacity-50' : ''
              }`}
              rows={4}
              placeholder="Add specific details about how you want this scene to look..."
              disabled={isEnhancing}
            />
            {isEnhancing && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm font-medium text-rose-500">
                    AI is enhancing your prompt...
                  </span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Shot Type
            </label>
            <Select
              value={inputs.shotType}
              onValueChange={(value) => handleInputChange('shotType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select shot type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="close-up">Close-up Shot</SelectItem>
                <SelectItem value="medium">Medium Shot</SelectItem>
                <SelectItem value="long">Long Shot</SelectItem>
                <SelectItem value="extreme-close-up">Extreme Close-up</SelectItem>
                <SelectItem value="wide">Wide Shot</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="mt-4 w-full"
          variant="default"
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating...
            </span>
          ) : (
            'Generate Image'
          )}
        </Button>
      </div>
    </div>
  );
});

SceneContainer.displayName = 'SceneContainer';

const ImageGallery = memo(({ 
  scenes, 
  storyId, 
  setScenes 
}: { 
  scenes: Scene[];
  storyId: number | null;
  setScenes: React.Dispatch<React.SetStateAction<Scene[]>>;
}) => {
  const handleGenerateImage = async (sceneId: string, inputs: SceneInputs) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene || !storyId) return;

    try {
      setScenes(prevScenes => 
        prevScenes.map(s => 
          s.id === sceneId ? { ...s, isGenerating: true } : s
        )
      );

      const response = await fetch('/api/video-story-image-to-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneId: parseInt(sceneId.replace('scene-', '')),
          storyId,
          sceneOrder: scene.number,
          sceneDescription: inputs.sceneDescription,
          imageDescription: inputs.imageDescription,
          shotType: inputs.shotType
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to generate image');
      }

      const data = await response.json();
      
      if (data.imageUrl) {
        setScenes(prevScenes => 
          prevScenes.map(s => 
            s.id === sceneId ? { 
              ...s, 
              generatedImageUrl: data.imageUrl,
              isGenerating: false,
              imagePrompt: data.enhancedPrompt 
            } : s
          )
        );
      }
    } catch (error) {
      console.error('Error generating image:', error);
      setScenes(prevScenes => 
        prevScenes.map(s => 
          s.id === sceneId ? { ...s, isGenerating: false } : s
        )
      );
    }
  };

  return (
    <div className="space-y-6">
      {scenes.map((scene) => (
        <SceneContainer
          key={scene.id}
          scene={{
            ...scene,
            imageUrl: scene.generatedImageUrl || scene.storyboardImageUrl
          }}
          onGenerate={(inputs) => handleGenerateImage(scene.id, inputs)}
        />
      ))}
    </div>
  );
});

ImageGallery.displayName = 'ImageGallery';

const GenerateImagesSection = memo(({ scenes, storyId, setScenes, onNavigateToVideo }: { 
  scenes: Scene[];
  storyId: number | null;
  setScenes: React.Dispatch<React.SetStateAction<Scene[]>>;
  onNavigateToVideo: () => void;
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Image Generation Board
        </h2>
        <motion.button
          onClick={onNavigateToVideo}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-3 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300"
        >
          Generate Videos
        </motion.button>
      </div>
      <ImageGallery scenes={scenes} storyId={storyId} setScenes={setScenes} />
    </div>
  );
});

const VideoContainer = memo(({ 
  scene,
  generatedVideo,
  onGenerateVideo 
}: { 
  scene: Scene;
  generatedVideo?: { url: string } | null;
  onGenerateVideo: (inputs: VideoSceneInputs) => Promise<void>;
}) => {
  const [inputs, setInputs] = useState<VideoSceneInputs>({
    videoMotion: '',
    cameraMovement: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const handleInputChange = (field: keyof VideoSceneInputs, value: string) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    await onGenerateVideo(inputs);
    setIsGenerating(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6 flex gap-6">
      <div className="w-1/2 relative">
        {generatedVideo ? (
          <video
            controls
            className="w-full aspect-video rounded-lg"
            src={generatedVideo.url}
          >
            Your browser does not support video playback.
          </video>
        ) : (
          <img
            src={scene.generatedImageUrl || scene.imageUrl}
            alt={`Scene ${scene.number}`}
            className="w-full aspect-video object-cover rounded-lg"
          />
        )}
        <div className="absolute top-3 left-3 px-2 py-1 bg-black/50 rounded-md">
          <span className="text-white text-sm font-medium">
            Scene {scene.number}
          </span>
        </div>
      </div>

      <div className="w-1/2 flex flex-col h-[400px]">
        <div className="flex-1 space-y-4 overflow-y-auto pr-4 custom-scrollbar">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Video Motion
            </label>
            <Textarea
              value={inputs.videoMotion}
              onChange={(e) => handleInputChange('videoMotion', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              rows={4}
              placeholder="Describe the motion you want in this scene..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Camera Movement
            </label>
            <Textarea
              value={inputs.cameraMovement}
              onChange={(e) => handleInputChange('cameraMovement', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
              rows={4}
              placeholder="Describe camera movements and transitions..."
            />
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !inputs.videoMotion || !inputs.cameraMovement}
          className="mt-4 w-full"
          variant="default"
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating Video...
            </span>
          ) : (
            'Generate Video'
          )}
        </Button>
      </div>
    </div>
  );
});

VideoContainer.displayName = 'VideoContainer';

const VideoBoard = memo(({ 
  scenes,
  generatedVideos,
  onGenerateVideo,
  setCurrentStep 
}: { 
  scenes: Scene[];
  generatedVideos: Record<string, { url: string }>;
  onGenerateVideo: (sceneId: string, inputs: VideoSceneInputs) => Promise<void>;
  setCurrentStep: (step: string) => void;
}) => {
  const router = useRouter();
  const allVideosGenerated = scenes.every(scene => generatedVideos[scene.id]?.url);

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Video Generation Board
        </h2>
        {allVideosGenerated && (
          <Button
            onClick={() => setCurrentStep('audio')}
            className="bg-gradient-to-r from-rose-500 to-rose-600 text-white"
          >
            Add Audio
          </Button>
        )}
      </div>
      <div className="space-y-6">
        {scenes.map((scene) => (
          <VideoContainer
            key={scene.id}
            scene={scene}
            generatedVideo={generatedVideos[scene.id]}
            onGenerateVideo={(inputs) => onGenerateVideo(scene.id, inputs)}
          />
        ))}
      </div>
    </div>
  );
});

VideoBoard.displayName = 'VideoBoard';

const ProgressBar = memo(({ 
  currentStep, 
  steps, 
  onStepClick 
}: { 
  currentStep: string;
  steps: Step[];
  onStepClick: (stepId: string) => void;
}) => {
  return (
    <div className="w-full max-w-5xl mx-auto mb-8">
      <div className="flex justify-between items-center gap-2">
        {steps.map((step) => (
          <button
            key={step.id}
            onClick={() => step.enabled && onStepClick(step.id)}
            disabled={!step.enabled}
            className={`
              flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
              ${step.enabled 
                ? 'cursor-pointer hover:bg-rose-50' 
                : 'cursor-not-allowed opacity-50'
              }
              ${step.current 
                ? 'border-2 border-rose-500 text-rose-500 bg-rose-50' 
                : 'border border-gray-200 text-gray-600'
              }
            `}
          >
            {step.label}
          </button>
        ))}
      </div>
    </div>
  );
});

ProgressBar.displayName = 'ProgressBar';

const StoryInputForm = memo(({ onSubmit, isLoading }: { 
  onSubmit: (inputs: StoryInputs) => void;
  isLoading: boolean;
}) => {
  const [inputs, setInputs] = useState<StoryInputs>({
    storyTitle: '',
    mainCharacters: '',
    storyGenre: '',
    storyLocation: '',
    openingScene: '',
    storyDuration: '30'
  });

  const handleChange = (field: keyof StoryInputs, value: string) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(inputs);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Story Title
          </label>
          <Input
            type="text"
            value={inputs.storyTitle}
            onChange={(e) => handleChange('storyTitle', e.target.value)}
            placeholder="Enter your story title (e.g., The Whispering Forest)"
            className="w-full"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Main Characters
          </label>
          <Textarea
            value={inputs.mainCharacters}
            onChange={(e) => handleChange('mainCharacters', e.target.value)}
            placeholder="List main characters and their traits (e.g., Lena – brave, Zeke – loyal)"
            className="min-h-[100px]"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Story Genre
            </label>
            <Select
              value={inputs.storyGenre}
              onValueChange={(value) => handleChange('storyGenre', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Genre" />
              </SelectTrigger>
              <SelectContent>
                {genreOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Story Duration
            </label>
            <Select
              value={inputs.storyDuration}
              onValueChange={(value) => handleChange('storyDuration', value as '15' | '30' | '60')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Duration" />
              </SelectTrigger>
              <SelectContent>
                {durationOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Story Setting / Location
          </label>
          <Textarea
            value={inputs.storyLocation}
            onChange={(e) => handleChange('storyLocation', e.target.value)}
            placeholder="Describe the setting (e.g., In an ancient jungle temple...)"
            className="min-h-[100px]"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Opening Scene
          </label>
          <Textarea
            value={inputs.openingScene}
            onChange={(e) => handleChange('openingScene', e.target.value)}
            placeholder="Describe how the story starts (e.g., A strange box arrives at their door...)"
            className="min-h-[100px]"
            required
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full"
        variant="default"
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-t-2 border-white rounded-full animate-spin" />
            <span>Enhancing Story...</span>
          </div>
        ) : (
          'Create Story'
        )}
      </Button>
    </form>
  );
});

StoryInputForm.displayName = 'StoryInputForm';

const formatStory = (story: string) => {
  // Clean the story text and ensure proper paragraph spacing
  const cleanedStory = story
    .trim()
    .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newline
    .split('\n\n')
    .filter(paragraph => paragraph.trim())
    .join('\n\n');

  return cleanedStory;
};

// Add new interfaces
interface AudioResult {
  url: string;
  script: string;
}

interface AudioSceneInputs {
  script: string;
}

// Add AudioContainer component
const AudioContainer = memo(({ 
  scene,
  generatedAudio,
  onGenerateAudio,
  setGeneratedAudios 
}: { 
  scene: Scene;
  generatedAudio?: AudioResult;
  onGenerateAudio: (script: string) => Promise<void>;
  setGeneratedAudios: React.Dispatch<React.SetStateAction<Record<string, AudioResult>>>;
}) => {
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [scriptError, setScriptError] = useState<string | null>(null);
  const [audioScript, setAudioScript] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleGenerateScript = async () => {
    setIsGeneratingScript(true);
    setScriptError(null);
    try {
      const response = await fetch('/api/generate-audio-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageDescription: scene.imagePrompt,
          sceneDescription: scene.text
        })
      });

      if (!response.ok) throw new Error('Failed to generate script');
      
      const data = await response.json();
      setAudioScript(data.audioScript);
    } catch (error) {
      setScriptError('Failed to generate script');
      console.error('Script generation error:', error);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleGenerateAudio = async () => {
    if (!audioScript) return;
    setIsGeneratingAudio(true);
    try {
      await onGenerateAudio(audioScript);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const fetchExistingAudio = async () => {
    try {
      const { data: audioRecord } = await (await supabase)
        .from('scene_audio')
        .select('audio_url, script')
        .eq('scene_id', scene.id)
        .maybeSingle();

      if (audioRecord) {
        setGeneratedAudios(prev => ({
          ...prev,
          [scene.id]: {
            url: audioRecord.audio_url,
            script: audioRecord.script
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching existing audio:', error);
    }
  };

  useEffect(() => {
    fetchExistingAudio();
  }, [scene.id]);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    const audioElement = audioRef.current;
    if (audioElement) {
      audioElement.onended = () => setIsPlaying(false);
      audioElement.onpause = () => setIsPlaying(false);
      audioElement.onplay = () => setIsPlaying(true);
    }
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6 flex gap-6">
      <div className="w-1/2 relative">
        <video
          controls
          className="w-full aspect-video rounded-lg"
          src={scene.videoUrl}
        >
          Your browser does not support video playback.
        </video>
      </div>

      <div className="w-1/2 flex flex-col h-[400px]">
        <div className="flex-1 space-y-4 overflow-y-auto pr-4 custom-scrollbar">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-semibold text-gray-700">
                Narration Script
              </label>
              <Button
                onClick={handleGenerateScript}
                disabled={isGeneratingScript}
                className="px-3 py-1 text-sm bg-rose-100 text-rose-600 rounded hover:bg-rose-200 transition-colors"
              >
                {isGeneratingScript ? 'Generating...' : 'Generate Script'}
              </Button>
            </div>
            {audioScript ? (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">{audioScript}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {audioScript.length} characters
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">
                No script generated yet.
              </p>
            )}
          </div>

          {audioScript && (
            <Button
              onClick={handleGenerateAudio}
              disabled={isGeneratingAudio || !audioScript}
              className="w-full mt-4 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors disabled:opacity-50"
            >
              {isGeneratingAudio ? 'Generating Audio...' : 'Generate Audio'}
            </Button>
          )}

          {generatedAudio?.script && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Audio Script
              </label>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-4">
                {generatedAudio.script}
              </p>
            </div>
          )}

          {generatedAudio?.url && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">
                Generated Audio
              </label>
              <div className="w-full">
                <audio
                  controls
                  src={generatedAudio.url}
                  className="w-full"
                >
                  Your browser does not support audio playback.
                </audio>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

AudioContainer.displayName = 'AudioContainer';

// Add AudioBoard component
const AudioBoard = memo(({ 
  scenes,
  generatedAudios,
  onGenerateAudio,
  setGeneratedAudios 
}: { 
  scenes: Scene[];
  generatedAudios: Record<string, AudioResult>;
  onGenerateAudio: (sceneId: string) => Promise<void>;
  setGeneratedAudios: React.Dispatch<React.SetStateAction<Record<string, AudioResult>>>;
}) => {
  const router = useRouter();

  const handleMergeAudioVideo = () => {
    // Get all video and audio URLs in sequence
    const mediaUrls = scenes.map(scene => ({
      videoUrl: scene.videoUrl,
      audioUrl: generatedAudios[scene.id]?.url
    })).filter(urls => urls.videoUrl && urls.audioUrl);

    // Encode URLs for passing as query parameter
    const encodedUrls = encodeURIComponent(JSON.stringify(mediaUrls));
    
    // Navigate to video editor with both video and audio URLs
    router.push(`/tools/video-editor?media=${encodedUrls}`);
  };

  const allAudiosGenerated = scenes.every(scene => generatedAudios[scene.id]?.url);

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Audio Generation Board
        </h2>
        {allAudiosGenerated && (
          <Button
            onClick={handleMergeAudioVideo}
            className="bg-gradient-to-r from-rose-500 to-rose-600 text-white"
          >
            Merge Audio & Video
          </Button>
        )}
      </div>
      <div className="space-y-6">
        {scenes.map((scene) => (
          <AudioContainer
            key={scene.id}
            scene={scene}
            generatedAudio={generatedAudios[scene.id]}
            onGenerateAudio={(script) => onGenerateAudio(scene.id)}
            setGeneratedAudios={setGeneratedAudios}
          />
        ))}
      </div>
    </div>
  );
});

AudioBoard.displayName = 'AudioBoard';

export default function VideoStoryGenerator() {
  const [story, setStory] = useState('')
  const [loading, setLoading] = useState(false)
  const [wordCount, setWordCount] = useState(0)
  const [generatedStory, setGeneratedStory] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [scenes, setScenes] = useState<Scene[]>([])
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null)
  const [showStoryboard, setShowStoryboard] = useState(false)
  const [storyboardLoading, setStoryboardLoading] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [isGeneratingImages, setIsGeneratingImages] = useState(false)
  const [videoResult, setVideoResult] = useState<VideoResult | null>(null)
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false)
  const [hasAnimationPlayed, setHasAnimationPlayed] = useState(false)
  const [enhancingPrompts, setEnhancingPrompts] = useState<Set<string>>(new Set());
  const [currentStep, setCurrentStep] = useState('story');
  const [storyId, setStoryId] = useState<number | null>(null);
  const [generatedVideos, setGeneratedVideos] = useState<Record<string, { url: string }>>({});
  const [storyInputs, setStoryInputs] = useState<StoryInputs | null>(null);
  const [generatedAudios, setGeneratedAudios] = useState<Record<string, AudioResult>>({});
  
  const searchParams = useSearchParams();
  const historyId = searchParams.get('history');

  useEffect(() => {
    async function loadFromHistory() {
      if (!historyId) return;

      const { data, error } = await supabase
        .from('story_history')
        .select('*')
        .eq('id', historyId)
        .single();

      if (error || !data) {
        console.error('Error loading history:', error);
        return;
      }

      setStoryInputs(data.story_inputs);
      setGeneratedStory(data.generated_story);
      setScenes(data.scenes);
      setGeneratedImages(data.generated_images);
      setGeneratedVideos(data.generated_videos);
      setGeneratedAudios(data.generated_audios);
      setStoryId(data.story_id);
      
      if (data.generated_audios) {
        setCurrentStep('audio');
      } else if (data.generated_videos) {
        setCurrentStep('video');
      } else if (data.generated_images) {
        setCurrentStep('images');
      } else if (data.scenes) {
        setCurrentStep('storyboard');
      } else if (data.generated_story) {
        setCurrentStep('enhanced');
      }
    }

    loadFromHistory();
  }, [historyId]);

  const saveToHistory = async () => {
    if (!storyInputs) return; // Early return if no story inputs

    try {
      const historyData = {
        story_inputs: storyInputs,
        generated_story: generatedStory,
        scenes: scenes,
        generated_images: generatedImages,
        generated_videos: generatedVideos,
        generated_audios: generatedAudios,
        story_id: storyId
      };

      const historyId = searchParams.get('history');

      // Check if history already exists and update it
      if (historyId) {
        const { error: updateError } = await supabase
          .from('story_history')
          .update(historyData)
          .eq('id', historyId);

        if (updateError) throw updateError;
      } else {
        // Create new history entry
        const { error: insertError } = await supabase
          .from('story_history')
          .insert(historyData);

        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error('Error saving history:', error);
    }
  };

  const handleGenerateSceneAudio = async (sceneId: string) => {
    try {
      const scene = scenes.find(s => s.id === sceneId);
      if (!scene) return;

      const scriptResponse = await fetch('/api/generate-audio-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageDescription: scene.imagePrompt,
          sceneDescription: scene.text
        })
      });

      if (!scriptResponse.ok) throw new Error('Failed to generate audio script');
      
      const scriptData = await scriptResponse.json();
      
      const audioResponse = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: scriptData.audioScript,
          sceneId: scene.id
        })
      });

      if (!audioResponse.ok) throw new Error('Failed to generate audio');
      
      const audioData = await audioResponse.json();
      
      setGeneratedAudios(prev => ({
        ...prev,
        [sceneId]: { 
          url: audioData.audioUrl,
          script: scriptData.audioScript
        }
      }));

      await saveToHistory();

    } catch (error) {
      console.error('Error generating audio:', error);
    }
  };

  const countWords = (text: string) => {
    return text.trim().split(/\s+/).filter(Boolean).length
  }

  useEffect(() => {
    setWordCount(countWords(story))
  }, [story])

  const handleStorySubmit = async (inputs: StoryInputs) => {
    setLoading(true);
    try {
      const response = await fetch('/api/video-story-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          inputs,
          generateScenes: false 
        })
      });
      
      const data = await response.json();
      setGeneratedStory(data.refinedStory);
      setStoryInputs(inputs);
      setIsEditing(false);
      setShowStoryboard(false);
      setScenes([]);
      setHasAnimationPlayed(false);
      await saveToHistory();
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const handleGenerateStoryboard = async () => {
    if (!generatedStory || !storyInputs) return;
    
    const numScenes = Math.floor(parseInt(storyInputs.storyDuration) / 5);
    
    setStoryboardLoading(true);
    try {
      const { data: storyData, error: storyError } = await supabase
        .from('video_stories')
        .insert({
          title: 'AI Generated Story',
          story_text: generatedStory,
        })
        .select()
        .single();

      if (storyError) {
        console.error('Error creating story:', storyError);
        throw storyError;
      }
      
      setStoryId(storyData.id);

      const response = await fetch('/api/video-story-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          story: generatedStory,
          generateScenes: true,
          numScenes,
          inputs: storyInputs
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate storyboard')
      }

      const responseData = await response.json() as ApiResponse;
      
      if (!responseData.success || !responseData.scenes || responseData.scenes.length === 0) {
        throw new Error(responseData.error || 'No scenes were generated')
      }

      const scenesWithGreyscale = responseData.scenes.map((scene: ParsedScene) => ({
        ...scene,
        storyboardImageUrl: createGreyscaleSvg({ 
          id: scene.id, 
          number: scene.number, 
          text: scene.text, 
          imageUrl: '' 
        }).storyboardImageUrl
      }));
      
      setScenes(scenesWithGreyscale);
      setShowStoryboard(true);

      for (const [index, scene] of scenesWithGreyscale.entries()) {
        try {
          const imageResponse = await fetch('/api/video-story-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              prompt: scene.imagePrompt,
              storyId: storyData.id,
              sceneOrder: index + 1,
              sceneDescription: scene.text,
              sceneId: scene.id
            })
          });

          const imageData = await imageResponse.json();
          
          if (imageData.imageUrl) {
            setScenes((prevScenes: Scene[]) => 
              prevScenes.map((s: Scene) => 
                s.id === scene.id ? { 
                  ...s, 
                  storyboardImageUrl: imageData.imageUrl,
                  imageUrl: imageData.imageUrl 
                } : s
              )
            );
          }
        } catch (error) {
          console.error(`Error generating image for scene ${scene.id}:`, error)
        }
      }

      await saveToHistory();

    } catch (error) {
      console.error('Error generating storyboard:', error)
    } finally {
      setStoryboardLoading(false)
    }
  }

  const handleSceneTextChange = (sceneId: string, newText: string) => {
    setScenes(prevScenes => 
      prevScenes.map(scene =>
        scene.id === sceneId ? { ...scene, text: newText } : scene
      )
    )
  }

  const handleRegenerateStoryboardImage = useCallback(async (sceneId: string) => {
    setScenes(prevScenes =>
      prevScenes.map(scene =>
        scene.id === sceneId ? { ...scene, isGenerating: true } : scene
      )
    );

    try {
      const scene = scenes.find(s => s.id === sceneId);
      if (!scene || !storyId) {
        throw new Error('Scene or Story ID not found');
      }

      // Use video-story-image endpoint for storyboard images
      const response = await fetch('/api/video-story-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Professional line-art illustration of: ${scene.text}. Scene details: ${scene.visualDetails || scene.text}. Style: Black and white line art, Grayscale Image.`,
          sceneId: scene.id,
          storyId,
          sceneOrder: scene.number,
          sceneDescription: scene.text
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate image');
      }

      const data = await response.json();
      
      if (data.imageUrl) {
        setScenes(prevScenes =>
          prevScenes.map(scene =>
            scene.id === sceneId ? { 
              ...scene, 
              storyboardImageUrl: data.imageUrl,
              imageUrl: data.imageUrl,
              isGenerating: false 
            } : scene
          )
        );

        await saveToHistory();
      }
    } catch (error) {
      console.error('Error generating image:', error);
      setScenes(prevScenes =>
        prevScenes.map(scene =>
          scene.id === sceneId ? { ...scene, isGenerating: false } : scene
        )
      );
    }
  }, [scenes, storyId, saveToHistory]);

  const generateImagePrompt = async (sceneText: string): Promise<string> => {
    try {
      const response = await fetch('/api/generate-image-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sceneText })
      })
      const data = await response.json()
      return data.prompt
    } catch (error) {
      console.error('Error generating prompt:', error)
      return ''
    }
  }

  const handleAddScene = useCallback(async () => {
    const sceneId = Date.now().toString();
    const sceneNumber = scenes.length + 1;
    const defaultText = 'New scene description...';
    const imagePrompt = await generateImagePrompt(defaultText);
    
    const greyScaleData = createGreyscaleSvg({ 
      id: `scene-${sceneId}`,
      number: sceneNumber,
      text: defaultText,
      imageUrl: ''
    });
    
    const newScene: Scene = {
      ...greyScaleData,
      imagePrompt: imagePrompt || '',
      visualDetails: '',
      focusElements: ''
    };
    
    setScenes(prevScenes => [...prevScenes, newScene]);
  }, [scenes])

  const handleDeleteScene = (sceneId: string) => {
    setScenes(scenes.filter(scene => scene.id !== sceneId))
  }

  const handleScenePromptSave = async (sceneId: string, prompt: string) => {
    setScenes(prevScenes =>
      prevScenes.map(scene =>
        scene.id === sceneId
          ? { ...scene, imagePrompt: prompt }
          : scene
      )
    )
  }

  const handleRegenerate = () => {
    handleStorySubmit(storyInputs as StoryInputs)
  }

  const handleGenerateAllImages = async () => {
    setIsGeneratingImages(true)
    const newImages: GeneratedImage[] = scenes.map(scene => ({
      id: `img-${scene.id}`,
      sceneId: scene.id,
      imageUrl: '',
      isGenerating: true
    }))
    setGeneratedImages(newImages)

    try {
      for (const scene of scenes) {
        setGeneratedImages(prev => prev.map(img => 
          img.sceneId === scene.id 
            ? { ...img, isGenerating: true }
            : img
        ))

        const response = await fetch('/api/video-story-image-to-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sceneId: scene.id,
            storyId,
            sceneOrder: scene.number,
            sceneDescription: scene.text,
            imageDescription: scene.imagePrompt,
            shotType: ''
          })
        })

        if (!response.ok) {
          throw new Error('Failed to generate image')
        }

        const data = await response.json()

        setGeneratedImages(prev => prev.map(img => 
          img.sceneId === scene.id 
            ? { ...img, imageUrl: data.imageUrl, isGenerating: false }
            : img
        ))

        await new Promise(resolve => setTimeout(resolve, 500))
      }

      await saveToHistory();

    } catch (error) {
      console.error('Error generating images:', error)
      setGeneratedImages(prev => prev.map(img => ({ ...img, isGenerating: false })))
    } finally {
      setIsGeneratingImages(false)
    }
  }

  const handleRegenerateGalleryImage = async (imageId: string) => {
    const image = generatedImages.find(img => img.id === imageId)
    if (!image) return

    const scene = scenes.find(s => s.id === image.sceneId)
    if (!scene || !storyId) return

    setGeneratedImages(prev => prev.map(img =>
      img.id === imageId ? { ...img, isGenerating: true } : img
    ))

    try {
      const response = await fetch('/api/video-story-image-to-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneId: scene.id,
          storyId,
          sceneOrder: scene.number,
          sceneDescription: scene.text,
          imageDescription: scene.imagePrompt,
          shotType: ''
        })
      })

      const data = await response.json()

      setGeneratedImages(prev => prev.map(img =>
        img.id === imageId
          ? { ...img, imageUrl: data.imageUrl, isGenerating: false }
          : img
      ))

      await saveToHistory();

    } catch (error) {
      console.error('Error regenerating image:', error)
      setGeneratedImages(prev => prev.map(img =>
        img.id === imageId ? { ...img, isGenerating: false } : img
      ))
    }
  }

  const handleGenerateVideo = async () => {
    if (generatedImages.length === 0) return;
    
    setIsGeneratingVideo(true);
    try {
      const videoData = {
        scenes: scenes.map((scene, index) => ({
          imageUrl: generatedImages[index]?.imageUrl || '',
          description: scene.text,
          visualDetails: scene.visualDetails || scene.text,
          focusElements: scene.focusElements || ''
        })),
        story: generatedStory
      };

      const response = await fetch('/api/image-to-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(videoData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate video');
      }
      
      setVideoResult({
        videoUrl: data.videoUrl,
        status: 'completed'
      });

      await saveToHistory();

    } catch (error) {
      console.error('Error generating video:', error);
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const handleGenerateSceneVideo = async (sceneId: string, inputs: VideoSceneInputs) => {
    try {
      const scene = scenes.find(s => s.id === sceneId);
      if (!scene) return;

      const videoPrompt = `Scene Description: ${scene.text}
Video Motion: ${inputs.videoMotion}
Camera Movement: ${inputs.cameraMovement}`;

      const response = await fetch('/api/image-to-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenes: [{
            imageUrl: scene.generatedImageUrl || scene.imageUrl,
            description: scene.text,
            videoMotion: inputs.videoMotion,
            cameraMovement: inputs.cameraMovement,
            prompt: videoPrompt
          }],
          story: generatedStory
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate video');
      }

      const data = await response.json();
      
      setGeneratedVideos(prev => ({
        ...prev,
        [sceneId]: { url: data.videoUrl }
      }));

      setScenes(prev => 
        prev.map(s => 
          s.id === sceneId ? { ...s, videoUrl: data.videoUrl } : s
        )
      );

      await saveToHistory();

    } catch (error) {
      console.error('Error generating video:', error);
    }
  };

  const handleSaveEdit = () => {
    setIsEditing(false);
  };

  const handleVideoPromptSave = (sceneId: string, prompt: string) => {
    setScenes(prevScenes =>
      prevScenes.map(scene =>
        scene.id === sceneId
          ? { ...scene, videoPrompt: prompt }
          : scene
      )
    );
  };

  const handleVideoPromptEnhance = async (sceneId: string) => {
    const scene = scenes.find(s => s.id === sceneId);
    if (!scene) return;

    try {
      const response = await fetch('/api/enhance-video-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneText: scene.text,
          visualDetails: scene.visualDetails,
          currentPrompt: scene.videoPrompt
        })
      });

      const data = await response.json();
      
      if (data.enhancedPrompt) {
        handleVideoPromptSave(sceneId, data.enhancedPrompt);
      }
    } catch (error) {
      console.error('Error enhancing video prompt:', error);
    }
  };

  const canGenerateVideo = useCallback(() => {
    return scenes.every(scene => scene.videoPrompt && scene.videoPrompt.trim() !== '');
  }, [scenes]);

  const steps: Step[] = [
    { 
      id: 'story', 
      label: 'Story', 
      number: 1,
      completed: !!story, 
      current: currentStep === 'story',
      enabled: true 
    },
    { 
      id: 'enhanced', 
      label: 'Enhanced Story', 
      number: 2,
      completed: !!generatedStory, 
      current: currentStep === 'enhanced',
      enabled: !!generatedStory 
    },
    { 
      id: 'storyboard', 
      label: 'Storyboard', 
      number: 3,
      completed: scenes.length > 0, 
      current: currentStep === 'storyboard',
      enabled: !!generatedStory 
    },
    { 
      id: 'images', 
      label: 'Images', 
      number: 4,
      completed: generatedImages.length > 0, 
      current: currentStep === 'images',
      enabled: scenes.length > 0 
    },
    { 
      id: 'video', 
      label: 'Videos', 
      number: 5,
      completed: !!videoResult, 
      current: currentStep === 'video',
      enabled: generatedImages.length > 0 
    },
    { 
      id: 'audio', 
      label: 'Audio', 
      number: 6,
      completed: Object.keys(generatedAudios).length > 0, 
      current: currentStep === 'audio',
      enabled: Object.keys(generatedVideos).length > 0 
    }
  ];

  const handleStepClick = (stepId: string) => {
    setCurrentStep(stepId);
  };

  useEffect(() => {
    if (videoResult) setCurrentStep('video');
    else if (generatedImages.length > 0) setCurrentStep('images');
    else if (scenes.length > 0) setCurrentStep('storyboard');
    else if (generatedStory) setCurrentStep('enhanced');
    else setCurrentStep('story');
  }, [videoResult, generatedImages.length, scenes.length, generatedStory]);

  const loadingButton = (
    <div className="flex items-center justify-center space-x-2">
      <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin" />
      <span>Enhancing your story...</span>
    </div>
  );

  return (
    <main className="min-h-screen bg-backgroundApp dark:bg-neutral-950">
      <div className="container mx-auto py-8 px-4 max-w-6xl space-y-8">
        <div className="flex justify-between items-center">
          <Link href="/tools">
            <Button variant="outline" className="border-neutral-500">
              ← Back
            </Button>
          </Link>          
        </div>

        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold text-rose-500">
            Video Story Generator
          </h1>
          <p className="text-muted-foreground text-lg">
            Create cinematic videos with AI-powered story generation and scene organization.
          </p>
        </div>

        <ProgressBar 
          currentStep={currentStep}
          steps={steps}
          onStepClick={handleStepClick}
        />

        <motion.div 
          className="space-y-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <AnimatePresence mode='wait'>
            {currentStep === 'story' && (
              <motion.div
                key="story-input"
                variants={fadeIn}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="bg-white rounded-2xl shadow-xl p-8 backdrop-blur-lg border border-white/20"
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-rose-500">
                    Create Your Story
                  </h2>
                  <p className="text-lg font-medium text-rose-500 mt-2">
                    Fill in the details below to create your video story
                  </p>
                </div>
                <StoryInputForm 
                  onSubmit={handleStorySubmit}
                  isLoading={loading}
                />
              </motion.div>
            )}

            {currentStep === 'enhanced' && generatedStory && (
              <motion.div
                key="generated-story"
                variants={slideUp}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-xl p-8 mt-8 border border-white/20"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Your Story</h2>
                  <div className="space-x-3">
                    <Button
                      onClick={() => isEditing ? handleSaveEdit() : setIsEditing(true)}
                      variant="outline"
                      className="border-2 hover:border-pink-400 transition-colors duration-200"
                    >
                      {isEditing ? 'Save' : 'Edit'}
                    </Button>
                    {currentStep === 'enhanced' && (
                      <Button
                        onClick={handleGenerateStoryboard}
                        disabled={storyboardLoading}
                        className="bg-gradient-to-r from-rose-400 to-rose-500 text-white hover:from-rose-500 hover:to-rose-600"
                      >
                        {storyboardLoading ? 'Generating...' : 'Create Storyboard'}
                      </Button>
                    )}
                  </div>
                </div>
                {isEditing ? (
                  <Textarea
                    value={generatedStory}
                    onChange={(e) => setGeneratedStory(e.target.value)}
                    className="w-full h-48 p-4 border-2 border-gray-200 rounded-xl focus:border-pink-400 focus:ring-2 focus:ring-pink-200 transition-all duration-200"
                  />
                ) : (
                  <div className="prose max-w-none text-justify text-gray-700 leading-relaxed px-8">
                    {!hasAnimationPlayed && currentStep === 'enhanced' ? (
                      <Typewriter
                        words={[formatStory(generatedStory)]}
                        cursor={false}
                        typeSpeed={1}
                        onType={(step) => {
                          if (step === generatedStory.length - 1) {
                            setHasAnimationPlayed(true);
                          }
                        }}
                      />
                    ) : (
                      formatStory(generatedStory)
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {currentStep === 'storyboard' && showStoryboard && (
              <motion.div
                key="storyboard"
                variants={slideUp}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl shadow-xl p-8"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-3xl font-bold text-rose-500">Storyboard</h2>
                  <div className="flex items-center gap-4">
                    <motion.button
                      onClick={() => {
                        setCurrentStep('images');
                        handleGenerateAllImages();
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={scenes.length === 0}
                      className="px-6 py-3 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Generate Images
                    </motion.button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mt-8">
                  {scenes.map((scene) => (
                    <motion.div
                      key={scene.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="flex flex-col bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"
                    >
                      <div className="relative w-full aspect-video rounded-t-xl overflow-hidden bg-neutral-100">
                        {scene.isGenerating ? (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-neutral-200 border-t-rose-500" />
                          </div>
                        ) : (
                          <img
                            src={scene.storyboardImageUrl}
                            alt={`Scene ${scene.number}`}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute top-3 left-3 px-2 py-1 bg-black/50 rounded-md">
                          <span className="text-white text-sm font-medium">
                            Scene {scene.number}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 space-y-4">
                        <div className="space-y-2">
                          <Textarea
                            value={scene.text}
                            onChange={(e) => handleSceneTextChange(scene.id, e.target.value)}
                            className="w-full p-3 min-h-[100px] text-sm text-neutral-700 border border-neutral-200 
                              rounded-lg focus:border-rose-400 focus:ring-1 focus:ring-rose-400 
                              transition-all duration-200 resize-none"
                            placeholder="Describe what happens in this scene..."
                          />
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <Button
                            onClick={() => handleRegenerateStoryboardImage(scene.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium 
                              text-neutral-600 hover:text-neutral-800 bg-neutral-100 
                              hover:bg-neutral-200 rounded-md transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                              />
                            </svg>
                            Regenerate
                          </Button>
                          
                          <Button
                            onClick={() => handleDeleteScene(scene.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium 
                              text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md 
                              transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                              />
                            </svg>
                            Delete
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {currentStep === 'images' && (
              <GenerateImagesSection 
                scenes={scenes} 
                storyId={storyId} 
                setScenes={setScenes}
                onNavigateToVideo={() => setCurrentStep('video')}
              />
            )}

            {currentStep === 'video' && (
              <VideoBoard
                scenes={scenes}
                generatedVideos={generatedVideos}
                onGenerateVideo={handleGenerateSceneVideo}
                setCurrentStep={setCurrentStep}
              />
            )}

            {currentStep === 'audio' && (
              <AudioBoard
                scenes={scenes}
                generatedAudios={generatedAudios}
                onGenerateAudio={handleGenerateSceneAudio}
                setGeneratedAudios={setGeneratedAudios}
              />
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </main>
  )
}

