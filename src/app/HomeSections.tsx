import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
// import { useLanguage } from "@/contexts/LanguageContext";

interface Chapter {
  id: string;
  chapterNumber: number;
  title: string;
  language: string;
  pagesEN?: string[];
  pagesMM?: string[];
}

interface Manga {
  id: string;
  title: string;
  author: string;
  description: string;
  coverImage: string;
  type: string[];
  genres: string[];
  status: string;
  chapters?: Chapter[];
  rating?: number;
  views?: number;
  publishedAt?: { seconds?: number } | string | number | null;
}

function Section({ title, items }: { title: string; items: Manga[] }) {
  return (
    <div className="mb-10">
      <h2 className="text-xl font-bold mb-4 text-white">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
        {items.map((manga) => (
          <Link
            key={manga.id}
            href={`/manga/${manga.id}`}
            className="bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 hover:border-green-600 transition block"
          >
            <div className="relative h-40 w-full">
              <Image
                src={manga.coverImage || "/no-cover.png"}
                alt={manga.title}
                fill
                unoptimized
                className="object-cover"
              />
            </div>
            <div className="p-2">
              <h3 className="text-sm font-semibold text-white line-clamp-2 mb-1">
                {manga.title}
              </h3>
              <p className="text-xs text-zinc-400 line-clamp-1">
                {manga.author}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function HomeSections() {
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "mangas"), (snapshot) => {
      const list = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title ?? "",
          author: data.author ?? "",
          description: data.description ?? "",
          coverImage: data.coverImage ?? "",
          type: Array.isArray(data.type) ? data.type : [],
          genres: Array.isArray(data.genres) ? data.genres : [],
          status: data.status ?? "",
          chapters: Array.isArray(data.chapters) ? data.chapters : [],
          rating: typeof data.rating === "number" ? data.rating : undefined,
          views: typeof data.views === "number" ? data.views : undefined,
          publishedAt: data.publishedAt ?? null,
        };
      });
      setMangas(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Helper sort/filter
  const getSorted = (key: keyof Manga, desc = true, limit = 8): Manga[] =>
    [...mangas]
      .filter((m) => typeof m[key] === "number" && m[key] !== undefined)
      .sort((a, b) => {
        const aVal = typeof a[key] === "number" ? (a[key] as number) : 0;
        const bVal = typeof b[key] === "number" ? (b[key] as number) : 0;
        return desc ? bVal - aVal : aVal - bVal;
      })
      .slice(0, limit);

  const getLatest = (limit = 8): Manga[] =>
    [...mangas]
      .filter((m) => m.publishedAt)
      .sort((a, b) => {
        const aDate =
          typeof a.publishedAt === "object" &&
          a.publishedAt?.seconds !== undefined
            ? (a.publishedAt.seconds as number)
            : typeof a.publishedAt === "string" ||
              typeof a.publishedAt === "number"
            ? new Date(a.publishedAt).getTime() / 1000
            : 0;
        const bDate =
          typeof b.publishedAt === "object" &&
          b.publishedAt?.seconds !== undefined
            ? (b.publishedAt.seconds as number)
            : typeof b.publishedAt === "string" ||
              typeof b.publishedAt === "number"
            ? new Date(b.publishedAt).getTime() / 1000
            : 0;
        return bDate - aDate;
      })
      .slice(0, limit);

  const getRecommended = (limit = 8): Manga[] =>
    [...mangas]
      .filter(
        (m) => typeof m.rating === "number" && typeof m.views === "number"
      )
      .sort((a, b) => {
        const aScore = (a.rating ?? 0) * (a.views ?? 0);
        const bScore = (b.rating ?? 0) * (b.views ?? 0);
        return bScore - aScore;
      })
      .slice(0, limit);

  const getByStatus = (status: string, limit = 8): Manga[] =>
    mangas
      .filter(
        (m) => (m.status || "").toLowerCase().trim() === status.toLowerCase()
      )
      .slice(0, limit);

  if (loading) {
    return <div className="text-center py-16 text-zinc-400">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* <Section title="Newly Released" items={getLatest()} /> */}
      <Section title="Best Rating" items={getSorted("rating")} />
      <Section title="Most Viewed" items={getSorted("views")} />
      <Section title="Recommended" items={getRecommended()} />
      <Section title="Ongoing" items={getByStatus("Ongoing")} />
      <Section title="Completed" items={getByStatus("Completed")} />
    </div>
  );
}
