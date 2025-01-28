"use client";

import Script from "next/script";
import { useEffect } from "react";

export default function P5Page() {
  useEffect(() => {
    // Initialize any p5 widgets after script loads
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">P5.js Playground</h1>

      <Script
        src="//toolness.github.io/p5.js-widget/p5-widget.js"
        strategy="afterInteractive"
      />

      <div className="p5-widget mb-4">
        <script type="text/p5" data-autoplay data-height="400">
          {`function setup() {
  createCanvas(400, 400);
}

function draw() {
  background(220);
  ellipse(mouseX, mouseY, 50, 50);
}`}
        </script>
      </div>

      <div className="p5-widget">
        <script type="text/p5" data-height="300" data-preview-width="300">
          {`// Try editing this code!
createCanvas(300, 300);
background(255, 0, 200);
ellipse(150, 150, 100, 100);`}
        </script>
      </div>
    </div>
  );
}
