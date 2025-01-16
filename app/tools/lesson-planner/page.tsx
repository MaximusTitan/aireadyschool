import { Chat } from "./components/chat";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lesson Planner - AI Ready School",
  description:
    "Create lesson plans with ease using AI Ready School's lesson planner tool.",
};

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col p-6">
      <Chat />
    </main>
  );
}
