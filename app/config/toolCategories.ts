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

interface CategoryTools {
  [key: string]: {
    Learning: Tool[];
    Research: Tool[];
    Creative: Tool[];
    Tech: Tool[];
  };
}

export const categories: CategoryTools = {
  Student: {
    Learning: [
      {
        title: "AI Tutor",
        description: "Learn with AI tutor",
        route: "/tools/gen-chat",
        icon: Atom
      },
      {
        title: "Assessment Generator",
        description: "Create and share interactive multiple choice questions",
        route: "/tools/mcq-generator",
        icon: ClipboardList
      },
      {
        title: "Study Plan Generator",
        description: "Plan your study schedule",
        route: "/tools/study-planner",
        icon: Calendar
      },
      {
        title: "Evaluator",
        description: "Evaluate student answers",
        route: "/tools/evaluator",
        icon: CheckSquare
      },
      {
        title: "Lesson Content Generator",
        description: "Generate lesson content",
        route: "/tools/lesson-content-generator",
        icon: BookOpen
      }
    ],
    Research: [
      {
        title: "Research Assistant",
        description: "Get help with your research",
        route: "/tools/research",
        icon: Search
      },
      {
        title: "YouTube Summary",
        description: "Generate questions and summaries from YouTube videos",
        route: "/tools/youtube-assistant",
        icon: Youtube
      },
      {
        title: "Project Helper",
        description: "Get help with your projects",
        route: "/tools/project-helper",
        icon: FolderKanban
      },
      {
        title: "Chat with Docs",
        description: "Powerful RAG-based document chat system",
        route: "/tools/chat-with-docs",
        icon: MessageSquare,
        isHot: true
      },
      {
        title: "Text Tools",
        description: "Rewrite, proofread, translate, generate questions",
        route: "/tools/text-tools",
        icon: Type
      }
    ],
    Creative: [
      {
        title: "Comic Strip Generator",
        description: "Generate comics",
        route: "/tools/comic-generator",
        icon: Image
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
        title: "Story Generator",
        description: "Generate stories from prompts",
        route: "/tools/story-generator",
        icon: BookText
      },
      {
        title: "Song Generator",
        description: "Generate songs from lyrics",
        route: "/tools/song-generator",
        icon: Music
      },
      {
        title: "Canvas",
        description: "Generate using Canvas",
        route: "/canvas",
        icon: CanvasIcon
      },
    ],
    Tech: [
      {
        title: "Creative Coding Playground",
        description: "Code in P5.js",
        route: "/tools/p5",
        icon: Code
      },
      {
        title: "Code Playground",
        description: "Code in various languages",
        route: "/tools/code-playground",
        icon: Terminal
      }
    ]
  },
  Teacher: {
    Learning: [
      {
        title: "Lesson Plan Generator",
        description: "Create lesson plans",
        route: "/tools/lesson-planner",
        icon: BookOpen
      },
      {
        title: "Assessment Generator",
        description: "Create interactive assessments",
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
        title: "Personalized Learning Plan",
        description: "Plan individualized education for students",
        route: "/tools/plp",
        icon: Users
      },
      {
        title: "Assignment Generator",
        description: "Generate assignments",
        route: "/tools/assignment-generator",
        icon: FileText
      }
    ],
    Research: [
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
        title: "Text Tools",
        description: "Rewrite, proofread, translate, generate questions",
        route: "/tools/text-tools",
        icon: Type
      }
    ],
    Creative: [
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
    Tech: [
      {
        title: "Teachable Machine",
        description: "Train a machine learning model",
        route: "/tools/teachable-machine",
        icon: Brain
      }
    ]
  },
  School: {
    Learning: [
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
      }
    ],
    Research: [
      {
        title: "Chat with Docs",
        description: "Document chat system",
        route: "/tools/chat-with-docs",
        icon: MessageSquare,
        isHot: true
      },
      {
        title: "Text Tools",
        description: "Rewrite, proofread, translate, generate questions",
        route: "/tools/text-tools",
        icon: Type
      },
      {
        title: "YouTube Summary",
        description: "Video summaries and questions",
        route: "/tools/youtube-assistant",
        icon: Youtube
      }
    ],
    Creative: [
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
        title: "Presentation Generator",
        description: "Create presentations",
        route: "/tools/presentation",
        icon: PresentationIcon,
        isHot: true
      }
    ],
    Tech: []
  }
};