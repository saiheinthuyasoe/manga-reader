// Firebase Firestore helpers for manga operations

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "./firebase";
import { Manga } from "@/types/manga";

// Get all mangas
export async function getAllMangas(): Promise<Manga[]> {
  const mangasCol = collection(db, "mangas");
  const mangaSnapshot = await getDocs(mangasCol);
  const mangaList = mangaSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Manga[];
  return mangaList;
}

// Alias for consistency
export const getAllManga = getAllMangas;

// Get manga by ID
export async function getMangaById(id: string): Promise<Manga | null> {
  const mangaDoc = doc(db, "mangas", id);
  const mangaSnapshot = await getDoc(mangaDoc);

  if (!mangaSnapshot.exists()) {
    return null;
  }

  return {
    id: mangaSnapshot.id,
    ...mangaSnapshot.data(),
  } as Manga;
}

// Get trending mangas
export async function getTrendingMangas(
  limitCount: number = 10
): Promise<Manga[]> {
  const mangasCol = collection(db, "mangas");
  const q = query(mangasCol, orderBy("views", "desc"), limit(limitCount));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Manga[];
}

// Get latest updated mangas
export async function getLatestMangas(
  limitCount: number = 10
): Promise<Manga[]> {
  const mangasCol = collection(db, "mangas");
  const q = query(mangasCol, orderBy("updatedAt", "desc"), limit(limitCount));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Manga[];
}

// Get mangas by genre
export async function getMangasByGenre(genre: string): Promise<Manga[]> {
  const mangasCol = collection(db, "mangas");
  const q = query(mangasCol, where("genres", "array-contains", genre));
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Manga[];
}

// Search mangas by title
export async function searchMangas(searchTerm: string): Promise<Manga[]> {
  const mangasCol = collection(db, "mangas");
  const querySnapshot = await getDocs(mangasCol);

  // Note: For better search, consider using Algolia or similar service
  const mangas = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Manga[];

  return mangas.filter((manga) =>
    manga.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
}

// Add a new manga (admin function)
export async function addManga(manga: Omit<Manga, "id">): Promise<string> {
  const mangasCol = collection(db, "mangas");
  const docRef = await addDoc(mangasCol, manga);
  return docRef.id;
}

// Update manga
export async function updateManga(
  id: string,
  updates: Partial<Manga>
): Promise<void> {
  const mangaDoc = doc(db, "mangas", id);
  await updateDoc(mangaDoc, updates);
}

// Delete chapter from manga
export async function deleteChapterFromManga(
  mangaId: string,
  chapterId: string
): Promise<void> {
  const mangaDoc = doc(db, "mangas", mangaId);
  const mangaSnap = await getDoc(mangaDoc);
  if (!mangaSnap.exists()) return;
  const data = mangaSnap.data();
  const chapters = (data.chapters || []).filter(
    (ch: { id: string }) => ch.id !== chapterId
  );
  await updateDoc(mangaDoc, { chapters });
}

// Delete manga
export async function deleteManga(id: string): Promise<void> {
  const mangaDoc = doc(db, "mangas", id);
  await deleteDoc(mangaDoc);
}

// Increment manga views
export async function incrementMangaViews(id: string): Promise<void> {
  const mangaDoc = doc(db, "mangas", id);
  const manga = await getDoc(mangaDoc);

  if (manga.exists()) {
    const currentViews = manga.data().views || 0;
    await updateDoc(mangaDoc, { views: currentViews + 1 });
  }
}
