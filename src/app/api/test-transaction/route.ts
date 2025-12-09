import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get user's current coins
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const currentCoins = userData.coins || 0;

    // Create a test transaction
    const transaction = await addDoc(collection(db, "coinTransactions"), {
      userId: userId,
      type: "admin_add",
      amount: 100,
      balance: currentCoins + 100,
      description: "Test transaction - Admin added 100 coins",
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      message: "Test transaction created successfully",
    });
  } catch (error) {
    console.error("Error creating test transaction:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
