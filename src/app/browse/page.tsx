"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import Loading from "@/components/Loading";
import { useSearchParams } from "next/navigation";

interface Manga {
  id: string;
  title: string;
  author: string;
  description: string;
  coverImage: string;
  type: string[];
  genres: string[];
  status: string;
}

export default function BrowsePage() {
  const { user, loading } = useAuth();
  const searchParams = useSearchParams();
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [filteredMangas, setFilteredMangas] = useState<Manga[]>([]);
  const [loadingMangas, setLoadingMangas] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [selectedType, setSelectedType] = useState<string>("All");

  // Get all unique genres from mangas
  const allGenres = [
    "All",
    ...new Set(mangas.flatMap((manga) => manga.genres)),
  ];

  // Get all unique types from mangas
  const allTypes = [
    "All",
    ...new Set(mangas.flatMap((manga) => manga.type || [])),
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
        const mangasList = mangasSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Manga[];
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

    // Filter by status
    if (selectedStatus !== "All") {
      filtered = filtered.filter((manga) => manga.status === selectedStatus);
    }

    // Filter by type
    if (selectedType !== "All") {
      filtered = filtered.filter((manga) => manga.type?.includes(selectedType));
    }

    setFilteredMangas(filtered);
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
            Browse Manga
          </h1>
          <p className="text-sm sm:text-base text-zinc-400">
            Explore our collection of {mangas.length} manga titles
          </p>
        </div>

        {/* Filters */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="text-sm text-zinc-400 mb-2 block">Search</label>
              <input
                type="text"
                placeholder="Search by title or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
              />
            </div>

            {/* Type Filter */}
            <div>
              <label className="text-sm text-zinc-400 mb-2 block">Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
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
              <label className="text-sm text-zinc-400 mb-2 block">Genre</label>
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
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
              <label className="text-sm text-zinc-400 mb-2 block">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
              >
                <option value="All">All</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Active Filters Info */}
          {(searchQuery ||
            selectedGenre !== "All" ||
            selectedStatus !== "All" ||
            selectedType !== "All") && (
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <p className="text-sm text-zinc-400">
                Showing {filteredMangas.length} of {mangas.length} manga
              </p>
            </div>
          )}
        </div>

        {/* Manga Grid */}
        {filteredMangas.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredMangas.map((manga) => (
              <Link
                key={manga.id}
                href={`/manga/${manga.id}`}
                className="group"
              >
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden hover:border-green-600 transition">
                  <div className="aspect-[2/3] relative bg-zinc-800">
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
                    <p className="text-xs text-zinc-400 mb-2">{manga.author}</p>
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
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-zinc-400 text-lg">No manga found</p>
            <p className="text-zinc-500 text-sm mt-2">
              Try adjusting your filters or search query
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
