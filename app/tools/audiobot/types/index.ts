export interface AudioRecorderRef {
    current: MediaRecorder | null;
  }
  
  export interface AudioChunksRef {
    current: Blob[];
  }
  
  export interface TranscriptionResponse {
    text: string;
    error?: string;
  }
  
  export interface ChatResponse {
    response: string;
    error?: string;
    redirect?: string;
  }
  