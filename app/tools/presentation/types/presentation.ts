export type SlideLayout = 
  | 'modernTitle' 
  | 'splitWithImage'
  | 'fullBleed'
  | 'gridLayout'
  | 'timelineLayout'
  | 'comparisonLayout'
  | 'statistic'
  | 'imageGallery'
  | 'split' 
  | 'fullImage' 
  | 'imageTop' 
  | 'imageBottom' 
  | 'grid'
  | 'titleSlide'
  | 'contentWithImage'
  | 'splitContent'
  | 'quoteSlide'
  | 'bulletPoints' // Added new layout types
  | 'timelineSlide'
  | 'comparisonSlide'
  | 'statisticSlide'
  | 'textLeft' 
  | 'textRight'
  | 'videoSlide' // Added videoSlide layout type
  | 'fullVideo';  // Add this new layout type

export interface Slide {
  id: string
  title: string
  subtitle?: string
  content?: string
  leftContent?: string
  rightContent?: string
  image?: string
  rightImage?: string // Added rightImage property
  numbers?: {
    first: string
    second: string
  }
  additionalImages?: string[]
  backgroundColor?: string
  textColor?: string
  bulletPoints?: string[] // Added bulletPoints property
  quote?: {
    text: string
    author: string
  } // Added quote property
  statistics?: {
    value: string
    label: string
  }[]
  timeline?: {
    year: string
    event: string
  }[]
  comparison?: {
    left: {
      title: string
      points: string[]
    }
    right: {
      title: string
      points: string[]
    }
  }
  author?: {
    name: string
    avatar?: string
    lastEdited?: string
  }
  videoUrl?: string; // Added videoUrl property
  videoId?: string;  // Add this new property
  type?: 'youtube';  // Add this new property
  layout: SlideLayout
  order: number
}

export interface Presentation {
  id: string;
  topic?: string;  // Make topic optional
  title?: string;  // Add title field
  slides: Slide[];
  theme: string;
  transition: string;
  created_at?: string;
  email?: string;
  lastEdited?: string;
}

