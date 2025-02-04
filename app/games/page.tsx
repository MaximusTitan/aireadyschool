"use client";
import { useState } from "react";
import Link from "next/link";

const GamesPage = () => {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  const games = [
    {
      id: "math",
      title: "Math Game",
      description: "Practice your math skills",
    },
    { id: "memory", title: "Memory Game", description: "Test your memory" },
    {
      id: "typing",
      title: "Typing Game",
      description: "Improve your typing speed",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8 text-gray-800">
        Educational Games
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map((game) => (
          <div
            key={game.id}
            className="border border-gray-200 rounded-lg p-6 hover:border-gray-400 
                     transition-all duration-300 bg-white hover:shadow-sm"
          >
            <h2 className="text-2xl font-semibold mb-3 text-gray-700">
              {game.title}
            </h2>
            <p className="text-gray-600 mb-6 text-sm">{game.description}</p>
            <Link
              href={`/games/${game.id}`}
              className="inline-block bg-gray-100 text-gray-700 px-6 py-2.5 rounded-md 
                       hover:bg-gray-200 transition-colors duration-300 text-sm font-medium"
            >
              Play Now
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GamesPage;
