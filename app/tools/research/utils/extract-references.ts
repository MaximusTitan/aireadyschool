/**
 * Extracts references from research content in various formats:
 * - HTML format with id="ref" tags
 * - Markdown format like [1]: http://example.com
 * - Numbered lists in a References section
 */
export function extractReferences(content: string): string[] {
  if (!content) return [];
  
  const references: string[] = [];
  
  // Try to find HTML reference tags first
  const htmlRefRegex = /<p id="ref\d+">.*?<\/p>/gs;
  const htmlRefs = content.match(htmlRefRegex);
  
  if (htmlRefs && htmlRefs.length > 0) {
    return htmlRefs;
  }
  
  // Try to find markdown style references
  const markdownRefRegex = /\[\d+\]:.+(?:\n(?!\[\d+\]).+)*/g;
  const markdownRefs = content.match(markdownRefRegex);
  
  if (markdownRefs && markdownRefs.length > 0) {
    return markdownRefs;
  }
  
  // Look for a References section
  const referencesSectionRegex = /\n\s*References:?\s*\n/i;
  const referencesMatch = content.match(referencesSectionRegex);
  
  if (referencesMatch && referencesMatch.index !== undefined) {
    const referencesStartIndex = referencesMatch.index;
    const referencesSection = content.substring(referencesStartIndex);
    
    // Split the references section by line
    const lines = referencesSection.split('\n');
    let currentRef = '';
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // If line starts with a number or [number], it's a new reference
      if (/^(\[\d+\]|\d+\.)/.test(line)) {
        if (currentRef) {
          references.push(currentRef.trim());
          currentRef = '';
        }
        currentRef = line;
      } else if (line && currentRef) {
        // Continue previous reference
        currentRef += ' ' + line;
      }
    }
    
    // Add the last reference
    if (currentRef) {
      references.push(currentRef.trim());
    }
  }
  
  // If we still don't have references, try to find citation links
  if (references.length === 0) {
    // Look for citation links in the format [1](http://example.com)
    const citationRegex = /\[\d+\]\(https?:\/\/[^\s)]+\)/g;
    const citationMatches = content.match(citationRegex);
    
    if (citationMatches && citationMatches.length > 0) {
      // Convert to reference format
      return citationMatches.map((citation, index) => {
        const numMatch = citation.match(/\[(\d+)\]/);
        const urlMatch = citation.match(/\(([^)]+)\)/);
        
        if (numMatch && urlMatch) {
          return `[${numMatch[1]}]: ${urlMatch[1]} Reference ${index + 1}`;
        }
        return citation;
      });
    }
  }
  
  return references;
}