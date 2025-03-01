"use client";

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@/utils/cn';
import {
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Type
} from 'lucide-react';

interface SimpleRichEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  isEditing?: boolean;
}

export function SimpleRichEditor({ value, onChange, className, isEditing = true }: SimpleRichEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 });
  const activeSelectionRef = useRef<Range | null>(null);
  const isFormatting = useRef(false);
  const mouseInToolbar = useRef(false);

  // Initialize content
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  // Save the selection range with cursor position
  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0).cloneRange();
      activeSelectionRef.current = range;
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

  // Handle content changes
  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
    }
  }, [onChange]);

  // Position toolbar based on selection
  const updateToolbarPosition = useCallback((range: Range) => {
    if (!range || !editorRef.current) return;
    
    const editorRect = editorRef.current.getBoundingClientRect();
    const rangeRect = range.getBoundingClientRect();

    setToolbarPosition({
      top: Math.max(0, rangeRect.top - editorRect.top - 40), // FIXED: Adjusted offset to avoid cutting off
      left: Math.max(0, rangeRect.left - editorRect.left),
    });
  }, []);

  // Handle selection changes
  const handleSelectionChange = useCallback(() => {
    if (!isEditing || isFormatting.current) return;

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      const range = sel.getRangeAt(0);

      if (editorRef.current?.contains(range.commonAncestorContainer)) {
        activeSelectionRef.current = range.cloneRange();
        updateToolbarPosition(range);
        setShowToolbar(true);
      }
    }
  }, [isEditing, updateToolbarPosition]);

  // Set up event listeners
  useEffect(() => {
    const editor = editorRef.current;
    if (editor && isEditing) {
      const mouseUpHandler = () => handleSelectionChange();
      const keyUpHandler = () => handleSelectionChange();

      editor.addEventListener('mouseup', mouseUpHandler);
      editor.addEventListener('keyup', keyUpHandler);

      // Click outside to hide toolbar
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

  // Format commands
  const formatText = useCallback((command: string, value?: string) => {
    if (!isEditing) return;

    isFormatting.current = true;
    saveSelection(); // Save the selection before applying formatting

    document.execCommand(command, false, value);
    handleInput();

    setTimeout(() => {
      restoreSelection(); // FIXED: Restore selection immediately after formatting
      setShowToolbar(true);
      isFormatting.current = false;
    }, 10);
  }, [isEditing, saveSelection, handleInput, restoreSelection]);

  return (
    <div 
      className={cn('relative', className)}
      onClick={() => {
        if (isEditing && editorRef.current) {
          editorRef.current.focus();
        }
      }}
    >
      {isEditing && showToolbar && (
        <div 
          ref={toolbarRef}
          className="absolute z-50 bg-white rounded-lg shadow-lg p-2 flex gap-2"
          style={{ 
            top: `${toolbarPosition.top}px`, 
            left: `${toolbarPosition.left}px`,
            transform: 'translateY(-100%)',
            border: '1px solid #e5e7eb',
            height: '40px', // FIXED: Reduced height
            overflow: 'hidden', // FIXED: Prevents stretching
          }}
          onMouseDown={(e) => {
            e.preventDefault(); 
            e.stopPropagation();
          }}
          onMouseEnter={() => { mouseInToolbar.current = true; }}
          onMouseLeave={() => { mouseInToolbar.current = false; }}
        >
          <button 
            onMouseDown={(e) => {
              e.preventDefault();
              formatText('bold');
            }}
            className="p-1.5 hover:bg-gray-100 rounded bg-gray-50 text-black border border-gray-200"
            title="Bold"
          >
            <Bold className="w-4 h-4 text-gray-800" />
          </button>
          
          <button 
            onMouseDown={(e) => {
              e.preventDefault();
              formatText('italic');
            }}
            className="p-1.5 hover:bg-gray-100 rounded bg-gray-50 text-black border border-gray-200"
            title="Italic"
          >
            <Italic className="w-4 h-4 text-gray-800" />
          </button>
          
          <button 
            onMouseDown={(e) => {
              e.preventDefault();
              formatText('underline');
            }}
            className="p-1.5 hover:bg-gray-100 rounded bg-gray-50 text-black border border-gray-200"
            title="Underline"
          >
            <Underline className="w-4 h-4 text-gray-800" />
          </button>
        </div>
      )}

      <div 
        ref={editorRef}
        contentEditable={isEditing}
        className="w-full min-h-[100px] p-2 border border-gray-300 rounded-md"
        onInput={handleInput}
      />
    </div>
  );
}
