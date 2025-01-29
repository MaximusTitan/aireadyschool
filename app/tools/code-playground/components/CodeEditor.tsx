"use client";

import { useEffect, useState } from "react";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-rust";
import "prismjs/themes/prism-tomorrow.css";

interface CodeEditorProps {
  code: string;
  setCode: (code: string) => void;
  language: string;
}

export default function CodeEditor({
  code,
  setCode,
  language,
}: CodeEditorProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <Editor
        value={code}
        onValueChange={setCode}
        highlight={(code) =>
          Prism.highlight(
            code,
            Prism.languages[language.toLowerCase()] ||
              Prism.languages.javascript,
            language.toLowerCase()
          )
        }
        padding={16}
        style={{
          fontFamily: '"Fira code", "Fira Mono", monospace',
          fontSize: 14,
          backgroundColor: "#2d2d2d",
          color: "#ccc",
        }}
        textareaClassName="focus:outline-none"
      />
    </div>
  );
}
