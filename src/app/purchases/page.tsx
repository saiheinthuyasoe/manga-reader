"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { History, ArrowLeft, Coins, Calendar, BookOpen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { PurchaseHistory } from "@/types/transaction";
import Loading from "@/components/Loading";
import Link from "next/link";

export default function PurchaseHistoryPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [purchases, setPurchases] = useState<PurchaseHistory[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchPurchases = async () => {
      if (loading || !user) return;

      try {
        const q = query(
          collection(db, "purchaseHistory"),
          where("userId", "==", user.uid),
          orderBy("purchasedAt", "desc")
        );

        const snapshot = await getDocs(q);
        const purchaseData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          purchasedAt: doc.data().purchasedAt?.toDate() || new Date(),
        })) as PurchaseHistory[];

        setPurchases(purchaseData);
      } catch (error) {
        console.error("Error fetching purchase history:", error);
      } finally {
        setLoadingData(false);
      }
    };

    fetchPurchases();
  }, [user, loading, router]);

  if (loading || loadingData) {
    return <Loading />;
  }

  if (!user) {
    return null;
  }

  const totalSpent = purchases.reduce(
    (sum, purchase) => sum + purchase.coinPrice,
    0
  );

  return (
    <div className="min-h-screen bg-black pt-16 pb-28 md:pb-0">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Link
            href="/profile"
            className="p-2 hover:bg-zinc-800 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <History className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
              Purchase History
            </h1>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 sm:p-6">
            <p className="text-zinc-400 text-xs sm:text-sm mb-1">
              Total Purchases
            </p>
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
              <span className="text-2xl sm:text-3xl font-bold text-white">
                {purchases.length}
              </span>
              <span className="text-sm sm:text-base text-zinc-400">
                chapters
              </span>
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 sm:p-6">
            <p className="text-zinc-400 text-xs sm:text-sm mb-1">Total Spent</p>
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
              <span className="text-2xl sm:text-3xl font-bold text-white">
                {totalSpent}
              </span>
              <span className="text-sm sm:text-base text-zinc-400">coins</span>
            </div>
          </div>
        </div>

        {/* Purchase List */}
        {purchases.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-12 text-center">
            <History className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400 text-lg">No purchases yet</p>
            <p className="text-zinc-600 text-sm mt-2">
              Purchase premium chapters to see them here
            </p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {purchases.map((purchase) => (
              <Link
                key={purchase.id}
                href={`/read/${purchase.mangaId}/${purchase.chapterId}`}
                className="block bg-zinc-900 border border-zinc-800 rounded-lg p-3 sm:p-4 hover:border-purple-600 transition"
              >
                <div className="flex items-start justify-between gap-2 sm:gap-4">
                  <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="p-1.5 sm:p-2 bg-zinc-800 rounded-lg mt-1 flex-shrink-0">
                      <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base text-white font-medium mb-1 line-clamp-1">
                        {purchase.mangaTitle}
                      </p>
                      <p className="text-xs sm:text-sm text-zinc-400 mb-1 sm:mb-2 line-clamp-1">
                        Chapter {purchase.chapterNumber}:{" "}
                        {purchase.chapterTitle}
                      </p>
                      <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-zinc-500">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">
                          {purchase.purchasedAt.toLocaleDateString()}
                          <span className="hidden sm:inline">
                            {" "}
                            at {purchase.purchasedAt.toLocaleTimeString()}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Coins className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-base sm:text-lg font-bold">
                        {purchase.coinPrice}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
