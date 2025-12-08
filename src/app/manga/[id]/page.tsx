"use client";

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Share2,
  Eye,
  Calendar,
  User,
  Palette,
  Coins,
  Lock,
  Crown,
} from "lucide-react";
import { Manga, Chapter } from "@/types/manga";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import BookmarkButton from "@/components/BookmarkButton";
import RatingComponent from "@/components/RatingComponent";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import Loading from "@/components/Loading";

// Fetch manga from Firebase
const getMangaById = async (id: string): Promise<Manga | null> => {
  try {
    const mangaDoc = await getDoc(doc(db, "mangas", id));

    if (!mangaDoc.exists()) {
      return null;
    }

    const data = mangaDoc.data();

    return {
      id: mangaDoc.id,
      title: data.title,
      alternativeTitles: data.alternativeTitles || [],
      description: data.description,
      coverImage: data.coverImage,
      bannerImage: data.bannerImage,
      author: data.author,
      artist: data.artist,
      status: data.status,
      genres: data.genres,
      rating: data.rating || 0,
      views: data.views || 0,
      chapters: data.chapters || [],
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Manga;
  } catch (error) {
    console.error("Error fetching manga:", error);
    return null;
  }
};

export default function MangaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { t } = useLanguage();
  const { user, hasMembership, loading: authLoading } = useAuth();
  const [manga, setManga] = useState<Manga | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [views, setViews] = useState(0);
  const [viewCounted, setViewCounted] = useState(false);

  useEffect(() => {
    const fetchManga = async () => {
      const { id } = await params;
      const mangaData = await getMangaById(id);
      setManga(mangaData);
      setViews(mangaData?.views || 0);
      setLoading(false);
    };
    fetchManga();
  }, [params]);

  // Separate effect for view counting - runs once after auth is loaded
  useEffect(() => {
    if (authLoading || !manga || viewCounted) return;

    const incrementView = async () => {
      try {
        console.log("Calling view API with userId:", user?.uid);
        const response = await fetch(`/api/manga/${manga.id}/view`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user?.uid || null,
          }),
        });
        const data = await response.json();
        console.log("View API response:", data);
        if (data.success) {
          setViews(data.views);
        }
        setViewCounted(true);
      } catch (error) {
        console.error("Error updating view count:", error);
      }
    };

    incrementView();
  }, [manga, user, authLoading, viewCounted]);

  const canAccessChapter = (chapter: Chapter) => {
    // Free chapters are accessible to everyone
    if (chapter.isFree) return true;

    // Members can access all non-free chapters
    if (hasMembership) return true;

    // Check if user has purchased this chapter
    if (user?.purchasedChapters?.includes(chapter.id)) return true;

    return false;
  };

  const handlePurchaseChapter = async (
    chapterId: string,
    coinPrice: number
  ) => {
    if (!user) {
      alert("Please sign in to purchase chapters");
      return;
    }

    if ((user.coins || 0) < coinPrice) {
      alert(
        `Insufficient coins. You need ${coinPrice} coins but have ${
          user.coins || 0
        }. Please contact admin to buy coins.`
      );
      return;
    }

    if (!confirm(`Purchase this chapter for ${coinPrice} coins?`)) {
      return;
    }

    setPurchasing(chapterId);
    try {
      const userRef = doc(db, "users", user.uid);
      const newCoins = (user.coins || 0) - coinPrice;
      const purchasedChapters = [...(user.purchasedChapters || []), chapterId];

      await updateDoc(userRef, {
        coins: newCoins,
        purchasedChapters: purchasedChapters,
        updatedAt: new Date(),
      });

      // Update local user state
      window.location.reload(); // Refresh to update user data
    } catch (error) {
      console.error("Error purchasing chapter:", error);
      alert("Failed to purchase chapter. Please try again.");
    } finally {
      setPurchasing(null);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!manga) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-black pt-16">
      {/* Banner Section */}
      <div className="relative h-[400px] overflow-hidden">
        <Image
          src={manga.bannerImage || manga.coverImage}
          alt={manga.title}
          fill
          unoptimized
          className="object-cover opacity-30"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/70 to-transparent" />
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-48 sm:-mt-64 relative z-10">
        <div className="flex flex-col md:flex-row gap-6 sm:gap-8">
          {/* Cover Image */}
          <div className="shrink-0 mx-auto md:mx-0">
            <div className="relative w-48 sm:w-56 md:w-64 aspect-2/3 rounded-lg overflow-hidden shadow-2xl">
              <Image
                src={manga.coverImage}
                alt={manga.title}
                fill
                unoptimized
                className="object-cover"
              />
            </div>
          </div>

          {/* Info Section */}
          <div className="flex-1 text-white">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
              {manga.title}
            </h1>
            {manga.alternativeTitles && manga.alternativeTitles.length > 0 && (
              <p className="text-sm sm:text-base text-zinc-400 mb-4">
                {manga.alternativeTitles.join(", ")}
              </p>
            )}

            {/* Stats */}
            <div className="flex flex-wrap gap-4 sm:gap-6 mb-4 sm:mb-6 text-sm sm:text-base">
              <RatingComponent
                mangaId={manga.id}
                initialRating={manga.rating || 0}
                initialCount={
                  (manga as { ratingCount?: number }).ratingCount || 0
                }
              />
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-green-500" />
                <span>
                  {views >= 1000000
                    ? `${(views / 1000000).toFixed(2)}M`
                    : views >= 1000
                    ? `${(views / 1000).toFixed(1)}K`
                    : views}{" "}
                  views
                </span>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  manga.status === "ongoing"
                    ? "bg-green-500/20 text-green-500"
                    : manga.status === "completed"
                    ? "bg-green-500/20 text-green-500"
                    : "bg-yellow-500/20 text-yellow-500"
                }`}
              >
                {manga.status.toUpperCase()}
              </div>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2 mb-6">
              {manga.genres.map((genre) => (
                <span
                  key={genre}
                  className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-full text-sm transition cursor-pointer"
                >
                  {genre}
                </span>
              ))}
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-zinc-400" />
                <span className="text-zinc-400">{t("author")}:</span>
                <span>{manga.author}</span>
              </div>
              {manga.artist && (
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-zinc-400" />
                  <span className="text-zinc-400">{t("artist")}:</span>
                  <span>{manga.artist}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
              {manga.chapters && manga.chapters.length > 0 ? (
                <Link
                  href={`/read/${manga.id}/${manga.chapters[0].id}`}
                  className="px-6 sm:px-8 py-2.5 sm:py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition text-center text-sm sm:text-base"
                >
                  {t("readNow")}
                </Link>
              ) : (
                <button
                  disabled
                  className="px-6 sm:px-8 py-2.5 sm:py-3 bg-zinc-700 text-zinc-400 rounded-lg font-semibold text-center text-sm sm:text-base cursor-not-allowed"
                >
                  {t("noChaptersAvailable")}
                </button>
              )}
              <BookmarkButton mangaId={manga.id} />
              <button className="px-4 sm:px-6 py-2.5 sm:py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg flex items-center justify-center gap-2 transition text-sm sm:text-base">
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                {t("share")}
              </button>
            </div>

            {/* Description */}
            <div className="bg-zinc-900 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">{t("synopsis")}</h2>
              <p className="text-zinc-300 leading-relaxed">
                {manga.description}
              </p>
            </div>
          </div>
        </div>

        {/* Chapters List */}
        <div className="mt-8 sm:mt-12 bg-zinc-900 rounded-lg p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">
            {t("chapters")}
          </h2>
          <div className="grid gap-2">
            {manga.chapters.map((chapter) => {
              const isAccessible = canAccessChapter(chapter);
              const needsPurchase =
                !chapter.isFree &&
                !hasMembership &&
                !user?.purchasedChapters?.includes(chapter.id);
              const coinPrice = chapter.coinPrice || 0;

              return (
                <div
                  key={chapter.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-zinc-800 rounded-lg gap-2 sm:gap-0"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 flex-1">
                    <span className="text-green-500 font-semibold text-sm sm:text-base">
                      {t("chapter")} {chapter.chapterNumber}
                    </span>
                    <span className="text-white text-sm sm:text-base line-clamp-1">
                      {chapter.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm text-zinc-400">
                    <div className="flex items-center gap-2">
                      {chapter.pagesEN && chapter.pagesEN.length > 0 && (
                        <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs font-semibold">
                          EN
                        </span>
                      )}
                      {chapter.pagesMM && chapter.pagesMM.length > 0 && (
                        <span className="px-2 py-1 bg-purple-600/20 text-purple-400 rounded text-xs font-semibold">
                          MM
                        </span>
                      )}
                      {chapter.isFree && (
                        <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs font-semibold">
                          FREE
                        </span>
                      )}
                      {needsPurchase && coinPrice > 0 && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-yellow-600/20 text-yellow-400 rounded text-xs font-semibold">
                          <Coins className="w-3 h-3" />
                          {coinPrice}
                        </span>
                      )}
                      {!isAccessible && coinPrice === 0 && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-purple-600/20 text-purple-400 rounded text-xs font-semibold">
                          <Crown className="w-3 h-3" />
                          Member Only
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {chapter.publishedAt
                          ? (() => {
                              const date = chapter.publishedAt;
                              // Handle Firebase Timestamp
                              if (
                                typeof date === "object" &&
                                date !== null &&
                                "seconds" in date
                              ) {
                                return new Date(
                                  (date as { seconds: number }).seconds * 1000
                                ).toLocaleDateString();
                              }
                              // Handle regular Date or date string
                              return new Date(date).toLocaleDateString();
                            })()
                          : "Not set"}
                      </span>
                    </div>

                    {/* Action Button */}
                    <div>
                      {isAccessible ? (
                        <Link
                          href={`/read/${manga.id}/${chapter.id}`}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold transition"
                        >
                          Read
                        </Link>
                      ) : needsPurchase && coinPrice > 0 ? (
                        <button
                          onClick={() =>
                            handlePurchaseChapter(chapter.id, coinPrice)
                          }
                          disabled={purchasing === chapter.id}
                          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-zinc-700 text-white rounded text-xs font-semibold transition flex items-center gap-1"
                        >
                          {purchasing === chapter.id ? (
                            "Purchasing..."
                          ) : (
                            <>
                              <Coins className="w-3 h-3" />
                              Buy {coinPrice}
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          disabled
                          className="px-4 py-2 bg-zinc-700 text-zinc-400 rounded text-xs font-semibold cursor-not-allowed flex items-center gap-1"
                        >
                          <Lock className="w-3 h-3" />
                          Locked
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
