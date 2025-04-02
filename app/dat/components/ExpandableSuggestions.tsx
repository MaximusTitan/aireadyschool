import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ChevronUp } from "lucide-react";

interface ExpandableSuggestionsProps {
  suggestions: string;  // This is correct - keep as string
}

export const ExpandableSuggestions = ({ suggestions }: ExpandableSuggestionsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Split suggestions and reverse to show newest first
  const suggestionEntries = suggestions.split('\n\n')
    .filter(Boolean)
    .reverse();

  // Function to parse suggestion entry into date heading and content
  const parseSuggestionEntry = (entry: string) => {
    // Check if entry contains a date pattern like "New Suggestion (MM/DD/YYYY):"
    const dateMatch = entry.match(/New Suggestion \(([^)]+)\):/);
    
    if (dateMatch) {
      const datePart = dateMatch[0]; // The full "New Suggestion (date):" part
      const date = dateMatch[1]; // Just the date part
      
      // Get the content after the date heading
      const content = entry.substring(datePart.length).trim();
      
      return {
        dateHeading: `New Suggestion (${date})`,
        content: content
      };
    }
    
    // If no date pattern is found, return the entire entry as content
    return {
      dateHeading: null,
      content: entry
    };
  };

  // Get the latest suggestion
  const latestSuggestion = suggestionEntries[0];
  const latestParsed = parseSuggestionEntry(latestSuggestion);

  return (
    <div className="space-y-4">
      {/* Latest suggestion - clickable to expand */}
      <div 
        className={`bg-blue-50 p-4 rounded-lg cursor-pointer transition-all hover:bg-blue-100 ${
          !isExpanded && suggestionEntries.length > 1 ? 'hover:shadow-md' : ''
        }`}
        onClick={() => suggestionEntries.length > 1 && setIsExpanded(!isExpanded)}
      >
        {latestParsed.dateHeading ? (
          <>
            <h4 className="font-semibold text-blue-800 mb-2">{latestParsed.dateHeading}</h4>
            <div className="text-gray-700 whitespace-pre-wrap">{latestParsed.content}</div>
          </>
        ) : (
          <div className="text-gray-700 whitespace-pre-wrap">{latestSuggestion}</div>
        )}
      </div>

      {/* Previous suggestions */}
      {isExpanded && suggestionEntries.length > 1 && (
        <>
          <div className="space-y-4">
            {suggestionEntries.slice(1).map((entry, index) => {
              const parsed = parseSuggestionEntry(entry);
              
              return (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  {parsed.dateHeading ? (
                    <>
                      <h4 className="font-semibold text-gray-800 mb-2">{parsed.dateHeading}</h4>
                      <div className="text-gray-700 whitespace-pre-wrap">{parsed.content}</div>
                    </>
                  ) : (
                    <div className="text-gray-700 whitespace-pre-wrap">{entry}</div>
                  )}
                </div>
              );
            })}
          </div>
          
          <Button
            onClick={() => setIsExpanded(false)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <ChevronUp className="h-4 w-4" />
            See Less
          </Button>
        </>
      )}
    </div>
  );
};
