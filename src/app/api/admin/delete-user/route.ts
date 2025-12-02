import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, deleteDoc } from "firebase/firestore";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 }
      );
    }

    // Delete user from Firestore
    // Note: This only deletes the Firestore document
    // To fully delete from Firebase Auth, you'd need Firebase Admin SDK
    await deleteDoc(doc(db, "users", userId));

    return NextResponse.json({
      message: "User deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { message: error.message || "Failed to delete user" },
      { status: 500 }
    );
  }
}
