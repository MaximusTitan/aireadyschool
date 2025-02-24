import DynamicLessonPlanner from "./components/dynamic-lesson-planner";
import LessonPlanGenerator from "./components/Lesson-plan-generator";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <LessonPlanGenerator />
    </main>
  );
}
