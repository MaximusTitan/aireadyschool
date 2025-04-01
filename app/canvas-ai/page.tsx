import { TldrawCanvas } from "./components/tldraw-canvas";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <TldrawCanvas />
    </main>
  );
}
