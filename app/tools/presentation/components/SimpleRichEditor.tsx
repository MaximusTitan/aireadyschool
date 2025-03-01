"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@/utils/cn';
import {
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Type, ChevronUp, ChevronDown
} from 'lucide-react';

interface SimpleRichEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  isEditing?: boolean;
  theme?: string; // Add theme prop
}

export function SimpleRichEditor({ 
  value, 
  onChange, 
  className, 
  isEditing = true,
  theme = 'modern' // Default theme
}: SimpleRichEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0, positionBelow: false });
  const activeSelectionRef = useRef<Range | null>(null);
  const isFormatting = useRef(false);
  const mouseInToolbar = useRef(false);
  const [lastFormattingTime, setLastFormattingTime] = useState(0);
  const originalRangeRef = useRef<Range | null>(null);
  const [fontSize, setFontSize] = useState<number>(16);
  
  // Get theme-specific color with proper colors for each theme
  const getThemeColor = useCallback(() => {
    switch (theme) {
      case 'dark':
        return '#ffffff';
      case 'modern':
        return '#ffffff';
      case 'creative':
        return '#333333'; // Changed to dark color for Creative theme
      case 'corporate':
        return '#333333';
      case 'minimal':
      default:
        return '#333333';
    }
  }, [theme]);

  // Initialize content with theme-appropriate styling
  useEffect(() => {
    if (editorRef.current) {
      if (value !== editorRef.current.innerHTML) {
        editorRef.current.innerHTML = value;
      }
      
      // Add theme class and reset any borders or backgrounds
      editorRef.current.classList.add(`theme-${theme}`);
      editorRef.current.style.background = 'transparent';
      editorRef.current.style.border = 'none';
      editorRef.current.style.color = getThemeColor();
    }
  }, [value, theme, getThemeColor]);

  // Save the selection range with cursor position
  const saveSelection = useCallback((shouldSaveAsOriginal = false) => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0).cloneRange();
      activeSelectionRef.current = range;
      
      // If this is the original selection that triggered the toolbar,
      // save it separately so we can keep using the same position
      if (shouldSaveAsOriginal) {
        originalRangeRef.current = range.cloneRange();
      }
      
      return range;
    }
    return null;
  }, []);

  // Restore selection including cursor position
  const restoreSelection = useCallback(() => {
    const range = activeSelectionRef.current;
    if (!range) return;
    
    try {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
    } catch (e) {
      console.warn('Failed to restore selection', e);
    }
  }, []);

  // Enhanced handle input to clean bullet point styling
  const handleInput = useCallback(() => {
    if (editorRef.current) {
      // Clean any unwanted styles that might be applied to list items
      if (theme === 'modern' || theme === 'creative') {
        const listItems = editorRef.current.querySelectorAll('li');
        listItems.forEach(item => {
          item.style.backgroundColor = 'transparent';
          item.style.border = 'none';
          item.style.boxShadow = 'none';
          item.style.outline = 'none';
          
          // Also clean any spans or divs inside list items
          const elements = item.querySelectorAll('span, div');
          elements.forEach(el => {
            (el as HTMLElement).style.backgroundColor = 'transparent';
            (el as HTMLElement).style.border = 'none';
            (el as HTMLElement).style.boxShadow = 'none';
          });
        });
      }
      
      const content = editorRef.current.innerHTML;
      onChange(content);
    }
  }, [onChange, theme]);

  // Enhanced toolbar positioning that ensures all tools are visible
  const updateToolbarPosition = useCallback((range: Range) => {
    if (!range || !editorRef.current) return;
    
    // Get the positions and dimensions
    const editorRect = editorRef.current.getBoundingClientRect();
    const rangeRect = range.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    
    // Calculate toolbar dimensions (estimate based on number of tools)
    const toolbarWidth = 360; // Increased width to fit all tools
    const toolbarHeight = 44; // Increased height for better visibility
    
    // Calculate initial position (centered above selection)
    let left = rangeRect.left - editorRect.left + (rangeRect.width / 2) - (toolbarWidth / 2);
    let top = rangeRect.top - editorRect.top - toolbarHeight - 10; // 10px gap
    let positionBelow = false;
    
    // Check if toolbar would go beyond the right edge of the container
    if (left + toolbarWidth > editorRect.width) {
      left = editorRect.width - toolbarWidth - 10; // 10px margin
    }
    
    // Check if toolbar would go beyond the left edge
    if (left < 0) {
      left = 10; // 10px margin
    }
    
    // Check if toolbar would go beyond the top edge
    if (top < 0) {
      // Position below selection instead
      top = rangeRect.bottom - editorRect.top + 10;
      positionBelow = true;
    }
    
    setToolbarPosition({
      top: Math.max(0, top),
      left: Math.max(0, left),
      positionBelow
    });
  }, []);

  // Function to get the font size of the selected text
  const getFontSize = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return 16;

    let node: Node | null = selection.anchorNode;
    
    // Navigate to the element node (could be a parent of the text node)
    while (node && node.nodeType !== Node.ELEMENT_NODE) {
      node = node.parentNode;
    }
    
    if (node && node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      
      // First check for explicit font size attribute or style
      const fontSizeAttr = element.getAttribute('size');
      if (fontSizeAttr) {
        // Convert HTML size attribute (1-7) to approximate pixels
        const htmlSizes = [8, 10, 12, 14, 18, 24, 36];
        return htmlSizes[parseInt(fontSizeAttr) - 1] || 16;
      }
      
      // Then check for style with font-size
      const computedStyle = window.getComputedStyle(element);
      const fontSizeStyle = computedStyle.fontSize;
      
      if (fontSizeStyle) {
        // Handle different units (px, em, rem, etc.)
        const size = parseFloat(fontSizeStyle);
        return size || 16;
      }
    }
    
    return 16; // Default font size
  }, []);

  // Update font size when selection changes
  const updateFontSize = useCallback(() => {
    const size = getFontSize();
    setFontSize(size);
  }, [getFontSize]);

  // Enhanced selection change handler
  const handleSelectionChange = useCallback(() => {
    if (!isEditing || isFormatting.current) return;
    
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      const range = sel.getRangeAt(0);
      
      // Check if selection is within our editor
      if (editorRef.current?.contains(range.commonAncestorContainer)) {
        // Save this as the original selection that triggered the toolbar
        const savedRange = saveSelection(true);
        if (savedRange) {
          updateToolbarPosition(savedRange);
          setShowToolbar(true);
          updateFontSize(); // Update font size when selection changes
        }
      }
    }
  }, [isEditing, saveSelection, updateToolbarPosition, updateFontSize]);

  // Set up event listeners
  useEffect(() => {
    const editor = editorRef.current;
    if (editor && isEditing) {
      const mouseUpHandler = () => handleSelectionChange();
      const keyUpHandler = () => handleSelectionChange();
      
      editor.addEventListener('mouseup', mouseUpHandler);
      editor.addEventListener('keyup', keyUpHandler);
      
      // Fix invisible cursor issue by setting pointer-events
      document.documentElement.style.cursor = 'auto';
      document.body.style.pointerEvents = 'auto';
      
      // Handle click outside to hide toolbar
      const handleClickOutside = (e: MouseEvent) => {
        if (
          !isFormatting.current &&
          toolbarRef.current &&
          !toolbarRef.current.contains(e.target as Node) &&
          editor &&
          !editor.contains(e.target as Node)
        ) {
          setShowToolbar(false);
        }
      };
      
      document.addEventListener('mousedown', handleClickOutside);
      
      return () => {
        editor.removeEventListener('mouseup', mouseUpHandler);
        editor.removeEventListener('keyup', keyUpHandler);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
    
    return () => {};
  }, [handleSelectionChange, isEditing]);

  // Format commands - Fixed to consistently keep selection active for all formatting operations
  const formatText = useCallback((command: string, value?: string) => {
    if (!isEditing) return;
    
    isFormatting.current = true;
    setLastFormattingTime(Date.now()); // Track when formatting was applied
    
    // Always use the current selection for formatting
    const savedRange = saveSelection();
    
    if (!savedRange) {
      isFormatting.current = false;
      return;
    }
    
    // Special handling for color to respect theme
    if (command === 'foreColor' && value) {
      // Only apply explicit color if it's not the default theme color
      document.execCommand(command, false, value);
    } else {
      document.execCommand(command, false, value);
    }
    
    handleInput();
    
    // Create a focused task to restore selection
    setTimeout(() => {
      try {
        // Focus the editor
        if (editorRef.current) {
          editorRef.current.focus();
        }
        
        // Restore the selection
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          
          // Use the same range we just saved before formatting
          if (savedRange) {
            sel.addRange(savedRange);
            
            // Keep the toolbar visible and in the same position
            setShowToolbar(true);
            
            // Use original range for toolbar positioning to prevent jumping
            if (originalRangeRef.current) {
              updateToolbarPosition(originalRangeRef.current);
            }
          }
        }
      } catch (e) {
        console.warn("Error restoring selection:", e);
      } finally {
        isFormatting.current = false;
      }
    }, 0);
  }, [isEditing, handleInput, saveSelection, updateToolbarPosition, theme]);

  // Ensure we keep monitoring for clicks outside to properly dismiss the toolbar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        toolbarRef.current && 
        !toolbarRef.current.contains(e.target as Node) && 
        editorRef.current && 
        !editorRef.current.contains(e.target as Node)
      ) {
        setShowToolbar(false);
        originalRangeRef.current = null; // Clear the original range
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Font size adjustment functions
  const increaseFontSize = useCallback(() => {
    // Save current selection
    const savedRange = saveSelection();
    
    if (!savedRange) return;
    
    // Get the current size and calculate new size
    const currentSize = getFontSize();
    const newSize = Math.min(72, currentSize + (currentSize < 36 ? 2 : 4));
    setFontSize(newSize);
    
    // Apply the new font size
    document.execCommand('fontSize', false, '7'); // Use max HTML size for better browser support
    
    // Then update the actual size with CSS
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.style.fontSize = `${newSize}px`;
      
      try {
        range.surroundContents(span);
        handleInput();
      } catch (e) {
        console.warn('Error applying font size:', e);
      }
    }
    
    // Restore selection
    setTimeout(() => {
      restoreSelection();
      setShowToolbar(true);
    }, 0);
  }, [saveSelection, getFontSize, restoreSelection, handleInput]);

  const decreaseFontSize = useCallback(() => {
    // Save current selection
    const savedRange = saveSelection();
    
    if (!savedRange) return;
    
    // Get the current size and calculate new size
    const currentSize = getFontSize();
    const newSize = Math.max(8, currentSize - (currentSize > 36 ? 4 : 2));
    setFontSize(newSize);
    
    // Apply the new font size
    document.execCommand('fontSize', false, '7'); // Use max HTML size for better browser support
    
    // Then update the actual size with CSS
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.style.fontSize = `${newSize}px`;
      
      try {
        range.surroundContents(span);
        handleInput();
      } catch (e) {
        console.warn('Error applying font size:', e);
      }
    }
    
    // Restore selection
    setTimeout(() => {
      restoreSelection();
      setShowToolbar(true);
    }, 0);
  }, [saveSelection, getFontSize, restoreSelection, handleInput]);

  return (
    <div className={cn('relative', className)}>
      {isEditing && showToolbar && (
        <div 
          ref={toolbarRef}
          className="absolute z-50 bg-white rounded-lg shadow-lg p-2 flex flex-wrap gap-2 items-center"
          style={{ 
            top: `${toolbarPosition.top}px`, 
            left: `${toolbarPosition.left}px`,
            transform: toolbarPosition.positionBelow ? 'translateY(0)' : 'translateY(-100%)',
            border: '1px solid #e5e7eb',
            maxWidth: '360px', // Increased width
            minHeight: '44px', // Increased height
            padding: '6px 8px', // More padding
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onMouseEnter={() => { mouseInToolbar.current = true; }}
          onMouseLeave={() => { mouseInToolbar.current = false; }}
        >
          {/* Formatting buttons */}
          <div className="flex items-center gap-1">
            <button 
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                formatText('bold');
              }}
              className="p-1.5 hover:bg-gray-100 rounded bg-gray-50 text-black border border-gray-200 flex items-center justify-center"
              title="Bold"
              style={{ minWidth: '28px', minHeight: '28px' }}
            >
              <Bold className="w-4 h-4 text-gray-800" />
            </button>
            
            <button 
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                formatText('italic');
              }}
              className="p-1.5 hover:bg-gray-100 rounded bg-gray-50 text-black border border-gray-200 flex items-center justify-center"
              title="Italic"
              style={{ minWidth: '28px', minHeight: '28px' }}
            >
              <Italic className="w-4 h-4 text-gray-800" />
            </button>
            
            <button 
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                formatText('underline');
              }}
              className="p-1.5 hover:bg-gray-100 rounded bg-gray-50 text-black border border-gray-200 flex items-center justify-center"
              title="Underline"
              style={{ minWidth: '28px', minHeight: '28px' }}
            >
              <Underline className="w-4 h-4 text-gray-800" />
            </button>
          </div>
          
          <div className="w-px h-5 bg-gray-300" />
          
          {/* Text size control */}
          <div className="flex items-center gap-1">
            <button 
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                formatText('fontSize', '5');
              }}
              className="p-1.5 hover:bg-gray-100 rounded bg-gray-50 text-black border border-gray-200 flex items-center justify-center"
              title="Larger Text"
              style={{ minWidth: '28px', minHeight: '28px' }}
            >
              <Type className="w-4 h-4 text-gray-800" />
            </button>
            
            {/* Font size controls */}
            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded">
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  decreaseFontSize();
                }}
                className="p-1.5 hover:bg-gray-100 rounded-l flex items-center justify-center"
                title="Decrease font size"
                style={{ minWidth: '24px', minHeight: '28px' }}
              >
                <ChevronDown className="w-3 h-3 text-gray-800" />
              </button>
              
              <div className="px-1.5 text-xs font-medium text-gray-800 min-w-[32px] text-center">
                {Math.round(fontSize)}px
              </div>
              
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  increaseFontSize();
                }}
                className="p-1.5 hover:bg-gray-100 rounded-r flex items-center justify-center"
                title="Increase font size"
                style={{ minWidth: '24px', minHeight: '28px' }}
              >
                <ChevronUp className="w-3 h-3 text-gray-800" />
              </button>
            </div>
          </div>
          
          <div className="w-px h-5 bg-gray-300" />
          
          {/* Alignment controls */}
          <div className="flex items-center gap-1">
            <button 
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                formatText('justifyLeft');
              }}
              className="p-1.5 hover:bg-gray-100 rounded bg-gray-50 text-black border border-gray-200 flex items-center justify-center"
              title="Align Left"
              style={{ minWidth: '28px', minHeight: '28px' }}
            >
              <AlignLeft className="w-4 h-4 text-gray-800" />
            </button>
            
            <button 
              onMouseDown={(e) => {
                e.preventDefault(); 
                e.stopPropagation();
                formatText('justifyCenter');
              }}
              className="p-1.5 hover:bg-gray-100 rounded bg-gray-50 text-black border border-gray-200 flex items-center justify-center"
              title="Align Center"
              style={{ minWidth: '28px', minHeight: '28px' }}
            >
              <AlignCenter className="w-4 h-4 text-gray-800" />
            </button>
            
            <button 
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                formatText('justifyRight');
              }}
              className="p-1.5 hover:bg-gray-100 rounded bg-gray-50 text-black border border-gray-200 flex items-center justify-center"
              title="Align Right"
              style={{ minWidth: '28px', minHeight: '28px' }}
            >
              <AlignRight className="w-4 h-4 text-gray-800" />
            </button>
          </div>
          
          <div className="w-px h-5 bg-gray-300" />
          
          {/* Color picker */}
          <div className="flex items-center">
            <div className="p-1.5 hover:bg-gray-100 rounded bg-gray-50 border border-gray-200 flex items-center justify-center" title="Text Color">
              <input
                type="color"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  activeSelectionRef.current = window.getSelection()?.getRangeAt(0).cloneRange() || null;
                }}
                onChange={(e) => {
                  formatText('foreColor', e.target.value);
                }}
                className="w-4 h-4 cursor-pointer rounded"
                style={{ border: 'none', padding: 0 }}
                title="Text Color"
              />
            </div>
          </div>
        </div>
      )}
      
      <div
        ref={editorRef}
        contentEditable={isEditing}
        onInput={handleInput}
        onMouseUp={handleSelectionChange}
        onKeyUp={(e) => {
          // Only trigger selection change if it's not within 100ms of a format operation
          // This prevents the toolbar position from changing immediately after formatting
          if (Date.now() - lastFormattingTime > 100) {
            handleSelectionChange();
          }
        }}
        className={cn(
          "prose max-w-none outline-none min-h-[1em] cursor-auto",
          isEditing ? "hover:bg-transparent" : "", // Remove hover background
          `theme-${theme}`, // Add theme class
          theme === 'modern' || theme === 'creative' ? 'clean-list-items' : '', // Add special class
          className
        )}
        style={{ 
          pointerEvents: 'auto',
          color: getThemeColor(), // Apply direct theme color
          backgroundColor: 'transparent',
          border: 'none',
          boxShadow: 'none'
        }}
        suppressContentEditableWarning={true}
      />

      <style dangerouslySetInnerHTML={{ __html: `
        /* Base cursor styles */
        [contenteditable] {
          cursor: text !important;
          -webkit-user-select: text !important;
          user-select: text !important;
        }
        
        /* Focus and selection styles */
        [contenteditable]:focus {
          outline: none !important;
          background-color: transparent !important;
          box-shadow: none !important;
        }
        
        /* Theme-specific text colors */
        .theme-dark [contenteditable] {
          color: #ffffff !important;
          background-color: transparent !important;
        }
        
        .theme-modern [contenteditable] {
          color: #ffffff !important;
          background-color: transparent !important;
        }
        
        .theme-creative [contenteditable] {
          color: #333333 !important;
          background-color: transparent !important;
        }
        
        .theme-corporate [contenteditable] { 
          color: #333333 !important;
          background-color: transparent !important;
        }
        
        .theme-minimal [contenteditable] {
          color: #333333 !important;
          background-color: transparent !important;
        }
        
        /* Remove hover highlight */
        [contenteditable]:hover {
          background-color: transparent !important;
        }
        
        /* Very subtle hover effect only in edit mode */
        [contenteditable="true"]:hover {
          background-color: rgba(255, 255, 255, 0.02) !important;
        }
        
        /* Clean selection highlight */
        ::selection {
          background: rgba(128, 128, 128, 0.3);
        }

        /* Clean list item styling */
        .clean-list-items ul,
        .clean-list-items ol,
        .clean-list-items li,
        .clean-list-items li * {
          background-color: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
        
        /* Specific fixes for contenteditable list items */
        [contenteditable] ul li,
        [contenteditable] ol li {
          background-color: transparent !important;
        }
        
        .theme-modern [contenteditable] li,
        .theme-creative [contenteditable] li {
          background-color: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
        
        /* Ensure bullet point markers are properly styled */
        .theme-modern .reveal ul li::before,
        .theme-modern [contenteditable] ul li::before {
          color: #ffffff !important;
          background: none !important;
          border: none !important;
        }
        
        .theme-creative .reveal ul li::before,
        .theme-creative [contenteditable] ul li::before {
          color: #333333 !important;
          background: none !important;
          border: none !important;
        }

        /* Ensure toolbar is never transparent */
        .absolute.z-50.bg-white {
          background-color: #ffffff !important;
          backdrop-filter: none !important;
        }
        
        /* Additional styling to ensure toolbar buttons are visible */
        .absolute.z-50.bg-white button,
        .absolute.z-50.bg-white div {
          background-color: #f9fafb !important;
          color: #111827 !important;
        }
        
        .absolute.z-50.bg-white button svg {
          color: #374151 !important;
        }

        /* Make toolbar more visible and ensure it's above everything */
        .absolute.z-50 {
          z-index: 9999 !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
          display: flex !important;
          flex-wrap: wrap !important;
          visibility: visible !important;
        }
        
        /* Style for toolbar buttons for better visibility */
        .absolute.z-50 button {
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 28px;
          min-height: 28px;
        }
        
        .absolute.z-50 button:hover {
          background-color: #f3f4f6 !important;
          transform: translateY(-1px);
        }
        
        .absolute.z-50 button:active {
          transform: translateY(0px);
        }
      `}} />
    </div>
  );
}

