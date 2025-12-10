"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Home, Settings, Lock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Loading from "@/components/Loading";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Chapter } from "@/types/manga";

export default function ReadPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, hasMembership } = useAuth();
  const mangaId = params.mangaId as string;
  const chapterId = params.chapterId as string;
  const langFromUrl = searchParams.get("lang") as "EN" | "MM" | null;

  const [manga, setManga] = useState<{ id: string; title: string } | null>(
    null
  );
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [readingMode, setReadingMode] = useState<"single" | "double">("single");
  const [showSettings, setShowSettings] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<"EN" | "MM">("EN");
  const [availableLanguages, setAvailableLanguages] = useState<("EN" | "MM")[]>(
    []
  );
  const [imageFit, setImageFit] = useState<
    "width" | "height" | "original" | "custom"
  >("width");
  const [customZoom, setCustomZoom] = useState(100);
  const [scrollDirection, setScrollDirection] = useState<
    "horizontal" | "vertical"
  >("vertical");

  const settingsRef = useRef<HTMLDivElement>(null);

  // Click outside to close settings
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target as Node)
      ) {
        setShowSettings(false);
      }
    };

    if (showSettings) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSettings]);

  // Load settings from localStorage
  useEffect(() => {
    const savedImageFit = localStorage.getItem("imageFit");
    const savedZoom = localStorage.getItem("customZoom");
    const savedScrollDirection = localStorage.getItem("scrollDirection");

    if (savedImageFit) {
      setImageFit(savedImageFit as "width" | "height" | "original" | "custom");
    }
    if (savedZoom) {
      setCustomZoom(parseInt(savedZoom));
    }
    if (savedScrollDirection) {
      setScrollDirection(savedScrollDirection as "horizontal" | "vertical");
    }
  }, []);

  // Fetch manga data from Firebase
  useEffect(() => {
    const fetchMangaData = async () => {
      try {
        const mangaDoc = await getDoc(doc(db, "mangas", mangaId));

        if (!mangaDoc.exists()) {
          router.push("/404");
          return;
        }

        const data = mangaDoc.data();
        setManga({ id: mangaDoc.id, title: data.title });

        const allChapters = data.chapters || [];
        setChapters(allChapters);

        const currentChapter = allChapters.find(
          (ch: Chapter) => ch.id === chapterId
        );
        if (currentChapter) {
          setChapter(currentChapter);

          // Determine available languages
          const langs: ("EN" | "MM")[] = [];
          if (currentChapter.pagesEN && currentChapter.pagesEN.length > 0)
            langs.push("EN");
          if (currentChapter.pagesMM && currentChapter.pagesMM.length > 0)
            langs.push("MM");
          setAvailableLanguages(langs);

          // Set language from URL parameter if valid, otherwise use first available
          if (langFromUrl && langs.includes(langFromUrl)) {
            setSelectedLanguage(langFromUrl);
          } else if (langs.length > 0) {
            setSelectedLanguage(langs[0]);
          }
        } else {
          router.push(`/manga/${mangaId}`);
        }
      } catch (error) {
        console.error("Error fetching manga:", error);
        router.push("/404");
      } finally {
        setLoadingData(false);
      }
    };

    if (mangaId && chapterId) {
      fetchMangaData();
    }
  }, [mangaId, chapterId, router]);

  // Check membership access
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Get pages for selected language
  const currentPages = chapter
    ? selectedLanguage === "EN"
      ? chapter.pagesEN || []
      : chapter.pagesMM || []
    : [];

  const totalPages = currentPages.length;
  const currentChapterIndex = chapters.findIndex((c) => c.id === chapterId);

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    } else if (currentChapterIndex < chapters.length - 1) {
      // Go to next chapter
      router.push(`/read/${mangaId}/${chapters[currentChapterIndex + 1].id}`);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    } else if (currentChapterIndex > 0) {
      // Go to previous chapter
      router.push(`/read/${mangaId}/${chapters[currentChapterIndex - 1].id}`);
    }
  };

  const goToChapter = (newChapterId: string) => {
    router.push(`/read/${mangaId}/${newChapterId}`);
  };

  const handleImageFitChange = (
    fit: "width" | "height" | "original" | "custom"
  ) => {
    setImageFit(fit);
    localStorage.setItem("imageFit", fit);
  };

  const handleZoomChange = (zoom: number) => {
    setCustomZoom(zoom);
    localStorage.setItem("customZoom", zoom.toString());
  };

  const handleScrollDirectionChange = (
    direction: "horizontal" | "vertical"
  ) => {
    setScrollDirection(direction);
    localStorage.setItem("scrollDirection", direction);
  };

  if (loading || loadingData) {
    return <Loading />;
  }

  if (!user) {
    return null;
  }

  if (!manga || !chapter) {
    return <Loading />;
  }

  // Check if user can access this chapter
  const canAccessChapter =
    chapter.isFree || // Free chapters are accessible to everyone
    hasMembership || // Members can access all chapters
    user.purchasedChapters?.includes(chapterId); // User purchased with coins

  // Membership/Purchase required overlay
  if (!canAccessChapter) {
    const coinPrice = chapter.coinPrice || 0;

    return (
      <div className="min-h-screen bg-black text-white pt-16 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">
              {coinPrice > 0 ? "Chapter Locked" : "Membership Required"}
            </h1>
            <p className="text-zinc-400 mb-6">
              {coinPrice > 0
                ? `This chapter costs ${coinPrice} coins. Purchase it from the manga detail page to unlock.`
                : "You need an active membership to read this chapter. Please contact an administrator to upgrade your account."}
            </p>
            <div className="flex gap-4">
              <Link
                href={`/manga/${mangaId}`}
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
              >
                {coinPrice > 0 ? "Purchase Chapter" : "Back to Manga"}
              </Link>
              <Link
                href="/profile"
                className="flex-1 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-semibold transition"
              >
                View Profile
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <Link
                href={`/manga/${mangaId}`}
                className="p-1.5 sm:p-2 hover:bg-zinc-800 rounded-lg transition shrink-0"
              >
                <Home className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
              <div className="min-w-0">
                <h1 className="font-semibold text-sm sm:text-base truncate">
                  {manga.title}
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 truncate">
                  Ch. {chapter.chapterNumber}: {chapter.title}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1.5 sm:p-2 hover:bg-zinc-800 rounded-lg transition"
                aria-label="Settings"
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <select
                value={chapterId}
                onChange={(e) => goToChapter(e.target.value)}
                className="bg-zinc-800 text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-xs sm:text-sm"
                aria-label="Select chapter"
              >
                {chapters.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    Chapter {ch.chapterNumber}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div
          ref={settingsRef}
          className="fixed top-16 right-4 z-40 bg-zinc-900 border border-zinc-800 rounded-lg p-4 shadow-xl w-64"
        >
          <h3 className="font-semibold mb-4">Reading Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-zinc-400 mb-2 block">
                Language
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedLanguage("EN")}
                  disabled={!availableLanguages.includes("EN")}
                  className={`flex-1 px-4 py-2 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed ${
                    selectedLanguage === "EN"
                      ? "bg-blue-600"
                      : "bg-zinc-800 hover:bg-zinc-700"
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setSelectedLanguage("MM")}
                  disabled={!availableLanguages.includes("MM")}
                  className={`flex-1 px-4 py-2 rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed ${
                    selectedLanguage === "MM"
                      ? "bg-blue-600"
                      : "bg-zinc-800 hover:bg-zinc-700"
                  }`}
                >
                  Myanmar
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-2 block">
                Image Fit
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleImageFitChange("width")}
                  className={`px-3 py-2 rounded-lg transition text-xs ${
                    imageFit === "width"
                      ? "bg-green-600"
                      : "bg-zinc-800 hover:bg-zinc-700"
                  }`}
                >
                  Fit Width
                </button>
                <button
                  onClick={() => handleImageFitChange("height")}
                  className={`px-3 py-2 rounded-lg transition text-xs ${
                    imageFit === "height"
                      ? "bg-green-600"
                      : "bg-zinc-800 hover:bg-zinc-700"
                  }`}
                >
                  Fit Height
                </button>
                <button
                  onClick={() => handleImageFitChange("original")}
                  className={`px-3 py-2 rounded-lg transition text-xs ${
                    imageFit === "original"
                      ? "bg-green-600"
                      : "bg-zinc-800 hover:bg-zinc-700"
                  }`}
                >
                  Original
                </button>
                <button
                  onClick={() => handleImageFitChange("custom")}
                  className={`px-3 py-2 rounded-lg transition text-xs ${
                    imageFit === "custom"
                      ? "bg-green-600"
                      : "bg-zinc-800 hover:bg-zinc-700"
                  }`}
                >
                  Custom
                </button>
              </div>
              {imageFit === "custom" && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-zinc-400">Zoom</span>
                    <span className="text-xs text-white font-semibold">
                      {customZoom}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="300"
                    step="5"
                    value={customZoom}
                    onChange={(e) => handleZoomChange(Number(e.target.value))}
                    className="w-full accent-green-600"
                    aria-label="Zoom level"
                  />
                </div>
              )}
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-2 block">
                Scroll Direction
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => handleScrollDirectionChange("horizontal")}
                  className={`flex-1 px-4 py-2 rounded-lg transition ${
                    scrollDirection === "horizontal"
                      ? "bg-green-600"
                      : "bg-zinc-800 hover:bg-zinc-700"
                  }`}
                >
                  Horizontal
                </button>
                <button
                  onClick={() => handleScrollDirectionChange("vertical")}
                  className={`flex-1 px-4 py-2 rounded-lg transition ${
                    scrollDirection === "vertical"
                      ? "bg-green-600"
                      : "bg-zinc-800 hover:bg-zinc-700"
                  }`}
                >
                  Vertical
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reader Area */}
      {scrollDirection === "horizontal" ? (
        <div className="pt-20 pb-24">
          <div className="max-w-5xl mx-auto px-4">
            <div className="relative flex justify-center">
              {currentPages.length > 0 ? (
                <Image
                  src={currentPages[currentPage - 1]}
                  alt={`Page ${currentPage}`}
                  width={800}
                  height={1200}
                  className={`${
                    imageFit === "width"
                      ? "w-full h-auto"
                      : imageFit === "height"
                      ? "h-screen w-auto"
                      : imageFit === "original"
                      ? "max-w-full h-auto"
                      : "w-auto h-auto"
                  }`}
                  style={
                    imageFit === "custom"
                      ? { width: `${customZoom}%` }
                      : undefined
                  }
                  priority
                />
              ) : (
                <div className="w-full h-96 bg-zinc-800 rounded-lg flex items-center justify-center">
                  <p className="text-zinc-400">
                    No pages available for{" "}
                    {selectedLanguage === "EN" ? "English" : "Myanmar"}
                  </p>
                </div>
              )}
            </div>

            {/* Navigation Arrows on Image */}
            <button
              onClick={prevPage}
              disabled={currentPage === 1 && currentChapterIndex === 0}
              className="fixed left-4 top-1/2 -translate-y-1/2 p-3 bg-zinc-900/80 hover:bg-zinc-800 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={nextPage}
              disabled={
                currentPage === totalPages &&
                currentChapterIndex === chapters.length - 1
              }
              className="fixed right-4 top-1/2 -translate-y-1/2 p-3 bg-zinc-900/80 hover:bg-zinc-800 rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      ) : (
        <div className="pt-20 pb-8">
          <div className="max-w-5xl mx-auto px-4">
            <div className="flex flex-col items-center gap-0">
              {currentPages.length > 0 ? (
                currentPages.map((page, index) => (
                  <Image
                    key={index}
                    src={page}
                    alt={`Page ${index + 1}`}
                    width={800}
                    height={1200}
                    className={`${
                      imageFit === "width"
                        ? "w-full h-auto"
                        : imageFit === "height"
                        ? "h-screen w-auto"
                        : imageFit === "original"
                        ? "max-w-full h-auto"
                        : "w-auto h-auto"
                    }`}
                    style={
                      imageFit === "custom"
                        ? { width: `${customZoom}%` }
                        : undefined
                    }
                    priority={index === 0}
                  />
                ))
              ) : (
                <div className="w-full h-96 bg-zinc-800 rounded-lg flex items-center justify-center">
                  <p className="text-zinc-400">
                    No pages available for{" "}
                    {selectedLanguage === "EN" ? "English" : "Myanmar"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      {scrollDirection === "horizontal" && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900/95 backdrop-blur-sm border-t border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={prevPage}
                disabled={currentPage === 1 && currentChapterIndex === 0}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <div className="flex items-center gap-4">
                <span className="text-sm text-zinc-400">
                  Page {currentPage} of {totalPages}
                </span>
                <input
                  type="range"
                  min="1"
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => setCurrentPage(Number(e.target.value))}
                  className="w-48"
                  aria-label="Page slider"
                />
              </div>

              <button
                onClick={nextPage}
                disabled={
                  currentPage === totalPages &&
                  currentChapterIndex === chapters.length - 1
                }
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
