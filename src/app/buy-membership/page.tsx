"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Crown } from "lucide-react";
import Loading from "@/components/Loading";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { MemberBuyRequest } from "@/types/member-buy-request";
import { doc, deleteDoc as firestoreDeleteDoc } from "firebase/firestore";
import type { DocumentReference } from "firebase/firestore";

type MemberPackage = {
  id: string;
  name: string;
  price: number;
  duration: string;
};

export default function BuyMembershipPage() {
  const { user, loading, hasMembership } = useAuth();
  const router = useRouter();
  const [memberPackages, setMemberPackages] = useState<MemberPackage[]>([]);
  const [selected, setSelected] = useState<MemberPackage | null>(null);
  const [email, setEmail] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [myRequests, setMyRequests] = useState<MemberBuyRequest[]>([]);
  const [myRequestsPage, setMyRequestsPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "membershipRequests"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setMyRequests(
        snap.docs
          .map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              userId: data.userId,
              packageId: data.packageId,
              packageName: data.packageName,
              price: data.price,
              duration: data.duration,
              email: data.email,
              receiptUrl: data.receiptUrl,
              status: data.status,
              createdAt: data.createdAt?.toDate
                ? data.createdAt.toDate()
                : new Date(),
            } as MemberBuyRequest;
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

  const paginatedMyRequests = myRequests.slice(
    (myRequestsPage - 1) * itemsPerPage,
    myRequestsPage * itemsPerPage
  );

  const handleBuy = (pkg: MemberPackage) => {
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

      // Save membership request to Firestore
      await addDoc(collection(db, "membershipRequests"), {
        userId: user?.uid || "anonymous",
        packageId: selected.id,
        packageName: selected.name,
        price: selected.price,
        duration: selected.duration,
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

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Fetch member packages from Firestore
    async function fetchPackages() {
      const { db } = await import("@/lib/firebase");
      const { collection, getDocs } = await import("firebase/firestore");
      const colRef = collection(db, "memberPackages");
      const snap = await getDocs(colRef);
      setMemberPackages(
        snap.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            price: data.price,
            duration: data.duration,
          } as MemberPackage;
        })
      );
    }
    fetchPackages();
  }, []);

  if (loading) return <Loading />;
  if (!user) return null;

  if (hasMembership) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center">
        <Crown className="w-12 h-12 mx-auto text-yellow-400 mb-4" />
        <h1 className="text-2xl font-bold mb-2 text-white">
          You are already a member!
        </h1>
        <p className="text-zinc-400 mb-6">
          Thank you for supporting us. Enjoy unlimited reading!
        </p>
      </div>
    );
  }

  async function deleteDoc(docRef: DocumentReference) {
    await firestoreDeleteDoc(docRef);
  }
  return (
    <div className="max-w-4xl mx-auto px-4 pt-24 pb-12">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
        <Crown className="w-7 h-7 text-yellow-400" /> Buy Membership
      </h1>
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4 text-white">
          Available Packages
        </h2>
        <ul className="space-y-4">
          {memberPackages.length === 0 && (
            <li className="text-zinc-400">No packages available.</li>
          )}
          {memberPackages.map((pkg) => (
            <li
              key={pkg.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between bg-zinc-800 rounded-lg p-4"
            >
              <div>
                <div className="font-semibold text-white text-base">
                  {pkg.name}
                </div>
                <div className="text-zinc-400 text-sm">{pkg.duration}</div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2 sm:mt-0">
                <span className="font-bold text-green-400 text-lg">
                  {pkg.price?.toLocaleString()} MMK
                </span>
                <button
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm"
                  onClick={() => handleBuy(pkg)}
                >
                  Buy
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* My Membership Requests Table */}
      {user && (
        <div className="mt-12">
          <h2 className="text-lg font-bold mb-4 text-white">
            My Membership Requests
          </h2>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            {/* Responsive: Table for md+, cards for mobile */}
            <div className="hidden md:block w-full">
              <table className="w-full text-left text-sm border-collapse table-fixed">
                <thead>
                  <tr className="bg-zinc-800 text-zinc-400 border-b border-zinc-700">
                    <th className="py-3 px-4 font-medium w-[15%]">Package</th>
                    <th className="py-3 px-4 font-medium w-[10%]">Duration</th>
                    <th className="py-3 px-4 font-medium w-[15%]">Price</th>
                    <th className="py-3 px-4 font-medium w-[20%]">Email</th>
                    <th className="py-3 px-4 font-medium w-[10%]">Receipt</th>
                    <th className="py-3 px-4 font-medium w-[10%]">Status</th>
                    <th className="py-3 px-4 font-medium text-right w-[10%]">
                      Date
                    </th>
                    <th className="py-3 px-4 font-medium text-right w-[10%]">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {paginatedMyRequests.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-zinc-500 py-8 text-center"
                      >
                        No membership requests yet.
                      </td>
                    </tr>
                  ) : (
                    paginatedMyRequests.map((req) => (
                      <tr
                        key={req.id}
                        className="group hover:bg-zinc-800/50 transition-colors"
                      >
                        <td
                          className="py-3 px-4 font-medium text-zinc-100 truncate"
                          title={req.packageName}
                        >
                          {req.packageName}
                        </td>
                        <td className="py-3 px-4 text-zinc-300 truncate">
                          {req.duration}
                        </td>
                        <td className="py-3 px-4 text-green-400 font-medium truncate">
                          {req.price?.toLocaleString()} MMK
                        </td>
                        <td
                          className="py-3 px-4 text-zinc-300 truncate"
                          title={req.email}
                        >
                          {req.email}
                        </td>
                        <td className="py-3 px-4 text-zinc-300">
                          {req.receiptUrl ? (
                            <a
                              href={req.receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                            >
                              View
                            </a>
                          ) : (
                            <span className="text-zinc-500">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium capitalize inline-block truncate max-w-full ${
                              req.status === "approved"
                                ? "bg-green-500/10 text-green-400"
                                : req.status === "rejected"
                                ? "bg-red-500/10 text-red-400"
                                : "bg-yellow-500/10 text-yellow-400"
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-zinc-400 text-sm whitespace-nowrap">
                            {req.createdAt instanceof Date
                              ? req.createdAt.toLocaleDateString()
                              : "-"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end">
                            {req.status === "pending" && (
                              <button
                                className="text-zinc-400 hover:text-red-400 transition-colors p-1 rounded hover:bg-zinc-700 shrink-0"
                                onClick={async () => {
                                  if (
                                    !confirm(
                                      "Are you sure you want to delete this request?"
                                    )
                                  )
                                    return;
                                  await deleteDoc(
                                    doc(db, "membershipRequests", req.id)
                                  );
                                }}
                                title="Delete request"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M3 6h18" />
                                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Card layout for mobile */}
            <div className="md:hidden flex flex-col gap-4">
              {paginatedMyRequests.length === 0 ? (
                <div className="text-zinc-500 py-6 text-center">
                  No membership requests yet.
                </div>
              ) : (
                paginatedMyRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-zinc-800 rounded-lg p-3 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-100">
                        {req.packageName}
                      </span>
                      <span className="capitalize text-xs px-2 py-1 rounded bg-zinc-900 text-zinc-300">
                        {req.status}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400">
                      Duration:{" "}
                      <span className="text-white">{req.duration}</span>
                    </div>
                    <div className="text-xs text-zinc-400">
                      Price:{" "}
                      <span className="text-green-400 font-semibold">
                        {req.price?.toLocaleString()} MMK
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
                    <div className="flex gap-2 mt-1 items-center">
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
                        <button
                          className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs font-semibold ml-2"
                          onClick={async () => {
                            if (
                              !confirm(
                                "Are you sure you want to delete this request?"
                              )
                            )
                              return;
                            await deleteDoc(
                              doc(db, "membershipRequests", req.id)
                            );
                          }}
                          title="Delete request"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            {/* Pagination if needed */}
            {myRequests.length > itemsPerPage && (
              <div className="mt-4 flex flex-wrap items-center gap-2 justify-center">
                <button
                  className="px-3 py-1 bg-zinc-800 text-white rounded disabled:opacity-50"
                  onClick={() => setMyRequestsPage((p) => Math.max(1, p - 1))}
                  disabled={myRequestsPage === 1}
                >
                  Prev
                </button>
                <span className="text-zinc-300">
                  Page {myRequestsPage} of{" "}
                  {Math.ceil(myRequests.length / itemsPerPage)}
                </span>
                <button
                  className="px-3 py-1 bg-zinc-800 text-white rounded disabled:opacity-50"
                  onClick={() =>
                    setMyRequestsPage((p) =>
                      Math.min(
                        Math.ceil(myRequests.length / itemsPerPage),
                        p + 1
                      )
                    )
                  }
                  disabled={
                    myRequestsPage ===
                    Math.ceil(myRequests.length / itemsPerPage)
                  }
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal for buy membership */}
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/payment_qr.jpg"
                alt="QR Code"
                width={160}
                height={160}
                className="rounded bg-white p-2"
              />
              <span className="text-zinc-400 text-xs mt-2">
                Scan to pay {selected.price?.toLocaleString()} MMK
              </span>
            </div>
            {success ? (
              <div className="text-green-500 text-center font-semibold py-6">
                Thank you! Your membership request has been submitted.
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
    </div>
  );
}
