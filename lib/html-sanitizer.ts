import DOMPurify from 'dompurify';

/**
 * Sanitizes HTML content for safe output
 * Ensures proper formatting and removes any harmful elements
 */
export function sanitizeHtmlForOutput(html: string): string {
  // First, check if the content is markdown-like (containing # or * for headers/lists)
  // and convert those to proper HTML
  let processedHtml = html;
  
  // Replace markdown-style headers with HTML headers if they exist
  processedHtml = processedHtml.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  processedHtml = processedHtml.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  processedHtml = processedHtml.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  
  // Replace markdown-style lists with HTML lists
  processedHtml = processedHtml.replace(/^\* (.*$)/gim, '<ul><li>$1</li></ul>');
  processedHtml = processedHtml.replace(/^\d\. (.*$)/gim, '<ol><li>$1</li></ol>');
  
  // Replace double newlines with paragraph breaks
  processedHtml = processedHtml.replace(/\n\n/gim, '</p><p>');
  
  // Ensure the content is wrapped in a paragraph if it doesn't start with an HTML tag
  if (!processedHtml.trim().startsWith('<')) {
    processedHtml = `<p>${processedHtml}</p>`;
  }
  
  // Use DOMPurify to sanitize the HTML
  const cleanHtml = DOMPurify.sanitize(processedHtml, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'ul', 'ol', 'li', 
      'strong', 'em', 'u', 'blockquote', 'a', 'table', 'tr', 'td', 'th', 
      'thead', 'tbody', 'div', 'span'
    ],
    ALLOWED_ATTR: ['href', 'style', 'class']
  });
  
  return cleanHtml;
}
