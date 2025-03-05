import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export async function captureElement(
  element: HTMLElement,
  options: {
    scale?: number;
    quality?: number;
    backgroundColor?: string;
  } = {}
): Promise<string> {
  const {
    scale = 2,
    quality = 1.0,
    backgroundColor = '#ffffff'
  } = options;

  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor,
    logging: false,
    foreignObjectRendering: true,
    removeContainer: true,
    imageTimeout: 15000,
    onclone: (clonedDoc) => {
      // Ensure all fonts are loaded
      const style = clonedDoc.createElement('style');
      style.innerHTML = `
        * {
          font-family: "Comic Neue", Arial, sans-serif !important;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      `;
      clonedDoc.head.appendChild(style);
    }
  });

  return canvas.toDataURL('image/jpeg', quality);
}

export async function generatePDFFromImages(
  images: string[],
  options: {
    title?: string;
    orientation?: 'landscape' | 'portrait';
    format?: [number, number];
  } = {}
): Promise<jsPDF> {
  const {
    orientation = 'landscape',
    format = [1280, 720]
  } = options;

  const pdf = new jsPDF({
    orientation,
    unit: 'px',
    format,
    compress: true
  });

  images.forEach((imageData, index) => {
    if (index > 0) {
      pdf.addPage(format, orientation);
    }

    pdf.addImage({
      imageData,
      format: 'JPEG',
      x: 0,
      y: 0,
      width: format[0],
      height: format[1],
      compression: 'MEDIUM',
      rotation: 0,
      alias: `page-${index}`
    });
  });

  return pdf;
}
