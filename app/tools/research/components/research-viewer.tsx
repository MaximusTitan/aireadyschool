"use client";

import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, X, Save, Download, Bold, Italic, List, ListOrdered, Link } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { ResearchEntry } from "../types";

interface ResearchViewerProps {
  content: string;
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
  onContentUpdate: (content: string) => void;
  selectedResearch?: ResearchEntry;
  onSubmitQuery: (query: string) => Promise<void>;
  isLoading: boolean;
}

export function ResearchViewer({
  content,
  isEditing,
  setIsEditing,
  onContentUpdate,
  selectedResearch,
  onSubmitQuery,
  isLoading,
}: ResearchViewerProps) {
  const [editedContent, setEditedContent] = useState(content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle content changes
  const handleEdit = () => {
    setEditedContent(content);
    setIsEditing(true);
  };

  const handleSave = () => {
    onContentUpdate(editedContent);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedContent(e.target.value);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `research-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Improved rich text editing functions
  const applyFormatting = (format: string) => {
    if (!textareaRef.current) return;
    
    // Save the current selection
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selectedText = editedContent.substring(start, end);
    
    let newText = editedContent;
    let cursorPosition = end;
    
    switch (format) {
      case "bold":
        newText = editedContent.substring(0, start) + `**${selectedText}**` + editedContent.substring(end);
        cursorPosition = end + 4; // Add 4 for the ** markers
        break;
      case "italic":
        newText = editedContent.substring(0, start) + `*${selectedText}*` + editedContent.substring(end);
        cursorPosition = end + 2; // Add 2 for the * markers
        break;
      case "insertUnorderedList":
        // Insert a bullet point at the start of each line
        if (selectedText) {
          const formattedText = selectedText.split('\n').map(line => `- ${line}`).join('\n');
          newText = editedContent.substring(0, start) + formattedText + editedContent.substring(end);
        } else {
          newText = editedContent.substring(0, start) + "- " + editedContent.substring(end);
        }
        cursorPosition = end + 2; // Adjust for the "- " added
        break;
      case "insertOrderedList":
        // Insert numbered points
        if (selectedText) {
          const lines = selectedText.split('\n');
          const formattedText = lines.map((line, i) => `${i + 1}. ${line}`).join('\n');
          newText = editedContent.substring(0, start) + formattedText + editedContent.substring(end);
        } else {
          newText = editedContent.substring(0, start) + "1. " + editedContent.substring(end);
        }
        cursorPosition = end + 3; // Adjust for the "1. " added
        break;
      case "createLink":
        const url = prompt("Enter the link URL:");
        if (url) {
          newText = editedContent.substring(0, start) + `[${selectedText || "link"}](${url})` + editedContent.substring(end);
          cursorPosition = end + (url.length + (selectedText ? selectedText.length : 4) + 4);
        }
        break;
      default:
        break;
    }
    
    setEditedContent(newText);
    
    // Focus back on the textarea and set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 0);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {content || selectedResearch ? (
        <Card className="relative border bg-card p-6 shadow-sm">
          {/* Top toolbar with edit and download buttons */}
          <div className="absolute right-6 top-6 flex space-x-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                >
                  <X className="h-4 w-4 mr-1" /> Cancel
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSave}
                >
                  <Save className="h-4 w-4 mr-1" /> Save
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4 mr-1" /> Download
                </Button>
              </>
            )}
          </div>

          <div className="mt-8">
            <div className="flex items-center gap-1 mb-4">
              <FileText className="h-4 w-4" /> 
              <h2 className="font-medium">Research Content</h2>
            </div>
            
            {isEditing ? (
              <div className="space-y-4">
                {/* Rich text toolbar */}
                <div className="flex items-center space-x-1 bg-muted p-1 rounded-md">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => applyFormatting("bold")}
                    type="button"
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => applyFormatting("italic")}
                    type="button"
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => applyFormatting("insertUnorderedList")}
                    type="button"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => applyFormatting("insertOrderedList")}
                    type="button"
                  >
                    <ListOrdered className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => applyFormatting("createLink")}
                    type="button"
                  >
                    <Link className="h-4 w-4" />
                  </Button>
                </div>
                <textarea
                  ref={textareaRef}
                  value={editedContent}
                  onChange={handleContentChange}
                  className="w-full min-h-[500px] p-4 border rounded-md font-mono text-sm"
                />
              </div>
            ) : (
              <div className="prose max-w-none">
                {content ? (
                  <ReactMarkdown 
                    className="prose max-w-none"
                    rehypePlugins={[rehypeRaw]}
                    components={{
                      a: ({ node, ...props }) => (
                        <a
                          {...props}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                        />
                      ),
                    }}
                  >
                    {content}
                  </ReactMarkdown>
                ) : (
                  <p>No content yet. Ask a research question to get started.</p>
                )}
              </div>
            )}
          </div>
        </Card>
      ) : (
        <div className="text-center py-12 border rounded-lg bg-white shadow-sm">
          <h2 className="text-2xl font-bold mb-2">No Research Selected</h2>
          <p className="text-gray-500 mb-6">
            Create a new research or select an existing one from the sidebar
          </p>
        </div>
      )}
    </div>
  );
}