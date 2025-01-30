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
import { Loader2, ArrowRight } from "lucide-react";

type Operation = "rewrite" | "proofread" | "translate" | "expand" | "summarize";

export const TextInputNode = ({ data }: { data: any }) => {
  return (
    <div className="w-[400px] bg-white rounded-xl shadow-lg border border-purple-100">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-purple-500 rounded-full" />
            <h3 className="font-semibold text-gray-800">Text Input</h3>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={data.operation}
              onValueChange={(value) => data.setOperation(value as Operation)}
            >
              <SelectTrigger className="w-[130px] bg-white/50">
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
            className="min-h-[200px] resize-none"
          />
          <Button
            onClick={data.processText}
            disabled={data.loading}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white"
          >
            {data.loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ArrowRight className="h-4 w-4 mr-2" />
            )}
            Process Text
          </Button>
        </div>
      </div>
    </div>
  );
};

export const TextOutputNode = ({ data }: { data: any }) => {
  return (
    <div className="w-[400px] bg-white rounded-xl shadow-lg border border-emerald-100">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 bg-emerald-500 rounded-full" />
          <h3 className="font-semibold text-gray-800">Processed Text</h3>
        </div>
        <Textarea
          placeholder="Processed text will appear here..."
          value={data.output}
          readOnly
          className="min-h-[200px] resize-none"
        />
      </div>
    </div>
  );
};
