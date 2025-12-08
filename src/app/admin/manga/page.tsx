"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NextImage from "next/image";
import { BookOpen, PlusCircle, Edit, Trash2, Eye, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { deleteManga } from "@/lib/db";
import { Manga } from "@/types/manga";
import { db } from "@/lib/firebase";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import Pagination from "@/components/Pagination";

export default function ManageMangaPage() {
  const router = useRouter();
  const { user, isAdmin, isTranslator } = useAuth();
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [userMap, setUserMap] = useState<
    Record<string, { name: string; email: string }>
  >({});

  useEffect(() => {
    if (!user || (!isAdmin && !isTranslator)) {
      router.push("/");
      return;
    }

    // Set up real-time listener for mangas collection
    const mangasCollection = collection(db, "mangas");
    const unsubscribe = onSnapshot(mangasCollection, async (snapshot) => {
      const mangasData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Manga[];

      // Fetch users data if admin
      if (isAdmin) {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const users: Record<string, { name: string; email: string }> = {};
        usersSnapshot.forEach((doc) => {
          const userData = doc.data();
          users[doc.id] = {
            name: userData.name || userData.email || "Unknown",
            email: userData.email || "",
          };
        });
        setUserMap(users);
      }

      // Filter manga based on user role
      let filteredData = mangasData;
      if (isTranslator && !isAdmin && user) {
        // Translators can only see manga they created
        filteredData = mangasData.filter(
          (manga) => manga.createdBy === user.uid
        );
      }
      // Admins see all manga

      setMangas(filteredData);
      setLoading(false);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, [user, isAdmin, isTranslator, router]);

  const filteredMangas = useMemo(() => {
    if (searchQuery.trim() === "") {
      return mangas;
    }
    const query = searchQuery.toLowerCase();
    return mangas.filter(
      (manga) =>
        manga.title.toLowerCase().includes(query) ||
        manga.author.toLowerCase().includes(query) ||
        manga.genres.some((g) => g.toLowerCase().includes(query))
    );
  }, [searchQuery, mangas]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }

    try {
      await deleteManga(id);
      setMangas((prev) => prev.filter((m) => m.id !== id));
    } catch (error) {
      console.error("Failed to delete manga:", error);
      alert("Failed to delete manga");
    }
  };

  if (!user || (!isAdmin && !isTranslator)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-green-500" />
            <h1 className="text-3xl font-bold text-white">Manage Manga</h1>
          </div>
          <Link
            href="/admin/manga/add"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
          >
            <PlusCircle className="w-5 h-5" />
            Add New Manga
          </Link>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by title, author, or genre..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-zinc-900 text-white rounded-lg pl-12 pr-4 py-3 border border-zinc-800 focus:outline-none focus:border-green-500"
            />
          </div>
        </div>

        {/* Manga List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-zinc-400 mt-4">Loading manga...</p>
          </div>
        ) : filteredMangas.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-12 text-center">
            <BookOpen className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400 text-lg mb-2">
              {searchQuery ? "No manga found" : "No manga available"}
            </p>
            <p className="text-zinc-600 text-sm">
              {searchQuery
                ? "Try a different search term"
                : "Click 'Add New Manga' to get started"}
            </p>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Manga
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Author
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Chapters
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Views
                    </th>
                    {isAdmin && (
                      <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        Owner
                      </th>
                    )}
                    <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {filteredMangas
                    .slice(
                      (currentPage - 1) * itemsPerPage,
                      currentPage * itemsPerPage
                    )
                    .map((manga) => (
                      <tr
                        key={manga.id}
                        className="hover:bg-zinc-800/50 transition"
                      >
                        <td className="px-6 py-4">
                          <Link
                            href={`/manga/${manga.id}`}
                            className="flex items-center gap-4 hover:opacity-80 transition"
                          >
                            <div className="relative w-12 h-16">
                              <NextImage
                                src={manga.coverImage}
                                alt={manga.title}
                                fill
                                className="object-cover rounded"
                                unoptimized
                              />
                            </div>
                            <div>
                              <p className="text-white font-medium hover:text-green-400 transition">
                                {manga.title}
                              </p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {manga.genres.slice(0, 2).map((genre) => (
                                  <span
                                    key={genre}
                                    className="text-xs px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded"
                                  >
                                    {genre}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-zinc-300">
                          {manga.author}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                              manga.status === "ongoing"
                                ? "bg-green-500/20 text-green-400"
                                : manga.status === "completed"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-yellow-500/20 text-yellow-400"
                            }`}
                          >
                            {manga.status.charAt(0).toUpperCase() +
                              manga.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-zinc-300">
                          {manga.chapters.length}
                        </td>
                        <td className="px-6 py-4 text-zinc-300">
                          {manga.views.toLocaleString()}
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-4 text-zinc-300">
                            {manga.createdBy && userMap[manga.createdBy]
                              ? userMap[manga.createdBy].name
                              : "Unknown"}
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/manga/${manga.id}`}
                              className="p-2 hover:bg-zinc-700 rounded-lg transition"
                              title="View"
                            >
                              <Eye className="w-4 h-4 text-zinc-400" />
                            </Link>
                            <Link
                              href={`/admin/manga/${manga.id}/chapters`}
                              className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition"
                              title="Manage Chapters"
                            >
                              Chapters
                            </Link>
                            <Link
                              href={`/admin/manga/${manga.id}/edit`}
                              className="p-2 hover:bg-zinc-700 rounded-lg transition"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4 text-green-400" />
                            </Link>
                            <button
                              onClick={() =>
                                handleDelete(manga.id, manga.title)
                              }
                              className="p-2 hover:bg-zinc-700 rounded-lg transition"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredMangas.length / itemsPerPage)}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredMangas.length}
            />
          </div>
        )}

        {/* Stats */}
        {!loading && mangas.length > 0 && (
          <div className="mt-6 text-zinc-400 text-sm">
            Showing {filteredMangas.length} of {mangas.length} manga
          </div>
        )}
      </div>
    </div>
  );
}
