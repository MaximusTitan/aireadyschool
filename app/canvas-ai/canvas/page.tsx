import { Suspense } from "react";
import { DrawingCanvas } from "../components/draw/drawing-canvas";

export default function CanvasPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <div className="flex flex-1">
        <Suspense
          fallback={
            <div className="flex items-center justify-center w-full">
              Loading canvas...
            </div>
          }
        >
          <DrawingCanvas />
        </Suspense>
      </div>
    </main>
  );
}
