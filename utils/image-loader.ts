export const waitForImages = (element: HTMLElement): Promise<void[]> => {
  const images = element.getElementsByTagName('img');
  
  return Promise.all(
    Array.from(images).map(img => 
      new Promise<void>((resolve, reject) => {
        if (img.complete) {
          resolve();
        } else {
          img.onload = () => resolve();
          img.onerror = () => {
            console.error('Failed to load image:', img.src);
            resolve(); // Resolve anyway to continue with other images
          };
        }
        
        // Set a timeout to prevent hanging
        setTimeout(() => resolve(), 10000);
      })
    )
  );
};
