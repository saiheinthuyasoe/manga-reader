"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, arrayRemove } from "firebase/firestore";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import Loading from "@/components/Loading";
import Pagination from "@/components/Pagination";
import { Bookmark, Trash2, BookOpen } from "lucide-react";

interface Chapter {
  id: string;
  chapterNumber: number;
  title: string;
  language: string;
  pagesEN?: string[];
  pagesMM?: string[];
}

interface Manga {
  id: string;
  title: string;
  author: string;
  description: string;
  coverImage: string;
  genres: string[];
  status: string;
  chapters?: Chapter[];
}

export default function BookmarksPage() {
  const { user, loading } = useAuth();
  const [bookmarkedMangas, setBookmarkedMangas] = useState<Manga[]>([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

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
              const data = mangaDoc.data();
              // Get the latest 3 chapters sorted by chapter number
              const allChapters = (data.chapters || []) as Chapter[];
              const latestChapters = allChapters
                .sort((a, b) => b.chapterNumber - a.chapterNumber)
                .slice(0, 3);

              return {
                id: mangaDoc.id,
                ...data,
                chapters: latestChapters,
              } as Manga;
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
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {bookmarkedMangas
                .slice(
                  (currentPage - 1) * itemsPerPage,
                  currentPage * itemsPerPage
                )
                .map((manga) => (
                  <div
                    key={manga.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden hover:border-green-600 transition flex h-52 group relative"
                  >
                    {/* Cover Image - Clickable to manga detail */}
                    <Link
                      href={`/manga/${manga.id}`}
                      className="w-36 shrink-0 relative bg-zinc-800"
                    >
                      {manga.coverImage ? (
                        <>
                          <Image
                            src={manga.coverImage}
                            alt={manga.title}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-zinc-800 animate-pulse -z-10" />
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">
                          No Cover
                        </div>
                      )}
                      {/* Language badges */}
                      <div className="absolute top-2 left-2 flex gap-1">
                        {(() => {
                          const hasEN = manga.chapters?.some(
                            (ch) => ch.pagesEN && ch.pagesEN.length > 0
                          );
                          const hasMM = manga.chapters?.some(
                            (ch) => ch.pagesMM && ch.pagesMM.length > 0
                          );

                          if (hasEN && hasMM) {
                            return (
                              <span className="bg-green-600 text-white text-xs px-2 py-1 rounded font-semibold">
                                EN/MM
                              </span>
                            );
                          } else if (hasEN) {
                            return (
                              <span className="bg-green-600 text-white text-xs px-2 py-1 rounded font-semibold">
                                EN
                              </span>
                            );
                          } else if (hasMM) {
                            return (
                              <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded font-semibold">
                                MM
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </Link>

                    {/* Info Section */}
                    <div className="flex-1 p-5 flex flex-col">
                      {/* Title and genres - Clickable to manga detail */}
                      <div className="mb-4">
                        <Link href={`/manga/${manga.id}`}>
                          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-green-500 transition cursor-pointer">
                            {manga.title}
                          </h3>
                        </Link>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {manga.genres.slice(0, 3).map((genre) => (
                            <span key={genre} className="text-sm text-zinc-400">
                              {genre}
                              {manga.genres.indexOf(genre) <
                                Math.min(2, manga.genres.length - 1) && ", "}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Chapters List */}
                      <div className="mt-auto space-y-2.5">
                        {manga.chapters && manga.chapters.length > 0 ? (
                          manga.chapters.map((chapter) => {
                            const hasEN =
                              chapter.pagesEN && chapter.pagesEN.length > 0;
                            const hasMM =
                              chapter.pagesMM && chapter.pagesMM.length > 0;
                            let langLabel = "";
                            if (hasEN && hasMM) langLabel = "[EN/MM]";
                            else if (hasEN) langLabel = "[EN]";
                            else if (hasMM) langLabel = "[MM]";

                            return (
                              <Link
                                key={chapter.id}
                                href={`/read/${manga.id}/${chapter.id}`}
                                className="flex items-center gap-2 text-sm hover:text-green-500 transition"
                              >
                                <BookOpen className="w-4 h-4 text-purple-500" />
                                <span className="text-purple-500">
                                  Chap {chapter.chapterNumber} {langLabel}
                                </span>
                              </Link>
                            );
                          })
                        ) : (
                          <p className="text-xs text-zinc-500">
                            No chapters available
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Remove Bookmark Button */}
                    <button
                      onClick={() => removeBookmark(manga.id)}
                      className="absolute top-2 right-2 p-2 bg-red-600/90 hover:bg-red-700 rounded-lg transition opacity-0 group-hover:opacity-100"
                      aria-label="Remove bookmark"
                      title="Remove from bookmarks"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(bookmarkedMangas.length / itemsPerPage)}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={bookmarkedMangas.length}
            />
          </>
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
