"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShoppingBag,
  Search,
  Calendar,
  User,
  BookOpen,
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
import { PurchaseHistory } from "@/types/transaction";
import Loading from "@/components/Loading";
import Pagination from "@/components/Pagination";
import Link from "next/link";

export default function AdminPurchasesPage() {
  const router = useRouter();
  const { user, isAdmin, loading } = useAuth();
  const [purchases, setPurchases] = useState<PurchaseHistory[]>([]);
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
        console.log("[Admin Purchases] Fetching users...");
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
          "[Admin Purchases] Users loaded:",
          Object.keys(users).length
        );
        setUserMap(users);

        console.log("[Admin Purchases] Fetching purchase history...");
        // Fetch purchase history
        const q = query(
          collection(db, "purchaseHistory"),
          orderBy("purchasedAt", "desc"),
          limit(500)
        );

        const snapshot = await getDocs(q);
        console.log("[Admin Purchases] Snapshot size:", snapshot.size);
        const purchaseData = snapshot.docs.map((doc) => {
          console.log("[Admin Purchases] Purchase:", doc.id, doc.data());
          return {
            id: doc.id,
            ...doc.data(),
            purchasedAt: doc.data().purchasedAt?.toDate() || new Date(),
          };
        }) as PurchaseHistory[];

        console.log("[Admin Purchases] Total loaded:", purchaseData.length);
        setPurchases(purchaseData);
        setError(null);
      } catch (error) {
        console.error("[Admin Purchases] Error:", error);
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

  const filteredPurchases = purchases.filter((purchase) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const userName = userMap[purchase.userId]?.name.toLowerCase() || "";
    const userEmail = userMap[purchase.userId]?.email.toLowerCase() || "";
    const mangaTitle = purchase.mangaTitle.toLowerCase();
    const chapterTitle = purchase.chapterTitle.toLowerCase();
    return (
      userName.includes(query) ||
      userEmail.includes(query) ||
      mangaTitle.includes(query) ||
      chapterTitle.includes(query)
    );
  });

  const paginatedPurchases = filteredPurchases.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSelectAll = () => {
    if (selectedIds.size === paginatedPurchases.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedPurchases.map((p) => p.id)));
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
          deleteDoc(doc(db, "purchaseHistory", id))
        )
      );

      // Remove deleted purchases from state
      setPurchases((prev) => prev.filter((p) => !selectedIds.has(p.id)));
      setSelectedIds(new Set());
      setShowDeleteModal(false);
      alert(`Successfully deleted ${selectedIds.size} purchase(s)`);
    } catch (error) {
      console.error("Error deleting purchases:", error);
      alert("Failed to delete purchases");
    } finally {
      setDeleting(false);
    }
  };

  const totalSpent = filteredPurchases.reduce(
    (sum, purchase) => sum + purchase.coinPrice,
    0
  );

  return (
    <div className="min-h-screen bg-black pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3">
            <ShoppingBag className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500" />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
              User Purchase History
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

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 sm:p-6">
            <p className="text-zinc-400 text-xs sm:text-sm mb-1">
              Total Purchases
            </p>
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
              <span className="text-2xl sm:text-3xl font-bold text-white">
                {filteredPurchases.length}
              </span>
              <span className="text-sm sm:text-base text-zinc-400">
                chapters
              </span>
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 sm:p-6">
            <p className="text-zinc-400 text-xs sm:text-sm mb-1">
              Total Coins Spent
            </p>
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
              <span className="text-2xl sm:text-3xl font-bold text-white">
                {totalSpent}
              </span>
              <span className="text-sm sm:text-base text-zinc-400">coins</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-4 sm:mb-6">
          <div className="relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by user, manga, or chapter..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-zinc-900 text-white text-sm sm:text-base rounded-lg pl-10 sm:pl-12 pr-3 sm:pr-4 py-2 sm:py-3 border border-zinc-800 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/20 border border-red-600/50 rounded-lg p-6 mb-6">
            <h3 className="text-red-400 font-bold mb-2">
              Error Loading Purchases
            </h3>
            <p className="text-red-300 text-sm mb-3">{error}</p>
            <div className="bg-red-900/30 border border-red-600/30 rounded p-4">
              <p className="text-red-200 text-sm mb-2">
                <strong>Firestore Index Required:</strong>
              </p>
              <p className="text-red-200 text-sm mb-2">
                The admin page needs an index for:{" "}
                <code className="bg-black/30 px-2 py-1 rounded">
                  purchaseHistory
                </code>{" "}
                collection
              </p>
              <p className="text-red-200 text-sm mb-2">
                Index fields:{" "}
                <code className="bg-black/30 px-2 py-1 rounded">
                  purchasedAt (Descending)
                </code>
              </p>
              <p className="text-red-200 text-sm">
                Check the browser console for a link to create the index
                automatically.
              </p>
            </div>
          </div>
        )}

        {/* Purchases Table */}
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
                        selectedIds.size === paginatedPurchases.length
                          ? "Deselect All"
                          : "Select All"
                      }
                    >
                      {selectedIds.size === paginatedPurchases.length ? (
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
                    Manga
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Chapter
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {paginatedPurchases.length === 0 && !error ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <ShoppingBag className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                      <p className="text-zinc-400">
                        {searchQuery
                          ? "No purchases found"
                          : "No purchases yet"}
                      </p>
                      <p className="text-zinc-600 text-sm mt-2">
                        Purchases will appear here when users buy chapters
                      </p>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <p className="text-red-400">
                        Unable to load purchases. See error above.
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedPurchases.map((purchase) => (
                    <tr
                      key={purchase.id}
                      className="hover:bg-zinc-800/50 transition"
                    >
                      <td className="px-4 py-4">
                        <button
                          onClick={() => handleSelectOne(purchase.id)}
                          className="text-zinc-400 hover:text-white transition"
                        >
                          {selectedIds.has(purchase.id) ? (
                            <CheckSquare className="w-5 h-5 text-purple-500" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-zinc-300">
                          <Calendar className="w-4 h-4 text-zinc-500" />
                          <div>
                            <div>
                              {purchase.purchasedAt.toLocaleDateString()}
                            </div>
                            <div className="text-xs text-zinc-500">
                              {purchase.purchasedAt.toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-zinc-500" />
                          <div>
                            <div className="text-white text-sm">
                              {userMap[purchase.userId]?.name || "Unknown"}
                            </div>
                            <div className="text-xs text-zinc-500">
                              {userMap[purchase.userId]?.email || ""}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white text-sm">
                          {purchase.mangaTitle}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-zinc-300 text-sm">
                          Ch. {purchase.chapterNumber}: {purchase.chapterTitle}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 font-bold text-yellow-500">
                          <Coins className="w-4 h-4" />
                          <span>{purchase.coinPrice}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link
                          href={`/read/${purchase.mangaId}/${purchase.chapterId}`}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 rounded text-xs font-semibold transition"
                        >
                          <BookOpen className="w-3 h-3" />
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-zinc-800">
            {paginatedPurchases.length === 0 && !error ? (
              <div className="px-4 py-12 text-center">
                <ShoppingBag className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-400 text-sm">
                  {searchQuery ? "No purchases found" : "No purchases yet"}
                </p>
                <p className="text-zinc-600 text-xs mt-2">
                  Purchases will appear here when users buy chapters
                </p>
              </div>
            ) : error ? (
              <div className="px-4 py-12 text-center">
                <p className="text-red-400 text-sm">
                  Unable to load purchases. See error above.
                </p>
              </div>
            ) : (
              paginatedPurchases.map((purchase) => (
                <div
                  key={purchase.id}
                  className="p-3 hover:bg-zinc-800/50 transition"
                >
                  <div className="flex items-start gap-2 mb-3">
                    <button
                      onClick={() => handleSelectOne(purchase.id)}
                      className="text-zinc-400 hover:text-white transition mt-1 flex-shrink-0"
                    >
                      {selectedIds.has(purchase.id) ? (
                        <CheckSquare className="w-5 h-5 text-purple-500" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium line-clamp-1">
                            {purchase.mangaTitle}
                          </p>
                          <p className="text-zinc-400 text-xs line-clamp-1">
                            Ch. {purchase.chapterNumber}:{" "}
                            {purchase.chapterTitle}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-yellow-500 font-bold flex-shrink-0">
                          <Coins className="w-4 h-4" />
                          <span className="text-base">
                            {purchase.coinPrice}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
                        <User className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">
                          {userMap[purchase.userId]?.name || "Unknown"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-zinc-500">
                          <Calendar className="w-3 h-3 flex-shrink-0" />
                          <span>
                            {purchase.purchasedAt.toLocaleDateString()}
                          </span>
                        </div>
                        <Link
                          href={`/read/${purchase.mangaId}/${purchase.chapterId}`}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-purple-600/20 text-purple-400 rounded font-semibold"
                        >
                          <BookOpen className="w-3 h-3" />
                          View
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {filteredPurchases.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(filteredPurchases.length / itemsPerPage)}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              totalItems={filteredPurchases.length}
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
                Are you sure you want to delete {selectedIds.size} purchase
                record(s)? This action cannot be undone.
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
