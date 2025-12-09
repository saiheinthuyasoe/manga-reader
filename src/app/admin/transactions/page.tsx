"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  History,
  Search,
  Calendar,
  User,
  Coins,
  Trash2,
  CheckSquare,
  Square,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  getDocs,
  limit,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { CoinTransaction } from "@/types/transaction";
import Loading from "@/components/Loading";
import Pagination from "@/components/Pagination";

export default function AdminTransactionsPage() {
  const router = useRouter();
  const { user, isAdmin, loading } = useAuth();
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [userMap, setUserMap] = useState<
    Record<string, { name: string; email: string }>
  >({});
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push("/");
    }
  }, [user, isAdmin, loading, router]);

  useEffect(() => {
    const fetchData = async () => {
      if (loading || !user || !isAdmin) return;

      try {
        console.log("[Admin Transactions] Fetching users...");
        // Fetch users for mapping
        const usersSnapshot = await getDocs(collection(db, "users"));
        const users: Record<string, { name: string; email: string }> = {};
        usersSnapshot.forEach((doc) => {
          const userData = doc.data();
          users[doc.id] = {
            name: userData.displayName || userData.email || "Unknown",
            email: userData.email || "",
          };
        });
        console.log(
          "[Admin Transactions] Users loaded:",
          Object.keys(users).length
        );
        setUserMap(users);

        console.log("[Admin Transactions] Fetching transactions...");
        // Fetch transactions
        const q = query(
          collection(db, "coinTransactions"),
          orderBy("createdAt", "desc"),
          limit(500)
        );

        const snapshot = await getDocs(q);
        console.log("[Admin Transactions] Snapshot size:", snapshot.size);
        const txData = snapshot.docs.map((doc) => {
          console.log("[Admin Transactions] Transaction:", doc.id, doc.data());
          return {
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
          };
        }) as CoinTransaction[];

        console.log("[Admin Transactions] Total loaded:", txData.length);
        setTransactions(txData);
        setError(null);
      } catch (error) {
        console.error("[Admin Transactions] Error:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setError(errorMessage);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [user, isAdmin, loading, router]);

  if (loading || loadingData) {
    return <Loading />;
  }

  if (!user || !isAdmin) {
    return null;
  }

  const filteredTransactions = transactions.filter((tx) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const userName = userMap[tx.userId]?.name.toLowerCase() || "";
    const userEmail = userMap[tx.userId]?.email.toLowerCase() || "";
    const description = tx.description.toLowerCase();
    return (
      userName.includes(query) ||
      userEmail.includes(query) ||
      description.includes(query)
    );
  });

  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "purchase":
        return "text-red-400";
      case "gift":
      case "admin_add":
        return "text-green-400";
      case "refund":
        return "text-yellow-400";
      case "admin_deduct":
        return "text-orange-400";
      default:
        return "text-zinc-400";
    }
  };

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case "purchase":
        return "bg-red-600/20 text-red-400";
      case "gift":
        return "bg-green-600/20 text-green-400";
      case "admin_add":
        return "bg-green-600/20 text-green-400";
      case "refund":
        return "bg-yellow-600/20 text-yellow-400";
      case "admin_deduct":
        return "bg-orange-600/20 text-orange-400";
      default:
        return "bg-zinc-600/20 text-zinc-400";
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === paginatedTransactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedTransactions.map((tx) => tx.id)));
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;

    setDeleting(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          deleteDoc(doc(db, "coinTransactions", id))
        )
      );

      // Remove deleted transactions from state
      setTransactions((prev) => prev.filter((tx) => !selectedIds.has(tx.id)));
      setSelectedIds(new Set());
      setShowDeleteModal(false);
      alert(`Successfully deleted ${selectedIds.size} transaction(s)`);
    } catch (error) {
      console.error("Error deleting transactions:", error);
      alert("Failed to delete transactions");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3">
            <History className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
              Coin Transaction History
            </h1>
          </div>
          {selectedIds.size > 0 && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm sm:text-base w-full sm:w-auto"
            >
              <Trash2 className="w-4 h-4" />
              Delete {selectedIds.size} Selected
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="mb-4 sm:mb-6">
          <div className="relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by user name, email, or description..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-zinc-900 text-white text-sm sm:text-base rounded-lg pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 border border-zinc-800 focus:outline-none focus:border-green-500"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border border-red-600/50 rounded-lg p-6 mb-6">
            <h3 className="text-red-400 font-bold mb-2">
              Error Loading Transactions
            </h3>
            <p className="text-red-300 text-sm mb-3">{error}</p>
            <div className="bg-red-900/30 border border-red-600/30 rounded p-4">
              <p className="text-red-200 text-sm mb-2">
                <strong>Firestore Index Required:</strong>
              </p>
              <p className="text-red-200 text-sm mb-2">
                The admin page needs an index for:{" "}
                <code className="bg-black/30 px-2 py-1 rounded">
                  coinTransactions
                </code>{" "}
                collection
              </p>
              <p className="text-red-200 text-sm mb-2">
                Index fields:{" "}
                <code className="bg-black/30 px-2 py-1 rounded">
                  createdAt (Descending)
                </code>
              </p>
              <p className="text-red-200 text-sm">
                Check the browser console for a link to create the index
                automatically.
              </p>
            </div>
          </div>
        )}

        {/* Transactions Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-800">
                <tr>
                  <th className="px-4 py-4 text-left">
                    <button
                      onClick={handleSelectAll}
                      className="text-zinc-400 hover:text-white transition"
                      title={
                        selectedIds.size === paginatedTransactions.length
                          ? "Deselect All"
                          : "Select All"
                      }
                    >
                      {selectedIds.size === paginatedTransactions.length ? (
                        <CheckSquare className="w-5 h-5" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {paginatedTransactions.length === 0 && !error ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <History className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                      <p className="text-zinc-400">
                        {searchQuery
                          ? "No transactions found"
                          : "No transactions yet"}
                      </p>
                      <p className="text-zinc-600 text-sm mt-2">
                        Transactions will appear here when users purchase
                        chapters
                      </p>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <p className="text-red-400">
                        Unable to load transactions. See error above.
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-zinc-800/50 transition">
                      <td className="px-4 py-4">
                        <button
                          onClick={() => handleSelectOne(tx.id)}
                          className="text-zinc-400 hover:text-white transition"
                        >
                          {selectedIds.has(tx.id) ? (
                            <CheckSquare className="w-5 h-5 text-green-500" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-zinc-300">
                          <Calendar className="w-4 h-4 text-zinc-500" />
                          <div>
                            <div>{tx.createdAt.toLocaleDateString()}</div>
                            <div className="text-xs text-zinc-500">
                              {tx.createdAt.toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-zinc-500" />
                          <div>
                            <div className="text-white text-sm">
                              {userMap[tx.userId]?.name || "Unknown"}
                            </div>
                            <div className="text-xs text-zinc-500">
                              {userMap[tx.userId]?.email || ""}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getTransactionBadge(
                            tx.type
                          )}`}
                        >
                          {tx.type.replace("_", " ").toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-300 text-sm max-w-md">
                        {tx.description}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div
                          className={`flex items-center justify-end gap-1 font-bold ${getTransactionColor(
                            tx.type
                          )}`}
                        >
                          <span>
                            {tx.amount > 0 ? "+" : ""}
                            {tx.amount}
                          </span>
                          <Coins className="w-4 h-4" />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-zinc-300 font-semibold">
                          {tx.balance}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-zinc-800">
            {paginatedTransactions.length === 0 && !error ? (
              <div className="px-4 py-12 text-center">
                <History className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-400 text-sm">
                  {searchQuery
                    ? "No transactions found"
                    : "No transactions yet"}
                </p>
                <p className="text-zinc-600 text-xs mt-2">
                  Transactions will appear here when users purchase chapters
                </p>
              </div>
            ) : error ? (
              <div className="px-4 py-12 text-center">
                <p className="text-red-400 text-sm">
                  Unable to load transactions. See error above.
                </p>
              </div>
            ) : (
              paginatedTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3 hover:bg-zinc-800/50 transition"
                >
                  <div className="flex items-start gap-2 mb-3">
                    <button
                      onClick={() => handleSelectOne(tx.id)}
                      className="text-zinc-400 hover:text-white transition mt-1 flex-shrink-0"
                    >
                      {selectedIds.has(tx.id) ? (
                        <CheckSquare className="w-5 h-5 text-green-500" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${getTransactionBadge(
                            tx.type
                          )}`}
                        >
                          {tx.type.replace("_", " ").toUpperCase()}
                        </span>
                        <div
                          className={`flex items-center gap-1 font-bold text-base ${getTransactionColor(
                            tx.type
                          )}`}
                        >
                          <span>
                            {tx.amount > 0 ? "+" : ""}
                            {tx.amount}
                          </span>
                          <Coins className="w-4 h-4" />
                        </div>
                      </div>

                      <p className="text-white text-sm font-medium mb-2 line-clamp-2">
                        {tx.description}
                      </p>

                      <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
                        <User className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">
                          {userMap[tx.userId]?.name || "Unknown"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-zinc-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 flex-shrink-0" />
                          <span>{tx.createdAt.toLocaleDateString()}</span>
                        </div>
                        <span>Bal: {tx.balance}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {filteredTransactions.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredTransactions.length / itemsPerPage)}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredTransactions.length}
            />
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold text-white mb-4">
                Confirm Delete
              </h2>
              <p className="text-zinc-300 mb-6">
                Are you sure you want to delete {selectedIds.size}{" "}
                transaction(s)? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSelected}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50 flex items-center gap-2"
                >
                  {deleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
