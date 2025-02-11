export const categories: {
  [key: string]: {
    title: string;
    description: string;
    route: string;
    isHot?: boolean;
    isComingSoon?: boolean;
  }[];
} = {
  Student: [
    {
      title: "Assessment Generator",
      description: "Create and share interactive multiple choice questions for students",
      route: "/tools/mcq-generator",
    },
    {
      title: "Evaluator",
      description: "Evaluate student answers",
      route: "/tools/evaluator",
    },
    {
      title: "Text Tools",
      description: "Rewrite, proofread, translate, generate questions, expand, summarize texts",
      route: "/tools/text-tools",
    },
    {
      title: "Comic Strip Generator",
      description: "Generate comics",
      route: "/tools/comic-generator",
    },
    {
      title: "Research Assistant",
      description: "Get help with your research",
      route: "/tools/research",
    },
    {
      title: "Project Helper",
      description: "Get help with your projects",
      route: "/tools/project-helper",
    },
    {
      title: "Lesson Content Generator",
      description: "Generate lesson content",
      route: "/tools/lesson-content-generator",
    },
    {
      title: "YouTube Summary",
      description: "Generate questions and summaries from YouTube videos",
      route: "/tools/youtube-assistant",
    },
    {
      title: "Chat with Docs",
      description: "Powerful RAG-based document chat system for intelligent document interactions",
      route: "/tools/chat-with-docs",
      isHot: true,
    },
    {
      title: "Image Generator",
      description: "Create stunning images with Flux AI technology",
      route: "/tools/image-generator",
      isHot: true,
    },
    {
      title: "Video Generator",
      description: "Generate videos from images",
      route: "/tools/video-generator",
    },
    {
      title: "Presentation Generator",
      description: "Create presentations",
      route: "/tools/presentation",
      isHot: true,
    },
    // {
    //   title: "Video Story Generator",
    //   description: "Generate video stories from text",
    //   route: "/tools/video-story-generator",
    //   isComingSoon: true,
    // },
    {
      title: "Song Generator",
      description: "Generate songs from lyrics",
      route: "/tools/song-generator",
    },
    {
      title: "Story Generator",
      description: "Generate stories from prompts",
      route: "/tools/story-generator",
    },
    {
      title: "Creative Coding Playground",
      description: "Code in P5.js",
      route: "/tools/p5",
    },
    {
      title: "Study Plan Generator",
      description: "Plan your study schedule",
      route: "/tools/study-planner",
    },
    {
      title: "Code Playground",
      description: "Code in various languages",
      route: "/tools/code-playground",
    },
    {
      title: "Canvas",
      description: "Generate using Canvas",
      route: "/canvas",
    },
    {
      title: "AI Tutor",
      description: "Get help with your studies",
      route: "/tools/gen-chat",
    },
  ],
  Teacher: [
    {
      title: "Lesson Plan Generator",
      description: "Create lesson plans",
      route: "/tools/lesson-planner",
    },
    {
      title: "Evaluator",
      description: "Evaluate student answers",
      route: "/tools/evaluator",
    },
    {
      title: "Text Tools",
      description: "Rewrite, proofread, translate, generate questions, expand, summarize texts",
      route: "/tools/text-tools",
    },
    {
      title: "Teachable Machine",
      description: "Train a machine learning model",
      route: "/tools/teachable-machine",
    },
    {
      title: "Assessment Generator",
      description: "Create interactive assessments",
      route: "/tools/mcq-generator",
    },
    {
      title: "Personalized Learning Plan",
      description: "Plan individualized education for students",
      route: "/tools/plp",
    },
    {
      title: "YouTube Summary",
      description: "Video summaries and questions",
      route: "/tools/youtube-assistant",
    },
    {
      title: "Chat with Docs",
      description: "Document chat system",
      route: "/tools/chat-with-docs",
      isHot: true,
    },
    {
      title: "Assignment Generator",
      description: "Generate assignments",
      route: "/tools/assignment-generator",
    },
    {
      title: "Lesson Content Generator",
      description: "Create lesson content",
      route: "/tools/lesson-content-generator",
    },
    {
      title: "Image Generator",
      description: "Create stunning images",
      route: "/tools/image-generator",
      isHot: true,
    },
    {
      title: "Video Generator",
      description: "Generate videos from images",
      route: "/tools/video-generator",
    },
    // {
    //   title: "Video Story Generator",
    //   description: "Generate video stories from text",
    //   route: "/tools/video-story-generator",
    //   isComingSoon: true,
    // },
    {
      title: "Presentation Generator",
      description: "Create presentations",
      route: "/tools/presentation",
      isHot: true,
    },
    {
      title: "Canvas",
      description: "Generate using Canvas",
      route: "/canvas",
    },
    {
      title: "AI Tutor",
      description: "Get help with your studies",
      route: "/tools/gen-chat",
    },
  ],
  School: [
    {
      title: "Text Tools",
      description: "Rewrite, proofread, translate, generate questions, expand, summarize texts",
      route: "/tools/text-tools",
    },
    {
      title: "YouTube Summary",
      description: "Video summaries and questions",
      route: "/tools/youtube-assistant",
    },
    {
      title: "Chat with Docs",
      description: "Document chat system",
      route: "/tools/chat-with-docs",
      isHot: true,
    },
    {
      title: "Image Generator",
      description: "Create stunning images",
      route: "/tools/image-generator",
      isHot: true,
    },
    {
      title: "Video Generator",
      description: "Generate videos from images",
      route: "/tools/video-generator",
    },
    // {
    //   title: "Video Story Generator",
    //   description: "Generate video stories from text",
    //   route: "/tools/video-story-generator",
    //   isComingSoon: true,
    // },
    {
      title: "Assignment Generator",
      description: "Generate assignments",
      route: "/tools/assignment-generator",
    },
    {
      title: "Lesson Content Generator",
      description: "Create lesson content",
      route: "/tools/lesson-content-generator",
    },
    {
      title: "Presentation Generator",
      description: "Create presentations",
      route: "/tools/presentation",
      isHot: true,
    },
    // {
    //   title: "School Intelligence",
    //   description: "Get insights about your school",
    //   route: "/tools/school-intelligence",
    //   isComingSoon: true,
    // },
  ],
};
