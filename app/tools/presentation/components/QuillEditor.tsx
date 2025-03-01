"use client";

import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  isEditing?: boolean;
}

export function QuillEditor({ value, onChange, className, isEditing = true }: QuillEditorProps) {
  const [isFocused, setIsFocused] = useState(false);

  const modules = {
    toolbar: isEditing ? [
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'font': [] }],
      [{ 'align': [] }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link']
    ] : false
  };

  return (
    <div className="relative">
      <ReactQuill
        value={value}
        onChange={onChange}
        modules={modules}
        theme="snow"
        readOnly={!isEditing}
        className={`${className} ${!isEditing ? 'no-toolbar' : ''}`}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      <style>{`
        .ql-toolbar {
          position: ${isFocused ? 'absolute' : 'static'};
          top: -45px;
          left: 0;
          right: 0;
          background: white;
          border-radius: 6px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          z-index: 50;
          display: ${isEditing ? 'block' : 'none'};
        }
        .ql-container {
          border: none !important;
        }
        .ql-editor {
          padding: ${isEditing ? '8px' : '0'} !important;
          min-height: auto !important;
        }
        .no-toolbar .ql-editor {
          padding: 0 !important;
        }
        .ql-editor p {
          margin: 0;
        }
        .ql-toolbar.ql-snow {
          border: none;
        }
        .ql-container.ql-snow {
          border: none;
        }
        .ql-editor:focus {
          outline: none;
        }
      `}</style>
    </div>
  );
}
