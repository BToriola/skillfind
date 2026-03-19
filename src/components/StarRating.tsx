"use client";
import { useState } from "react";

interface StarRatingProps {
  rating: number;
  onRate?: (r: number) => void;
  readonly?: boolean;
}

export default function StarRating({ rating, onRate, readonly = false }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onRate?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={`text-xl transition ${readonly ? "cursor-default" : "cursor-pointer"} ${
            star <= (hovered || rating) ? "text-yellow-400" : "text-gray-200"
          } bg-transparent border-none p-0`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
