import { NextRequest, NextResponse } from "next/server";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { UserProfile } from "@/types/user";

export async function POST(request: NextRequest) {
  try {
    const { email, password, displayName, role } = await request.json();

    if (!email || !password || !displayName) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const uid = userCredential.user.uid;

    // Create user profile in Firestore
    const userProfile: UserProfile = {
      uid,
      email,
      displayName,
      accountType: "free",
      role: role || "user",
      coins: 0,
      bookmarks: [],
      readingHistory: [],
      purchasedChapters: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(doc(db, "users", uid), userProfile);

    return NextResponse.json({
      message: "User created successfully",
      user: { uid, email, displayName, role: userProfile.role },
    });
  } catch (error: unknown) {
    console.error("Error creating user:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create user";
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}
