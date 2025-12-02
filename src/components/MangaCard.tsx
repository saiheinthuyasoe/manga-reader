import Link from "next/link";
import Image from "next/image";
import { Manga } from "@/types/manga";
import { Eye, Star } from "lucide-react";

interface MangaCardProps {
  manga: Manga;
}

export default function MangaCard({ manga }: MangaCardProps) {
  const latestChapter = manga.chapters[manga.chapters.length - 1];

  return (
    <Link href={`/manga/${manga.id}`} className="group">
      <div className="relative overflow-hidden rounded-lg bg-zinc-900 transition-transform duration-300 hover:scale-105">
        <div className="relative aspect-[2/3] w-full">
          <Image
            src={manga.coverImage}
            alt={manga.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          {/* Status badge */}
          <div className="absolute top-2 left-2">
            <span
              className={`px-2 py-1 text-xs font-medium rounded ${
                manga.status === "ongoing"
                  ? "bg-green-500"
                  : manga.status === "completed"
                  ? "bg-green-500"
                  : "bg-yellow-500"
              }`}
            >
              {manga.status.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="p-3">
          <h3 className="font-semibold text-white line-clamp-2 mb-2">
            {manga.title}
          </h3>

          <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
              <span>{manga.rating.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>{(manga.views / 1000).toFixed(1)}K</span>
            </div>
          </div>

          {latestChapter && (
            <div className="text-xs text-zinc-500">
              Chapter {latestChapter.number}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
