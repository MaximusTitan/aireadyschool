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
    <div className="max-w-5xl mx-auto ml-[30px] mt-[12px] p-6">
  <h1 className="text-3xl font-bold mb-6 text-gray-800 mb-9">
    Educational Games
  </h1>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
    {games.map((game) => (
      <div
        key={game.id}
        className="border border-gray-200 rounded-lg p-7 hover:border-gray-400 
                 transition-all duration-300 bg-white hover:shadow-sm max-w-[600px]"
      >
        <h2 className="text-xl font-semibold mb-2 text-gray-700">
          {game.title}
        </h2>
        <p className="text-gray-600 mb-4 text-xs">
          {game.description}
        </p>
        <Link
          href={`/games/${game.id}`}
          className="inline-block bg-gray-100 text-gray-700 px-4 py-2 rounded-md 
                   hover:bg-gray-200 transition-colors duration-300 text-xs font-medium"
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
