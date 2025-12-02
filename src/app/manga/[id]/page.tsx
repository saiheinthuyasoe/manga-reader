import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Share2, Eye, Star, Calendar, User, Palette } from "lucide-react";
import { Manga } from "@/types/manga";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import BookmarkButton from "@/components/BookmarkButton";

// Fetch manga from Firebase
const getMangaById = async (id: string): Promise<Manga | null> => {
  try {
    const mangaDoc = await getDoc(doc(db, "mangas", id));

    if (!mangaDoc.exists()) {
      return null;
    }

    const data = mangaDoc.data();

    return {
      id: mangaDoc.id,
      title: data.title,
      alternativeTitles: data.alternativeTitles || [],
      description: data.description,
      coverImage: data.coverImage,
      bannerImage: data.bannerImage,
      author: data.author,
      artist: data.artist,
      status: data.status,
      genres: data.genres,
      rating: data.rating || 0,
      views: data.views || 0,
      chapters: data.chapters || [],
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as Manga;
  } catch (error) {
    console.error("Error fetching manga:", error);
    return null;
  }
};

export default async function MangaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const manga = await getMangaById(id);

  if (!manga) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-black pt-16">
      {/* Banner Section */}
      <div className="relative h-[400px] overflow-hidden">
        <Image
          src={manga.bannerImage || manga.coverImage}
          alt={manga.title}
          fill
          className="object-cover opacity-30"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/70 to-transparent" />
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-48 sm:-mt-64 relative z-10">
        <div className="flex flex-col md:flex-row gap-6 sm:gap-8">
          {/* Cover Image */}
          <div className="shrink-0 mx-auto md:mx-0">
            <div className="relative w-48 sm:w-56 md:w-64 aspect-[2/3] rounded-lg overflow-hidden shadow-2xl">
              <Image
                src={manga.coverImage}
                alt={manga.title}
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* Info Section */}
          <div className="flex-1 text-white">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
              {manga.title}
            </h1>
            {manga.alternativeTitles && manga.alternativeTitles.length > 0 && (
              <p className="text-sm sm:text-base text-zinc-400 mb-4">
                {manga.alternativeTitles.join(", ")}
              </p>
            )}

            {/* Stats */}
            <div className="flex flex-wrap gap-4 sm:gap-6 mb-4 sm:mb-6 text-sm sm:text-base">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                <span className="font-semibold">{manga.rating.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-green-500" />
                <span>{(manga.views / 1000000).toFixed(2)}M views</span>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  manga.status === "ongoing"
                    ? "bg-green-500/20 text-green-500"
                    : manga.status === "completed"
                    ? "bg-green-500/20 text-green-500"
                    : "bg-yellow-500/20 text-yellow-500"
                }`}
              >
                {manga.status.toUpperCase()}
              </div>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2 mb-6">
              {manga.genres.map((genre) => (
                <span
                  key={genre}
                  className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-full text-sm transition cursor-pointer"
                >
                  {genre}
                </span>
              ))}
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-zinc-400" />
                <span className="text-zinc-400">Author:</span>
                <span>{manga.author}</span>
              </div>
              {manga.artist && (
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-zinc-400" />
                  <span className="text-zinc-400">Artist:</span>
                  <span>{manga.artist}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
              <Link
                href={`/read/${manga.id}/${manga.chapters[0].id}`}
                className="px-6 sm:px-8 py-2.5 sm:py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition text-center text-sm sm:text-base"
              >
                Read Now
              </Link>
              <BookmarkButton mangaId={manga.id} />
              <button className="px-4 sm:px-6 py-2.5 sm:py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg flex items-center justify-center gap-2 transition text-sm sm:text-base">
                <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                Share
              </button>
            </div>

            {/* Description */}
            <div className="bg-zinc-900 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Synopsis</h2>
              <p className="text-zinc-300 leading-relaxed">
                {manga.description}
              </p>
            </div>
          </div>
        </div>

        {/* Chapters List */}
        <div className="mt-8 sm:mt-12 bg-zinc-900 rounded-lg p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">
            Chapters
          </h2>
          <div className="grid gap-2">
            {manga.chapters.map((chapter) => (
              <Link
                key={chapter.id}
                href={`/read/${manga.id}/${chapter.id}`}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition group gap-2 sm:gap-0"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                  <span className="text-green-500 font-semibold group-hover:text-green-400 text-sm sm:text-base">
                    Chapter {chapter.chapterNumber}
                  </span>
                  <span className="text-white text-sm sm:text-base line-clamp-1">
                    {chapter.title}
                  </span>
                </div>
                <div className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm text-zinc-400">
                  <div className="flex items-center gap-2">
                    {chapter.pagesEN && chapter.pagesEN.length > 0 && (
                      <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs font-semibold">
                        EN
                      </span>
                    )}
                    {chapter.pagesMM && chapter.pagesMM.length > 0 && (
                      <span className="px-2 py-1 bg-purple-600/20 text-purple-400 rounded text-xs font-semibold">
                        MM
                      </span>
                    )}
                    {chapter.isFree && (
                      <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded text-xs font-semibold">
                        FREE
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {chapter.publishedAt
                        ? (() => {
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
                        : "Not set"}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
