"use client";

import { useState } from "react";
import LessonList from "./LessonList";
import Lesson from "./Lesson";
import LanguageSelector from "./LanguageSelector";
import { lessons } from "../data/lessons";
import type { Lesson as LessonType } from "../types/lessons";
import { motion, AnimatePresence } from "framer-motion";
import ProgressTracker from "./ProgressTracker";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import CodePlayground from "./CodePlayground";

export default function LearnToCode() {
  const [currentLesson, setCurrentLesson] = useState<LessonType | null>(null);
  const [selectedLanguage, setSelectedLanguage] =
    useState<string>("JavaScript");
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const languageLessons = lessons[selectedLanguage] || [];

  const filteredLessons = languageLessons.filter((lesson) =>
    lesson.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-1/4 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <LanguageSelector
            languages={Object.keys(lessons)}
            selectedLanguage={selectedLanguage}
            setSelectedLanguage={setSelectedLanguage}
          />
          <ProgressTracker
            completedLessons={
              completedLessons.filter((id) =>
                id.startsWith(selectedLanguage.toLowerCase())
              ).length
            }
            totalLessons={languageLessons.length}
          />
          <div className="relative mb-4">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search lessons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <LessonList
            lessons={filteredLessons}
            setCurrentLesson={setCurrentLesson}
            currentLessonId={currentLesson?.id}
            completedLessons={completedLessons}
          />
        </div>
        <div className="w-full lg:w-3/4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentLesson?.id || "playground"}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentLesson ? (
                <Lesson
                  lesson={currentLesson}
                  onComplete={(lessonId) =>
                    setCompletedLessons((prev) => [...prev, lessonId])
                  }
                />
              ) : (
                <CodePlayground language={selectedLanguage} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
