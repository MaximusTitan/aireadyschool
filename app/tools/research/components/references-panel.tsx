"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight, ExternalLink, Book } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReferencesPanelProps {
  references: string[];
  selectedResearch?: any;
}

interface ParsedReference {
  id: string;
  title: string;
  url: string;
  description: string;
}

export function ReferencesPanel({ references, selectedResearch }: ReferencesPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [parsedRefs, setParsedRefs] = useState<ParsedReference[]>([]);
  
  useEffect(() => {
    // Process references whenever they change or selectedResearch changes
    const processedRefs = references
      .filter(ref => ref && ref.trim().length > 0)
      .map((ref, index) => {
        // Parse HTML-formatted references like <p id="ref1">
        if (ref.includes('<p id="ref')) {
          const idMatch = ref.match(/id="ref(\d+)"/);
          const urlMatch = ref.match(/href="([^"]+)"/);
          const titleMatch = ref.match(/>([^<]+)<\/a>/);
          
          const id = idMatch ? idMatch[1] : (index + 1).toString();
          const url = urlMatch ? urlMatch[1] : "#";
          const title = titleMatch ? titleMatch[1].trim() : "Reference";
          
          // Get description (everything after the closing </a> tag)
          const descMatch = ref.match(/<\/a>([^<]+)/);
          const description = descMatch 
            ? descMatch[1].trim().replace(/^[,"\s]+|[,"\s]+$/g, '') 
            : "";
          
          return { id, url, title, description };
        }
        
        // Parse markdown-style references like [1]: http://example.com Title
        const markdownIdMatch = ref.match(/\[(\d+)\]:/);
        if (markdownIdMatch) {
          const id = markdownIdMatch[1];
          const urlMatch = ref.match(/(https?:\/\/[^\s"]+)/);
          const url = urlMatch ? urlMatch[1] : "#";
          
          // Extract title - everything after URL that's not part of the URL
          let title = "Reference";
          let description = "";
          
          if (urlMatch) {
            const afterUrl = ref.substring(ref.indexOf(urlMatch[0]) + urlMatch[0].length);
            
            // Check if there's a title in quotes
            const quotedTitleMatch = afterUrl.match(/"([^"]+)"/);
            if (quotedTitleMatch) {
              title = quotedTitleMatch[1].trim();
              description = afterUrl.replace(quotedTitleMatch[0], "").trim();
            } else {
              // Just use first part as title, rest as description
              const parts = afterUrl.trim().split(/[,.]/);
              if (parts.length > 0) {
                title = parts[0].trim();
                description = parts.slice(1).join(", ").trim();
              }
            }
          }
          
          return { id, url, title, description };
        }
        
        // Fallback for other formats
        return { 
          id: (index + 1).toString(),
          url: "#",
          title: `Reference ${index + 1}`,
          description: ref.trim()
        };
      });
    
    setParsedRefs(processedRefs);
  }, [references, selectedResearch]);

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b bg-background flex justify-between items-center">
        <div className="flex items-center">
          <Book className="h-5 w-5 mr-2 text-rose-500" />
          <h2 className="text-sm font-medium">References & Sources</h2>
          {parsedRefs.length > 0 && (
            <span className="ml-2 text-xs bg-gray-200 px-2 py-0.5 rounded-full">
              {parsedRefs.length}
            </span>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsExpanded(!isExpanded)}>
          <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        </Button>
      </div>
      
      {isExpanded && (
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {parsedRefs.length > 0 ? (
              parsedRefs.map((ref, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardHeader className="p-3 pb-2">
                    <CardTitle className="text-sm flex items-start justify-between">
                      <div className="flex">
                        {ref.id && <span className="mr-2 text-rose-500">[{ref.id}]</span>}
                        <span className="line-clamp-2">{ref.title}</span>
                      </div>
                      {ref.url && ref.url !== "#" && (
                        <a 
                          href={ref.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 hover:text-blue-800 ml-2 flex-shrink-0"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </CardTitle>
                  </CardHeader>
                  
                  {ref.description && (
                    <CardContent className="p-3 pt-0">
                      <p className="text-xs text-muted-foreground line-clamp-3">{ref.description}</p>
                    </CardContent>
                  )}
                </Card>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No references available for this research.
              </div>
            )}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}