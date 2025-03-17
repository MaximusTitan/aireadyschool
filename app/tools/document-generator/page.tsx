"use client";

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  Suspense,
} from "react";
import { toast } from "sonner";
import {
  useEditor,
  EditorContent,
  NodeViewWrapper,
  NodeViewContent,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import TiptapImage from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import FontFamily from "@tiptap/extension-font-family";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import { Extension, Commands, RawCommands } from "@tiptap/core";
import { NodeSelection } from "@tiptap/pm/state";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { saveAs } from "file-saver";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Image as ImageIcon,
  FileDown,
  X,
  Loader2,
  FileText,
  ChevronDown,
  Upload,
  Paintbrush,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import "./tiptap-styles.css";
import ResizableImage from "./ResizableImage";
import { useSearchParams } from "next/navigation";
import { saveDocumentToDatabase } from "@/lib/db";
import { Node } from "@tiptap/core";
import { createClient } from "@/utils/supabase/client";

// Create a custom fontSize extension based on TextStyle
const FontSize = Extension.create({
  name: "fontSize",

  addAttributes() {
    return {
      fontSize: {
        default: null,
        parseHTML: (element: { style: { fontSize: any } }) =>
          element.style.fontSize,
        renderHTML: (attributes: { fontSize: any }) => {
          if (!attributes.fontSize) {
            return {};
          }
          return { style: `font-size: ${attributes.fontSize}` };
        },
      },
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: ["textStyle"],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element) => element.style.fontSize,
            renderHTML: (attributes) => {
              if (!attributes.fontSize) {
                return {};
              }
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }: { chain: any }) => {
          return chain().setMark("textStyle", { fontSize }).run();
        },
    } as Partial<RawCommands>;
  },
});

// Fix ResizableImageExtension definition
const ResizableImageExtension = TiptapImage.extend({
  name: "resizableImage",
  inline: true,
  draggable: true,

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        renderHTML: (attributes) => ({
          width: attributes.width,
        }),
      },
      height: {
        default: null,
        renderHTML: (attributes) => ({
          height: attributes.height,
        }),
      },
    };
  },
});

const fontFamilies = [
  { name: "Arial", value: "Arial, sans-serif" },
  { name: "Times New Roman", value: "Times New Roman, serif" },
  { name: "Georgia", value: "Georgia, serif" },
  { name: "Courier New", value: "Courier New, monospace" },
  { name: "Verdana", value: "Verdana, sans-serif" },
  { name: "Helvetica", value: "Helvetica, sans-serif" },
];

const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 30, 36];

const colors = [
  { name: "Black", value: "#000000" },
  { name: "Red", value: "#FF0000" },
  { name: "Blue", value: "#0000FF" },
  { name: "Green", value: "#008000" },
  { name: "Purple", value: "#800080" },
  { name: "Orange", value: "#FFA500" },
];

const highlightColors = [
  { name: "Yellow", value: "#FFFF00" },
  { name: "Pink", value: "#FFD1DC" },
  { name: "Green", value: "#90EE90" },
  { name: "Blue", value: "#ADD8E6" },
  { name: "Purple", value: "#D8BFD8" },
  { name: "Orange", value: "#FFDAB9" },
];

const DocumentGeneratorContent = () => {
  const [documentTitle, setDocumentTitle] = useState("Untitled Document");
  const [loading, setLoading] = useState(false);
  const [aiPromptVisible, setAiPromptVisible] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(
    null
  );
  const [customFontSize, setCustomFontSize] = useState("");
  const [currentFontFamily, setCurrentFontFamily] =
    useState("Arial, sans-serif");
  const [currentFontSize, setCurrentFontSize] = useState("12");
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();
  const [isSaving, setIsSaving] = useState(false);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const supabase = createClient();
  const [exportingPdf, setExportingPdf] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        paragraph: {
          HTMLAttributes: {
            class: "my-2",
          },
        },
      }),
      TextStyle.configure(),
      FontFamily.configure(),
      Color,
      FontSize, // Add our custom FontSize extension
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right"],
      }),
      ResizableImageExtension.configure({
        allowBase64: true,
        inline: true,
        HTMLAttributes: {
          class: "resizable-image",
        },
      }),
      Placeholder.configure({
        // Only show placeholder in first paragraph when document is empty
        placeholder: ({ node, pos }) => {
          if (node.type.name === "paragraph" && pos === 0) {
            return "Start typing...";
          }
          return "";
        },
        showOnlyCurrent: true,
      }),
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content: "<p></p>",
    autofocus: "end",
    editorProps: {
      attributes: {
        class:
          "h-full outline-none prose prose-sm sm:prose max-w-none focus:outline-none",
        spellcheck: "false",
      },
      handleDOMEvents: {
        // Add DOM event handlers for image resizing
        mousedown: (view, event) => {
          const target = event.target as HTMLElement;
          if (target.tagName === "IMG") {
            // Make the image selected
            const pos = view.posAtDOM(target, 0);
            if (pos) {
              // Use the imported NodeSelection directly
              view.dispatch(
                view.state.tr.setSelection(
                  NodeSelection.create(view.state.doc, pos)
                )
              );
              return true;
            }
          }
          return false;
        },
      },
    },
    onUpdate: ({ editor }) => {
      // Get current marks for updating UI
      const marks = editor.getAttributes("textStyle");
      if (marks.fontFamily) {
        setCurrentFontFamily(marks.fontFamily);
      }

      if (marks.fontSize) {
        // Remove 'px' if it exists
        const size = marks.fontSize.replace(/px$/, "");
        setCurrentFontSize(size);
      }

      // Show AI generation button if content exists
      const content = editor.getText();
      if (content && content.trim().length > 0 && !aiPromptVisible) {
        setAiPromptVisible(true);
      }
    },
  });

  // Focus editor on page load
  useEffect(() => {
    if (editor) {
      // Set focus when editor is ready
      setTimeout(() => {
        editor.commands.focus("end");
      }, 10);
    }
  }, [editor]);

  // Handle click anywhere on the document area to focus editor
  const handleContainerClick = useCallback(
    (e: React.MouseEvent) => {
      if (editor && e.target === e.currentTarget) {
        editor.commands.focus("end");
      }
    },
    [editor]
  );

  // Debug function to check applied marks
  const debugMarks = () => {
    if (editor) {
      console.log("Current marks:", editor.getAttributes("textStyle"));
      console.log(
        "Selected text:",
        editor.state.selection.content().content.firstChild?.text
      );

      // Try applying a basic mark first to test selection
      editor.chain().focus().toggleBold().run();

      // Then try with fontSize
      const fontSize = "24px";
      editor.chain().focus().setMark("textStyle", { fontSize }).run();
    }
  };

  // Improved font size change handler that properly applies the fontSize
  const handleFontSizeChange = (size: string) => {
    if (editor) {
      setCurrentFontSize(size);
      // Make sure the size has px if it's just a number
      const fontSize = /^\d+$/.test(size) ? `${size}px` : size;
      // Apply fontSize to the selected text or current position
      editor.chain().focus().setMark("textStyle", { fontSize }).run();
    }
  };

  // Handle custom font size input
  const handleCustomFontSizeChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCustomFontSize(e.target.value);
  };

  const handleCustomFontSizeSubmit = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter" && customFontSize) {
      handleFontSizeChange(customFontSize);
      setCustomFontSize("");
    }
  };

  // Handle font family change - Fixed version
  const handleFontFamilyChange = (fontFamily: string) => {
    if (editor) {
      setCurrentFontFamily(fontFamily);
      editor.chain().focus().setFontFamily(fontFamily).run();
    }
  };

  // Handle text color change
  const handleTextColorChange = (color: string) => {
    if (editor) {
      editor.chain().focus().setColor(color).run();
    }
  };

  // Handle highlight color change
  const handleHighlightChange = (color: string) => {
    if (editor) {
      editor.chain().focus().toggleHighlight({ color }).run();
    }
  };

  // Handle file upload for images with resizing
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editor) {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const imageUrl = readerEvent.target?.result as string;

        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > 400) {
            const ratio = height / width;
            width = 400;
            height = Math.round(width * ratio);
          }

          editor
            .chain()
            .focus()
            .insertContent({
              type: "resizableImage",
              attrs: {
                src: imageUrl,
                alt: file.name,
                width,
                height,
              },
            })
            .run();
        };
        img.src = imageUrl;
      };
      reader.readAsDataURL(file);
    }
  };

  // Function to trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Modified function to generate document with AI
  const generateDocument = async () => {
    if (!editor) return;

    try {
      setLoading(true);

      // Get current document content
      const currentContent = editor.getHTML();
      const contentText = editor.getText();
      const title = documentTitle;

      // Only send request if there's actual content
      if (!contentText || contentText.trim() === "") {
        alert("Please add some content to the document first.");
        setLoading(false);
        return;
      }

      // Call our API route that uses Groq with current content
      const response = await fetch("/api/generate-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content: currentContent,
          contentText: contentText,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate document");
      }
      const data = await response.json();

      // Insert generated content
      if (data.content) {
        editor.commands.setContent(data.content);
      }

      setAiPromptVisible(false);
    } catch (error) {
      console.error("Error generating document:", error);
    } finally {
      setLoading(false);
    }
  };

  // Function to generate and insert image with better error handling
  const generateImage = async () => {
    if (!imagePrompt || !editor) return;

    try {
      setGeneratingImage(true);
      setGeneratedImageUrl(null);

      // Call our updated API endpoint
      const response = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: imagePrompt }),
      });

      const data = await response.json();

      if (data.imageUrl) {
        // Show the generated image
        setGeneratedImageUrl(data.imageUrl);

        // Show fallback message if using fallback image
        if (data.fallback) {
          alert(
            "Using a placeholder image as AI image generation failed. You can try again or use this placeholder."
          );
        }
      }
    } catch (error) {
      console.error("Error generating image:", error);
      alert(
        "Failed to generate image. Please try again with a different description."
      );
    } finally {
      setGeneratingImage(false);
    }
  };

  // Enhanced image insertion with resizable capabilities
  const addGeneratedImage = () => {
    if (generatedImageUrl && editor) {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > 400) {
          const ratio = height / width;
          width = 400;
          height = Math.round(width * ratio);
        }

        editor
          .chain()
          .focus()
          .insertContent({
            type: "resizableImage",
            attrs: {
              src: generatedImageUrl,
              alt: imagePrompt,
              width,
              height,
            },
          })
          .run();

        setGeneratedImageUrl(null);
        setImagePrompt("");
      };
      img.src = generatedImageUrl;
    }
  };

  // Regenerate image with same prompt
  const regenerateImage = () => {
    if (imagePrompt) {
      generateImage();
    }
  };

  // Function to export document as PDF with improved formatting
  const exportAsPDF = async () => {
    if (!editor || !editorRef.current) {
      toast.error("Cannot export: editor not initialized");
      return;
    }

    try {
      setExportingPdf(true);
      toast.info("Preparing PDF export...");

      // Define margins in millimeters for A4 page
      const margins = {
        top: 15,
        right: 10,
        bottom: 25,
        left: 10,
      };

      // Create a temporary container
      const container = document.createElement("div");
      container.style.position = "fixed";
      container.style.top = "0";
      container.style.left = "0";
      container.style.width = "794px"; // A4 width at 96 DPI
      container.style.background = "white";
      container.style.zIndex = "-9999";

      // Create content div with styles
      const contentDiv = document.createElement("div");
      contentDiv.innerHTML = editor.getHTML();
      contentDiv.style.padding = `${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm`;
      contentDiv.style.width = "100%";
      contentDiv.style.boxSizing = "border-box";
      contentDiv.style.background = "white";
      contentDiv.style.fontFamily = "Arial, sans-serif";
      contentDiv.style.fontSize = "12pt";

      // Apply styles to all elements
      contentDiv.querySelectorAll("*").forEach((element) => {
        if (element instanceof HTMLElement) {
          // Copy computed styles from editor elements
          const editorElement = editor.view.dom.querySelector(
            `[data-node-type="${element.getAttribute("data-node-type")}"]`
          );
          if (editorElement) {
            const styles = window.getComputedStyle(editorElement);
            element.style.cssText = styles.cssText;
          }

          // Preserve specific styles
          if (element.style.fontWeight)
            element.style.fontWeight = element.style.fontWeight;
          if (element.style.fontStyle)
            element.style.fontStyle = element.style.fontStyle;
          if (element.style.textDecoration)
            element.style.textDecoration = element.style.textDecoration;
          if (element.style.color) element.style.color = element.style.color;
          if (element.style.backgroundColor)
            element.style.backgroundColor = element.style.backgroundColor;
          if (element.style.textAlign)
            element.style.textAlign = element.style.textAlign;

          // Handle specific element types
          switch (element.tagName.toLowerCase()) {
            case "h1":
              element.style.fontSize = "24pt";
              element.style.fontWeight = "bold";
              element.style.marginBottom = "12pt";
              break;
            case "h2":
              element.style.fontSize = "20pt";
              element.style.fontWeight = "bold";
              element.style.marginBottom = "10pt";
              break;
            case "p":
              element.style.marginBottom = "10pt";
              element.style.lineHeight = "1.5";
              break;
            case "ul":
            case "ol":
              element.style.marginLeft = "20pt";
              element.style.marginBottom = "10pt";
              break;
            case "li":
              element.style.marginBottom = "5pt";
              break;
            case "img":
              if (element instanceof HTMLImageElement) {
                element.style.maxWidth = "100%";
                element.style.height = "auto";
              }
              break;
          }
        }
      });

      // Add content to container and container to document
      container.appendChild(contentDiv);
      document.body.appendChild(container);

      // Wait for images to load
      await Promise.all(
        Array.from(container.getElementsByTagName("img")).map(
          (img) =>
            new Promise((resolve) => {
              if (img.complete) resolve(null);
              else img.onload = () => resolve(null);
            })
        )
      );

      // Create PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      // Use html2canvas with better settings
      const canvas = await html2canvas(contentDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#FFFFFF",
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
          // Ensure styles are copied to cloned document
          const styleSheets = Array.from(document.styleSheets);
          styleSheets.forEach((sheet) => {
            try {
              const cssRules = sheet.cssRules || sheet.rules;
              if (cssRules) {
                const style = document.createElement("style");
                Array.from(cssRules).forEach((rule) => {
                  style.appendChild(document.createTextNode(rule.cssText));
                });
                clonedDoc.head.appendChild(style);
              }
            } catch (e) {
              console.warn("Could not copy styles", e);
            }
          });
        },
      });

      // Remove temporary elements
      document.body.removeChild(container);

      // Calculate dimensions
      const imgWidth = 210 - margins.left - margins.right; // A4 width in mm minus margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Add image to PDF
      const pageHeight = 297 - margins.top - margins.bottom; // A4 height in mm minus margins

      if (imgHeight > pageHeight) {
        // Multi-page handling
        let remainingHeight = canvas.height;
        let position = 0;

        while (remainingHeight > 0) {
          // Add page content
          const currentHeight = Math.min(
            canvas.width * (pageHeight / imgWidth),
            remainingHeight
          );
          const canvas2 = document.createElement("canvas");
          canvas2.width = canvas.width;
          canvas2.height = currentHeight;

          const ctx = canvas2.getContext("2d");
          if (ctx) {
            ctx.drawImage(
              canvas,
              0,
              position,
              canvas.width,
              currentHeight,
              0,
              0,
              canvas.width,
              currentHeight
            );

            const imgData = canvas2.toDataURL("image/jpeg", 1.0);
            if (position > 0) {
              pdf.addPage();
            }

            pdf.addImage(
              imgData,
              "JPEG",
              margins.left,
              margins.top,
              imgWidth,
              (currentHeight * imgWidth) / canvas.width,
              "",
              "FAST"
            );
          }

          remainingHeight -= currentHeight;
          position += currentHeight;
        }
      } else {
        // Single page
        pdf.addImage(
          canvas.toDataURL("image/jpeg", 1.0),
          "JPEG",
          margins.left,
          margins.top,
          imgWidth,
          imgHeight,
          "",
          "FAST"
        );
      }

      // Save the PDF
      pdf.save(`${documentTitle || "Document"}.pdf`);
      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export PDF. Please try again.");
    } finally {
      setExportingPdf(false);
    }
  };

  // Function to export document as DOCX
  const exportAsDOCX = () => {
    // Implement DOCX export logic here
    alert("DOCX export functionality will be implemented here");
  };

  // Load document if ID is provided in URL
  useEffect(() => {
    const loadDocument = async () => {
      const id = searchParams.get("id");
      if (!id || !editor) return;

      try {
        setLoading(true);

        const { data, error } = await supabase
          .from("document_generator")
          .select("*")
          .eq("id", id)
          .single();

        if (error) throw error;

        if (data) {
          setDocumentId(data.id);
          setDocumentTitle(data.title);
          editor.commands.setContent(data.content);
        }
      } catch (error) {
        console.error("Error loading document:", error);
        toast.error("Failed to load document");
      } finally {
        setLoading(false);
      }
    };

    if (editor) {
      loadDocument();
    }
  }, [editor, searchParams, supabase]);

  // Updated save document function
  const saveDocument = async () => {
    if (!editor) {
      console.error("Editor not initialized");
      return;
    }

    try {
      setIsSaving(true);
      console.log("Save initiated...");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !user.email) {
        throw new Error("User not authenticated or missing email");
      }

      console.log("Preparing document data...");
      const content = editor.getHTML();
      console.log("Document content length:", content.length);

      const result = await saveDocumentToDatabase({
        email: user.email,
        title: documentTitle,
        content: content,
        id: documentId || undefined,
      });

      if (result.error) {
        console.error("Save operation failed:", result.error);
        throw result.error;
      }

      if (result.data) {
        setDocumentId(result.data.id);
      }

      // Update documentId if this was a new document
      if (!documentId && result.data) {
        setDocumentId(result.data.id);
      }

      toast.success("Document saved successfully!");
    } catch (error) {
      console.error("Error saving document:", error);
      toast.error("Failed to save document. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 overflow-hidden">
      {/* Document Header */}
      <div className="p-4 border-b bg-white flex items-center justify-between">
        <input
          type="text"
          value={documentTitle}
          onChange={(e) => setDocumentTitle(e.target.value)}
          className="text-xl font-medium bg-transparent border-none focus:outline-none focus:ring-0 w-[300px]"
        />

        <div className="flex items-center space-x-2">
          <Button
            variant="default"
            className="flex items-center gap-1"
            onClick={saveDocument}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Save
          </Button>

          <Button
            variant="outline"
            className="flex items-center gap-1"
            onClick={exportAsPDF}
            disabled={exportingPdf}
          >
            {exportingPdf ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown size={16} />
            )}
            Export as PDF
          </Button>
        </div>
      </div>

      {/* Enhanced Toolbar */}
      <div className="p-2 border-b flex flex-wrap gap-1 bg-white sticky top-0 z-10 shadow-sm">
        {/* Font Family Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1 min-w-[120px]">
              <span className="truncate">
                {fontFamilies.find((f) => f.value === currentFontFamily)
                  ?.name || "Font"}
              </span>
              <ChevronDown size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {fontFamilies.map((font) => (
              <DropdownMenuItem
                key={font.value}
                onClick={() => handleFontFamilyChange(font.value)}
                className="cursor-pointer"
                style={{ fontFamily: font.value }}
              >
                {font.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Font Size Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1 w-[60px]">
              {currentFontSize}
              <ChevronDown size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <div className="px-2 py-2">
              <Input
                placeholder="Custom size..."
                value={customFontSize}
                onChange={handleCustomFontSizeChange}
                onKeyDown={handleCustomFontSizeSubmit}
                className="mb-2 h-8"
              />
            </div>
            <DropdownMenuSeparator />
            {fontSizes.map((size) => (
              <DropdownMenuItem
                key={size}
                onClick={() => handleFontSizeChange(size.toString())}
                className="cursor-pointer"
              >
                {size}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Debug button */}

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* Formatting Options */}
        <Button
          size="icon"
          variant={editor.isActive("bold") ? "default" : "ghost"}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={18} />
        </Button>
        <Button
          size="icon"
          variant={editor.isActive("italic") ? "default" : "ghost"}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={18} />
        </Button>
        <Button
          size="icon"
          variant={editor.isActive("underline") ? "default" : "ghost"}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon size={18} />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* Text Color */}
        <Popover>
          <PopoverTrigger asChild>
            <Button size="icon" variant="ghost" className="relative">
              <span className="flex items-center justify-center w-4 h-4 bg-current rounded-full" />
              <span className="sr-only">Text color</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="flex flex-col gap-2">
              <h3 className="font-medium">Text Color</h3>
              <div className="grid grid-cols-6 gap-1">
                {colors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleTextColorChange(color.value)}
                    className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center"
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Highlight */}
        <Popover>
          <PopoverTrigger asChild>
            <Button size="icon" variant="ghost">
              <Paintbrush size={18} />
              <span className="sr-only">Highlight</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64">
            <div className="flex flex-col gap-2">
              <h3 className="font-medium">Highlight Color</h3>
              <div className="grid grid-cols-6 gap-1">
                {highlightColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleHighlightChange(color.value)}
                    className="w-8 h-8 rounded border border-gray-200 flex items-center justify-center"
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* Heading buttons */}
        <Button
          size="icon"
          variant={
            editor.isActive("heading", { level: 1 }) ? "default" : "ghost"
          }
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
        >
          <Heading1 size={18} />
        </Button>
        <Button
          size="icon"
          variant={
            editor.isActive("heading", { level: 2 }) ? "default" : "ghost"
          }
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          <Heading2 size={18} />
        </Button>
        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* Alignment buttons */}
        <Button
          size="icon"
          variant={editor.isActive({ textAlign: "left" }) ? "default" : "ghost"}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeft size={18} />
        </Button>
        <Button
          size="icon"
          variant={
            editor.isActive({ textAlign: "center" }) ? "default" : "ghost"
          }
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <AlignCenter size={18} />
        </Button>
        <Button
          size="icon"
          variant={
            editor.isActive({ textAlign: "right" }) ? "default" : "ghost"
          }
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <AlignRight size={18} />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* List buttons */}
        <Button
          size="icon"
          variant={editor.isActive("bulletList") ? "default" : "ghost"}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={18} />
        </Button>
        <Button
          size="icon"
          variant={editor.isActive("orderedList") ? "default" : "ghost"}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={18} />
        </Button>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* Enhanced Image Handling */}
        <Popover>
          <PopoverTrigger asChild>
            <Button size="icon" variant="ghost">
              <ImageIcon size={18} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="flex flex-col gap-4">
              <h3 className="font-medium">Insert Image</h3>

              {/* Upload from computer */}
              <div>
                <Button
                  variant="outline"
                  className="w-full flex items-center gap-2"
                  onClick={triggerFileInput}
                >
                  <Upload size={16} />
                  Upload from Computer
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <DropdownMenuSeparator />

              {/* Generate with AI */}
              <div className="flex flex-col gap-2">
                <h4 className="text-sm font-medium">Generate with AI</h4>
                <div className="flex gap-2">
                  <Input
                    placeholder="Describe the image..."
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    className="flex-1"
                  />
                  <Button disabled={generatingImage} onClick={generateImage}>
                    {generatingImage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Generate"
                    )}
                  </Button>
                </div>

                {generatedImageUrl && (
                  <div className="flex flex-col gap-2">
                    <div className="aspect-video relative border rounded overflow-hidden">
                      <img
                        src={generatedImageUrl}
                        alt="Generated"
                        className="object-contain w-full h-full"
                      />
                    </div>
                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={regenerateImage}
                      >
                        Regenerate
                      </Button>
                      <Button size="sm" onClick={addGeneratedImage}>
                        Add to Document
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Editor Content */}
      <div className="flex-grow overflow-auto p-6 flex justify-center">
        <div className="w-full max-w-[816px]">
          <div
            ref={editorRef}
            className="min-h-[1056px] bg-white shadow-md rounded border border-gray-300 mx-auto cursor-text"
            style={{
              paddingLeft: "72px",
              paddingRight: "72px",
              paddingTop: "60px",
              paddingBottom: "60px",
            }}
            onClick={handleContainerClick}
          >
            <EditorContent editor={editor} className="h-full caret-black" />
          </div>
        </div>

        {/* AI generation floating button */}
        {aiPromptVisible && (
          <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg border p-2 z-10 flex items-center gap-2">
            <Button
              onClick={generateDocument}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Enhance with AI
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setAiPromptVisible(false)}
            >
              <X size={16} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// Create loading component
const DocumentGeneratorLoading = () => {
  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
};

// Main component with Suspense wrapper
const DocumentGenerator = () => {
  return (
    <Suspense fallback={<DocumentGeneratorLoading />}>
      <DocumentGeneratorContent />
    </Suspense>
  );
};

export default DocumentGenerator;
