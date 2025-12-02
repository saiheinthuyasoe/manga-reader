"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { CldUploadWidget } from "next-cloudinary";
import { PlusCircle, Upload, X, ArrowLeft, ImagePlus } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getMangaById, updateManga } from "@/lib/db";
import { Manga } from "@/types/manga";

export default function AddChapterPage() {
  const router = useRouter();
  const params = useParams();
  const { user, isAdmin } = useAuth();
  const [manga, setManga] = useState<Manga | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingManga, setLoadingManga] = useState(true);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    chapterNumber: "",
    title: "",
    pagesEN: [] as string[],
    pagesMM: [] as string[],
    isFree: false,
    publishDate: new Date().toISOString().slice(0, 16), // Format: YYYY-MM-DDTHH:mm
  });

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
      setLoadingManga(true);
      const data = await getMangaById(params.id as string);
      setManga(data);

      // Auto-suggest next chapter number
      if (data && data.chapters.length > 0) {
        const maxChapter = Math.max(
          ...data.chapters.map((c) => c.chapterNumber)
        );
        setFormData((prev) => ({
          ...prev,
          chapterNumber: String(maxChapter + 1),
        }));
      } else {
        setFormData((prev) => ({ ...prev, chapterNumber: "1" }));
      }
    } catch (err) {
      setError("Failed to load manga");
    } finally {
      setLoadingManga(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (formData.pagesEN.length === 0 && formData.pagesMM.length === 0) {
        setError("Please upload at least one page for English or Myanmar");
        setLoading(false);
        return;
      }

      if (!manga) {
        setError("Manga not found");
        setLoading(false);
        return;
      }

      const newChapter = {
        id: `chapter-${Date.now()}`,
        chapterNumber: parseFloat(formData.chapterNumber),
        title: formData.title,
        pagesEN: formData.pagesEN,
        pagesMM: formData.pagesMM,
        publishedAt: new Date(formData.publishDate),
        isFree: formData.isFree,
      };

      await updateManga(params.id as string, {
        chapters: [...manga.chapters, newChapter],
        updatedAt: new Date(),
      });

      router.push(`/admin/manga/${params.id}/chapters`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message || "Failed to add chapter");
    } finally {
      setLoading(false);
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

  if (!user || !isAdmin) {
    return null;
  }

  if (loadingManga) {
    return (
      <div className="min-h-screen bg-black pt-16 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-400 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6">
          <Link
            href={`/admin/manga/${params.id}/chapters`}
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Chapters
          </Link>
          <div className="flex items-center gap-3">
            <PlusCircle className="w-8 h-8 text-green-500" />
            <h1 className="text-3xl font-bold text-white">Add New Chapter</h1>
          </div>
          {manga && <p className="text-zinc-400 mt-2">to {manga.title}</p>}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Chapter Number & Title */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Chapter Number *
                </label>
                <input
                  type="number"
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
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Publish Date & Time *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.publishDate}
                onChange={(e) =>
                  setFormData({ ...formData, publishDate: e.target.value })
                }
                className="w-full bg-zinc-800 text-white rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-zinc-500 mt-2">
                Set when this chapter should be published. Defaults to current
                date/time.
              </p>
            </div>

            {/* Free/Membership Toggle */}
            <div className="bg-zinc-800 rounded-lg p-4">
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

            {/* English Pages Upload */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                <span className="inline-flex items-center gap-2">
                  English Pages ({formData.pagesEN.length} uploaded)
                  <span className="text-xs text-zinc-500">Optional</span>
                </span>
              </label>

              <CldUploadWidget
                uploadPreset="ml_default"
                signatureEndpoint="/api/cloudinary-signature"
                options={{
                  folder: `manga-reader/chapters/${params.id}/EN`,
                  multiple: true,
                  maxFiles: 100,
                }}
                onSuccess={(result) => {
                  if (
                    result.info &&
                    typeof result.info !== "string" &&
                    "secure_url" in result.info
                  ) {
                    const url = result.info.secure_url;
                    setFormData((prev) => ({
                      ...prev,
                      pagesEN: [...prev.pagesEN, url],
                    }));
                  }
                }}
              >
                {({ open }) => (
                  <button
                    type="button"
                    onClick={() => open()}
                    className="w-full p-6 border-2 border-dashed border-zinc-700 rounded-lg hover:border-green-500 transition flex flex-col items-center gap-2"
                  >
                    <ImagePlus className="w-10 h-10 text-green-500" />
                    <span className="text-zinc-400">
                      Click to upload English pages
                    </span>
                    <span className="text-zinc-600 text-sm">
                      You can select multiple images at once
                    </span>
                  </button>
                )}
              </CldUploadWidget>

              {/* English Pages Preview Grid */}
              {formData.pagesEN.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.pagesEN.map((page, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={page}
                        alt={`EN Page ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <div className="absolute top-2 left-2 px-2 py-1 bg-green-600 rounded text-xs text-white font-semibold">
                        EN {index + 1}
                      </div>
                      <button
                        type="button"
                        onClick={() => removePageEN(index)}
                        className="absolute top-2 right-2 p-2 bg-red-600 rounded-full hover:bg-red-700 opacity-0 group-hover:opacity-100 transition"
                        aria-label={`Remove EN page ${index + 1}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Myanmar Pages Upload */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                <span className="inline-flex items-center gap-2">
                  Myanmar Pages ({formData.pagesMM.length} uploaded)
                  <span className="text-xs text-zinc-500">Optional</span>
                </span>
              </label>

              <CldUploadWidget
                uploadPreset="ml_default"
                signatureEndpoint="/api/cloudinary-signature"
                options={{
                  folder: `manga-reader/chapters/${params.id}/MM`,
                  multiple: true,
                  maxFiles: 100,
                }}
                onSuccess={(result) => {
                  if (
                    result.info &&
                    typeof result.info !== "string" &&
                    "secure_url" in result.info
                  ) {
                    const url = result.info.secure_url;
                    setFormData((prev) => ({
                      ...prev,
                      pagesMM: [...prev.pagesMM, url],
                    }));
                  }
                }}
              >
                {({ open }) => (
                  <button
                    type="button"
                    onClick={() => open()}
                    className="w-full p-6 border-2 border-dashed border-zinc-700 rounded-lg hover:border-purple-500 transition flex flex-col items-center gap-2"
                  >
                    <ImagePlus className="w-10 h-10 text-purple-500" />
                    <span className="text-zinc-400">
                      Click to upload Myanmar pages
                    </span>
                    <span className="text-zinc-600 text-sm">
                      You can select multiple images at once
                    </span>
                  </button>
                )}
              </CldUploadWidget>

              {/* Myanmar Pages Preview Grid */}
              {formData.pagesMM.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.pagesMM.map((page, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={page}
                        alt={`MM Page ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <div className="absolute top-2 left-2 px-2 py-1 bg-purple-600 rounded text-xs text-white font-semibold">
                        MM {index + 1}
                      </div>
                      <button
                        type="button"
                        onClick={() => removePageMM(index)}
                        className="absolute top-2 right-2 p-2 bg-red-600 rounded-full hover:bg-red-700 opacity-0 group-hover:opacity-100 transition"
                        aria-label={`Remove MM page ${index + 1}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition"
              >
                {loading ? "Adding Chapter..." : "Add Chapter"}
              </button>
              <Link
                href={`/admin/manga/${params.id}/chapters`}
                className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-semibold transition text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
