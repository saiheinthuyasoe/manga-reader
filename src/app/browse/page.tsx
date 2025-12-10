"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, RotateCcw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Loading from "@/components/Loading";
import Pagination from "@/components/Pagination";
import { useSearchParams } from "next/navigation";

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
  type: string[];
  genres: string[];
  status: string;
  chapters?: Chapter[];
}

function BrowseContent() {
  const { loading } = useAuth();
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [filteredMangas, setFilteredMangas] = useState<Manga[]>([]);
  const [loadingMangas, setLoadingMangas] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Get all unique genres from mangas
  const allGenres = [
    "All",
    ...new Set(mangas.flatMap((manga) => manga.genres)),
  ];

  // Get all unique types from mangas, splitting comma-separated values
  const allTypes = [
    "All",
    ...Array.from(
      new Set(
        mangas
          .flatMap((manga) =>
            (manga.type || []).flatMap((t) =>
              typeof t === "string" ? t.split(",").map((s) => s.trim()) : []
            )
          )
          .filter((t) => t)
      )
    ),
  ];

  // Set search query from URL parameter
  useEffect(() => {
    const searchFromUrl = searchParams.get("search");
    if (searchFromUrl) {
      setSearchQuery(searchFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchMangas = async () => {
      try {
        const mangasSnapshot = await getDocs(collection(db, "mangas"));
        const mangasList = mangasSnapshot.docs.map((doc) => {
          const data = doc.data();
          // Chapters are stored as an array in the manga document
          const allChapters = (data.chapters || []) as Chapter[];
          // Get the latest 3 chapters sorted by chapter number
          const latestChapters = allChapters
            .sort((a, b) => b.chapterNumber - a.chapterNumber)
            .slice(0, 3);

          console.log(`Manga ${doc.id} chapters:`, latestChapters);

          return {
            id: doc.id,
            ...data,
            chapters: latestChapters,
          };
        }) as Manga[];
        console.log("Fetched mangas with chapters:", mangasList);
        setMangas(mangasList);
        setFilteredMangas(mangasList);
      } catch (error) {
        console.error("Error fetching mangas:", error);
      } finally {
        setLoadingMangas(false);
      }
    };

    fetchMangas();
  }, []);

  // Filter mangas based on search, genre, and status
  useEffect(() => {
    let filtered = mangas;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (manga) =>
          manga.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          manga.author.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by genre
    if (selectedGenre !== "All") {
      filtered = filtered.filter((manga) =>
        manga.genres.includes(selectedGenre)
      );
    }

    // Filter by status (case-insensitive, trimmed)
    if (selectedStatus !== "All") {
      const normalizedSelectedStatus = selectedStatus.toLowerCase().trim();
      filtered = filtered.filter(
        (manga) =>
          (manga.status || "").toLowerCase().trim() === normalizedSelectedStatus
      );
    }

    // Filter by type
    if (selectedType !== "All") {
      filtered = filtered.filter((manga) => manga.type?.includes(selectedType));
    }

    setFilteredMangas(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchQuery, selectedGenre, selectedStatus, selectedType, mangas]);

  if (loading || loadingMangas) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-black text-white pt-16">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
            {t("browseManga")}
          </h1>
          <p className="text-sm sm:text-base text-zinc-400">
            {t("exploreCollection")} {mangas.length} {t("mangaTitles")}
          </p>
        </div>

        {/* Filters */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1">
              {/* Search */}
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">
                  {t("search")}
                </label>
                <input
                  type="text"
                  placeholder={t("searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
                />
              </div>

              {/* Type Filter */}
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">
                  {t("type")}
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
                  aria-label="Filter by type"
                >
                  {allTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Genre Filter */}
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">
                  {t("genre")}
                </label>
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
                  aria-label="Filter by genre"
                >
                  {allGenres.map((genre) => (
                    <option key={genre} value={genre}>
                      {genre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="text-sm text-zinc-400 mb-2 block">
                  {t("status")}
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
                  aria-label="Filter by status"
                >
                  <option value="All">{t("all")}</option>
                  <option value="Ongoing">{t("ongoing")}</option>
                  <option value="Completed">{t("completed")}</option>
                </select>
              </div>
            </div>
            {/* Reset Filters Button */}
            <button
              type="button"
              className="flex items-center justify-center px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-zinc-300 text-sm font-medium transition mt-4 md:mt-6"
              onClick={() => {
                setSearchQuery("");
                setSelectedGenre("All");
                setSelectedStatus("All");
                setSelectedType("All");
              }}
              aria-label="Reset filters"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          {/* Active Filters Info */}
          {(searchQuery ||
            selectedGenre !== "All" ||
            selectedStatus !== "All" ||
            selectedType !== "All") && (
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <p className="text-sm text-zinc-400">
                {t("showing")} {filteredMangas.length} {t("of")} {mangas.length}{" "}
                {t("manga")}
              </p>
            </div>
          )}
        </div>

        {/* Manga Grid */}
        {filteredMangas.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredMangas
                .slice(
                  (currentPage - 1) * itemsPerPage,
                  currentPage * itemsPerPage
                )
                .map((manga) => (
                  <div
                    key={manga.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden hover:border-green-600 transition flex h-52 group"
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
                  </div>
                ))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredMangas.length / itemsPerPage)}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredMangas.length}
            />
          </>
        ) : (
          <div className="text-center py-16">
            <p className="text-zinc-400 text-lg">{t("noMangaFound")}</p>
            <p className="text-zinc-500 text-sm mt-2">
              {t("tryAdjustingFilters")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<Loading />}>
      <BrowseContent />
    </Suspense>
  );
}
