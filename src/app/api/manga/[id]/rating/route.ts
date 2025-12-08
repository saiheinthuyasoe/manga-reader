import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId, stars } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    if (!stars || stars < 1 || stars > 5) {
      return NextResponse.json(
        { error: "Stars must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Get manga document
    const mangaRef = doc(db, "mangas", id);
    const mangaDoc = await getDoc(mangaRef);

    if (!mangaDoc.exists()) {
      return NextResponse.json({ error: "Manga not found" }, { status: 404 });
    }

    const mangaData = mangaDoc.data();
    const ratings = mangaData.ratings || {};

    // Update or add user's rating
    ratings[userId] = stars;

    // Calculate new average rating
    // Total ratings = sum of all star values
    // Count = number of users who rated
    const allRatings = Object.values(ratings) as number[];
    const totalSum = allRatings.reduce((sum, rating) => sum + rating, 0);
    const count = allRatings.length;
    const averageRating = count > 0 ? Number((totalSum / count).toFixed(2)) : 0;

    // Update manga document
    await updateDoc(mangaRef, {
      ratings,
      rating: averageRating,
      ratingCount: count,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      rating: averageRating,
      ratingCount: count,
      userRating: stars,
    });
  } catch (error) {
    console.error("Error updating rating:", error);
    return NextResponse.json(
      {
        error: "Failed to update rating",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const mangaRef = doc(db, "mangas", id);
    const mangaDoc = await getDoc(mangaRef);

    if (!mangaDoc.exists()) {
      return NextResponse.json({ error: "Manga not found" }, { status: 404 });
    }

    const mangaData = mangaDoc.data();
    const ratings = mangaData.ratings || {};
    const userRating = userId ? ratings[userId] : null;

    return NextResponse.json({
      rating: mangaData.rating || 0,
      ratingCount: mangaData.ratingCount || 0,
      userRating,
    });
  } catch (error) {
    console.error("Error fetching rating:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch rating",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
