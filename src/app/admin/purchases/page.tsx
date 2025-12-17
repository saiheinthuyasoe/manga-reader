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
  onSnapshot,
  updateDoc,
  increment,
  getDoc,
  addDoc,
} from "firebase/firestore";
import { PurchaseHistory } from "@/types/transaction";
import { CoinBuyRequest } from "@/types/coin-buy-request";
import Loading from "@/components/Loading";
import Pagination from "@/components/Pagination";
import Link from "next/link";

export default function AdminPurchasesPage() {
  const [tab, setTab] = useState<"purchases" | "buy-coin">("purchases");
  const [buyRequests, setBuyRequests] = useState<CoinBuyRequest[]>([]);
  const [buyRequestsPage, setBuyRequestsPage] = useState(1);
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
  const [showBuyReqDeleteModal, setShowBuyReqDeleteModal] = useState(false);
  const [buyReqToDelete, setBuyReqToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push("/");
    }
  }, [user, isAdmin, loading, router]);

  useEffect(() => {
    let unsubBuyReq: (() => void) | undefined;
    const fetchData = async () => {
      if (loading || !user || !isAdmin) return;
      try {
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
        setUserMap(users);
        // Fetch purchase history (one-time)
        const q = query(
          collection(db, "purchaseHistory"),
          orderBy("purchasedAt", "desc"),
          limit(500)
        );
        const snapshot = await getDocs(q);
        const purchaseData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          purchasedAt: doc.data().purchasedAt?.toDate() || new Date(),
        })) as PurchaseHistory[];
        setPurchases(purchaseData);
        // Real-time buy coin requests
        const buyReqQ = query(
          collection(db, "coinBuyRequests"),
          orderBy("createdAt", "desc"),
          limit(500)
        );
        unsubBuyReq = onSnapshot(buyReqQ, (snap) => {
          const buyReqs = snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
          })) as CoinBuyRequest[];
          setBuyRequests(buyReqs);
        });
        setError(null);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setError(errorMessage);
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
    return () => {
      if (unsubBuyReq) unsubBuyReq();
    };
  }, [user, isAdmin, loading, router]);

  if (loading || loadingData) {
    return <Loading />;
  }

  if (!user || !isAdmin) {
    return null;
  }

  // Purchases filtering and pagination (existing)
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

  // Buy Coin Requests pagination
  const paginatedBuyRequests = buyRequests.slice(
    (buyRequestsPage - 1) * itemsPerPage,
    buyRequestsPage * itemsPerPage
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
        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-zinc-800">
          <button
            className={`px-4 py-2 font-semibold text-sm border-b-2 transition ${
              tab === "purchases"
                ? "border-purple-500 text-purple-400"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
            onClick={() => setTab("purchases")}
          >
            Chapter Purchases
          </button>
          <button
            className={`px-4 py-2 font-semibold text-sm border-b-2 transition ${
              tab === "buy-coin"
                ? "border-yellow-500 text-yellow-400"
                : "border-transparent text-zinc-400 hover:text-white"
            }`}
            onClick={() => setTab("buy-coin")}
          >
            Buy Coin Requests
          </button>
        </div>

        {/* Removed chapter purchases table from buy coin package tab as requested */}
        {tab === "buy-coin" && (
          <>
            {/* Desktop/tablet table view with pagination */}
            <div className="hidden md:block bg-zinc-900 border border-zinc-800 rounded-lg p-2 sm:p-4 md:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-yellow-400 mb-4 sm:mb-6 flex items-center gap-2">
                <Coins className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" /> Buy
                Coin Requests
              </h2>
              <div className="w-full overflow-x-auto">
                <table className="min-w-[600px] w-full text-left border-separate border-spacing-y-2 text-xs sm:text-sm md:text-base">
                  <thead>
                    <tr className="bg-zinc-800">
                      <th className="py-2 px-2 sm:py-3 sm:px-4 rounded-l-lg">
                        User
                      </th>
                      <th className="py-2 px-2 sm:py-3 sm:px-4">Package</th>
                      <th className="py-2 px-2 sm:py-3 sm:px-4">Coins</th>
                      <th className="py-2 px-2 sm:py-3 sm:px-4">Price</th>
                      <th className="py-2 px-2 sm:py-3 sm:px-4">Email</th>
                      <th className="py-2 px-2 sm:py-3 sm:px-4">Receipt</th>
                      <th className="py-2 px-2 sm:py-3 sm:px-4">Status</th>
                      <th className="py-2 px-2 sm:py-3 sm:px-4">
                        Requested At
                      </th>
                      <th className="py-2 px-2 sm:py-3 sm:px-4 rounded-r-lg">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedBuyRequests.length === 0 ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="text-zinc-500 py-6 text-center"
                        >
                          No buy coin requests yet.
                        </td>
                      </tr>
                    ) : (
                      paginatedBuyRequests.map((req) => (
                        <tr
                          key={req.id}
                          className="hover:bg-zinc-800 transition"
                        >
                          <td className="py-2 px-4 font-medium text-zinc-100">
                            {userMap[req.userId]?.name || req.userId}
                          </td>
                          <td className="py-2 px-4 text-zinc-200">
                            {req.packageName}
                          </td>
                          <td className="py-2 px-4 text-zinc-200">
                            {req.coins}
                          </td>
                          <td className="py-2 px-4 text-zinc-200">
                            ${req.price}
                          </td>
                          <td className="py-2 px-4 text-zinc-200">
                            {req.email}
                          </td>
                          <td className="py-2 px-4 text-zinc-200">
                            {req.receiptUrl ? (
                              <a
                                href={req.receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 underline"
                              >
                                View
                              </a>
                            ) : (
                              <span className="text-zinc-500">-</span>
                            )}
                          </td>
                          <td className="py-2 px-4 text-zinc-200 capitalize">
                            {req.status}
                          </td>
                          <td className="py-2 px-4 text-zinc-200">
                            {req.createdAt instanceof Date
                              ? req.createdAt.toLocaleString()
                              : "-"}
                          </td>
                          <td className="py-2 px-4 flex gap-2">
                            {req.status === "pending" && (
                              <>
                                <button
                                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-semibold"
                                  onClick={async () => {
                                    // Approve: set status, add coins
                                    let userRef = doc(db, "users", req.userId);
                                    let userSnap = await getDoc(userRef);
                                    if (!userSnap.exists()) {
                                      // Try to find user by email
                                      const usersSnapshot = await getDocs(
                                        collection(db, "users")
                                      );
                                      let found = false;
                                      usersSnapshot.forEach((uDoc) => {
                                        const uData = uDoc.data();
                                        if (
                                          uData.email &&
                                          uData.email === req.email
                                        ) {
                                          userRef = doc(db, "users", uDoc.id);
                                          userSnap = uDoc as typeof userSnap;
                                          found = true;
                                        }
                                      });
                                      if (!found) {
                                        alert("User not found");
                                        return;
                                      }
                                    }
                                    await updateDoc(
                                      doc(db, "coinBuyRequests", req.id),
                                      { status: "approved" }
                                    );
                                    // Get user's current coin balance for transaction record
                                    const userSnapFinal = await getDoc(userRef);
                                    const userData = userSnapFinal.data();
                                    const newBalance =
                                      (userData?.coins || 0) + req.coins;
                                    await updateDoc(userRef, {
                                      coins: increment(req.coins),
                                    });
                                    // Add transaction record
                                    await addDoc(
                                      collection(db, "coinTransactions"),
                                      {
                                        userId: userRef.id,
                                        type: "admin_add",
                                        amount: req.coins,
                                        balance: newBalance,
                                        description: `Admin approved buy coin request (${req.packageName})`,
                                        adminId: user?.uid || null,
                                        createdAt: new Date(),
                                      }
                                    );
                                  }}
                                >
                                  Approve
                                </button>
                                <button
                                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-semibold"
                                  onClick={async () => {
                                    await updateDoc(
                                      doc(db, "coinBuyRequests", req.id),
                                      { status: "rejected" }
                                    );
                                  }}
                                >
                                  Reject
                                </button>
                              </>
                            )}
                            <button
                              className="bg-zinc-700 hover:bg-zinc-800 text-white px-3 py-1 rounded text-xs font-semibold"
                              onClick={() => {
                                setBuyReqToDelete(req.id);
                                setShowBuyReqDeleteModal(true);
                              }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {/* Pagination for Buy Coin Requests (desktop) */}
              {buyRequests.length > 0 && (
                <Pagination
                  currentPage={buyRequestsPage}
                  totalPages={Math.ceil(buyRequests.length / itemsPerPage)}
                  onPageChange={setBuyRequestsPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={buyRequests.length}
                />
              )}
            </div>
            {/* Mobile card view with pagination */}
            <div className="md:hidden space-y-4">
              <h2 className="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-400" /> Buy Coin Requests
              </h2>
              {paginatedBuyRequests.length === 0 ? (
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-center text-zinc-500">
                  No buy coin requests yet.
                </div>
              ) : (
                paginatedBuyRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-100">
                        {userMap[req.userId]?.name || req.userId}
                      </span>
                      <span className="capitalize text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-300">
                        {req.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-zinc-300">
                      <span>
                        Package:{" "}
                        <span className="font-medium text-white">
                          {req.packageName}
                        </span>
                      </span>
                      <span>
                        Coins:{" "}
                        <span className="font-medium text-white">
                          {req.coins}
                        </span>
                      </span>
                      <span>
                        Price:{" "}
                        <span className="font-medium text-white">
                          ${req.price}
                        </span>
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400 break-all">
                      Email: {req.email}
                    </div>
                    <div className="text-xs text-zinc-400">
                      Requested:{" "}
                      {req.createdAt instanceof Date
                        ? req.createdAt.toLocaleString()
                        : "-"}
                    </div>
                    <div className="flex gap-2 mt-2">
                      {req.receiptUrl ? (
                        <a
                          href={req.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 underline text-xs"
                        >
                          Receipt
                        </a>
                      ) : (
                        <span className="text-zinc-500 text-xs">
                          No Receipt
                        </span>
                      )}
                      {req.status === "pending" && (
                        <>
                          <button
                            className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs font-semibold"
                            onClick={async () => {
                              // Approve: set status, add coins
                              let userRef = doc(db, "users", req.userId);
                              let userSnap = await getDoc(userRef);
                              if (!userSnap.exists()) {
                                // Try to find user by email
                                const usersSnapshot = await getDocs(
                                  collection(db, "users")
                                );
                                let found = false;
                                usersSnapshot.forEach((uDoc) => {
                                  const uData = uDoc.data();
                                  if (
                                    uData.email &&
                                    uData.email === req.email
                                  ) {
                                    userRef = doc(db, "users", uDoc.id);
                                    userSnap = uDoc as typeof userSnap;
                                    found = true;
                                  }
                                });
                                if (!found) {
                                  alert("User not found");
                                  return;
                                }
                              }
                              await updateDoc(
                                doc(db, "coinBuyRequests", req.id),
                                { status: "approved" }
                              );
                              // Get user's current coin balance for transaction record
                              const userSnapFinal = await getDoc(userRef);
                              const userData = userSnapFinal.data();
                              const newBalance =
                                (userData?.coins || 0) + req.coins;
                              await updateDoc(userRef, {
                                coins: increment(req.coins),
                              });
                              // Add transaction record
                              await addDoc(collection(db, "coinTransactions"), {
                                userId: userRef.id,
                                type: "admin_add",
                                amount: req.coins,
                                balance: newBalance,
                                description: `Admin approved buy coin request (${req.packageName})`,
                                adminId: user?.uid || null,
                                createdAt: new Date(),
                              });
                            }}
                          >
                            Approve
                          </button>
                          <button
                            className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs font-semibold"
                            onClick={async () => {
                              await updateDoc(
                                doc(db, "coinBuyRequests", req.id),
                                { status: "rejected" }
                              );
                            }}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button
                        className="bg-zinc-700 hover:bg-zinc-800 text-white px-2 py-1 rounded text-xs font-semibold"
                        onClick={async () => {
                          await deleteDoc(doc(db, "coinBuyRequests", req.id));
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
              {/* Pagination for Buy Coin Requests (mobile) */}
              {buyRequests.length > 0 && (
                <Pagination
                  currentPage={buyRequestsPage}
                  totalPages={Math.ceil(buyRequests.length / itemsPerPage)}
                  onPageChange={setBuyRequestsPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={buyRequests.length}
                />
              )}
            </div>
          </>
        )}

        {/* Only show search bar if tab is 'purchases' */}
        {tab === "purchases" && (
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
        )}

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

        {/* Only show purchases table if tab is 'purchases' */}
        {tab === "purchases" && (
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
                            Ch. {purchase.chapterNumber}:{" "}
                            {purchase.chapterTitle}
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
                          <button
                            className="inline-flex items-center gap-1 px-3 py-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded text-xs font-semibold transition ml-2"
                            onClick={() => {
                              setSelectedIds(new Set([purchase.id]));
                              setShowDeleteModal(true);
                            }}
                            title="Delete purchase"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
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
        )}
        {/* End purchases table */}
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
        {showBuyReqDeleteModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold text-white mb-4">
                Confirm Delete
              </h2>
              <p className="text-zinc-300 mb-6">
                Are you sure you want to delete this buy coin request? This
                action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowBuyReqDeleteModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!buyReqToDelete) return;
                    await deleteDoc(doc(db, "coinBuyRequests", buyReqToDelete));
                    setShowBuyReqDeleteModal(false);
                    setBuyReqToDelete(null);
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
