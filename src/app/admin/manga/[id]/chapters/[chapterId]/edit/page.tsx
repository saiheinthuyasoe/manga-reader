"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { Manga, Chapter } from "@/types/manga";
import Loading from "@/components/Loading";
import R2MultiUploadWidget from "@/components/R2MultiUploadWidget";

export default function EditChapterPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading, isAdmin, isTranslator } = useAuth();
  const mangaId = params.id as string;
  const chapterId = params.chapterId as string;

  const [manga, setManga] = useState<Manga | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    chapterNumber: "",
    title: "",
    pagesEN: [] as string[],
    pagesMM: [] as string[],
    isFree: false,
    coinPrice: 0,
    publishDate: new Date().toISOString().slice(0, 16),
  });

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && (!user || (!isAdmin && !isTranslator))) {
      router.push("/");
    }
  }, [user, isAdmin, isTranslator, authLoading, router]);

  // Load manga and chapter data
  useEffect(() => {
    const loadChapter = async () => {
      try {
        const mangaDoc = await getDoc(doc(db, "mangas", mangaId));
        if (!mangaDoc.exists()) {
          alert("Manga not found");
          router.push("/admin/manga");
          return;
        }

        const mangaData = { id: mangaDoc.id, ...mangaDoc.data() } as Manga;

        // Check ownership for translators
        if (isTranslator && !isAdmin && mangaData.createdBy !== user?.uid) {
          alert("You don't have permission to edit this chapter");
          router.push("/admin/manga");
          return;
        }

        setManga(mangaData);

        const chapter = mangaData.chapters?.find(
          (ch: Chapter) => ch.id === chapterId
        );
        if (!chapter) {
          alert("Chapter not found");
          router.push(`/admin/manga/${mangaId}/chapters`);
          return;
        }

        setFormData({
          chapterNumber: chapter.chapterNumber.toString(),
          title: chapter.title,
          pagesEN: chapter.pagesEN || [],
          pagesMM: chapter.pagesMM || [],
          isFree: chapter.isFree || false,
          coinPrice: chapter.coinPrice || 0,
          publishDate: chapter.publishedAt
            ? new Date(
                typeof chapter.publishedAt === "object" &&
                "seconds" in chapter.publishedAt
                  ? (chapter.publishedAt as { seconds: number }).seconds * 1000
                  : chapter.publishedAt
              )
                .toISOString()
                .slice(0, 16)
            : new Date().toISOString().slice(0, 16),
        });
      } catch (error) {
        console.error("Error loading chapter:", error);
        alert("Failed to load chapter");
      } finally {
        setLoading(false);
      }
    };

    if (mangaId && chapterId) {
      loadChapter();
    }
  }, [mangaId, chapterId, router, isAdmin, isTranslator, user?.uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!manga) return;

    if (formData.pagesEN.length === 0 && formData.pagesMM.length === 0) {
      alert("Please upload at least one page for English or Myanmar");
      return;
    }

    setSaving(true);

    try {
      const mangaRef = doc(db, "mangas", mangaId);
      const updatedChapters = manga.chapters.map((ch: Chapter) =>
        ch.id === chapterId
          ? {
              ...ch,
              chapterNumber: parseFloat(formData.chapterNumber),
              title: formData.title,
              pagesEN: formData.pagesEN,
              pagesMM: formData.pagesMM,
              isFree: formData.isFree,
              coinPrice: formData.coinPrice,
              publishedAt: new Date(formData.publishDate),
            }
          : ch
      );

      await updateDoc(mangaRef, {
        chapters: updatedChapters,
        updatedAt: new Date(),
      });

      alert("Chapter updated successfully!");
      router.push(`/admin/manga/${mangaId}/chapters`);
    } catch (error) {
      console.error("Error updating chapter:", error);
      alert("Failed to update chapter");
    } finally {
      setSaving(false);
    }
  };

  const removePageEN = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      pagesEN: prev.pagesEN.filter((_, i) => i !== index),
    }));
  };

  const removePageMM = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      pagesMM: prev.pagesMM.filter((_, i) => i !== index),
    }));
  };

  if (authLoading || loading) {
    return <Loading />;
  }

  if (!user || (!isAdmin && !isTranslator)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white pt-20 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/admin/manga/${mangaId}/chapters`}
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-4 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Chapters
          </Link>
          <h1 className="text-3xl font-bold">Edit Chapter</h1>
          <p className="text-zinc-400 mt-2">Edit chapter for: {manga?.title}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-zinc-900 rounded-lg p-6">
            {/* Chapter Number & Title */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Chapter Number *
                </label>
                <input
                  type="number"
                  aria-label="Chapter Number"
                  step="0.1"
                  required
                  value={formData.chapterNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, chapterNumber: e.target.value })
                  }
                  className="w-full bg-zinc-800 text-white rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., 1 or 1.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Chapter Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full bg-zinc-800 text-white rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., The Beginning"
                />
              </div>
            </div>

            {/* Publish Date */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Publish Date & Time *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.publishDate}
                placeholder="Select publish date and time"
                onChange={(e) =>
                  setFormData({ ...formData, publishDate: e.target.value })
                }
                className="w-full bg-zinc-800 text-white rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-zinc-500 mt-2">
                Set when this chapter should be published.
              </p>
            </div>

            {/* Free/Membership Toggle */}
            <div className="bg-zinc-800 rounded-lg p-4 mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isFree}
                  onChange={(e) =>
                    setFormData({ ...formData, isFree: e.target.checked })
                  }
                  className="w-5 h-5 rounded bg-zinc-700 border-zinc-600 text-green-600 focus:ring-2 focus:ring-green-500"
                />
                <div>
                  <span className="text-white font-medium">Free Chapter</span>
                  <p className="text-sm text-zinc-400">
                    Allow free accounts to read this chapter
                  </p>
                </div>
              </label>
            </div>

            {/* Coin Price */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Coin Price
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={formData.coinPrice}
                placeholder="Enter coin price (0 for membership only)"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    coinPrice: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full bg-zinc-800 text-white rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-zinc-500 mt-2">
                Set to 0 for free access with membership. Free users can
                purchase with coins if price is set.
                {!formData.isFree && formData.coinPrice > 0 && (
                  <span className="block mt-1 text-yellow-500">
                    ⚠️ Free users must pay {formData.coinPrice} coins. Members
                    can read for free.
                  </span>
                )}
                {!formData.isFree && formData.coinPrice === 0 && (
                  <span className="block mt-1 text-green-500">
                    ✓ Members only - Free users cannot access.
                  </span>
                )}
                {formData.isFree && (
                  <span className="block mt-1 text-blue-500">
                    ✓ Everyone can read for free.
                  </span>
                )}
              </p>
            </div>

            {/* English Pages Upload */}
            <R2MultiUploadWidget
              folder={`manga-chapters/${mangaId}/EN`}
              values={formData.pagesEN}
              onSuccess={(urls) =>
                setFormData((prev) => ({
                  ...prev,
                  pagesEN: [...prev.pagesEN, ...urls],
                }))
              }
              onRemove={removePageEN}
              label="English Pages"
              language="EN"
            />

            {/* Myanmar Pages Upload */}
            <R2MultiUploadWidget
              folder={`manga-chapters/${mangaId}/MM`}
              values={formData.pagesMM}
              onSuccess={(urls) =>
                setFormData((prev) => ({
                  ...prev,
                  pagesMM: [...prev.pagesMM, ...urls],
                }))
              }
              onRemove={removePageMM}
              label="Myanmar Pages"
              language="MM"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <Link
              href={`/admin/manga/${mangaId}/chapters`}
              className="px-8 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-semibold transition text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
