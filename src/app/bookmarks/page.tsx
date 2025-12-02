"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, arrayRemove } from "firebase/firestore";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import Loading from "@/components/Loading";
import { Bookmark, Trash2 } from "lucide-react";

interface Manga {
  id: string;
  title: string;
  author: string;
  description: string;
  coverImage: string;
  genres: string[];
  status: string;
}

export default function BookmarksPage() {
  const { user, loading } = useAuth();
  const [bookmarkedMangas, setBookmarkedMangas] = useState<Manga[]>([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(true);

  useEffect(() => {
    const fetchBookmarks = async () => {
      if (!user?.uid) {
        setLoadingBookmarks(false);
        return;
      }

      try {
        // Get user's bookmarks
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const bookmarkIds = userDoc.data()?.bookmarks || [];

        if (bookmarkIds.length === 0) {
          setLoadingBookmarks(false);
          return;
        }

        // Fetch all bookmarked manga details
        const mangaPromises = bookmarkIds.map(async (mangaId: string) => {
          if (!mangaId) return null;
          try {
            const mangaDoc = await getDoc(doc(db, "mangas", mangaId));
            if (mangaDoc.exists()) {
              return { id: mangaDoc.id, ...mangaDoc.data() } as Manga;
            }
          } catch (error) {
            console.error(`Error fetching manga ${mangaId}:`, error);
          }
          return null;
        });

        const mangas = await Promise.all(mangaPromises);
        setBookmarkedMangas(mangas.filter((m) => m !== null) as Manga[]);
      } catch (error) {
        console.error("Error fetching bookmarks:", error);
      } finally {
        setLoadingBookmarks(false);
      }
    };

    if (!loading) {
      fetchBookmarks();
    }
  }, [user, loading]);

  const removeBookmark = async (mangaId: string) => {
    if (!user) return;

    try {
      await updateDoc(doc(db, "users", user.uid), {
        bookmarks: arrayRemove(mangaId),
      });
      setBookmarkedMangas((prev) => prev.filter((m) => m.id !== mangaId));
    } catch (error) {
      console.error("Error removing bookmark:", error);
    }
  };

  if (loading || loadingBookmarks) {
    return <Loading />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white pt-16 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please Log In</h1>
          <p className="text-zinc-400 mb-6">
            You need to be logged in to view your bookmarks
          </p>
          <Link
            href="/login"
            className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition"
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-16">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <Bookmark className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
              My Bookmarks
            </h1>
          </div>
          <p className="text-sm sm:text-base text-zinc-400">
            {bookmarkedMangas.length > 0
              ? `You have ${bookmarkedMangas.length} bookmarked manga`
              : "You haven't bookmarked any manga yet"}
          </p>
        </div>

        {/* Bookmarked Manga Grid */}
        {bookmarkedMangas.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {bookmarkedMangas.map((manga) => (
              <div key={manga.id} className="group relative">
                <Link href={`/manga/${manga.id}`}>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden hover:border-green-600 transition">
                    <div className="aspect-2/3 relative bg-zinc-800">
                      {manga.coverImage ? (
                        <Image
                          src={manga.coverImage}
                          alt={manga.title}
                          fill
                          className="object-cover group-hover:scale-105 transition"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600">
                          No Cover
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-sm mb-1 line-clamp-2 group-hover:text-green-500 transition">
                        {manga.title}
                      </h3>
                      <p className="text-xs text-zinc-400 mb-2">
                        {manga.author}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {manga.genres.slice(0, 2).map((genre) => (
                          <span
                            key={genre}
                            className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded"
                          >
                            {genre}
                          </span>
                        ))}
                        {manga.genres.length > 2 && (
                          <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-xs rounded">
                            +{manga.genres.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Remove Bookmark Button */}
                <button
                  onClick={() => removeBookmark(manga.id)}
                  className="absolute top-2 right-2 p-2 bg-red-600/90 hover:bg-red-700 rounded-lg transition opacity-0 group-hover:opacity-100"
                  aria-label="Remove bookmark"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-zinc-900 border border-zinc-800 rounded-lg">
            <Bookmark className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400 text-lg mb-2">No bookmarks yet</p>
            <p className="text-zinc-500 text-sm mb-6">
              Start exploring manga and bookmark your favorites!
            </p>
            <Link
              href="/browse"
              className="inline-block px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition"
            >
              Browse Manga
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
