"use client";

import { Day } from "../types";

interface SessionNavigatorProps {
  days: Day[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function SessionNavigator({
  days,
  activeTab,
  onTabChange,
}: SessionNavigatorProps) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">Sessions</h2>
      <div className="space-y-2">
        {days.map((day) => (
          <div
            key={`session-${day.day}`}
            className={`border rounded-md p-4 cursor-pointer ${
              activeTab === `day-${day.day}`
                ? "bg-rose-50"
                : "bg-white hover:bg-gray-50"
            } transition-colors`}
            onClick={() => onTabChange(`day-${day.day}`)}
          >
            <div className="flex">
              <div className="w-1 bg-rose-500 mr-4"></div>
              <div>
                <span className="font-medium">Session {day.day}</span>:{" "}
                {day.topicHeading}
              </div>
            </div>
          </div>
        ))}
        <div
          className={`border rounded-md p-4 cursor-pointer ${
            activeTab === "assessment"
              ? "bg-rose-50"
              : "bg-white hover:bg-gray-50"
          } transition-colors`}
          onClick={() => onTabChange("assessment")}
        >
          <div className="flex">
            <div className="w-1 bg-rose-500 mr-4"></div>
            <div>
              <span className="font-medium">Assessment Plan</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
