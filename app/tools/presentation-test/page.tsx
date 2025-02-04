"use client";
import React, { useState } from "react";
import pptxgen from "pptxgenjs";

interface Slide {
  title: string;
  content: string[];
}

export default function PresentationTest() {
  const [topic, setTopic] = useState("");
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSlides, setEditedSlides] = useState<Slide[]>([]);

  const generatePresentation = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/presentation-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });
      const data = await response.json();
      const parsedSlides = JSON.parse(data.answer);
      setSlides(parsedSlides);
      setEditedSlides(parsedSlides);
    } catch (error) {
      console.error("Error generating presentation:", error);
    }
    setLoading(false);
  };

  const handleTitleEdit = (newTitle: string) => {
    const newSlides = [...editedSlides];
    newSlides[currentSlide] = {
      ...newSlides[currentSlide],
      title: newTitle,
    };
    setEditedSlides(newSlides);
  };

  const handleContentEdit = (index: number, newContent: string) => {
    const newSlides = [...editedSlides];
    newSlides[currentSlide].content[index] = newContent;
    setEditedSlides(newSlides);
  };

  const addBulletPoint = () => {
    const newSlides = [...editedSlides];
    newSlides[currentSlide].content.push("New point");
    setEditedSlides(newSlides);
  };

  const removeBulletPoint = (index: number) => {
    const newSlides = [...editedSlides];
    newSlides[currentSlide].content.splice(index, 1);
    setEditedSlides(newSlides);
  };

  const downloadPresentation = () => {
    const content = slides
      .map((slide) => `# ${slide.title}\n\n${slide.content.join("\n")}`)
      .join("\n\n---\n\n");

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "presentation.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadPowerPoint = async () => {
    const pptx = new pptxgen();

    editedSlides.forEach((slide) => {
      const pptSlide = pptx.addSlide();

      // Add title
      pptSlide.addText(slide.title, {
        x: 0.5,
        y: 0.5,
        w: "90%",
        fontSize: 24,
        bold: true,
        color: "363636",
      });

      // Add content
      slide.content.forEach((point, idx) => {
        pptSlide.addText(point, {
          x: 0.7,
          y: 1.5 + idx * 0.5,
          w: "85%",
          fontSize: 18,
          bullet: true,
          color: "666666",
        });
      });
    });

    await pptx.writeFile({ fileName: "presentation.pptx" });
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
          AI Presentation Generator
        </h1>

        <div className="mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Enter presentation topic"
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={generatePresentation}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate"}
            </button>
          </div>
        </div>

        {slides.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                {isEditing ? "Done Editing" : "Edit Slides"}
              </button>
            </div>

            <div className="mb-6 min-h-[300px]">
              {isEditing ? (
                <>
                  <input
                    type="text"
                    value={editedSlides[currentSlide].title}
                    onChange={(e) => handleTitleEdit(e.target.value)}
                    className="text-2xl font-bold mb-4 w-full p-2 border rounded"
                  />
                  <ul className="space-y-3">
                    {editedSlides[currentSlide].content.map((point, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={point}
                          onChange={(e) => handleContentEdit(i, e.target.value)}
                          className="flex-1 p-2 border rounded"
                        />
                        <button
                          onClick={() => removeBulletPoint(i)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                    <button
                      onClick={addBulletPoint}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      + Add Bullet Point
                    </button>
                  </ul>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">
                    {editedSlides[currentSlide].title}
                  </h2>
                  <ul className="space-y-3 pl-6">
                    {editedSlides[currentSlide].content.map((point, i) => (
                      <li key={i} className="text-gray-700 text-lg list-disc">
                        {point}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <button
                onClick={() => setCurrentSlide((prev) => Math.max(0, prev - 1))}
                disabled={currentSlide === 0}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                ← Previous
              </button>
              <button
                onClick={downloadPowerPoint}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Download PPT
              </button>
              <button
                onClick={() =>
                  setCurrentSlide((prev) =>
                    Math.min(slides.length - 1, prev + 1)
                  )
                }
                disabled={currentSlide === slides.length - 1}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
