"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { History, ArrowLeft, Coins, Calendar, BookOpen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { CoinTransaction } from "@/types/transaction";
import Loading from "@/components/Loading";
import Link from "next/link";
import Pagination from "@/components/Pagination";

export default function TransactionHistoryPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [loadingData, setLoadingData] = useState(true);
  const [creatingTest, setCreatingTest] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTestTransaction = async () => {
    if (!user) return;

    setCreatingTest(true);
    try {
      const response = await fetch("/api/test-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid }),
      });

      const data = await response.json();
      if (data.success) {
        alert("Test transaction created! Refreshing...");
        window.location.reload();
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      console.error("Error creating test transaction:", error);
      alert("Failed to create test transaction");
    } finally {
      setCreatingTest(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (loading || !user) return;

      try {
        console.log("Fetching transactions for user:", user.uid);
        const q = query(
          collection(db, "coinTransactions"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);
        console.log("Transaction snapshot size:", snapshot.size);
        const txData = snapshot.docs.map((doc) => {
          console.log("Transaction doc:", doc.id, doc.data());
          return {
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
          };
        }) as CoinTransaction[];

        console.log("Transactions loaded:", txData.length);
        setTransactions(txData);
        setError(null);
      } catch (error) {
        console.error("Error fetching transactions:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setError(errorMessage);

        // Check if it's an index error
        if (errorMessage.includes("index") || errorMessage.includes("Index")) {
          console.error(
            "FIRESTORE INDEX REQUIRED: Please check the browser console for a link to create the index, or see FIRESTORE_INDEXES.md"
          );
        }
      } finally {
        setLoadingData(false);
      }
    };

    fetchTransactions();
  }, [user, loading, router]);

  if (loading || loadingData) {
    return <Loading />;
  }

  if (!user) {
    return null;
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "purchase":
        return <BookOpen className="w-5 h-5 text-red-400" />;
      case "gift":
      case "admin_add":
        return <Coins className="w-5 h-5 text-green-400" />;
      case "refund":
      case "admin_deduct":
        return <Coins className="w-5 h-5 text-yellow-400" />;
      default:
        return <Coins className="w-5 h-5 text-zinc-400" />;
    }
  };

  const getTransactionColor = (amount: number) => {
    return amount > 0 ? "text-green-400" : "text-red-400";
  };

  // Pagination logic
  const paginatedTransactions = transactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="min-h-screen bg-black pt-16">
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
            <History className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
              Transaction History
            </h1>
          </div>
        </div>

        {/* Current Balance */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-zinc-400 text-xs sm:text-sm mb-1">
                Current Balance
              </p>
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
                <span className="text-2xl sm:text-3xl font-bold text-white">
                  {user.coins || 0}
                </span>
                <span className="text-sm sm:text-base text-zinc-400">
                  coins
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border border-red-600/50 rounded-lg p-6 mb-6">
            <h3 className="text-red-400 font-bold mb-2">
              Error Loading Transactions
            </h3>
            <p className="text-red-300 text-sm mb-3">{error}</p>
            {(error.includes("index") || error.includes("Index")) && (
              <div className="bg-red-900/30 border border-red-600/30 rounded p-4">
                <p className="text-red-200 text-sm mb-2">
                  <strong>Firestore Index Required:</strong>
                </p>
                <p className="text-red-200 text-sm mb-2">
                  1. Check the browser console for an error with a link to
                  create the index
                </p>
                <p className="text-red-200 text-sm mb-2">
                  2. Click that link to automatically create the index in
                  Firebase Console
                </p>
                <p className="text-red-200 text-sm">
                  3. Wait 1-2 minutes for the index to build, then refresh this
                  page
                </p>
              </div>
            )}
          </div>
        )}

        {/* Transactions List */}
        {!error && transactions.length === 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-12 text-center">
            <History className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400 text-lg">No transactions yet</p>
            <p className="text-zinc-600 text-sm mt-2">
              Click &quot;Create Test Transaction&quot; above to test the system
            </p>
          </div>
        ) : !error ? (
          <div className="space-y-2 sm:space-y-3">
            {paginatedTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 sm:p-4 hover:border-zinc-700 transition"
              >
                <div className="flex items-start justify-between gap-2 sm:gap-4">
                  <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="p-1.5 sm:p-2 bg-zinc-800 rounded-lg mt-1 flex-shrink-0">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base text-white font-medium mb-1 line-clamp-2">
                        {transaction.description}
                      </p>
                      <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-zinc-400">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="truncate">
                          {transaction.createdAt.toLocaleDateString()}
                          <span className="hidden sm:inline">
                            {" "}
                            at {transaction.createdAt.toLocaleTimeString()}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p
                      className={`text-base sm:text-xl font-bold ${getTransactionColor(
                        transaction.amount
                      )}`}
                    >
                      {transaction.amount > 0 ? "+" : ""}
                      {transaction.amount}
                    </p>
                    <p className="text-xs sm:text-sm text-zinc-500 whitespace-nowrap">
                      Bal: {transaction.balance}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {/* Pagination for user transactions */}
            {transactions.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(transactions.length / itemsPerPage)}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={transactions.length}
              />
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
