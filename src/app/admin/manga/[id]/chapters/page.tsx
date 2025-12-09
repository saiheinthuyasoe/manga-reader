"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import NextImage from "next/image";
import {
  BookOpen,
  PlusCircle,
  Edit,
  Trash2,
  Eye,
  ArrowLeft,
  Lock,
  Coins,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getMangaById, deleteChapterFromManga } from "@/lib/db";
import { Manga } from "@/types/manga";

export default function MangaChaptersPage() {
  const [deleting, setDeleting] = useState<string | null>(null);
  const handleDeleteChapter = async (chapterId: string) => {
    if (!window.confirm("Are you sure you want to delete this chapter?"))
      return;
    setDeleting(chapterId);
    try {
      await deleteChapterFromManga(params.id as string, chapterId);
      // Refresh manga data
      const updated = await getMangaById(params.id as string);
      setManga(updated);
    } catch (err) {
      alert("Failed to delete chapter.");
    } finally {
      setDeleting(null);
    }
  };
  const router = useRouter();
  const params = useParams();
  const { user, isAdmin, isTranslator } = useAuth();
  const [manga, setManga] = useState<Manga | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || (!isAdmin && !isTranslator)) {
      router.push("/");
    }
  }, [user, isAdmin, isTranslator, router]);

  useEffect(() => {
    const loadManga = async () => {
      try {
        setLoading(true);
        const data = await getMangaById(params.id as string);

        // Check ownership for translators
        if (data && isTranslator && !isAdmin && data.createdBy !== user?.uid) {
          router.push("/admin/manga");
          return;
        }

        setManga(data);
      } catch (error) {
        console.error("Failed to load manga:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user && (isAdmin || isTranslator)) {
      loadManga();
    }
  }, [user, isAdmin, isTranslator, params.id, router]);

  if (!user || (!isAdmin && !isTranslator)) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-16 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
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
        {/* Header - Responsive */}
        <div className="mb-6">
          <Link
            href="/admin/manga"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Manga List
          </Link>
          <div className="flex flex-col sm:flex-row items-center gap-4 mb-4">
            <div className="relative w-24 h-36 sm:w-16 sm:h-24">
              <NextImage
                src={manga.coverImage}
                alt={manga.title}
                fill
                className="object-cover rounded"
              />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                {manga.title}
              </h1>
              <p className="text-zinc-400">Manage Chapters</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end mb-6">
          <Link
            href={`/admin/manga/${params.id}/chapters/add`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition w-full sm:w-auto justify-center"
          >
            <PlusCircle className="w-5 h-5" />
            Add New Chapter
          </Link>
        </div>

        {/* Chapters List - Responsive */}
        {manga.chapters.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-12 text-center">
            <BookOpen className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400 text-lg mb-2">No chapters yet</p>
            <p className="text-zinc-600 text-sm">
              Click &ldquo;Add New Chapter&rdquo; to get started
            </p>
          </div>
        ) : (
          <div>
            {/* Mobile: Cards */}
            <div className="grid grid-cols-1 gap-4 sm:hidden">
              {manga.chapters
                .sort((a, b) => a.chapterNumber - b.chapterNumber)
                .map((chapter) => (
                  <div
                    key={chapter.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-white">
                          Ch. {chapter.chapterNumber}
                        </span>
                        <span className="ml-2 text-zinc-300">
                          {chapter.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/read/${params.id}/${chapter.id}`}
                          title="View"
                          className="p-1 hover:bg-zinc-700 rounded transition"
                        >
                          <Eye className="w-4 h-4 text-zinc-400" />
                        </Link>
                        <Link
                          href={`/admin/manga/${params.id}/chapters/${chapter.id}/edit`}
                          title="Edit"
                          className="p-1 hover:bg-zinc-700 rounded transition"
                        >
                          <Edit className="w-4 h-4 text-green-400" />
                        </Link>
                        <button
                          className="p-1 hover:bg-zinc-700 rounded transition disabled:opacity-50"
                          title="Delete"
                          onClick={() => handleDeleteChapter(chapter.id)}
                          disabled={deleting === chapter.id}
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2 text-xs mt-2">
                      {chapter.pagesEN && chapter.pagesEN.length > 0 && (
                        <span className="px-2 py-1 rounded bg-green-500/20 text-green-400">
                          EN: {chapter.pagesEN.length} pages
                        </span>
                      )}
                      {chapter.pagesMM && chapter.pagesMM.length > 0 && (
                        <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-400">
                          MM: {chapter.pagesMM.length} pages
                        </span>
                      )}
                      {chapter.isFree ? (
                        <span className="px-2 py-1 rounded bg-green-500/20 text-green-400">
                          Free
                        </span>
                      ) : chapter.coinPrice && chapter.coinPrice > 0 ? (
                        <span className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-500">
                          {chapter.coinPrice} coins
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-400">
                          Member Only
                        </span>
                      )}
                      <span className="px-2 py-1 rounded bg-zinc-800 text-zinc-400">
                        {chapter.publishedAt
                          ? (() => {
                              const date = chapter.publishedAt;
                              if (
                                typeof date === "object" &&
                                date !== null &&
                                "seconds" in date
                              ) {
                                return new Date(
                                  (date as { seconds: number }).seconds * 1000
                                ).toLocaleDateString();
                              }
                              return new Date(date).toLocaleDateString();
                            })()
                          : "Not set"}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
            {/* Desktop: Table */}
            <div className="hidden sm:block bg-zinc-900 border border-zinc-800 rounded-lg overflow-x-auto">
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
                      Access
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
                            <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400">
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
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {chapter.isFree ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400">
                                <Lock className="w-3 h-3" />
                                Free
                              </span>
                            ) : chapter.coinPrice && chapter.coinPrice > 0 ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-500">
                                <Coins className="w-3 h-3" />
                                {chapter.coinPrice} coins
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-400">
                                <Lock className="w-3 h-3" />
                                Member Only
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-zinc-400 text-sm">
                          {chapter.publishedAt ? (
                            (() => {
                              const date = chapter.publishedAt;
                              if (
                                typeof date === "object" &&
                                date !== null &&
                                "seconds" in date
                              ) {
                                return new Date(
                                  (date as { seconds: number }).seconds * 1000
                                ).toLocaleDateString();
                              }
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
                              <Edit className="w-4 h-4 text-green-400" />
                            </Link>
                            <button
                              className="p-2 hover:bg-zinc-700 rounded-lg transition disabled:opacity-50"
                              title="Delete"
                              onClick={() => handleDeleteChapter(chapter.id)}
                              disabled={deleting === chapter.id}
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
