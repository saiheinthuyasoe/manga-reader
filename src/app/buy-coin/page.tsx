"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

import {
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CoinPackage } from "@/types/coin-package";
import { CoinBuyRequest } from "@/types/coin-buy-request";
import Pagination from "@/components/Pagination";
import Image from "next/image";

export default function BuyCoinPage() {
  const [coinPackages, setCoinPackages] = useState<CoinPackage[]>([]);
  const [myRequests, setMyRequests] = useState<CoinBuyRequest[]>([]);
  const [myRequestsPage, setMyRequestsPage] = useState(1);
  const itemsPerPage = 10;
  const { user } = useAuth();
  const [selected, setSelected] = useState<CoinPackage | null>(null);
  const [email, setEmail] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "coinPackages"), (snapshot) => {
      setCoinPackages(
        snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as CoinPackage)
        )
      );
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, "coinBuyRequests"), (snap) => {
      setMyRequests(
        snap.docs
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              userId: data.userId,
              packageId: data.packageId,
              packageName: data.packageName,
              coins: data.coins,
              price: data.price,
              email: data.email,
              receiptUrl: data.receiptUrl,
              status: data.status,
              createdAt: data.createdAt?.toDate
                ? data.createdAt.toDate()
                : new Date(),
            } as CoinBuyRequest;
          })
          .filter((r) => r.userId === user.uid)
          .sort(
            (a, b) =>
              (b.createdAt?.getTime?.() || 0) - (a.createdAt?.getTime?.() || 0)
          )
      );
    });
    return () => unsub();
  }, [user]);

  // Reset page if myRequests changes and current page is out of range
  useEffect(() => {
    if (myRequestsPage > Math.ceil(myRequests.length / itemsPerPage)) {
      setMyRequestsPage(1);
    }
  }, [myRequests, myRequestsPage]);

  const paginatedMyRequests = myRequests.slice(
    (myRequestsPage - 1) * itemsPerPage,
    myRequestsPage * itemsPerPage
  );

  const handleBuy = (pkg: CoinPackage) => {
    setSelected(pkg);
    setEmail(user?.email || "");
    setReceipt(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !receipt) return;
    setSubmitting(true);
    try {
      // Upload receipt to R2
      const formData = new FormData();
      formData.append("file", receipt);
      formData.append("folder", "Receipt");
      const uploadRes = await fetch("/api/upload", {
        method: "PUT",
        body: formData,
      });
      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok || !uploadJson.publicUrl)
        throw new Error("Upload failed");
      const receiptUrl = uploadJson.publicUrl;

      // Save buy coin request to Firestore
      await addDoc(collection(db, "coinBuyRequests"), {
        userId: user?.uid || "anonymous",
        packageId: selected.id,
        packageName: selected.name,
        coins: selected.coins,
        price: selected.price,
        email,
        receiptUrl,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      setSuccess(true);
    } catch {
      alert("Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl w-full mx-auto pt-24 pb-10 px-2 sm:px-4">
      <h1 className="text-2xl font-bold mb-6">Buy Coins</h1>
      <div className="grid gap-6">
        {coinPackages.map((pkg) => (
          <div
            key={pkg.id}
            className="bg-zinc-900 rounded-lg p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow gap-4"
          >
            <div>
              <div className="text-lg font-semibold text-white">{pkg.name}</div>
              <div className="text-green-400 font-bold text-xl mt-1">
                {pkg.coins} Coins
              </div>
              <div className="text-zinc-400 text-sm mt-1">
                {pkg.price.toLocaleString()} MMK
              </div>
            </div>
            <button
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition"
              onClick={() => handleBuy(pkg)}
            >
              Buy
            </button>
          </div>
        ))}
      </div>
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-2">
          <div className="bg-zinc-900 rounded-xl p-4 sm:p-8 w-full max-w-md shadow-lg border border-zinc-800 relative">
            <button
              className="absolute top-3 right-3 text-zinc-400 hover:text-white text-xl"
              onClick={() => setSelected(null)}
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-4 text-center text-white">
              Pay for {selected.name}
            </h2>
            <div className="flex flex-col items-center mb-4">
              <Image
                src="/payment_qr.jpg"
                alt="QR Code"
                width={160}
                height={160}
                className="rounded bg-white p-2"
              />
              <span className="text-zinc-400 text-xs mt-2">
                Scan to pay {selected.price.toLocaleString()} MMK
              </span>
            </div>
            {success ? (
              <div className="text-green-500 text-center font-semibold py-6">
                Thank you! Your payment request has been submitted.
              </div>
            ) : (
              <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
                <label className="flex flex-col gap-1">
                  <span className="text-sm text-zinc-400">Account Email</span>
                  <input
                    type="email"
                    className="bg-zinc-800 text-white px-3 py-2 rounded border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-sm text-zinc-400">
                    Attach Receipt Image
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="bg-zinc-800 text-white px-3 py-2 rounded border border-zinc-700"
                    onChange={(e) => setReceipt(e.target.files?.[0] || null)}
                    required
                  />
                </label>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded font-semibold mt-2 disabled:opacity-60"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
      {/* My Requests */}
      {user && (
        <div className="mt-12">
          <h2 className="text-lg font-bold mb-4 text-white">
            My Buy Coin Requests
          </h2>
          {/* Desktop/tablet table view */}
          <div className="hidden md:block bg-zinc-900 rounded-xl p-2 sm:p-4 shadow-lg overflow-x-auto sm:overflow-x-visible">
            <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[540px] sm:min-w-0">
              <thead>
                <tr className="bg-zinc-800 text-zinc-200">
                  <th className="py-2 px-2 rounded-tl-xl whitespace-normal">
                    Package
                  </th>
                  <th className="py-2 px-2 whitespace-nowrap">Coins</th>
                  <th className="py-2 px-2 whitespace-nowrap">Price</th>
                  <th className="py-2 px-2 whitespace-nowrap">Status</th>
                  <th className="py-2 px-2 whitespace-normal">Requested At</th>
                  <th className="py-2 px-2 whitespace-normal">Receipt</th>
                  <th className="py-2 px-2 rounded-tr-xl whitespace-nowrap">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedMyRequests.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="text-zinc-500 py-6 text-center rounded-b-xl bg-zinc-950"
                    >
                      No requests yet.
                    </td>
                  </tr>
                ) : (
                  paginatedMyRequests.map((req, idx) => (
                    <tr
                      key={req.id}
                      className={
                        idx % 2 === 0
                          ? "bg-zinc-950 hover:bg-zinc-800 transition"
                          : "bg-zinc-900 hover:bg-zinc-800 transition"
                      }
                    >
                      <td className="py-2 px-2 font-medium text-zinc-100 break-words max-w-[120px]">
                        {req.packageName}
                      </td>
                      <td className="py-2 px-2 text-zinc-200 whitespace-nowrap">
                        {req.coins}
                      </td>
                      <td className="py-2 px-2 text-zinc-200 whitespace-nowrap">
                        {req.price.toLocaleString()} MMK
                      </td>
                      <td className="py-2 px-2 capitalize text-zinc-200 whitespace-nowrap">
                        <span
                          className={
                            req.status === "approved"
                              ? "bg-green-700/30 text-green-400 px-2 py-1 rounded text-xs font-semibold"
                              : req.status === "rejected"
                              ? "bg-red-700/30 text-red-400 px-2 py-1 rounded text-xs font-semibold"
                              : "bg-yellow-700/30 text-yellow-300 px-2 py-1 rounded text-xs font-semibold"
                          }
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-zinc-200 break-words max-w-[120px]">
                        {req.createdAt ? req.createdAt.toLocaleString() : "-"}
                      </td>
                      <td className="py-2 px-2">
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
                      <td className="py-2 px-2">
                        {req.status === "pending" && (
                          <button
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-semibold"
                            onClick={() => {
                              setDeleteId(req.id);
                              setShowDeleteModal(true);
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {/* Pagination for My Buy Coin Requests (desktop) */}
            {myRequests.length > 0 && (
              <Pagination
                currentPage={myRequestsPage}
                totalPages={Math.ceil(myRequests.length / itemsPerPage)}
                onPageChange={setMyRequestsPage}
                itemsPerPage={itemsPerPage}
                totalItems={myRequests.length}
              />
            )}
          </div>
          {/* Mobile card view */}
          <div className="md:hidden space-y-4">
            {paginatedMyRequests.length === 0 ? (
              <div className="bg-zinc-900 rounded-xl p-4 text-center text-zinc-500">
                No requests yet.
              </div>
            ) : (
              paginatedMyRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-zinc-900 rounded-xl p-4 flex flex-col gap-2 shadow"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-100">
                      {req.packageName}
                    </span>
                    <span className="capitalize text-xs px-2 py-1 rounded bg-zinc-800 text-zinc-300">
                      {req.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-zinc-300">
                    <span>
                      Coins:{" "}
                      <span className="font-medium text-white">
                        {req.coins}
                      </span>
                    </span>
                    <span>
                      <span>
                        Price:{" "}
                        <span className="font-medium text-white">
                          {req.price.toLocaleString()} MMK
                        </span>
                      </span>
                    </span>
                  </div>
                  <div className="text-xs text-zinc-400">
                    Requested:{" "}
                    {req.createdAt ? req.createdAt.toLocaleString() : "-"}
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
                      <span className="text-zinc-500 text-xs">No Receipt</span>
                    )}
                    {req.status === "pending" && (
                      <button
                        className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs font-semibold"
                        onClick={async () => {
                          await deleteDoc(doc(db, "coinBuyRequests", req.id));
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
            {/* Pagination for My Buy Coin Requests (mobile) */}
            {myRequests.length > 0 && (
              <Pagination
                currentPage={myRequestsPage}
                totalPages={Math.ceil(myRequests.length / itemsPerPage)}
                onPageChange={setMyRequestsPage}
                itemsPerPage={itemsPerPage}
                totalItems={myRequests.length}
              />
            )}
          </div>
        </div>
      )}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">
              Confirm Delete
            </h2>
            <p className="text-zinc-300 mb-6">
              Are you sure you want to delete this buy coin request? This action
              cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!deleteId) return;
                  await deleteDoc(doc(db, "coinBuyRequests", deleteId));
                  setShowDeleteModal(false);
                  setDeleteId(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition flex items-center gap-2"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
