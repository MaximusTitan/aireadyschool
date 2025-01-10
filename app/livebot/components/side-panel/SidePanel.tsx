/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
"use client";

import cn from "classnames";
import { useEffect, useRef, useState } from "react";
import { RiSidebarFoldLine, RiSidebarUnfoldLine } from "react-icons/ri";
import Select from "react-select";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { useLoggerStore } from "../../lib/store-logger";

const filterOptions = [
  { value: "conversations", label: "Conversations" },
  { value: "tools", label: "Tool Use" },
  { value: "none", label: "All" },
];

export default function SidePanel() {
  const { connected, client } = useLiveAPIContext();
  const [open, setOpen] = useState(true);
  const loggerRef = useRef<HTMLDivElement>(null);
  const loggerLastHeightRef = useRef<number>(-1);
  const { log, logs } = useLoggerStore();

  const [textInput, setTextInput] = useState("");
  const [selectedOption, setSelectedOption] = useState<{
    value: string;
    label: string;
  } | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Replace any Set with Array if applicable
  // For example, if logs were a Set, convert them to an Array
  const logsArray = Array.from(logs); // Assuming `logs` was a Set

  //scroll the log to the bottom when new logs come in
  useEffect(() => {
    if (loggerRef.current) {
      const el = loggerRef.current;
      const scrollHeight = el.scrollHeight;
      if (scrollHeight !== loggerLastHeightRef.current) {
        el.scrollTop = scrollHeight;
        loggerLastHeightRef.current = scrollHeight;
      }
    }
  }, [logs]);

  // listen for log events and store them
  useEffect(() => {
    client.on("log", log);
    return () => {
      client.off("log", log);
    };
  }, [client, log]);

  const handleSubmit = () => {
    client.send([{ text: textInput }]);

    setTextInput("");
    if (inputRef.current) {
      inputRef.current.innerText = "";
    }
  };

  return (
    <div
      className={`side-panel ${
        open ? "open" : ""
      } bg-white text-gray-800 w-64 transition-width duration-300 shadow-lg border-l border-gray-200`}
    >
      <header className="top flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
        <h2 className="text-lg font-semibold text-gray-700">Console</h2>
        {open ? (
          <button
            className="opener p-2 hover:bg-gray-100 rounded-lg"
            onClick={() => setOpen(false)}
          >
            <RiSidebarFoldLine className="text-gray-600" />
          </button>
        ) : (
          <button
            className="opener p-2 hover:bg-gray-100 rounded-lg"
            onClick={() => setOpen(true)}
          >
            <RiSidebarUnfoldLine className="text-gray-600" />
          </button>
        )}
      </header>
      <section className="indicators flex items-center justify-between p-4 bg-gray-50">
        <Select
          className="react-select w-full"
          classNamePrefix="react-select"
          styles={{
            control: (baseStyles) => ({
              ...baseStyles,
              background: "white",
              color: "#374151",
              minHeight: "33px",
              maxHeight: "33px",
              border: "1px solid #E5E7EB",
              borderRadius: "0.375rem",
            }),
            option: (styles, { isFocused, isSelected }) => ({
              ...styles,
              backgroundColor: isFocused
                ? "#F3F4F6"
                : isSelected
                  ? "#E5E7EB"
                  : undefined,
              color: "#374151",
            }),
          }}
          defaultValue={selectedOption}
          options={filterOptions}
          onChange={(e) => {
            setSelectedOption(e);
          }}
        />
        <div
          className={cn("streaming-indicator ml-2 text-sm", {
            "text-blue-600": connected,
            "text-gray-500": !connected,
          })}
        >
          {connected
            ? `🔵${open ? " Streaming" : ""}`
            : `⏸️${open ? " Paused" : ""}`}
        </div>
      </section>

      <div
        className={cn(
          "input-container mt-auto border-t border-gray-200",
          { "opacity-50": !connected },
          "p-4"
        )}
      >
        <div className="input-content flex items-center relative">
          <textarea
            className="input-area flex-1 border border-gray-300 text-gray-700 p-2 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            ref={inputRef}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();
                handleSubmit();
              }
            }}
            onChange={(e) => setTextInput(e.target.value)}
            value={textInput}
          ></textarea>
          <span
            className={cn(
              "input-content-placeholder",
              {
                hidden: textInput.length,
              },
              "absolute left-4 top-2 text-gray-400"
            )}
          >
            Type something...
          </span>

          <button
            className="send-button ml-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed"
            onClick={handleSubmit}
            disabled={!connected}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
