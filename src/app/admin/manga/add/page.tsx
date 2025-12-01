"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CldUploadWidget } from "next-cloudinary";
import { PlusCircle, Upload, X, ImagePlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { addManga } from "@/lib/db";
import { Manga } from "@/types/manga";

export default function AddMangaPage() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    alternativeTitles: "",
    description: "",
    author: "",
    artist: "",
    status: "ongoing" as "ongoing" | "completed" | "hiatus",
    genres: "",
    coverImage: "",
    bannerImage: "",
  });

  useEffect(() => {
    if (!user || !isAdmin) {
      router.push("/");
    }
  }, [user, isAdmin, router]);

  if (!user || !isAdmin) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!formData.coverImage) {
        setError("Please upload a cover image");
        setLoading(false);
        return;
      }

      const mangaData: Omit<Manga, "id"> = {
        title: formData.title,
        alternativeTitles: formData.alternativeTitles
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t),
        description: formData.description,
        coverImage: formData.coverImage,
        bannerImage: formData.bannerImage || formData.coverImage,
        author: formData.author,
        artist: formData.artist || formData.author,
        status: formData.status,
        genres: formData.genres
          .split(",")
          .map((g) => g.trim())
          .filter((g) => g),
        rating: 0,
        views: 0,
        chapters: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await addManga(mangaData);
      router.push("/admin/manga");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message || "Failed to add manga");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black pt-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-3 mb-8">
          <PlusCircle className="w-8 h-8 text-blue-500" />
          <h1 className="text-3xl font-bold text-white">Add New Manga</h1>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Cover Image Upload */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Cover Image *
              </label>
              <CldUploadWidget
                uploadPreset="ml_default"
                signatureEndpoint="/api/cloudinary-signature"
                options={{ folder: "manga-reader/manga-cover" }}
                onSuccess={(result) => {
                  if (
                    result.info &&
                    typeof result.info !== "string" &&
                    "secure_url" in result.info
                  ) {
                    setFormData((prev) => ({
                      ...prev,
                      coverImage: result.info.secure_url,
                    }));
                  }
                }}
              >
                {({ open }) => (
                  <div>
                    {formData.coverImage ? (
                      <div className="relative">
                        <img
                          src={formData.coverImage}
                          alt="Cover preview"
                          className="w-48 h-72 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, coverImage: "" })
                          }
                          className="absolute top-2 right-2 p-2 bg-red-600 rounded-full hover:bg-red-700"
                          aria-label="Remove cover image"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => open()}
                        className="w-full p-8 border-2 border-dashed border-zinc-700 rounded-lg hover:border-blue-500 transition flex flex-col items-center gap-2"
                      >
                        <ImagePlus className="w-12 h-12 text-zinc-500" />
                        <span className="text-zinc-400">
                          Click to upload cover image
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </CldUploadWidget>
            </div>

            {/* Banner Image Upload */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Banner Image (Optional)
              </label>
              <CldUploadWidget
                uploadPreset="ml_default"
                signatureEndpoint="/api/cloudinary-signature"
                options={{ folder: "manga-reader/manga-banner" }}
                onSuccess={(result) => {
                  if (
                    result.info &&
                    typeof result.info !== "string" &&
                    "secure_url" in result.info
                  ) {
                    setFormData((prev) => ({
                      ...prev,
                      bannerImage: result.info.secure_url,
                    }));
                  }
                }}
              >
                {({ open }) => (
                  <div>
                    {formData.bannerImage ? (
                      <div className="relative">
                        <img
                          src={formData.bannerImage}
                          alt="Banner preview"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, bannerImage: "" })
                          }
                          className="absolute top-2 right-2 p-2 bg-red-600 rounded-full hover:bg-red-700"
                          aria-label="Remove banner image"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => open()}
                        className="w-full p-6 border-2 border-dashed border-zinc-700 rounded-lg hover:border-blue-500 transition flex flex-col items-center gap-2"
                      >
                        <Upload className="w-8 h-8 text-zinc-500" />
                        <span className="text-zinc-400 text-sm">
                          Click to upload banner image
                        </span>
                      </button>
                    )}
                  </div>
                )}
              </CldUploadWidget>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full bg-zinc-800 text-white rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter manga title"
              />
            </div>

            {/* Alternative Titles */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Alternative Titles (comma separated)
              </label>
              <input
                type="text"
                value={formData.alternativeTitles}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    alternativeTitles: e.target.value,
                  })
                }
                className="w-full bg-zinc-800 text-white rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., ワンピース, One Piece"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Description *
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={6}
                className="w-full bg-zinc-800 text-white rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter manga description"
              />
            </div>

            {/* Author & Artist */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Author *
                </label>
                <input
                  type="text"
                  required
                  value={formData.author}
                  onChange={(e) =>
                    setFormData({ ...formData, author: e.target.value })
                  }
                  className="w-full bg-zinc-800 text-white rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Author name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Artist (Optional)
                </label>
                <input
                  type="text"
                  value={formData.artist}
                  onChange={(e) =>
                    setFormData({ ...formData, artist: e.target.value })
                  }
                  className="w-full bg-zinc-800 text-white rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Artist name"
                />
              </div>
            </div>

            {/* Status & Genres */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as
                        | "ongoing"
                        | "completed"
                        | "hiatus",
                    })
                  }
                  className="w-full bg-zinc-800 text-white rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="hiatus">Hiatus</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Genres * (comma separated)
                </label>
                <input
                  type="text"
                  required
                  value={formData.genres}
                  onChange={(e) =>
                    setFormData({ ...formData, genres: e.target.value })
                  }
                  className="w-full bg-zinc-800 text-white rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Action, Adventure, Fantasy"
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition"
              >
                {loading ? "Adding Manga..." : "Add Manga"}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-semibold transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
