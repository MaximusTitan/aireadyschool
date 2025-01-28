import { Progress } from "@/components/ui/progress";

interface ProgressTrackerProps {
  completedLessons: number;
  totalLessons: number;
}

export default function ProgressTracker({
  completedLessons,
  totalLessons,
}: ProgressTrackerProps) {
  const progress = (completedLessons / totalLessons) * 100;

  return (
    <div className="mb-4">
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Progress
        </span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {completedLessons}/{totalLessons}
        </span>
      </div>
      <Progress value={progress} className="w-full" />
    </div>
  );
}
