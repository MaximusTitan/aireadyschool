"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ArrowRight, Copy, Check } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import {
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { KeyboardIcon, ZapIcon } from "lucide-react";

type Operation = "rewrite" | "proofread" | "translate" | "expand" | "summarize";

export const TextInputNode = ({ data }: { data: any }) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      data.processText();
    }
  };

  return (
    <div className="w-[500px] bg-white rounded-xl shadow-lg border border-purple-100 hover:border-purple-300 transition-all hover:shadow-xl">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full" />
            <h3 className="font-semibold text-gray-800">Text Input</h3>
          </div>
          <div className="flex items-center gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <KeyboardIcon size={12} />
                    <span>Cmd + Enter to process</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Use keyboard shortcut to quickly process text</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Select
              value={data.operation}
              onValueChange={(value) => data.setOperation(value as Operation)}
            >
              <SelectTrigger className="w-[160px] bg-white/50">
                <SelectValue placeholder="Operation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summarize">✨ Summarize</SelectItem>
                <SelectItem value="rewrite">📝 Rewrite</SelectItem>
                <SelectItem value="proofread">🔍 Proofread</SelectItem>
                <SelectItem value="translate">🌍 Translate</SelectItem>
                <SelectItem value="expand">📈 Expand</SelectItem>
              </SelectContent>
            </Select>
            {data.operation === "translate" && (
              <Select
                value={data.targetLanguage}
                onValueChange={data.setTargetLanguage}
              >
                <SelectTrigger className="w-[130px] bg-white/50">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spanish">🇪🇸 Spanish</SelectItem>
                  <SelectItem value="french">🇫🇷 French</SelectItem>
                  <SelectItem value="german">🇩🇪 German</SelectItem>
                  <SelectItem value="italian">🇮🇹 Italian</SelectItem>
                  <SelectItem value="portuguese">🇵🇹 Portuguese</SelectItem>
                  <SelectItem value="chinese">🇨🇳 Chinese</SelectItem>
                  <SelectItem value="japanese">🇯🇵 Japanese</SelectItem>
                  <SelectItem value="telugu">TG Telugu</SelectItem>
                  <SelectItem value="hindi">HI Hindi</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        <div className="space-y-3">
          <Textarea
            placeholder="Enter your text here..."
            value={data.input}
            onChange={(e) => data.setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[200px] resize-none transition-all focus:ring-2 focus:ring-purple-200"
          />
          <Button
            onClick={data.processText}
            disabled={data.loading || !data.input.trim()}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white transition-all"
          >
            {data.loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <ZapIcon className="h-4 w-4 mr-2" />
                Process Text
              </>
            )}
          </Button>
          {!data.input.trim() && (
            <p className="text-xs text-gray-400 text-center animate-fade-in">
              Enter some text to begin
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export const TextOutputNode = ({ data }: { data: any }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(data.output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-[400px] bg-white rounded-xl shadow-lg border border-emerald-100 hover:border-emerald-300 transition-all hover:shadow-xl">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
            <h3 className="text-sm font-medium text-emerald-700">
              Processed Text
            </h3>
          </div>
          <button
            onClick={handleCopy}
            className={`p-1.5 rounded-md transition-all ${
              copied
                ? "bg-emerald-100 text-emerald-600"
                : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            }`}
            title={copied ? "Copied!" : "Copy to clipboard"}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
        <div className="text-gray-700 leading-relaxed whitespace-pre-wrap text-[15px] mt-2">
          {data.output || "Processed text will appear here..."}
        </div>
      </div>
    </div>
  );
};
