export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface ResearchEntry {
  id: string;
  email: string;
  prompt: string;
  response: string;
  timestamp: string;
  conversation: Message[];
}
