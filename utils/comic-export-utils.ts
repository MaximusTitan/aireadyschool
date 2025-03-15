import jsPDF from 'jspdf';

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
 * Helper function to pause execution for a given number of milliseconds
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Generate a filename for the comic download
 */
export const getComicFileName = (title: string): string => {
  const sanitizedTitle = (title ?? 'comic')
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase()
    .slice(0, 50);
  return `${sanitizedTitle}_comic.pdf`;
};

/**
 * Prepare the comic panel for export
 */
const prepareComicForExport = (comicContainer: HTMLElement): void => {
  // Force all text to use standard fonts that render well in export
  const textElements = comicContainer.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, span, div');
  textElements.forEach(el => {
    const element = el as HTMLElement;
    
    // Save original styles
    const originalFontFamily = element.style.fontFamily;
    const originalMaxHeight = element.style.maxHeight;
    const originalOverflow = element.style.overflow;
    
    // Apply export-friendly styles
    element.style.fontFamily = "'Arial', 'Helvetica', sans-serif";
    element.style.letterSpacing = '0.025em';
    element.style.maxHeight = 'none';
    element.style.overflow = 'visible';
    
    // Store original styles as data attributes to restore later
    element.dataset.originalFontFamily = originalFontFamily;
    element.dataset.originalMaxHeight = originalMaxHeight;
    element.dataset.originalOverflow = originalOverflow;
  });
  
  // Ensure speech bubbles are fully visible
  const speechBubbles = comicContainer.querySelectorAll('.comic-panel > div > div');
  speechBubbles.forEach(el => {
    const element = el as HTMLElement;
    if (element.className.includes('speech-bubble') || 
        element.className.includes('absolute')) {
      
      // Save original styles
      element.dataset.originalMaxHeight = element.style.maxHeight;
      
      // Ensure speech bubble can expand to fit content
      element.style.maxHeight = 'none';
      element.style.overflow = 'visible';
    }
  });
  
  // Force all elements to be visible
  const allElements = comicContainer.querySelectorAll('*');
  allElements.forEach(el => {
    const element = el as HTMLElement;
    
    // Make sure text is clearly visible
    if (element.style.opacity !== '1') {
      element.dataset.originalOpacity = element.style.opacity;
      element.style.opacity = '1';
    }
  });
};

/**
 * Restore the comic panel after export
 */
const restoreComicAfterExport = (comicContainer: HTMLElement): void => {
  // Restore text elements to their original state
  const textElements = comicContainer.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, span, div');
  textElements.forEach(el => {
    const element = el as HTMLElement;
    
    // Restore original styles if they were saved
    if (element.dataset.originalFontFamily) {
      element.style.fontFamily = element.dataset.originalFontFamily;
      delete element.dataset.originalFontFamily;
    }
    
    if (element.dataset.originalMaxHeight) {
      element.style.maxHeight = element.dataset.originalMaxHeight;
      delete element.dataset.originalMaxHeight;
    }
    
    if (element.dataset.originalOverflow) {
      element.style.overflow = element.dataset.originalOverflow;
      delete element.dataset.originalOverflow;
    }
    
    // Remove export-specific styles
    element.style.letterSpacing = '';
  });
  
  // Restore other elements to their original state
  const allElements = comicContainer.querySelectorAll('*');
  allElements.forEach(el => {
    const element = el as HTMLElement;
    
    if (element.dataset.originalOpacity) {
      element.style.opacity = element.dataset.originalOpacity;
      delete element.dataset.originalOpacity;
    }
  });
};

/**
 * Render a comic page to an image with improved text quality
 */
export const renderComicToImage = async (comicContainer: HTMLElement): Promise<string> => {
  try {
    // Make a clone of the comic page to avoid modifying the original
    const comicClone = comicContainer.cloneNode(true) as HTMLElement;
    document.body.appendChild(comicClone);
    
    // Set styles on the clone for proper rendering
    comicClone.style.position = 'absolute';
    comicClone.style.left = '-9999px';
    comicClone.style.top = '0';
    comicClone.style.width = `${comicContainer.clientWidth}px`;
    comicClone.style.height = `${comicContainer.clientHeight}px`;
    comicClone.style.display = 'block';
    comicClone.style.visibility = 'visible';
    comicClone.style.opacity = '1';
    comicClone.style.zIndex = '-1000';
    
    // Apply text rendering improvements to the clone
    prepareComicForExport(comicClone);
    
    // Fix speech bubbles in the clone - ensure they can expand to show all text
    const speechBubbles = comicClone.querySelectorAll('.comic-panel > div > div');
    speechBubbles.forEach(bubble => {
      const element = bubble as HTMLElement;
      if (element.className.includes('absolute') || element.className.includes('speech')) {
        element.style.maxHeight = 'none';
        element.style.overflow = 'visible';
        
        // Find the paragraph within the speech bubble
        const paragraph = element.querySelector('p');
        if (paragraph) {
          (paragraph as HTMLElement).style.maxHeight = 'none';
          (paragraph as HTMLElement).style.overflow = 'visible';
          (paragraph as HTMLElement).style.whiteSpace = 'pre-wrap';
          (paragraph as HTMLElement).style.wordBreak = 'break-word';
        }
      }
    });
    
    // Wait longer to ensure the comic is fully rendered - increased from 800ms to 2500ms
    await sleep(2500);
    
    // Force any images in the comic to load
    const images = Array.from(comicClone.querySelectorAll('img'));
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
    
    // Wait a bit more after images are loaded
    await sleep(500);
    
    // Use html2canvas with settings optimized for text rendering
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(comicClone, {
      scale: 3, // Higher scale for better text quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: false,
      onclone: (document) => {
        // Add a special stylesheet to the cloned document for better text rendering
        const styleElement = document.createElement('style');
        styleElement.textContent = `
          * {
            text-rendering: geometricPrecision !important;
            letter-spacing: 0.025em !important;
            word-spacing: 0.05em !important;
          }
          
          /* Ensure speech bubbles show all content */
          .comic-panel > div > div {
            max-height: none !important;
            overflow: visible !important;
          }
          
          /* Ensure paragraph text is fully visible */
          p {
            max-height: none !important;
            overflow: visible !important;
            white-space: pre-wrap !important;
            word-break: break-word !important;
          }
        `;
        document.head.appendChild(styleElement);
      }
    });
    
    // Clean up the clone
    document.body.removeChild(comicClone);
    
    return canvas.toDataURL('image/jpeg', 0.98); // Increased quality
  } catch (error) {
    console.error('Error rendering comic:', error);
    throw error;
  }
};

/**
 * Export comic as PDF
 */
export const exportComicToPDF = async (
  comicContainer: HTMLElement,
  title: string,
  goToPage: (pageIndex: number) => void,
  totalPages: number,
  currentPage: number
): Promise<void> => {
  try {
    console.log('Starting comic export to PDF...');
    
    // Store current page to restore later
    const originalPage = currentPage;
    
    // Get the actual dimensions of the comic container
    const containerWidth = comicContainer.clientWidth;
    const containerHeight = comicContainer.clientHeight;
    const containerAspectRatio = containerWidth / containerHeight;
    
    console.log(`Comic dimensions: ${containerWidth}x${containerHeight}, ratio: ${containerAspectRatio}`);
    
    // Initialize PDF with custom dimensions that match the comic's aspect ratio
    // Use points as the unit (72 points = 1 inch)
    const pdfWidth = 595.28; // Standard for most PDFs (about 8.3 inches)
    const pdfHeight = pdfWidth / containerAspectRatio;
    
    const pdf = new jsPDF({
      orientation: containerAspectRatio > 1 ? 'landscape' : 'portrait',
      unit: 'pt',
      format: [pdfWidth, pdfHeight],
      compress: true,
    });
    
    // Get page dimensions
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    console.log(`PDF dimensions: ${pageWidth}x${pageHeight}, ratio: ${pageWidth/pageHeight}`);
    
    // Capture comic images for each page
    const comicImages: string[] = [];
    
    // First, navigate to each page and capture it
    for (let i = 0; i < totalPages; i++) {
      console.log(`Capturing page ${i + 1} of ${totalPages}...`);
      
      // Navigate to the page
      goToPage(i);
      
      // Wait longer for page transition and rendering
      await sleep(3000);
      
      // Capture the current comic page
      const comicImage = await renderComicToImage(comicContainer);
      comicImages.push(comicImage);
    }
    
    // Process each captured image
    for (let i = 0; i < comicImages.length; i++) {
      if (i > 0) {
        pdf.addPage([pdfWidth, pdfHeight], containerAspectRatio > 1 ? 'landscape' : 'portrait');
      }
      
      // Load image to get actual dimensions
      const img = await loadImage(comicImages[i]);
      
      // Use the entire page area for the image to maintain aspect ratio
      // This ensures no stretching while using full page area
      pdf.addImage({
        imageData: comicImages[i],
        format: 'JPEG',
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight,
        compression: 'MEDIUM',
        rotation: 0,
      });
    }
    
    // Save the PDF
    const filename = getComicFileName(title);
    pdf.save(filename);
    
    // Restore the original page
    goToPage(originalPage);
    
    console.log('PDF export completed successfully!');
  } catch (error) {
    console.error('Error exporting comic to PDF:', error);
    throw error;
  }
};
