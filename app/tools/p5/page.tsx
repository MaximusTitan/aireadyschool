"use client";

import Script from "next/script";
import { useEffect, useState, useRef } from "react";

const SAMPLE_SKETCHES = [
  {
    title: "Moving Circle",
    code: `function setup() {
  createCanvas(600, 600);
}

function draw() {
  background(220);
  ellipse(mouseX, mouseY, 50, 50);
}`,
  },
  {
    title: "Rainbow Pattern",
    code: `function setup() {
  createCanvas(600, 600);
  colorMode(HSB);
}

function draw() {
  background(0);
  for (let i = 0; i < 360; i += 30) {
    fill((i + frameCount) % 360, 100, 100);
    arc(300, 300, 200, 200, radians(i), radians(i + 30));
  }
}`,
  },
  {
    title: "Bouncing Ball",
    code: `let x = 300;
let y = 300;
let xSpeed = 5;
let ySpeed = 3;

function setup() {
  createCanvas(600, 600);
}

function draw() {
  background(220);
  ellipse(x, y, 50, 50);
  
  x += xSpeed;
  y += ySpeed;
  
  if (x > width || x < 0) xSpeed *= -1;
  if (y > height || y < 0) ySpeed *= -1;
}`,
  },
];

export default function P5Page() {
  const [selectedSketch, setSelectedSketch] = useState(0);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scriptLoaded && containerRef.current) {
      // Clear previous widget
      containerRef.current.innerHTML = "";

      // Create new widget
      const scriptElement = document.createElement("script");
      scriptElement.type = "text/p5";
      scriptElement.setAttribute("data-autoplay", "");
      scriptElement.setAttribute("data-height", "600");
      scriptElement.setAttribute("data-preview-width", "600");
      scriptElement.textContent = SAMPLE_SKETCHES[selectedSketch].code;

      containerRef.current.appendChild(scriptElement);

      // Reinitialize p5 widget
      if (window.p5Widget) {
        window.p5Widget.replaceAll();
      }
    }
  }, [selectedSketch, scriptLoaded]);

  return (
    <div className="flex">
      <div className="w-64 h-screen bg-gray-100 p-4 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Sample Sketches</h2>
        <div className="space-y-2">
          {SAMPLE_SKETCHES.map((sketch, index) => (
            <button
              key={index}
              className={`w-full text-left p-2 rounded ${
                selectedSketch === index
                  ? "bg-blue-500 text-white"
                  : "hover:bg-gray-200"
              }`}
              onClick={() => setSelectedSketch(index)}
            >
              {sketch.title}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-4">
        <h1 className="text-2xl font-bold mb-4">P5.js Playground</h1>

        <Script
          src="//toolness.github.io/p5.js-widget/p5-widget.js"
          strategy="afterInteractive"
          onLoad={() => setScriptLoaded(true)}
        />

        <div ref={containerRef} className="p5-widget" />
      </div>
    </div>
  );
}
