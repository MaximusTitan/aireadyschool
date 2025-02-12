import { createClient, LiveTTSEvents } from "@deepgram/sdk";

class AudioQueue {
  private queue: AudioBuffer[] = [];
  private isPlaying = false;
  private audioContext: AudioContext | null = null;

  private async initAudioContext() {
    if (!this.audioContext) {
      try {
        this.audioContext = new AudioContext({ sampleRate: 24000 }); // Match Deepgram sample rate
      } catch (error) {
        console.error('Failed to create AudioContext:', error);
        throw new Error('Audio playback not supported in this browser');
      }
    }
    return this.audioContext;
  }

  async addToQueue(audioData: Uint8Array) {
    try {
      const context = await this.initAudioContext();
      const audioBuffer = await this.decodeAudioData(context, audioData);
      this.queue.push(audioBuffer);

      if (!this.isPlaying) {
        this.playNext();
      }
    } catch (error) {
      console.error('Error adding audio to queue:', error);
      throw error;
    }
  }

  private async decodeAudioData(context: AudioContext, audioData: Uint8Array): Promise<AudioBuffer> {
    const wavData = this.addWavHeader(audioData);
    try {
      return await context.decodeAudioData(wavData);
    } catch (error) {
      console.error('Failed to decode audio:', error);
      throw new Error('Unable to decode audio data');
    }
  }

  private addWavHeader(audioData: Uint8Array): ArrayBuffer {
    const SAMPLE_RATE = 24000;
    const CHANNELS = 1;
    const BITS_PER_SAMPLE = 16;
    const HEADER_LENGTH = 44;

    const wavHeader = new ArrayBuffer(HEADER_LENGTH);
    const view = new DataView(wavHeader);

    // RIFF chunk descriptor
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + audioData.length, true);
    this.writeString(view, 8, 'WAVE');

    // fmt sub-chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, 1, true); // audio format (PCM)
    view.setUint16(22, CHANNELS, true);
    view.setUint32(24, SAMPLE_RATE, true);
    view.setUint32(28, SAMPLE_RATE * CHANNELS * (BITS_PER_SAMPLE / 8), true); // byte rate
    view.setUint16(32, CHANNELS * (BITS_PER_SAMPLE / 8), true); // block align
    view.setUint16(34, BITS_PER_SAMPLE, true);

    // data sub-chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, audioData.length, true);

    const wavArray = new Uint8Array(HEADER_LENGTH + audioData.length);
    wavArray.set(new Uint8Array(wavHeader), 0);
    wavArray.set(audioData, HEADER_LENGTH);

    return wavArray.buffer;
  }

  private writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  private async playNext() {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const buffer = this.queue.shift()!;
    const source = this.audioContext!.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext!.destination);
    
    source.onended = () => {
      this.playNext();
    };

    try {
      source.start(0);
    } catch (error) {
      console.error('Error playing audio:', error);
      this.playNext();
    }
  }

  clearQueue() {
    this.queue = [];
    this.isPlaying = false;
  }
}

const audioQueue = new AudioQueue();

export const speakText = async (text: string) => {
  if (!text?.trim()) {
    console.warn('Empty text received for TTS');
    return;
  }

  console.log('Speaking text:', text);
  
  if (!process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY) {
    throw new Error('Deepgram API key not found');
  }

  const deepgram = createClient(process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY);
  const dgConnection = deepgram.speak.live({ model: "aura-asteria-en" });

  return new Promise<void>((resolve, reject) => {
    let audioBuffer = new Uint8Array(0);
    let hasError = false;

    const cleanup = () => {
      console.log('TTS cleanup, buffer size:', audioBuffer.length);
      dgConnection.removeAllListeners();
      if (hasError) {
        audioQueue.clearQueue();
      }
    };

    dgConnection.on(LiveTTSEvents.Open, () => {
      try {
        // Send complete text at once
        console.log('Sending text to TTS:', text);
        dgConnection.sendText(text);
        dgConnection.flush();
      } catch (error) {
        console.error('Error sending text to TTS:', error);
        hasError = true;
        cleanup();
        reject(error);
      }
    });

    dgConnection.on(LiveTTSEvents.Audio, (data) => {
      if (!hasError) {
        const chunk = new Uint8Array(data);
        const newBuffer = new Uint8Array(audioBuffer.length + chunk.length);
        newBuffer.set(audioBuffer);
        newBuffer.set(chunk, audioBuffer.length);
        audioBuffer = newBuffer;
      }
    });

    dgConnection.on(LiveTTSEvents.Flushed, async () => {
      if (hasError) return;

      try {
        if (audioBuffer.length === 0) {
          throw new Error('No audio data received');
        }

        await audioQueue.addToQueue(audioBuffer);
        cleanup();
        resolve();
      } catch (error) {
        hasError = true;
        cleanup();
        reject(error);
      }
    });

    dgConnection.on(LiveTTSEvents.Error, (error) => {
      hasError = true;
      cleanup();
      reject(error);
    });

    // Add timeout
    setTimeout(() => {
      if (!hasError) {
        hasError = true;
        cleanup();
        reject(new Error('TTS request timed out'));
      }
    }, 10000);
  });
};
