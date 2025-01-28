import type { Lesson } from "../types/lessons";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface LessonListProps {
  lessons: Lesson[];
  setCurrentLesson: (lesson: Lesson) => void;
  currentLessonId: string | undefined;
  completedLessons: string[];
}

export default function LessonList({
  lessons,
  setCurrentLesson,
  currentLessonId,
  completedLessons,
}: LessonListProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
        Lessons
      </h2>
      <div className="space-y-2">
        {lessons.map((lesson, index) => (
          <motion.div
            key={lesson.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Button
              variant={lesson.id === currentLessonId ? "default" : "outline"}
              className={`w-full justify-start text-left ${completedLessons.includes(lesson.id) ? "bg-green-100 dark:bg-green-900" : ""}`}
              onClick={() => setCurrentLesson(lesson)}
            >
              <span className="truncate">{lesson.title}</span>
              {completedLessons.includes(lesson.id) && (
                <span className="ml-2 text-green-500">✓</span>
              )}
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
