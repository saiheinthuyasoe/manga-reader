import { NextResponse } from "next/server";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function POST() {
  try {
    const mangasRef = collection(db, "mangas");
    const snapshot = await getDocs(mangasRef);

    let updated = 0;
    const updates: { id: string; oldUrl: string; newUrl: string }[] = [];

    for (const docSnap of snapshot.docs) {
      const manga = docSnap.data();
      let needsUpdate = false;
      const updateData: Record<string, string> = {};

      // Update coverImage if it uses /api/image
      if (manga.coverImage?.startsWith("/api/image?key=")) {
        const keyMatch = manga.coverImage.match(/key=([^&]+)/);
        if (keyMatch) {
          const key = decodeURIComponent(keyMatch[1]);
          const newUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${key}`;
          updateData.coverImage = newUrl;
          needsUpdate = true;
          updates.push({ id: docSnap.id, oldUrl: manga.coverImage, newUrl });
        }
      }

      // Update bannerImage if it uses /api/image
      if (manga.bannerImage?.startsWith("/api/image?key=")) {
        const keyMatch = manga.bannerImage.match(/key=([^&]+)/);
        if (keyMatch) {
          const key = decodeURIComponent(keyMatch[1]);
          const newUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${key}`;
          updateData.bannerImage = newUrl;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await updateDoc(doc(db, "mangas", docSnap.id), updateData);
        updated++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updated} manga records`,
      updates,
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      {
        error: "Failed to migrate URLs",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
