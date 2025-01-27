import React from "react";
import { Star } from "lucide-react";

interface SkillRatingProps {
  name: string;
  rating: number;
  onRatingChange: (rating: number) => void;
  isLoading?: boolean;
}

export function SkillRating({
  name,
  rating,
  onRatingChange,
  isLoading = false,
}: SkillRatingProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-700">{name}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 cursor-pointer transition-colors ${
              isLoading
                ? "text-gray-200"
                : star <= rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
            }`}
            onClick={() => !isLoading && onRatingChange(star)}
          />
        ))}
      </div>
    </div>
  );
}
