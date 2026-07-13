"use client";
import { useState } from "react";

import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  onRate?: (r: number) => void;
  readonly?: boolean;
  size?: number;
}

export default function StarRating({ rating, onRate, readonly = false, size }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onRate?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          className={`transition ${readonly ? "cursor-default" : "cursor-pointer"} bg-transparent border-none p-0`}
        >
          <Star
            size={size || (readonly ? 14 : 20)}
            className={`${
              star <= (hovered || rating)
                ? "text-yellow-400 fill-yellow-400"
                : "text-slate-200 fill-transparent"
            } transition-colors`}
          />
        </button>
      ))}
    </div>
  );
}
