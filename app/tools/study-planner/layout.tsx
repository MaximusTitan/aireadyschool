import { StudyPlanProvider } from "./contexts/StudyPlanContext";

export default function StudyPlannerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StudyPlanProvider>{children}</StudyPlanProvider>;
}
