import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await request.json();

    // Get manga document
    const mangaRef = doc(db, "mangas", id);
    const mangaDoc = await getDoc(mangaRef);

    if (!mangaDoc.exists()) {
      return NextResponse.json({ error: "Manga not found" }, { status: 404 });
    }

    const mangaData = mangaDoc.data();

    const viewHistory = mangaData.viewHistory || {};
    const currentViews = mangaData.views || 0;

    // Check if user/IP has viewed in the last 24 hours
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const viewKey = userId || ip || "anonymous";
    const lastViewTime = viewHistory[viewKey];
    const now = Date.now();
    const oneDayInMs = 24 * 60 * 60 * 1000;

    let shouldIncrement = false;

    if (!lastViewTime || now - lastViewTime > oneDayInMs) {
      shouldIncrement = true;
      viewHistory[viewKey] = now;
    }

    if (shouldIncrement) {
      await updateDoc(mangaRef, {
        views: currentViews + 1,
        viewHistory,
        updatedAt: new Date(),
      });

      return NextResponse.json({
        success: true,
        views: currentViews + 1,
        incremented: true,
      });
    }

    return NextResponse.json({
      success: true,
      views: currentViews,
      incremented: false,
      message: "View already counted in the last 24 hours",
    });
  } catch (error) {
    console.error("Error updating views:", error);
    return NextResponse.json(
      {
        error: "Failed to update views",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
