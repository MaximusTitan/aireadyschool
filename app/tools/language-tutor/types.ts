export interface Activity {
  id: string;
  module_id: string;
  title: string;
  description: string;
  content: ActivityContent;
  type: string;
  difficulty: number;
}

export interface ActivityContent {
  formal?: string[];
  informal?: string[];
  examples?: string[];
  words?: string[];
  pairs?: Record<string, string>[];
  audio_urls?: string[];
  scenarios?: string[];
  key_phrases?: string[];
  questions?: { q: string; a: string }[];
}

export interface Module {
  id: string;
  name: string;
  description: string;
  language: string;
  difficulty: number;
  order: number;
} 