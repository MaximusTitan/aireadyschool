export interface ResearchEntry {
  id: string;
  email: string;
  prompt: string;
  response: string;
  references?: string[];
  references_json?: string[];
  timestamp: string;
  thread_id?: string;
  conversation: Message[];
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  references?: string[];
}

export interface Reference {
  id: string;
  url: string;
  title: string;
  description: string;
}
