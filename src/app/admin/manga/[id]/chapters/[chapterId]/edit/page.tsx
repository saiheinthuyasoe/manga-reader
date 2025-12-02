"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, X, ImagePlus } from "lucide-react";
import { CldUploadWidget } from "next-cloudinary";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import Loading from "@/components/Loading";

export default function EditChapterPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const mangaId = params.id as string;
  const chapterId = params.chapterId as string;

  const [manga, setManga] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    chapterNumber: "",
    title: "",
    pagesEN: [] as string[],
    pagesMM: [] as string[],
    isFree: false,
    publishDate: new Date().toISOString().slice(0, 16),
  });

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.push("/");
    }
  }, [user, isAdmin, authLoading, router]);

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

        const mangaData = { id: mangaDoc.id, ...mangaDoc.data() };
        setManga(mangaData);

        const chapter = mangaData.chapters?.find(
          (ch: any) => ch.id === chapterId
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
          publishDate: chapter.publishedAt
            ? new Date(
                chapter.publishedAt.seconds
                  ? chapter.publishedAt.seconds * 1000
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
  }, [mangaId, chapterId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.pagesEN.length === 0 && formData.pagesMM.length === 0) {
      alert("Please upload at least one page for English or Myanmar");
      return;
    }

    setSaving(true);

    try {
      const mangaRef = doc(db, "mangas", mangaId);
      const updatedChapters = manga.chapters.map((ch: any) =>
        ch.id === chapterId
          ? {
              ...ch,
              chapterNumber: parseFloat(formData.chapterNumber),
              title: formData.title,
              pagesEN: formData.pagesEN,
              pagesMM: formData.pagesMM,
              isFree: formData.isFree,
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

  if (!user || !isAdmin) {
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

            {/* English Pages Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                English Pages ({formData.pagesEN.length} uploaded)
              </label>
              <CldUploadWidget
                uploadPreset="ml_default"
                signatureEndpoint="/api/cloudinary-signature"
                options={{
                  folder: `manga-reader/chapters/${mangaId}/EN`,
                  multiple: true,
                  resourceType: "image",
                }}
                onSuccess={(result: any) => {
                  if (result.info && result.info.secure_url) {
                    setFormData((prev) => ({
                      ...prev,
                      pagesEN: [...prev.pagesEN, result.info.secure_url],
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
                    <span className="text-zinc-400">Upload English pages</span>
                  </button>
                )}
              </CldUploadWidget>

              {formData.pagesEN.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.pagesEN.map((page, index) => (
                    <div
                      key={index}
                      className="relative group aspect-2/3 bg-zinc-800 rounded-lg overflow-hidden"
                    >
                      <img
                        src={page}
                        alt={`EN Page ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => removePageEN(index)}
                          className="p-2 bg-red-500 hover:bg-red-600 rounded-full transition"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="absolute bottom-2 left-2 bg-green-600 px-2 py-1 rounded text-xs font-semibold">
                        EN {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Myanmar Pages Upload */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Myanmar Pages ({formData.pagesMM.length} uploaded)
              </label>
              <CldUploadWidget
                uploadPreset="ml_default"
                signatureEndpoint="/api/cloudinary-signature"
                options={{
                  folder: `manga-reader/chapters/${mangaId}/MM`,
                  multiple: true,
                  resourceType: "image",
                }}
                onSuccess={(result: any) => {
                  if (result.info && result.info.secure_url) {
                    setFormData((prev) => ({
                      ...prev,
                      pagesMM: [...prev.pagesMM, result.info.secure_url],
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
                    <span className="text-zinc-400">Upload Myanmar pages</span>
                  </button>
                )}
              </CldUploadWidget>

              {formData.pagesMM.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.pagesMM.map((page, index) => (
                    <div
                      key={index}
                      className="relative group aspect-2/3 bg-zinc-800 rounded-lg overflow-hidden"
                    >
                      <img
                        src={page}
                        alt={`MM Page ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => removePageMM(index)}
                          className="p-2 bg-red-500 hover:bg-red-600 rounded-full transition"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="absolute bottom-2 left-2 bg-purple-600 px-2 py-1 rounded text-xs font-semibold">
                        MM {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
