import { Presentation, Slide } from '../types/presentation';
import jsPDF from 'jspdf';
import pptxgen from 'pptxgenjs';
import { saveAs } from 'file-saver';

/**
 * Helper function to ensure images are fully loaded before export
 */
export const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
};

/**
 * Helper function to create a filename based on the presentation topic
 */
export const getFileName = (presentation: Presentation, extension: string): string => {
  const sanitizedTopic = (presentation.topic ?? 'untitled')
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase()
    .slice(0, 50);
  return `${sanitizedTopic}_presentation.${extension}`;
};

/**
 * Helper function to pause execution for a given number of milliseconds
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Prepare the slide DOM for export by fixing font rendering issues
 * @param slide The slide element to prepare
 */
const prepareSlideForExport = (slide: HTMLElement): void => {
  // Force all text to use standard fonts that render well in export
  const textElements = slide.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, span, div');
  textElements.forEach(el => {
    const element = el as HTMLElement;
    
    // Save original styles
    const originalFontFamily = element.style.fontFamily;
    
    // Apply export-friendly styles
    element.style.fontFamily = "'Arial', 'Helvetica', sans-serif";
    element.style.letterSpacing = '0.025em'; // Add slight letter spacing to prevent merged text
    element.style.textRendering = 'geometricPrecision'; // Improve text rendering quality
    
    // Store original styles as data attributes to restore later
    element.dataset.originalFontFamily = originalFontFamily;
  });
  
  // Force all text to be visible (sometimes text can be transparent or have opacity issues)
  const allElements = slide.querySelectorAll('*');
  allElements.forEach(el => {
    const element = el as HTMLElement;
    
    // Make sure text is clearly visible
    if (element.style.opacity !== '1') {
      element.dataset.originalOpacity = element.style.opacity;
      element.style.opacity = '1';
    }
    
    // Ensure text isn't blended into background
    if (element.style.mixBlendMode) {
      element.dataset.originalMixBlendMode = element.style.mixBlendMode;
      element.style.mixBlendMode = 'normal';
    }
  });
}

/**
 * Restore the slide DOM after export
 * @param slide The slide element to restore
 */
const restoreSlideAfterExport = (slide: HTMLElement): void => {
  // Restore text elements to their original state
  const textElements = slide.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, span, div');
  textElements.forEach(el => {
    const element = el as HTMLElement;
    
    // Restore original styles if they were saved
    if (element.dataset.originalFontFamily) {
      element.style.fontFamily = element.dataset.originalFontFamily;
      delete element.dataset.originalFontFamily;
    }
    
    // Remove export-specific styles
    element.style.letterSpacing = '';
    element.style.textRendering = '';
  });
  
  // Restore other elements to their original state
  const allElements = slide.querySelectorAll('*');
  allElements.forEach(el => {
    const element = el as HTMLElement;
    
    if (element.dataset.originalOpacity) {
      element.style.opacity = element.dataset.originalOpacity;
      delete element.dataset.originalOpacity;
    }
    
    if (element.dataset.originalMixBlendMode) {
      element.style.mixBlendMode = element.dataset.originalMixBlendMode;
      delete element.dataset.originalMixBlendMode;
    }
  });
}

/**
 * Enhanced helper function to render a slide to an image with improved text quality
 */
export const renderSlideToImage = async (slide: HTMLElement): Promise<string> => {
  try {
    // Make a clone of the slide to avoid modifying the original
    const slideClone = slide.cloneNode(true) as HTMLElement;
    document.body.appendChild(slideClone);
    
    // Set styles on the clone for proper rendering
    slideClone.style.position = 'absolute';
    slideClone.style.left = '-9999px';
    slideClone.style.top = '0';
    slideClone.style.width = '1280px';
    slideClone.style.height = '720px';
    slideClone.style.display = 'block';
    slideClone.style.visibility = 'visible';
    slideClone.style.opacity = '1';
    slideClone.style.zIndex = '-1000';
    
    // Apply text rendering improvements to the clone
    prepareSlideForExport(slideClone);
    
    // Wait for a moment to ensure the slide is fully rendered
    await sleep(500);
    
    // Force any images in the slide to load
    const images = Array.from(slideClone.querySelectorAll('img'));
    await Promise.all(
      images.map(img => 
        new Promise<void>(resolve => {
          if (img.complete) resolve();
          else {
            img.onload = () => resolve();
            img.onerror = () => resolve(); // Continue even if image fails to load
          }
        })
      )
    );
    
    // Use html2canvas with settings optimized for text rendering
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(slideClone, {
      scale: 3, // Higher scale for better text quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: false,
      removeContainer: false,
      imageTimeout: 15000,
      onclone: (document) => {
        // Add a special stylesheet to the cloned document for better text rendering
        const styleElement = document.createElement('style');
        styleElement.textContent = `
          * {
            text-rendering: geometricPrecision !important;
            letter-spacing: 0.025em !important;
            word-spacing: 0.05em !important;
            font-kerning: normal !important;
          }
        `;
        document.head.appendChild(styleElement);
      }
    });
    
    // Clean up the clone
    document.body.removeChild(slideClone);
    
    return canvas.toDataURL('image/jpeg', 0.98); // Use high quality JPEG
  } catch (error) {
    console.error('Error rendering slide:', error);
    throw error;
  }
};

/**
 * Captures each slide by navigating through the presentation
 * @param revealInstance The Reveal.js instance
 * @param totalSlides Number of slides to capture
 * @returns Array of image data URLs for each slide
 */
export const captureAllSlides = async (
  revealInstance: any, 
  totalSlides: number
): Promise<string[]> => {
  const slideImages: string[] = [];
  
  // Store current slide index to restore later
  const currentIndex = revealInstance.getIndices().h;
  
  // Create a wrapper for each slide
  const slideWrapper = document.createElement('div');
  slideWrapper.style.width = '1280px';
  slideWrapper.style.height = '720px';
  slideWrapper.style.position = 'absolute';
  slideWrapper.style.left = '-9999px';
  slideWrapper.style.top = '0';
  document.body.appendChild(slideWrapper);
  
  // Navigate to each slide and capture it
  for (let i = 0; i < totalSlides; i++) {
    // Navigate to the slide
    revealInstance.slide(i, 0);
    
    // Wait for slide transition and rendering
    await sleep(800); // Increased wait time for better rendering
    
    // Get the current slide DOM element
    const slideElement = document.querySelector('.reveal .slides section.present') as HTMLElement;
    if (!slideElement) {
      console.error(`Could not find slide element for index ${i}`);
      continue;
    }
    
    try {
      // First, make a clean clone of the slide
      const clonedSlide = slideElement.cloneNode(true) as HTMLElement;
      slideWrapper.innerHTML = ''; // Clear previous slide
      slideWrapper.appendChild(clonedSlide);
      
      // Set clone slide visibility properties
      clonedSlide.style.visibility = 'visible';
      clonedSlide.style.display = 'block';
      clonedSlide.style.opacity = '1';
      clonedSlide.style.position = 'absolute';
      clonedSlide.style.width = '1280px';
      clonedSlide.style.height = '720px';
      
      // Capture the slide with enhanced text rendering
      const slideImage = await renderSlideToImage(clonedSlide);
      slideImages.push(slideImage);
    } catch (error) {
      console.error(`Error capturing slide ${i}:`, error);
      // Add a fallback slide as a placeholder
      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 1280, 720);
        ctx.fillStyle = '#FF0000';
        ctx.font = '30px Arial';
        ctx.fillText(`Error capturing slide ${i + 1}`, 100, 360);
      }
      slideImages.push(canvas.toDataURL('image/jpeg', 0.9));
    }
  }
  
  // Clean up
  document.body.removeChild(slideWrapper);
  
  // Restore the original slide position
  revealInstance.slide(currentIndex, 0);
  
  return slideImages;
};

/**
 * Export presentation as PDF - improved version with sequential slide capture
 */
export const exportToPDF = async (
  presentation: Presentation,
  revealInstance: any
): Promise<void> => {
  try {
    // Initialize PDF with appropriate dimensions
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: [1280, 720],
      compress: true, // Enable compression
    });
    
    // Capture all slides sequentially
    const slideImages = await captureAllSlides(revealInstance, presentation.slides.length);
    
    // Add each slide to the PDF
    slideImages.forEach((slideImage, i) => {
      if (i > 0) {
        pdf.addPage([1280, 720], 'landscape');
      }
      
      pdf.addImage({
        imageData: slideImage,
        format: 'JPEG',
        x: 0,
        y: 0,
        width: 1280,
        height: 720,
        compression: 'MEDIUM',
        rotation: 0,
        alias: `slide-${i}`, // Add alias to optimize PDF size
      });
    });
    
    // Save the PDF with optimized settings
    pdf.save(getFileName(presentation, 'pdf'));
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw error;
  }
};

/**
 * Export presentation as PowerPoint - improved version with sequential slide capture
 */
export const exportToPPTX = async (
  presentation: Presentation,
  revealInstance: any
): Promise<void> => {
  try {
    // Initialize PowerPoint with better slide quality settings
    const pptx = new pptxgen();
    pptx.layout = 'LAYOUT_16x9';
    pptx.defineLayout({ name: 'SLIDE_LAYOUT', width: 10, height: 5.625 }); // 16:9 ratio
    pptx.layout = 'SLIDE_LAYOUT';
    
    // Capture all slides sequentially with enhanced text rendering
    const slideImages = await captureAllSlides(revealInstance, presentation.slides.length);
    
    // Add each captured slide to PowerPoint
    for (let i = 0; i < slideImages.length; i++) {
      const slide = pptx.addSlide();
      
      // Clean up the base64 data
      const imageData = slideImages[i];
      
      // Make sure we have a proper base64 image
      if (!imageData.includes('base64,')) {
        console.error(`Image data for slide ${i + 1} is not in base64 format`);
        // Create a fallback image
        const fallbackSlide = pptx.addSlide();
        fallbackSlide.addText(`Error rendering slide ${i + 1}`, {
          x: 0.5,
          y: 2.5,
          w: 9,
          h: 1,
          fontSize: 36,
          color: 'FF0000',
          valign: 'middle',
          align: 'center',
        });
        continue;
      }
      
      // Extract the base64 part
      const base64Data = imageData.split('base64,')[1];
      
      // Add image with proper data and precise positioning
      slide.addImage({
        data: `image/jpeg;base64,${base64Data}`,
        x: 0,
        y: 0,
        w: '100%',
        h: '100%',
        sizing: {
          type: 'contain',
          w: '100%',
          h: '100%',
        },
      });
    }
    
    // Save the PowerPoint file with optimized settings
    pptx.writeFile({ 
      fileName: getFileName(presentation, 'pptx'),
      compression: true
    });
  } catch (error) {
    console.error('Error exporting to PPTX:', error);
    throw error;
  }
};

/**
 * Export presentation as JSON (unchanged)
 */
export const exportToJSON = (presentation: Presentation): void => {
  try {
    const data = JSON.stringify(presentation, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    saveAs(blob, getFileName(presentation, 'json'));
  } catch (error) {
    console.error('Error exporting to JSON:', error);
    throw error;
  }
};
