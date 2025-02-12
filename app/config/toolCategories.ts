import { 
  LucideIcon,
  ClipboardList,
  CheckSquare,
  Type,
  Image,
  Search,
  FolderKanban,
  BookOpen,
  Youtube,
  MessageSquare,
  Video,
  PresentationIcon,
  Music,
  BookText,
  Code,
  Calendar,
  Terminal,
  Palette as CanvasIcon,
  Atom,
  Brain,
  Users,
  FileText,
  BarChart3
} from "lucide-react";

interface Tool {
  title: string;
  description: string;
  route: string;
  icon: LucideIcon;
  isHot?: boolean;
  isComingSoon?: boolean;
}

export const categories: {
  [key: string]: Tool[];
} = {
  Student: [
    {
      title: "Assessment Generator",
      description: "Create and share interactive multiple choice questions for students",
      route: "/tools/mcq-generator",
      icon: ClipboardList
    },
    {
      title: "Evaluator",
      description: "Evaluate student answers",
      route: "/tools/evaluator",
      icon: CheckSquare
    },
    {
      title: "Text Tools",
      description: "Rewrite, proofread, translate, generate questions, expand, summarize texts",
      route: "/tools/text-tools",
      icon: Type
    },
    {
      title: "Comic Strip Generator",
      description: "Generate comics",
      route: "/tools/comic-generator",
      icon: Image
    },
    {
      title: "Research Assistant",
      description: "Get help with your research",
      route: "/tools/research",
      icon: Search
    },
    {
      title: "Project Helper",
      description: "Get help with your projects",
      route: "/tools/project-helper",
      icon: FolderKanban
    },
    {
      title: "Lesson Content Generator",
      description: "Generate lesson content",
      route: "/tools/lesson-content-generator",
      icon: BookOpen
    },
    {
      title: "YouTube Summary",
      description: "Generate questions and summaries from YouTube videos",
      route: "/tools/youtube-assistant",
      icon: Youtube
    },
    {
      title: "Chat with Docs",
      description: "Powerful RAG-based document chat system for intelligent document interactions",
      route: "/tools/chat-with-docs",
      icon: MessageSquare,
      isHot: true
    },
    {
      title: "Image Generator",
      description: "Create stunning images with Flux AI technology",
      route: "/tools/image-generator",
      icon: Image,
      isHot: true
    },
    {
      title: "Video Generator",
      description: "Generate videos from images",
      route: "/tools/video-generator",
      icon: Video
    },
    {
      title: "Presentation Generator",
      description: "Create presentations",
      route: "/tools/presentation",
      icon: PresentationIcon,
      isHot: true
    },
    {
      title: "Video Story Generator",
      description: "Generate video stories from text",
      route: "/tools/video-story-generator",
      isComingSoon: true,
      icon: Video,
    },
    {
      title: "Song Generator",
      description: "Generate songs from lyrics",
      route: "/tools/song-generator",
      icon: Music
    },
    {
      title: "Story Generator",
      description: "Generate stories from prompts",
      route: "/tools/story-generator",
      icon: BookText
    },
    {
      title: "Creative Coding Playground",
      description: "Code in P5.js",
      route: "/tools/p5",
      icon: Code
    },
    {
      title: "Study Plan Generator",
      description: "Plan your study schedule",
      route: "/tools/study-planner",
      isComingSoon: true,
      icon: Calendar
    },
    {
      title: "Code Playground",
      description: "Code in various languages",
      route: "/tools/code-playground",
      icon: Terminal
    },
    {
      title: "Canvas",
      description: "Generate using Canvas",
      route: "/canvas",
      icon: CanvasIcon
    },
    {
      title: "Science Tutor",
      description: "Learn Science concepts",
      route: "/tools/learn-science",
      icon: Atom
    },
  ],
  Teacher: [
    {
      title: "Lesson Plan Generator",
      description: "Create lesson plans",
      route: "/tools/lesson-planner",
      icon: BookOpen
    },
    {
      title: "Evaluator",
      description: "Evaluate student answers",
      route: "/tools/evaluator",
      icon: CheckSquare
    },
    {
      title: "Text Tools",
      description: "Rewrite, proofread, translate, generate questions, expand, summarize texts",
      route: "/tools/text-tools",
      icon: Type
    },
    {
      title: "Teachable Machine",
      description: "Train a machine learning model",
      route: "/tools/teachable-machine",
      icon: Brain
    },
    {
      title: "Assessment Generator",
      description: "Create interactive assessments",
      route: "/tools/mcq-generator",
      icon: ClipboardList
    },
    {
      title: "Personalized Learning Plan",
      description: "Plan individualized education for students",
      route: "/tools/plp",
      icon: Users
    },
    {
      title: "YouTube Summary",
      description: "Video summaries and questions",
      route: "/tools/youtube-assistant",
      icon: Youtube
    },
    {
      title: "Chat with Docs",
      description: "Document chat system",
      route: "/tools/chat-with-docs",
      icon: MessageSquare,
      isHot: true
    },
    {
      title: "Assignment Generator",
      description: "Generate assignments",
      route: "/tools/assignment-generator",
      icon: FileText
    },
    {
      title: "Lesson Content Generator",
      description: "Create lesson content",
      route: "/tools/lesson-content-generator",
      icon: BookOpen
    },
    {
      title: "Image Generator",
      description: "Create stunning images",
      route: "/tools/image-generator",
      icon: Image,
      isHot: true
    },
    {
      title: "Video Generator",
      description: "Generate videos from images",
      route: "/tools/video-generator",
      icon: Video
    },
    {
      title: "Video Story Generator",
      description: "Generate video stories from text",
      route: "/tools/video-story-generator",
      isComingSoon: true,
      icon: Video
    },
    {
      title: "Presentation Generator",
      description: "Create presentations",
      route: "/tools/presentation",
      icon: PresentationIcon,
      isHot: true
    },
    {
      title: "Canvas",
      description: "Generate using Canvas",
      route: "/canvas",
      icon: CanvasIcon
    },
  ],
  School: [
    {
      title: "Text Tools",
      description: "Rewrite, proofread, translate, generate questions, expand, summarize texts",
      route: "/tools/text-tools",
      icon: Type
    },
    {
      title: "YouTube Summary",
      description: "Video summaries and questions",
      route: "/tools/youtube-assistant",
      icon: Youtube
    },
    {
      title: "Chat with Docs",
      description: "Document chat system",
      route: "/tools/chat-with-docs",
      icon: MessageSquare,
      isHot: true
    },
    {
      title: "Image Generator",
      description: "Create stunning images",
      route: "/tools/image-generator",
      icon: Image,
      isHot: true
    },
    {
      title: "Video Generator",
      description: "Generate videos from images",
      route: "/tools/video-generator",
      icon: Video
    },
    {
      title: "Video Story Generator",
      description: "Generate video stories from text",
      route: "/tools/video-story-generator",
      isComingSoon: true,
      icon: Video
    },
    {
      title: "Assignment Generator",
      description: "Generate assignments",
      route: "/tools/assignment-generator",
      icon: FileText
    },
    {
      title: "Lesson Content Generator",
      description: "Create lesson content",
      route: "/tools/lesson-content-generator",
      icon: BookOpen
    },
    {
      title: "Presentation Generator",
      description: "Create presentations",
      route: "/tools/presentation",
      icon: PresentationIcon,
      isHot: true
    },
    {
      title: "School Intelligence",
      description: "Get insights about your school",
      route: "/tools/school-intelligence",
      isComingSoon: true,
      icon: BarChart3
    },
  ],
};