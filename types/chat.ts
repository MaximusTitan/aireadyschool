import { type Message, CreateMessage } from 'ai';

export type ToolState = 'pending' | 'result' | 'error';

export interface ToolCall {
  id: string;
  tool: string;
  parameters: Record<string, any>;
  function?: {
    name: string;
    arguments: Record<string, any>;
  };
  result?: any;
  state?: ToolState;
}

export interface ChatMessage extends Omit<Message, 'role'> {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'data';
  content: string;
  createdAt?: Date;
  toolCalls?: ToolCall[];
  isHidden?: boolean;
  hasBeenPlayed?: boolean;
}

export interface ThreadMessage extends ChatMessage {
  created_at?: string;
}

export type ChatAreaProps = {
  messages: any[];
  simulationCode: string | null;
  simulationCodeRef: React.MutableRefObject<string | null>;
  generatedImages: Record<string, { url: string; credits: number }>;
  pendingImageRequests: Set<string>;
  completedImages: Set<string>;
  pendingVisualizations: Set<string>;
  handleAnswerSubmit: (data: {
    studentAnswer: number;
    correctAnswer: number;
    question: string;
    topic: string;
    level: string;
  }) => Promise<void>;
  handleImageGeneration: (
    toolCallId: string,
    params: {
      prompt: string;
      style: string;
      imageSize: string;
      numInferenceSteps: number;
      numImages: number;
      enableSafetyChecker: boolean;
    }
  ) => Promise<void>;
  handleVisualization: (
    subject: string,
    concept: string
  ) => Promise<{ code?: string }>;
  onSimulationCode: (code: string) => void;
  generatedQuizzes: Record<string, any>;
  pendingQuizzes: Set<string>;
  handleQuizGeneration: (
    toolCallId: string,
    params: { subject: string; difficulty: string }
  ) => Promise<void>;
  handleQuizAnswer: (data: {
    selectedOption: {
      id: string;
      text: string;
      isCorrect: boolean;
    };
    question: string;
    allOptions: Array<{
      id: string;
      text: string;
      isCorrect: boolean;
    }>;
    subject: string;
    difficulty: string;
    explanation: string;
  }) => Promise<void>;
  input: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  generatedVideos: Record<string, string>;
  setGeneratedVideos: (videos: Record<string, string>) => void;
  lastGeneratedImage: string | null;
  isOwner?: boolean;
};
