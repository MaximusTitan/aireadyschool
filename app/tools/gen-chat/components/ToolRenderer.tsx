import { useRef } from "react";
import { SimulationWrapper } from "./SimulationWrapper";
import { MathProblem } from "./math-problem";
import { QuizCard } from "./quiz-card";
import { MindMapViewer } from "./mind-map-viewer";
import { VideoGenerator } from "./video-generator";

type ToolRendererProps = {
  invocation: any;
  generatedImages: Record<string, any>;
  pendingImageRequests: Set<string>;
  completedImages: Set<string>;
  pendingVisualizations: Set<string>;
  simulationCode: string | null;
  simulationCodeRef: React.MutableRefObject<string | null>;
  onSimulationCode: (code: string) => void;
  handleAnswerSubmit: (data: any) => void;
  handleImageGeneration: (toolCallId: string, params: any) => void;
  handleVisualization: (subject: string, concept: string) => Promise<any>;
  generatedQuizzes: Record<string, any>;
  pendingQuizzes: Set<string>;
  handleQuizGeneration: (toolCallId: string, params: any) => void;
  handleQuizAnswer: (data: any) => void;
  generatedVideos: Record<string, string>;
  handleVideoComplete: (toolCallId: string, videoUrl: string) => void;
  lastGeneratedImage: string | null;
};

export const ToolRenderer = ({
  invocation,
  generatedImages,
  pendingImageRequests,
  completedImages,
  pendingVisualizations,
  simulationCode,
  simulationCodeRef,
  onSimulationCode,
  handleAnswerSubmit,
  handleImageGeneration,
  handleVisualization,
  generatedQuizzes,
  pendingQuizzes,
  handleQuizGeneration,
  handleQuizAnswer,
  generatedVideos,
  handleVideoComplete,
  lastGeneratedImage,
}: ToolRendererProps) => {
  const { toolName, toolCallId, state, result } = invocation;

  // For pending state, show a spinner placeholder
  if (state !== "result") {
    return (
      <div className="mb-4 animate-pulse">
        <div className="h-8 bg-indigo-100 rounded w-3/4" />
      </div>
    );
  }

  switch (toolName) {
    case "generateMathProblem":
      return (
        <div className="mb-4">
          <MathProblem {...result} onAnswer={handleAnswerSubmit} />
        </div>
      );

    case "generateQuiz": {
      // Only generate if we don't have the quiz data and haven't started generating
      if (
        !generatedQuizzes[toolCallId] &&
        result.pending &&
        !pendingQuizzes.has(toolCallId)
      ) {
        handleQuizGeneration(toolCallId, {
          subject: result.subject,
          difficulty: result.difficulty,
        });
      }

      // Show loading state
      if (!generatedQuizzes[toolCallId]) {
        return (
          <div className="mb-4">
            <div className="animate-pulse">
              <div className="h-24 bg-neutral-100 rounded" />
              <div className="text-xs text-neutral-500 mt-2">
                Generating quiz...
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="mb-4">
          <QuizCard
            {...generatedQuizzes[toolCallId]}
            onAnswer={handleQuizAnswer}
          />
        </div>
      );
    }

    case "generateImage": {
      const shouldTriggerGeneration =
        result.pending &&
        !pendingImageRequests.has(toolCallId) &&
        !completedImages.has(toolCallId);

      if (shouldTriggerGeneration) {
        handleImageGeneration(toolCallId, {
          prompt: result.prompt,
          style: result.style,
          imageSize: result.imageSize || "square_hd",
          numInferenceSteps: 1,
          numImages: 1,
          enableSafetyChecker: true,
        });
      }

      if (!generatedImages[toolCallId] && result.pending) {
        return (
          <div className="mb-4">
            <div className="animate-pulse">
              <div className="h-48 bg-neutral-100 rounded" />
              <div className="text-xs text-neutral-500 mt-2">
                Generating image...
              </div>
            </div>
          </div>
        );
      }

      const imageData = generatedImages[toolCallId];
      if (!imageData) return null;

      return (
        <div className="mb-4 space-y-2">
          {imageData.url === "error" ? (
            <div className="text-sm text-red-500">
              Failed to generate image. Please try again.
            </div>
          ) : (
            <>
              <img
                src={imageData.url}
                alt={result.prompt}
                className="w-full max-w-md rounded-lg"
                loading="lazy"
              />
              <div className="text-xs text-neutral-500">
                Credits remaining: {imageData.credits}
              </div>
            </>
          )}
        </div>
      );
    }

    case "conceptVisualizer":
      if (simulationCode) {
        return (
          <div className="mb-4">
            <SimulationWrapper code={simulationCode} />
          </div>
        );
      }

      if (!pendingVisualizations.has(toolCallId)) {
        pendingVisualizations.add(toolCallId);
        handleVisualization(result.subject, result.concept).then((res) => {
          if (res.code) {
            let cleaned = res.code.trim();
            if (cleaned.startsWith("```html")) {
              cleaned = cleaned
                .replace(/^```html\s*/, "")
                .replace(/```$/, "")
                .trim();
            }
            simulationCodeRef.current = cleaned;
            onSimulationCode(cleaned);
          }
        });
      }

      return (
        <div className="mb-4">
          <div className="animate-pulse">
            <div className="h-48 bg-neutral-100 rounded" />
            <div className="text-xs text-neutral-500 mt-2">
              Generating visualization...
            </div>
          </div>
        </div>
      );

    case "generateMindMap":
      return (
        <div className="mb-4">
          <MindMapViewer data={result} />
        </div>
      );

    case "generateVideo": {
      const imageSource = result.imageUrl || lastGeneratedImage;

      if (generatedVideos[toolCallId]) {
        return (
          <div className="mb-4">
            <video
              src={generatedVideos[toolCallId]}
              controls
              className="w-full rounded-lg"
            />
          </div>
        );
      }

      return (
        <div className="mb-4">
          <VideoGenerator
            toolCallId={toolCallId}
            onComplete={handleVideoComplete}
            prompt={result.prompt}
            initialImage={imageSource}
          />
        </div>
      );
    }

    default:
      return null;
  }
};
