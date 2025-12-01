"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  PlusCircle,
  Edit,
  Trash2,
  Eye,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getMangaById } from "@/lib/db";
import { Manga } from "@/types/manga";

export default function MangaChaptersPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAdmin } = useAuth();
  const [manga, setManga] = useState<Manga | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isAdmin) {
      router.push("/");
    }
  }, [user, isAdmin, router]);

  useEffect(() => {
    if (user && isAdmin) {
      loadManga();
    }
  }, [user, isAdmin]);

  const loadManga = async () => {
    try {
      setLoading(true);
      const data = await getMangaById(params.id as string);
      setManga(data);
    } catch (error) {
      console.error("Failed to load manga:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user || !isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-16 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400 mt-4">Loading chapters...</p>
        </div>
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="min-h-screen bg-black pt-16 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">Manga not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin/manga"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Manga List
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <img
              src={manga.coverImage}
              alt={manga.title}
              className="w-16 h-24 object-cover rounded"
            />
            <div>
              <h1 className="text-3xl font-bold text-white">{manga.title}</h1>
              <p className="text-zinc-400">Manage Chapters</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end mb-6">
          <Link
            href={`/admin/manga/${params.id}/chapters/add`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
          >
            <PlusCircle className="w-5 h-5" />
            Add New Chapter
          </Link>
        </div>

        {/* Chapters List */}
        {manga.chapters.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-12 text-center">
            <BookOpen className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400 text-lg mb-2">No chapters yet</p>
            <p className="text-zinc-600 text-sm">
              Click "Add New Chapter" to get started
            </p>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Chapter
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      EN Pages
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      MM Pages
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Published
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {manga.chapters
                    .sort((a, b) => a.chapterNumber - b.chapterNumber)
                    .map((chapter) => (
                      <tr
                        key={chapter.id}
                        className="hover:bg-zinc-800/50 transition"
                      >
                        <td className="px-6 py-4 text-white font-medium">
                          Chapter {chapter.chapterNumber}
                        </td>
                        <td className="px-6 py-4 text-zinc-300">
                          {chapter.title}
                        </td>
                        <td className="px-6 py-4">
                          {chapter.pagesEN && chapter.pagesEN.length > 0 ? (
                            <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400">
                              {chapter.pagesEN.length} pages
                            </span>
                          ) : (
                            <span className="text-zinc-600 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {chapter.pagesMM && chapter.pagesMM.length > 0 ? (
                            <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-400">
                              {chapter.pagesMM.length} pages
                            </span>
                          ) : (
                            <span className="text-zinc-600 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-zinc-400 text-sm">
                          {chapter.publishedAt ? (
                            (() => {
                              const date = chapter.publishedAt;
                              // Handle Firebase Timestamp
                              if (
                                typeof date === "object" &&
                                date !== null &&
                                "seconds" in date
                              ) {
                                return new Date(
                                  (date as any).seconds * 1000
                                ).toLocaleDateString();
                              }
                              // Handle regular Date or date string
                              return new Date(date).toLocaleDateString();
                            })()
                          ) : (
                            <span className="text-zinc-600">Not set</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/read/${params.id}/${chapter.id}`}
                              className="p-2 hover:bg-zinc-700 rounded-lg transition"
                              title="View"
                            >
                              <Eye className="w-4 h-4 text-zinc-400" />
                            </Link>
                            <Link
                              href={`/admin/manga/${params.id}/chapters/${chapter.id}/edit`}
                              className="p-2 hover:bg-zinc-700 rounded-lg transition"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4 text-blue-400" />
                            </Link>
                            <button
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
          </div>
        )}

        {/* Stats */}
        {manga.chapters.length > 0 && (
          <div className="mt-6 text-zinc-400 text-sm">
            Total: {manga.chapters.length} chapter
            {manga.chapters.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </div>
  );
}
