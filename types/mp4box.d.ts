declare module "mp4box" {
  interface MP4Info {
    duration: number;
    timescale: number;
    isFragmented: boolean;
    isProgressive: boolean;
    hasIOD: boolean;
    brands: string[];
    created: Date;
    modified: Date;
    tracks: MP4Track[];
    [key: string]: any;
  }

  interface MP4Track {
    id: number;
    created: Date;
    modified: Date;
    movie_duration: number;
    layer: number;
    alternate_group: number;
    volume: number;
    track_width: number;
    track_height: number;
    timescale: number;
    duration: number;
    bitrate: number;
    codec: string;
    language: string;
    [key: string]: any;
  }

  interface MP4Sample {
    number: number;
    track_id: number;
    timescale: number;
    description: any;
    is_rap: boolean;
    is_sync: boolean;
    dts: number;
    cts: number;
    duration: number;
    size: number;
    data: Uint8Array;
    [key: string]: any;
  }

  interface MP4File {
    onMoovStart?: () => void;
    onReady: (info: MP4Info) => void;
    onError: (e: any) => void;
    onSamples: (id: number, user: any, samples: MP4Sample[]) => void;
    appendBuffer: (data: ArrayBuffer) => number;
    start: () => void;
    stop: () => void;
    flush: () => void;
    seek: (time: number, useRap: boolean) => number;
    getTrackById: (id: number) => MP4Track;
    getTrackSamples: (id: number) => MP4Sample[];
    setExtractionOptions: (id: number, user: any, options: object) => void;
    addTrack: (options: object) => MP4Track;
    getBuffer: () => ArrayBuffer;
    [key: string]: any;
  }

  interface MP4Box {
    createFile: () => MP4File;
  }

  const MP4Box: MP4Box;
  export default MP4Box;
}
