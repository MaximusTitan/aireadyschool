import { Metadata } from "next";
import TextTools from "./TextTools";

export const metadata: Metadata = {
  title: "Text Tools - AI Ready School",
  description:
    "Rewrite, proofread, translate, generate questions, expand, summarize texts",
};

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col p-6">
      <TextTools />
    </main>
  );
}
