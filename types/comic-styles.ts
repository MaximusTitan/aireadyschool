export type ComicStyle = {
  name: string;
  positivePrompt: string;
  negativePrompt: string;
  uiConfig: {
    speechBubbleStyle: string;
    panelGap: number;
    borderWidth: number;
    fontFamily: string;
    effectsEnabled: boolean;
  };
};

export const COMIC_STYLES: { [key: string]: ComicStyle } = {
  Cartoon: {
    name: "Cartoon",
    positivePrompt: "colorful 2D cartoon, thick outlines, exaggerated expressions, western comic book style, bold colors, superhero action shot, dynamic panel composition, classic American comic style, clean linework, vibrant palette, action-packed scenes, comic book shading",
    negativePrompt: "manga style, photorealism, 3D rendering, sketchy lines, black and white, anime style, realistic textures, gritty realism",
    uiConfig: {
      speechBubbleStyle: "rounded-xl",
      panelGap: 5,
      borderWidth: 2,
      fontFamily: "Comic Neue, sans-serif",
      effectsEnabled: true,
    }
  },
  Manga: {
    name: "Manga",
    positivePrompt: "highly detailed black and white manga panel, dramatic shading, inked lines, high contrast, expressive characters, dynamic action scene, Shonen Jump style, speed lines, detailed backgrounds, bold inking, dramatic angles, manga screentones, emotional intensity",
    negativePrompt: "western comic style, 3D rendering, photorealism, watercolor, bright colors, cartoonish, Disney style, simple drawings, sketchy lines",
    uiConfig: {
      speechBubbleStyle: "rounded-sm",
      panelGap: 3,
      borderWidth: 3,
      fontFamily: "Manga, Comic Neue, sans-serif",
      effectsEnabled: true,
    }
  },
  Classic: {
    name: "Classic",
    positivePrompt: "vintage comic book style, retro comic art, silver age comics, halftone dots, classic comic book coloring, bold outlines, traditional comic panel layout, 1960s comic art style, golden age comic aesthetics, simplified backgrounds, limited color palette",
    negativePrompt: "modern style, manga, 3D effects, digital art style, photorealism, anime influence, contemporary comic style, hyper-detailed",
    uiConfig: {
      speechBubbleStyle: "rounded-none",
      panelGap: 8,
      borderWidth: 1,
      fontFamily: "Comic Neue, serif",
      effectsEnabled: false,
    }
  },
  "3D": {
    name: "3D",
    positivePrompt: "3D rendered comic panel, volumetric lighting, cinematic composition, modern CGI style, detailed textures, dynamic camera angles, depth of field, realistic shading, dramatic lighting, high-quality 3D models, professional 3D animation style",
    negativePrompt: "2D art, flat shading, traditional comic style, manga style, sketchy lines, hand-drawn look, cel-shading, cartoon style",
    uiConfig: {
      speechBubbleStyle: "rounded-3xl",
      panelGap: 6,
      borderWidth: 4,
      fontFamily: "Arial, sans-serif",
      effectsEnabled: true,
    }
  }
};

// Function to get a comic style by name with fallback
export const getComicStyle = (styleName: string): ComicStyle => {
  return COMIC_STYLES[styleName] || COMIC_STYLES.Cartoon;
};

// Get a list of available style names
export const getComicStyleNames = (): string[] => {
  return Object.keys(COMIC_STYLES);
};
