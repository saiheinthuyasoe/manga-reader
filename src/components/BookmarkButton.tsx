"use client";

import { useState, useEffect } from "react";
import { BookmarkPlus, BookmarkCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  setDoc,
} from "firebase/firestore";
import { useRouter } from "next/navigation";

interface BookmarkButtonProps {
  mangaId: string;
}

export default function BookmarkButton({ mangaId }: BookmarkButtonProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log("BookmarkButton - Auth Loading:", authLoading);
    console.log("BookmarkButton - User:", user);
  }, [user, authLoading]);

  useEffect(() => {
    const checkBookmark = async () => {
      if (authLoading) return; // Wait for auth to finish loading

      if (!user?.uid) {
        setIsBookmarked(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const bookmarks = userDoc.data()?.bookmarks || [];
        setIsBookmarked(bookmarks.includes(mangaId));
      } catch (error) {
        console.error("Error checking bookmark:", error);
      }
    };

    checkBookmark();
  }, [user, mangaId, authLoading]);

  const toggleBookmark = async () => {
    // Don't do anything if still loading auth
    if (authLoading) {
      console.log("Auth still loading, please wait...");
      return;
    }

    if (!user?.uid) {
      console.log("No user found, redirecting to login");
      router.push("/login");
      return;
    }

    console.log("User found:", user.uid);
    setLoading(true);
    try {
      const userRef = doc(db, "users", user.uid);

      // Check if user document exists
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        console.log("Creating user document...");
        // Create user document if it doesn't exist
        await setDoc(userRef, {
          bookmarks: [mangaId],
          email: user.email,
          displayName: user.displayName,
          accountType: user.accountType || "free",
          role: user.role || "user",
          readingHistory: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        setIsBookmarked(true);
      } else {
        const currentBookmarks = userDoc.data()?.bookmarks || [];

        if (isBookmarked) {
          await updateDoc(userRef, {
            bookmarks: arrayRemove(mangaId),
          });
          setIsBookmarked(false);
        } else {
          await updateDoc(userRef, {
            bookmarks: arrayUnion(mangaId),
          });
          setIsBookmarked(true);
        }
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleBookmark}
      disabled={loading || authLoading}
      className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg flex items-center justify-center gap-2 transition text-sm sm:text-base ${
        isBookmarked
          ? "bg-green-600 hover:bg-green-700"
          : "bg-zinc-800 hover:bg-zinc-700"
      }`}
    >
      {isBookmarked ? (
        <BookmarkCheck className="w-4 h-4 sm:w-5 sm:h-5" />
      ) : (
        <BookmarkPlus className="w-4 h-4 sm:w-5 sm:h-5" />
      )}
      {authLoading ? "Loading..." : isBookmarked ? "Bookmarked" : "Bookmark"}
    </button>
  );
}
