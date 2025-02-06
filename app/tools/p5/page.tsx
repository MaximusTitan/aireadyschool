"use client";

import Script from "next/script";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

const SAMPLE_SKETCHES = [
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
  {
    title: "Interactive Sine Wave",
    code: `let angle = 0;
let amplitude = 100;

function setup() {
  createCanvas(600, 600);
}

function draw() {
  background(220);
  translate(0, height/2);
  
  // Draw axis
  line(0, 0, width, 0);
  
  beginShape();
  noFill();
  for(let x = 0; x < width; x++) {
    let y = amplitude * sin(angle + x * 0.02);
    vertex(x, y);
  }
  endShape();
  
  angle += 0.02;
}`,
  },
  {
    title: "Times Table Visualization",
    code: `let total = 200;
let factor = 0;

function setup() {
  createCanvas(600, 600);
  strokeWeight(1);
}

function draw() {
  background(0);
  translate(width / 2, height / 2);
  
  stroke(255, 150);
  noFill();
  ellipse(0, 0, 400, 400); // Replacing circle with ellipse
  
  for (let i = 0; i < total; i++) {
    let angle1 = map(i, 0, total, 0, TWO_PI);
    let x1 = 200 * cos(angle1);
    let y1 = 200 * sin(angle1);
    
    let angle2 = map(i * factor, 0, total, 0, TWO_PI);
    let x2 = 200 * cos(angle2);
    let y2 = 200 * sin(angle2);
    
    stroke(255, 50);
    line(x1, y1, x2, y2);
  }
  
  factor += 0.01;
}
`,
  },
  {
    title: "Math Function Grapher",
    code: `let xMin = -5;
let xMax = 5;
let yMin = -5;
let yMax = 5;

function setup() {
  createCanvas(600, 600);
}

function draw() {
  background(220);
  translate(width/2, height/2);
  scale(width/(xMax-xMin), -height/(yMax-yMin));
  
  // Draw axes
  stroke(0);
  line(xMin, 0, xMax, 0);
  line(0, yMin, 0, yMax);
  
  // Plot function
  noFill();
  stroke(0, 0, 255);
  beginShape();
  for(let x = xMin; x <= xMax; x += 0.1) {
    // Change this function to plot different equations
    let y = x * x;  // Example: y = x²
    vertex(x, y);
  }
  endShape();
}`,
  },
  {
    title: "Sierpinski Triangle",
    code: `let points = [];

function setup() {
  createCanvas(600, 600);
  background(220);
  
  // Define triangle vertices
  points[0] = createVector(width/2, 50);
  points[1] = createVector(50, height-50);
  points[2] = createVector(width-50, height-50);
  
  // Start with a random point
  let x = random(width);
  let y = random(height);
  
  for(let i = 0; i < 20000; i++) {
    stroke(0);
    strokeWeight(1);
    point(x, y);
    
    // Choose random vertex
    let r = floor(random(3));
    x = (x + points[r].x) / 2;
    y = (y + points[r].y) / 2;
  }
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
    <div className="p-4">
      <div className="flex items-center gap-2 mb-6">
        <Link
          href="/tools"
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-2xl font-bold">Creative Coding Playground</h1>
      </div>

      <div className="flex gap-4">
        <div className="w-64 bg-gray-100 p-4 rounded-lg">
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

        <div className="flex-1">
          <Script
            src="//toolness.github.io/p5.js-widget/p5-widget.js"
            strategy="afterInteractive"
            onLoad={() => setScriptLoaded(true)}
          />
          <div ref={containerRef} className="p5-widget" />
        </div>
      </div>
    </div>
  );
}
