"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const videos = [
  {
    id: 1,
    title: "What is Intelligence?",
    url: "https://youtu.be/_XZQyoomQGA",
    description: `Intelligence is a complex and multifaceted concept that has fascinated scientists, philosophers, and researchers for centuries. This video explores the fundamental nature of intelligence, both in biological and artificial contexts.

    Key concepts covered include cognitive abilities, problem-solving capabilities, pattern recognition, and adaptive behavior. We'll examine how intelligence manifests in different forms, from human cognition to machine intelligence.

    Understanding intelligence is crucial as it forms the foundation for comprehending artificial intelligence and its potential. This knowledge helps us better appreciate both the capabilities and limitations of AI systems.

    By the end of this video, you'll understand the various aspects of intelligence, how it's measured, and why this understanding is essential for the development of AI technologies.`,
  },
  {
    id: 2,
    title: "What is Artificial Intelligence?",
    url: "https://youtu.be/U0ax56_q5xo",
    description: `Artificial Intelligence (AI) represents one of the most transformative technologies of our time. This video provides a comprehensive introduction to AI, its history, and its current state.

    We'll explore the different types of AI, from narrow AI that excels at specific tasks to the concept of general AI that could match human-level intelligence across all domains. The video covers fundamental AI approaches, including rule-based systems, machine learning, and deep learning.

    AI's importance in today's world cannot be overstated, as it powers everything from smartphone assistants to autonomous vehicles, healthcare diagnostics, and scientific research.

    You'll learn about AI's core principles, its real-world applications, and how it's shaping our future. We'll also discuss the ethical considerations and challenges that come with advancing AI technology.`,
  },
  {
    id: 3,
    title: "What are Generative AI Models?",
    url: "https://youtu.be/dPtWUnoOfgM",
    description: `Generative AI represents a revolutionary advancement in artificial intelligence that can create new content, from text and images to music and code. This video delves into the fascinating world of generative AI models.

    We'll examine the architecture of generative models, including GANs (Generative Adversarial Networks), VAEs (Variational Autoencoders), and transformer-based models. The video explains how these models learn patterns from existing data to generate new, original content.

    Generative AI is revolutionizing creative industries, content creation, and problem-solving approaches. Its applications range from art creation to drug discovery and architectural design.

    By watching this video, you'll understand how generative models work, their current capabilities, limitations, and the exciting possibilities they offer for the future of AI-assisted creation.`,
  },
  {
    id: 4,
    title: "What are Large Language Models?",
    url: "https://youtu.be/l6bdD-8sLKs",
    description: `Large Language Models (LLMs) represent the cutting edge of natural language processing. This video explores these powerful AI models that have transformed how we interact with machines.

    We'll dive into the architecture of LLMs, including transformer models, attention mechanisms, and the significance of scale in model performance. The video covers training processes, fine-tuning, and how these models understand and generate human language.

    LLMs are revolutionizing industries through applications like content generation, translation, coding assistance, and conversational AI. Understanding them is crucial for anyone interested in modern AI development.

    You'll learn about the capabilities and limitations of LLMs, their impact on various fields, and the ethical considerations surrounding their deployment and use.`,
  },
  {
    id: 5,
    title: "Introduction to Generative AI",
    url: "https://youtu.be/E9NDoe_A0uU",
    description: `This comprehensive introduction to Generative AI provides a foundation for understanding one of the most exciting areas in modern technology. The video offers a broad overview of generative AI's capabilities and applications.

    We explore the basic principles behind generative models, including the concept of learning patterns and distributions from training data. The video covers various types of generative AI, from text and image generation to music and video creation.

    Generative AI is transforming creative processes, automation, and problem-solving across industries. Its impact spans from digital art creation to scientific discovery and product design.

    After watching this video, you'll understand the fundamental concepts of generative AI, its current state, and its potential future implications for society and technology.`,
  },
  {
    id: 6,
    title: "What is Data?",
    url: "https://youtu.be/wx-eUBBHrv0",
    description: `Data is the foundation of modern AI and machine learning. This video explores the fundamental concept of data and its critical role in artificial intelligence systems.

    We'll examine different types of data (structured, unstructured, semi-structured), data quality, collection methods, and preprocessing techniques. The video also covers important concepts like data representation, feature extraction, and the importance of diverse, high-quality datasets.

    Understanding data is crucial as it forms the backbone of all AI systems. The quality and quantity of data directly impact the performance and reliability of AI models.

    You'll learn about data collection strategies, common challenges in data management, data privacy considerations, and best practices for handling data in AI applications.`,
  },
  {
    id: 7,
    title: "What is Deep Learning?",
    url: "https://youtu.be/3Cow3sdkkAw",
    description: `Deep Learning represents a revolutionary approach to machine learning that has enabled unprecedented advances in AI capabilities. This video provides a thorough introduction to deep learning concepts and applications.

    We'll explore neural network architectures, learning processes, and the importance of deep learning in modern AI systems. The video covers key concepts like layers, activation functions, backpropagation, and the role of GPUs in training.

    Deep learning has transformed fields like computer vision, natural language processing, and robotics. It's the technology behind many AI breakthroughs we see today.

    By the end of this video, you'll understand how deep learning works, its advantages over traditional machine learning approaches, and its applications in solving complex real-world problems.`,
  },
  {
    id: 8,
    title: "Supervised, Unsupervised and Reinforcement Learning",
    url: "https://youtu.be/FVSaysmoX1Y",
    description: `This video explores the three main paradigms of machine learning: supervised, unsupervised, and reinforcement learning. Each approach offers unique capabilities and is suited for different types of problems.

    We'll examine how supervised learning uses labeled data for prediction and classification, how unsupervised learning discovers patterns in unlabeled data, and how reinforcement learning enables agents to learn through interaction with an environment.

    Understanding these learning paradigms is essential for anyone working with AI, as they form the foundation of modern machine learning applications.

    You'll learn about the characteristics of each approach, their typical applications, advantages, limitations, and how to choose the right paradigm for different problems.`,
  },
  {
    id: 9,
    title: "What is Prompting?",
    url: "https://youtu.be/b0o8fI_WgZ8",
    description: `Prompting has emerged as a crucial skill in the era of large language models and generative AI. This video introduces the art and science of effective prompting.

    We'll explore different prompting techniques, best practices, and how to craft effective prompts for various applications. The video covers concepts like few-shot prompting, chain-of-thought prompting, and prompt engineering.

    Effective prompting is becoming increasingly important as it determines the quality and reliability of AI-generated outputs. It's a key skill for anyone working with modern AI tools.

    You'll learn practical prompting strategies, common pitfalls to avoid, and how to optimize prompts for different use cases and AI models.`,
  },
  {
    id: 10,
    title: "What is Machine Learning?",
    url: "https://youtu.be/laxKOEdMDaA",
    description: `Machine Learning is a fundamental component of artificial intelligence that enables computers to learn from experience. This video provides a comprehensive introduction to machine learning concepts and methodologies.

    We'll explore how machine learning algorithms work, different types of learning approaches, and the importance of data in training models. The video covers key concepts like feature engineering, model selection, and evaluation metrics.

    Machine learning powers many of the AI applications we use daily, from recommendation systems to spam filters and autonomous vehicles.

    By the end of this video, you'll understand the basic principles of machine learning, how it differs from traditional programming, and its applications in solving real-world problems.`,
  },
  {
    id: 11,
    title: "What are Neural Networks?",
    url: "https://youtu.be/goLgmfZAUn4",
    description: `Neural Networks are sophisticated mathematical models inspired by the human brain's structure and function. This video delves into the architecture and working principles of neural networks.

    We'll examine the components of neural networks including neurons, layers, weights, and activation functions. The video explains how information flows through the network, how learning occurs through backpropagation, and how neural networks can approximate complex functions.

    Neural networks are the backbone of deep learning and have enabled breakthrough achievements in various AI applications.

    You'll learn about different types of neural networks, their applications, how they're trained, and the challenges involved in working with them.`,
  },
  {
    id: 12,
    title: "How Audio AI Models Work?",
    url: "https://youtu.be/QwScjIoY2zQ",
    description: `Audio AI models represent a fascinating application of artificial intelligence to sound processing and generation. This video explores the technology behind AI systems that work with audio.

    We'll examine how audio is represented digitally, the architectures used in audio AI models, and techniques for processing and generating sound. The video covers applications like speech recognition, music generation, and audio enhancement.

    Audio AI is transforming fields like music production, voice assistance, and audio processing, making it an increasingly important area of AI development.

    You'll understand the principles behind audio AI, current capabilities, challenges, and future possibilities in this exciting field.`,
  },
  {
    id: 13,
    title: "How Image AI Models Work",
    url: "https://youtu.be/7WgEAwD46dg",
    description: `Image AI models have revolutionized computer vision and image processing. This video explains the inner workings of AI systems that process and generate images.

    We'll explore convolutional neural networks (CNNs), image recognition techniques, and generative models for images. The video covers concepts like feature extraction, object detection, and image segmentation.

    Image AI has numerous applications, from medical imaging to autonomous vehicles, security systems, and creative tools.

    You'll learn about the architecture of image AI models, their training process, current capabilities, and the challenges in developing reliable image processing systems.`,
  },
  {
    id: 14,
    title: "How Video AI Models Work",
    url: "https://youtu.be/PpGYgCs1838",
    description: `Video AI models represent the cutting edge of artificial intelligence in multimedia processing. This video explores how AI systems process and generate video content.

    We'll examine the architectures used for video processing, including 3D convolutional networks and temporal models. The video covers applications like action recognition, video generation, and motion prediction.

    Video AI is increasingly important in applications ranging from entertainment and gaming to security and autonomous systems.

    You'll understand the complexities of video processing, current capabilities of video AI models, and the future potential of this technology.`,
  },
]

export default function AIFundamentalsPage() {
  const [currentVideo, setCurrentVideo] = useState<number | null>(null)

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.split("/").pop()
    return `https://www.youtube.com/embed/${videoId}`
  }

  const handlePrevious = () => {
    if (currentVideo !== null) {
      setCurrentVideo((prev) => (prev ?? 0) > 0 ? (prev ?? 0) - 1 : videos.length - 1)
    }
  }

  const handleNext = () => {
    if (currentVideo !== null) {
      setCurrentVideo((prev) => ((prev ?? 0) < videos.length - 1 ? (prev ?? 0) + 1 : 0))
    }
  }

  const handleVideoSelect = (index: number) => {
    setCurrentVideo(index)
  }

  const handleBackToAllVideos = () => {
    setCurrentVideo(null)
  }

  return (
    <div className="min-h-screen bg-[#f7f3f2]">
      <div className="max-w-[1400px] mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">AI Fundamentals</h1>
          {currentVideo !== null && (
            <Button variant="outline" className="bg-white hover:bg-gray-100" onClick={handleBackToAllVideos}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to All Videos
            </Button>
          )}
        </div>

        {currentVideo === null ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video, index) => (
              <Card
                key={video.id}
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-300"
                onClick={() => handleVideoSelect(index)}
              >
                <CardContent className="p-4">
                  <div className="aspect-video mb-4">
                    <iframe
                      src={getYouTubeEmbedUrl(video.url)}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{video.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3">{video.description.split("\n")[0]}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">
            <div className="space-y-8">
              <h2 className="text-2xl font-semibold text-center">{videos[currentVideo].title}</h2>
              <div className="relative flex items-center justify-center">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePrevious}
                  className="absolute -left-16 rounded-full bg-white hover:bg-gray-100 w-12 h-12"
                >
                  <ChevronLeft className="h-6 w-6" />
                  <span className="sr-only">Previous video</span>
                </Button>
                <div className="w-full aspect-video bg-muted rounded-lg overflow-hidden">
                  <iframe
                    src={getYouTubeEmbedUrl(videos[currentVideo].url)}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNext}
                  className="absolute -right-16 rounded-full bg-white hover:bg-gray-100 w-12 h-12"
                >
                  <ChevronRight className="h-6 w-6" />
                  <span className="sr-only">Next video</span>
                </Button>
              </div>
              <div className="p-6 rounded-lg bg-white mt-12">
                <h3 className="text-xl font-semibold mb-4">Description</h3>
                <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {videos[currentVideo].description}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

