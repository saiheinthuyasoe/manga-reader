export interface Manga {
  id: string;
  title: string;
  alternativeTitles?: string[];
  description: string;
  coverImage: string;
  bannerImage?: string;
  author: string;
  artist?: string;
  status: "ongoing" | "completed" | "hiatus";
  genres: string[];
  rating: number;
  views: number;
  chapters: Chapter[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Chapter {
  id: string;
  chapterNumber: number;
  title: string;
  pagesEN: string[];
  pagesMM: string[];
  publishedAt: Date;
  isFree?: boolean; // If true, free accounts can read this chapter
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  bookmarks: string[];
  readingHistory: ReadingHistory[];
  createdAt: Date;
}

export interface ReadingHistory {
  mangaId: string;
  chapterId: string;
  pageNumber: number;
  lastRead: Date;
}
