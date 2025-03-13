"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import {
  X,
  Maximize2,
  FileText,
  ChevronLeft,
  History,
} from "lucide-react";
import Loader from "@/components/ui/loader";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import pptxgen from "pptxgenjs";
import localFont from "next/font/local";
import Link from "next/link";
import { ComicForm, ComicFormData } from "@/components/comic-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Toaster } from "@/components/ui/toaster";
import { DebugPanel } from "@/components/debug-panel";
import ComicPanelLayout from "@/components/comic-panel-layout";
import { saveComic, getUserComics } from '@/utils/supabase/comics';
import { useToast } from '@/components/ui/use-toast';
import html2canvas from 'html2canvas';
import { HistoryModal } from "@/components/history-modal";

// Initialize your custom font
const comicNeue = localFont({
  src: "../../../public/fonts/ComicNeue-Bold.ttf",
  weight: "700",
  variable: "--font-comic",
  display: "swap",
});

const supabase = createClient();

export default function ComicGenerator() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [imageData, setImageData] = useState<{
    urls: string[];
    descriptions: string[];
    dialogues: string[];
  }>({ urls: [], descriptions: [], dialogues: [] });
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadedImages, setLoadedImages] = useState<boolean[]>([]);
  const [requestedPanels, setRequestedPanels] = useState<number>(8);
  const [comicStyleFromForm, setComicStyleFromForm] = useState<string>("Cartoon");
  const [activeTab, setActiveTab] = useState("advanced");
  const [useOpenAI, setUseOpenAI] = useState(false);
  const aiProvider = useOpenAI ? 'openai' : 'groq';
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [userComics, setUserComics] = useState<any[]>([]);

  // Set prompt from query string if available
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const topic = searchParams.get("topic");
    if (topic) {
      setPrompt(topic);
    }
  }, []);

  // Auto-submit if a topic is provided in the URL
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const topic = searchParams.get("topic");
    if (topic && prompt === topic && !loading && imageData.urls.length === 0) {
      handleSubmit(new Event("submit") as unknown as React.FormEvent);
    }
  }, [prompt, loading]);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleSubmitWithPrompt = async (submittedPrompt: string, provider: string = aiProvider) => {
    setImageData({ urls: [], descriptions: [], dialogues: [] });
    setLoadedImages([]);
    setLoading(true);

    try {
      // Ensure we're using the actual requested panel count from state
      const actualRequestedPanels = Number(requestedPanels) || 8;
      console.log(`Generating comic with ${actualRequestedPanels} panels`);
      
      const promptResponse = await fetch("/api/prompt-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: submittedPrompt, 
          provider,
          numPanels: actualRequestedPanels + 1  // +1 for title panel
        }),
      });
      
      const promptData = await promptResponse.json();
      if (!promptResponse.ok) throw new Error(promptData.message);

      const imageResponse = await fetch("/api/image-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompts: promptData.prompts }),
      });
      
      const imageGenData = await imageResponse.json();
      if (!imageResponse.ok) throw new Error(imageGenData.message);

      const preloadPromises = imageGenData.imageUrls.map((url: string) => loadImage(url));
      await Promise.all(preloadPromises);

      setImageData({
        urls: imageGenData.imageUrls,
        descriptions: promptData.prompts,
        dialogues: promptData.dialogues || promptData.prompts,
      });
      setLoadedImages(new Array(imageGenData.imageUrls.length).fill(true));

      // Save the comic
      await saveComic({
        prompt: submittedPrompt,
        image_urls: imageGenData.imageUrls,
        descriptions: promptData.prompts,
        dialogues: promptData.dialogues || promptData.prompts,
        panel_count: Number(requestedPanels),
        comic_style: comicStyleFromForm,
        title: promptData.title || submittedPrompt,
      });

      toast({
        title: "Comic saved successfully",
        description: "You can find it in your saved comics",
      });

    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: "Failed to save comic. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleSubmitWithPrompt(prompt, aiProvider);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  const getFileName = (extension: string) => {
    const sanitizedPrompt = prompt.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    return `${sanitizedPrompt}.${extension}`;
  };

  const downloadPDF = async () => {
    if (!containerRef.current) return;

    try {
      setLoading(true);

      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [1280, 720],
      });

      // Get the comic container element
      const comicElement = containerRef.current.querySelector('.max-w-6xl') as HTMLElement;
      if (!comicElement) {
        throw new Error('Comic container not found');
      }

      // Function to capture a specific element
      const captureElement = async (element: HTMLElement) => {
        return await html2canvas(element, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: true, // Enable logging for debugging
          foreignObjectRendering: true,
          removeContainer: false,
          imageTimeout: 30000, // Increase timeout for image loading
          onclone: (clonedDoc) => {
            // Ensure all images are loaded in cloned document
            const images = clonedDoc.getElementsByTagName('img');
            Array.from(images).forEach(img => {
              img.crossOrigin = 'anonymous';
              // Force image to be visible
              img.style.opacity = '1';
              img.style.display = 'block';
            });
          }
        });
      };

      // Function to add page to PDF
      const addPageToPDF = async (pageElement: HTMLElement, pageNumber: number) => {
        try {
          if (pageNumber > 0) {
            pdf.addPage([1280, 720], 'landscape');
          }

          const canvas = await captureElement(pageElement);
          const imageData = canvas.toDataURL('image/jpeg', 1.0);

          pdf.addImage({
            imageData,
            format: 'JPEG',
            x: 0,
            y: 0,
            width: 1280,
            height: 720,
            compression: 'FAST',
            rotation: 0
          });

          return true;
        } catch (error) {
          console.error(`Error capturing page ${pageNumber}:`, error);
          return false;
        }
      };

      // Save current page state
      const currentPageBackup = currentPage;

      // Get all pages
      const totalPages = Math.ceil((imageData.urls.length - 1) / 4);
      let successfulPages = 0;

      // Add title page
      await addPageToPDF(comicElement, 0);

      // Add each content page
      for (let i = 0; i < totalPages; i++) {
        setCurrentPage(i);
        // Wait for page transition and rendering
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (await addPageToPDF(comicElement, i + 1)) {
          successfulPages++;
        }
      }

      // Restore original page
      setCurrentPage(currentPageBackup);

      if (successfulPages === 0) {
        throw new Error('Failed to capture any pages');
      }

      // Save the PDF
      const filename = `${prompt.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_comic.pdf`;
      pdf.save(filename);

      toast({
        title: "PDF Generated Successfully",
        description: `Saved ${successfulPages + 1} pages to ${filename}`,
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement("img");
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  };

  const handleAdvancedFormSubmit = async (formData: ComicFormData, provider: string) => {
    // Ensure we capture the panel count from the form
    const panelCount = Number(formData.numPanels);
    
    // Update state to store the requested panel count
    setRequestedPanels(panelCount);
    console.log(`Panel count selected: ${panelCount}`);
    
    // Set comic style from form
    setComicStyleFromForm(formData.comicStyle);
    
    // Generate the prompt with the specified panel count
    const generatedPrompt = buildPromptFromFormData(formData);
    
    // Submit for processing
    await handleSubmitWithPrompt(generatedPrompt, provider);
  };

  const buildPromptFromFormData = (data: ComicFormData): string => {
    return `Create a ${data.numPanels}-panel ${data.comicStyle} comic titled "${data.title}" featuring ${data.mainCharacters} set in ${data.setting}. The dialogue should be ${data.dialogueTone.toLowerCase()} with a ${data.endingStyle.toLowerCase()}. ${data.additionalDetails}`;
  };

  const fetchUserComics = async () => {
    try {
      const comics = await getUserComics();
      setUserComics(comics);
    } catch (error) {
      console.error('Error fetching comics:', error);
      toast({
        title: "Error",
        description: "Failed to load comic history",
        variant: "destructive",
      });
    }
  };

  const handleViewHistoricComic = (comic: any) => {
    setShowHistory(false);
    setComicStyleFromForm(comic.comic_style);
    setRequestedPanels(comic.panel_count);
    setImageData({
      urls: comic.image_urls,
      descriptions: comic.descriptions,
      dialogues: comic.dialogues,
    });
    setPrompt(comic.prompt);
  };

  return (
    <div className={`min-h-screen bg-backgroundApp text-foreground ${comicNeue.variable}`}>
      <div className="container mx-auto py-8 px-4 max-w-6xl space-y-8">
        <Link href="/tools">
          <Button variant="outline" className="mb-2 border-neutral-500">
            ← Back
          </Button>
        </Link>

        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold text-rose-500">Comic Generator</h1>
          <p className="text-muted-foreground text-lg">
            Transform your ideas into engaging comic strips with AI-powered
            image generation and storytelling.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-between items-center mb-4 max-w-5xl">
            <TabsList className="w-fit">
              <TabsTrigger value="simple">Simple Mode</TabsTrigger>
              <TabsTrigger value="advanced">Advanced Mode</TabsTrigger>
            </TabsList>
            <Button
              variant="outline"
              onClick={() => {
                fetchUserComics();
                setShowHistory(true);
              }}
              className="flex items-center gap-2"
            >
              <History className="h-5 w-5" />
              View History
            </Button>
          </div>

          <TabsContent value="simple" className="max-w-5xl space-y-4">
            <div className="flex justify-end items-center space-x-2 mb-4">
              <span className="text-sm text-muted-foreground">
                {useOpenAI ? "Using: OpenAI" : "Using: Groq"}
              </span>
              <Switch
                id="ai-model-simple"
                checked={useOpenAI}
                onCheckedChange={setUseOpenAI}
              />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Textarea
                  placeholder="Enter your comic idea here..."
                  value={prompt}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  className="w-full resize-none px-4 py-2 text-base leading-normal h-[calc(6em+16px)]"
                />
              </div>
              <div className="flex flex-col items-end gap-2">
                <Button
                  type="submit"
                  className="w-fit max-w-md flex items-center gap-2"
                  disabled={loading || !prompt.trim()}
                >
                  Generate Comic
                </Button>
                <p className="text-xs text-muted-foreground">
                  Press Enter to send, Shift + Enter for new line
                </p>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="advanced" className="max-w-5xl">
            <div className="p-6 border rounded-lg bg-card">
              <h2 className="text-xl font-medium mb-4">Advanced Comic Settings</h2>
              <ComicForm 
                onSubmit={handleAdvancedFormSubmit} 
                isLoading={loading} 
                initialPrompt={prompt}
              />
            </div>
          </TabsContent>
        </Tabs>

        {loading && <Loader />}

        {imageData.urls.length > 0 && (
          <div ref={containerRef} className="flex-1 flex flex-col">
            <div className="bg-muted p-2">
              <div className="max-w-5xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={handleFullscreen}
                    className="flex items-center gap-2"
                  >
                    <Maximize2 className="h-5 w-5" />
                    <span>Fullscreen</span>
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={downloadPDF}
                    className="flex items-center gap-2"
                    disabled={loading}
                  >
                    <FileText className="h-5 w-5" />
                    <span>{loading ? 'Generating PDF...' : 'Download PDF'}</span>
                  </Button>
                </div>
                <div className="text-foreground">
                  {imageData.urls.length} panels generated
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-6xl mx-auto">
                <ComicPanelLayout 
                  images={imageData.urls}
                  descriptions={imageData.dialogues}
                  panelCount={Number(requestedPanels)}
                  comicStyle={comicStyleFromForm}
                />
                
                {/* Add debug panel in development */}
                <DebugPanel 
                  data={{
                    panelCount: requestedPanels,
                    comicStyle: comicStyleFromForm,
                    imageCount: imageData.urls.length,
                    descriptionCount: imageData.descriptions.length
                  }} 
                  title="Comic Settings" 
                />
              </div>
            </div>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
            <div className="bg-background p-6 rounded-lg shadow-lg text-center relative border border-border">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                aria-label="Close modal"
                title="Close modal"
              >
                <X className="h-6 w-6" />
              </button>
              <h2 className="text-lg mb-4">
                You do not have enough credits to generate a comic. <br />
                Please recharge your credits.
              </h2>
              <Button
                onClick={() => router.push("/credits")}
                className="bg-primary text-primary-foreground"
              >
                Recharge Credits
              </Button>
            </div>
          </div>
        )}
        <HistoryModal
          open={showHistory}
          onOpenChange={setShowHistory}
          comics={userComics}
          onViewComic={handleViewHistoricComic}
        />
        <Toaster />
      </div>
    </div>
  );
}

// Add utility function to calculate panel distribution (if not imported)
const calculatePanelDistribution = (totalImages: number) => {
  const contentPanels = totalImages - 1; // Subtract 1 for title
  const panelsPerPage = 4;
  const totalPages = Math.ceil(contentPanels / panelsPerPage);
  return { totalPanels: contentPanels, panelsPerPage, totalPages };
};

