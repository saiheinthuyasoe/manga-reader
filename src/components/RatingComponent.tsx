"use client";

import { Star } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface RatingComponentProps {
  mangaId: string;
  initialRating: number;
  initialCount: number;
}

export default function RatingComponent({
  mangaId,
  initialRating,
  initialCount,
}: RatingComponentProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(initialRating);
  const [ratingCount, setRatingCount] = useState(initialCount);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Fetch user's existing rating
    const fetchUserRating = async () => {
      if (!user) return;

      try {
        const response = await fetch(
          `/api/manga/${mangaId}/rating?userId=${user.uid}`
        );
        const data = await response.json();
        if (data.userRating) {
          setUserRating(data.userRating);
        }
        setRating(data.rating);
        setRatingCount(data.ratingCount);
      } catch (error) {
        console.error("Error fetching user rating:", error);
      }
    };

    fetchUserRating();
  }, [mangaId, user]);

  const handleRate = async (stars: number) => {
    if (!user) {
      alert("Please sign in to rate this manga");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/manga/${mangaId}/rating`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.uid,
          stars,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setRating(data.rating);
        setRatingCount(data.ratingCount);
        setUserRating(stars);
      } else {
        alert(data.error || "Failed to submit rating");
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
      alert("Failed to submit rating");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      {/* Display Rating */}
      <div className="flex items-center gap-2">
        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
        <span className="font-semibold">
          {rating.toFixed(2)} ({ratingCount}{" "}
          {ratingCount === 1 ? "rating" : "ratings"})
        </span>
      </div>

      {/* User Rating Input */}
      {user && (
        <div className="flex items-center gap-1 border-l border-zinc-700 pl-4">
          <span className="text-sm text-zinc-400 mr-2">
            {userRating ? "Your rating:" : "Rate:"}
          </span>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              title="rating"
              key={star}
              onClick={() => handleRate(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              disabled={isSubmitting}
              className="transition-transform hover:scale-110 disabled:opacity-50"
            >
              <Star
                className={`w-5 h-5 ${
                  star <= (hoverRating || userRating || 0)
                    ? "text-yellow-500 fill-yellow-500"
                    : "text-zinc-600"
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
