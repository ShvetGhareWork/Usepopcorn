"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  maxRating?: number
  color?: string
  size?: number
  className?: string
  messages?: string[]
  defaultRating?: number
  onSetRating?: (rating: number) => void
}

export function StarRating({
  maxRating = 5,
  color = "#fbbf24",
  size = 24,
  className = "",
  messages = [],
  defaultRating = 0,
  onSetRating,
}: StarRatingProps) {
  const [rating, setRating] = useState(defaultRating)
  const [tempRating, setTempRating] = useState(0)

  function handleRating(rating: number) {
    setRating(rating)
    if (onSetRating) onSetRating(rating)
  }

  const textStyle = {
    lineHeight: "1",
    margin: "0",
    color,
    fontSize: `${size / 1.5}px`,
  }

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className="flex">
        {Array.from({ length: maxRating }, (_, i) => (
          <Star
            key={i}
            size={size}
            className={cn(
              "cursor-pointer transition-all",
              (tempRating || rating) >= i + 1 ? "fill-current text-amber-400" : "text-slate-500",
            )}
            onClick={() => handleRating(i + 1)}
            onMouseEnter={() => setTempRating(i + 1)}
            onMouseLeave={() => setTempRating(0)}
          />
        ))}
      </div>
      {messages.length > 0 && (tempRating || rating) > 0 && (
        <p style={textStyle}>
          {messages.length === maxRating ? messages[(tempRating || rating) - 1] : tempRating || rating}
        </p>
      )}
    </div>
  )
}

