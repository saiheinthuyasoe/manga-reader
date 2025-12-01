import Image from "next/image";
import Link from "next/link";
import MangaCard from "@/components/MangaCard";
import { TrendingUp, Clock, Star, ChevronRight } from "lucide-react";
import { Manga } from "@/types/manga";

// Mock data - Replace with Firebase queries
const mockMangas: Manga[] = [
  {
    id: "1",
    title: "One Piece",
    description:
      "Monkey D. Luffy and his pirate crew explore the Grand Line in search of the One Piece treasure.",
    coverImage:
      "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=400&h=600&fit=crop",
    author: "Eiichiro Oda",
    status: "ongoing",
    genres: ["Action", "Adventure", "Fantasy"],
    rating: 9.2,
    views: 1500000,
    chapters: [
      {
        id: "1",
        number: 1095,
        title: "New Adventure",
        pages: [],
        publishedAt: new Date(),
        views: 50000,
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    title: "Attack on Titan",
    description: "Humanity fights for survival against giant humanoid Titans.",
    coverImage:
      "https://images.unsplash.com/photo-1618519764620-7403abdbdfe9?w=400&h=600&fit=crop",
    author: "Hajime Isayama",
    status: "completed",
    genres: ["Action", "Drama", "Dark Fantasy"],
    rating: 9.0,
    views: 1200000,
    chapters: [
      {
        id: "1",
        number: 139,
        title: "Final Chapter",
        pages: [],
        publishedAt: new Date(),
        views: 80000,
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    title: "My Hero Academia",
    description:
      "A world where people with superpowers are the norm and heroes work to keep the peace.",
    coverImage:
      "https://images.unsplash.com/photo-1601645191163-3fc0d5d64e35?w=400&h=600&fit=crop",
    author: "Kohei Horikoshi",
    status: "ongoing",
    genres: ["Action", "Superhero", "School"],
    rating: 8.5,
    views: 980000,
    chapters: [
      {
        id: "1",
        number: 405,
        title: "Heroes Unite",
        pages: [],
        publishedAt: new Date(),
        views: 45000,
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "4",
    title: "Demon Slayer",
    description:
      "A young boy becomes a demon slayer after his family is slaughtered by demons.",
    coverImage:
      "https://images.unsplash.com/photo-1578632292335-df3abbb0d586?w=400&h=600&fit=crop",
    author: "Koyoharu Gotouge",
    status: "completed",
    genres: ["Action", "Supernatural"],
    rating: 8.8,
    views: 1100000,
    chapters: [
      {
        id: "1",
        number: 205,
        title: "Epilogue",
        pages: [],
        publishedAt: new Date(),
        views: 75000,
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "5",
    title: "Tokyo Ghoul",
    description:
      "A college student transforms into a half-ghoul and struggles to survive in a world of humans and ghouls.",
    coverImage:
      "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=400&h=600&fit=crop",
    author: "Sui Ishida",
    status: "completed",
    genres: ["Horror", "Dark Fantasy"],
    rating: 8.3,
    views: 850000,
    chapters: [
      {
        id: "1",
        number: 143,
        title: "The End",
        pages: [],
        publishedAt: new Date(),
        views: 60000,
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "6",
    title: "Chainsaw Man",
    description:
      "A young man merges with his pet devil and becomes a Devil Hunter.",
    coverImage:
      "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&h=600&fit=crop",
    author: "Tatsuki Fujimoto",
    status: "ongoing",
    genres: ["Action", "Dark Fantasy"],
    rating: 8.9,
    views: 920000,
    chapters: [
      {
        id: "1",
        number: 145,
        title: "New Arc",
        pages: [],
        publishedAt: new Date(),
        views: 55000,
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-black pt-16">
      {/* Hero Section */}
      <div className="relative h-[500px] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1920&h=500&fit=crop"
          alt="Hero Banner"
          fill
          className="object-cover opacity-40"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/50 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Discover Your Next{" "}
              <span className="text-blue-500">Adventure</span>
            </h1>
            <p className="text-xl text-zinc-300 mb-8">
              Read thousands of manga titles for free. Updated daily with the
              latest chapters.
            </p>
            <Link
              href="/browse"
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
            >
              Start Reading
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Trending Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-blue-500" />
              <h2 className="text-2xl font-bold text-white">Trending Now</h2>
            </div>
            <Link
              href="/trending"
              className="text-blue-500 hover:text-blue-400 flex items-center gap-1"
            >
              View All
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {mockMangas.slice(0, 6).map((manga) => (
              <MangaCard key={manga.id} manga={manga} />
            ))}
          </div>
        </section>

        {/* Latest Updates */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Clock className="w-6 h-6 text-green-500" />
              <h2 className="text-2xl font-bold text-white">Latest Updates</h2>
            </div>
            <Link
              href="/latest"
              className="text-blue-500 hover:text-blue-400 flex items-center gap-1"
            >
              View All
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {mockMangas.map((manga) => (
              <MangaCard key={manga.id} manga={manga} />
            ))}
          </div>
        </section>

        {/* Popular This Week */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-500" />
              <h2 className="text-2xl font-bold text-white">
                Popular This Week
              </h2>
            </div>
            <Link
              href="/popular"
              className="text-blue-500 hover:text-blue-400 flex items-center gap-1"
            >
              View All
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {mockMangas.slice(0, 6).map((manga) => (
              <MangaCard key={manga.id} manga={manga} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
