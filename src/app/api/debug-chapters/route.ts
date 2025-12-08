import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export async function GET() {
  try {
    // Get all mangas
    const mangasSnapshot = await getDocs(collection(db, "mangas"));

    const results = await Promise.all(
      mangasSnapshot.docs.map(async (doc) => {
        const chaptersSnapshot = await getDocs(
          collection(db, "mangas", doc.id, "chapters")
        );

        const chapters = chaptersSnapshot.docs.map((chapterDoc) => ({
          id: chapterDoc.id,
          ...chapterDoc.data(),
        }));

        return {
          mangaId: doc.id,
          mangaTitle: doc.data().title,
          chaptersCount: chapters.length,
          chapters: chapters,
        };
      })
    );

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("Error fetching chapters:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch chapters",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
